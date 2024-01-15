import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  payments,
  customers,
  cartItems,
  checkoutSessions,
  orderStatusHistory,
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { Order, OrderItem, Payment, NewOrderItem, NewOrder } from '@/lib/db/schema';
import { getCartWithItems } from './cart';

// ============================================================================
// Types
// ============================================================================

export interface OrderWithItems extends Order {
  items: (OrderItem & {
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[] | null;
    };
    variant: {
      id: string;
      name: string;
    } | null;
  })[];
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  payments: Payment[];
}

export interface CreateOrderInput {
  checkoutSessionId: string;
  idempotencyKey: string;
  paymentProvider: string;
  paymentMethod?: string;
  providerTransactionId?: string;
}

export interface OrderListOptions {
  page?: number;
  pageSize?: number;
  customerId?: string;
  status?: string;
}

// ============================================================================
// Order Number Generation
// ============================================================================

/**
 * Generate order number: ORD-YYYYMMDD-XXXX
 * Sequential number per day, atomic with database lock
 */
async function generateOrderNumber(tx: Parameters<Parameters<typeof db.transaction>[0]>[0]): Promise<string> {
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // Get the count of orders today for sequential numbering
  const result = await tx.execute(sql`
    SELECT COUNT(*) as count
    FROM orders
    WHERE order_number LIKE ${`ORD-${datePrefix}-%`}
  `);
  
  const count = Number(result.rows[0]?.count ?? 0);
  const sequence = (count + 1).toString().padStart(4, '0');
  
  return `ORD-${datePrefix}-${sequence}`;
}

// ============================================================================
// Auto-Registration for Guests
// ============================================================================

/**
 * Handle auto-registration for guest checkouts
 * Returns customer ID (existing or newly created)
 */
async function getOrCreateCustomerForCheckout(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  data: {
    email: string;
    fullName: string;
    phone: string;
    userId?: string;
  }
): Promise<string> {
  // If user is logged in, find their customer record
  if (data.userId) {
    const existingCustomer = await tx.query.customers.findFirst({
      where: eq(customers.userId, data.userId),
    });
    
    if (existingCustomer) {
      return existingCustomer.id;
    }
  }
  
  // Check if customer exists by email
  const existingCustomer = await tx.query.customers.findFirst({
    where: eq(customers.email, data.email),
  });
  
  if (existingCustomer) {
    return existingCustomer.id;
  }
  
  // Parse full name into first/last
  const nameParts = data.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Guest';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Create new customer
  const [newCustomer] = await tx
    .insert(customers)
    .values({
      userId: data.userId || null,
      email: data.email,
      firstName,
      lastName,
      phone: data.phone,
    })
    .returning();
  
  if (!newCustomer) {
    throw new Error('Failed to create customer');
  }
  
  return newCustomer.id;
}

// ============================================================================
// Order Creation (Atomic Transaction)
// ============================================================================

/**
 * Create order from checkout session
 * Atomic transaction: order + items + payment + clear cart
 */
export async function createOrderFromCheckout(input: CreateOrderInput): Promise<OrderWithItems> {
  // Check for idempotency - return existing order if found
  const existingOrder = await db.query.orders.findFirst({
    where: eq(orders.idempotencyKey, input.idempotencyKey),
    with: {
      items: {
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
          variant: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
      customer: {
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      payments: true,
    },
  });
  
  if (existingOrder) {
    return existingOrder as OrderWithItems;
  }
  
  // Get checkout session
  const checkoutSession = await db.query.checkoutSessions.findFirst({
    where: eq(checkoutSessions.id, input.checkoutSessionId),
  });
  
  if (!checkoutSession) {
    throw new Error('Checkout session not found');
  }
  
  if (checkoutSession.status !== 'pending') {
    throw new Error('Checkout session is not pending');
  }
  
  // Get cart with items
  if (!checkoutSession.cartId) {
    throw new Error('No cart associated with checkout session');
  }
  
  const cart = await getCartWithItems(checkoutSession.cartId);
  if (!cart || cart.items.length === 0) {
    throw new Error('Cart is empty');
  }
  
  // Prepare totals
  const subtotalCents = cart.subtotalCents;
  const shippingCents = checkoutSession.shippingCents ?? 0;
  const totalCents = checkoutSession.totalCents ?? (subtotalCents + shippingCents);
  
  // Store cartId for clearing items later
  const cartIdToDelete = checkoutSession.cartId;
  
  // Execute atomic transaction
  const result = await db.transaction(async (tx) => {
    // 1. Get or create customer (handles auto-registration)
    const customerId = await getOrCreateCustomerForCheckout(tx, {
      email: checkoutSession.email,
      fullName: checkoutSession.fullName,
      phone: checkoutSession.phone,
      userId: checkoutSession.userId ?? undefined,
    });
    
    // 2. Generate order number
    const orderNumber = await generateOrderNumber(tx);
    
    // 3. Create order record
    const orderValues: NewOrder = {
      orderNumber,
      customerId,
      status: 'pending_payment',
      subtotalCents,
      shippingCents,
      taxCents: 0,
      discountCents: 0,
      totalCents,
      idempotencyKey: input.idempotencyKey,
      shippingFirstName: checkoutSession.fullName.split(' ')[0] || checkoutSession.fullName,
      shippingLastName: checkoutSession.fullName.split(' ').slice(1).join(' ') || '',
      shippingPhone: checkoutSession.phone,
      shippingAddress1: checkoutSession.address1,
      shippingAddress2: checkoutSession.address2,
      shippingCity: checkoutSession.city ?? '',
      shippingState: checkoutSession.province,
      shippingPostalCode: checkoutSession.postalCode ?? '',
      shippingCountry: checkoutSession.country,
      notes: checkoutSession.notes,
    };
    const [order] = await tx
      .insert(orders)
      .values(orderValues)
      .returning();
    
    if (!order) {
      throw new Error('Failed to create order');
    }
    
    // 4. Create order items from cart
    const orderItemsData: NewOrderItem[] = cart.items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      quantity: item.quantity,
      priceCents: item.variant?.priceCents ?? item.product.priceCents,
    }));
    
    await tx.insert(orderItems).values(orderItemsData);
    
    // 5. Create payment record
    const [payment] = await tx
      .insert(payments)
      .values({
        orderId: order.id,
        status: 'pending',
        amountCents: totalCents,
        provider: input.paymentProvider,
        providerTransactionId: input.providerTransactionId,
        paymentMethod: input.paymentMethod,
        idempotencyKey: `${input.idempotencyKey}-payment`,
      })
      .returning();
    
    if (!payment) {
      throw new Error('Failed to create payment');
    }
    
    // 6. Clear cart items
    if (cartIdToDelete) {
      await tx.delete(cartItems).where(eq(cartItems.cartId, cartIdToDelete));
    }
    
    // 7. Mark checkout session as completed
    await tx
      .update(checkoutSessions)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(checkoutSessions.id, input.checkoutSessionId));
    
    // 8. Update customer total spent
    await tx
      .update(customers)
      .set({
        totalSpentCents: sql`${customers.totalSpentCents} + ${totalCents}`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));
    
    // Fetch the complete order with relations
    const completeOrder = await tx.query.orders.findFirst({
      where: eq(orders.id, order.id),
      with: {
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
            variant: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        payments: true,
      },
    });
    
    return completeOrder;
  });
  
  if (!result) {
    throw new Error('Failed to create order');
  }
  
  return result as OrderWithItems;
}

// ============================================================================
// Order Retrieval
// ============================================================================

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: {
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
          variant: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
      customer: {
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      payments: true,
    },
  });
  
  return order as OrderWithItems | null;
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
    with: {
      items: {
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
          variant: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
      customer: {
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      payments: true,
    },
  });
  
  return order as OrderWithItems | null;
}

/**
 * List orders with pagination and filtering
 */
export async function listOrders(options: OrderListOptions = {}): Promise<{
  orders: OrderWithItems[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const { page = 1, pageSize = 20, customerId, status } = options;
  
  // Build where conditions
  const conditions: any[] = [];
  if (customerId) {
    conditions.push(eq(orders.customerId, customerId));
  }
  if (status) {
    conditions.push(eq(orders.status, status as any));
  }
  
  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / pageSize);
  
  // Get orders
  const ordersList = await db.query.orders.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      items: {
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
          variant: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
      customer: {
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      payments: true,
    },
    orderBy: [desc(orders.createdAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  
  return {
    orders: ordersList as OrderWithItems[],
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get orders for a customer
 */
export async function getCustomerOrders(customerId: string): Promise<OrderWithItems[]> {
  const ordersList = await db.query.orders.findMany({
    where: eq(orders.customerId, customerId),
    with: {
      items: {
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
          variant: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
      customer: {
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      payments: true,
    },
    orderBy: [desc(orders.createdAt)],
  });
  
  return ordersList as OrderWithItems[];
}

// ============================================================================
// Order Status Updates
// ============================================================================

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<Order | null> {
  const [order] = await db
    .update(orders)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
  
  return order ?? null;
}

/**
 * Get customer ID from user ID
 */
export async function getCustomerIdByUserId(userId: string): Promise<string | null> {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.userId, userId),
    columns: { id: true },
  });
  
  return customer?.id ?? null;
}

// ============================================================================
// Order Status History (F-015)
// ============================================================================

/**
 * Get status history for an order
 */
export async function getOrderStatusHistory(orderId: string) {
  const history = await db.query.orderStatusHistory.findMany({
    where: eq(orderStatusHistory.orderId, orderId),
    orderBy: [desc(orderStatusHistory.createdAt)],
  });
  
  return history;
}

/**
 * Create a status history entry (used internally when updating status)
 */
export async function createStatusHistoryEntry(input: {
  orderId: string;
  status: Order['status'];
  note?: string;
  changedBy?: string;
}) {
  const [entry] = await db
    .insert(orderStatusHistory)
    .values({
      orderId: input.orderId,
      status: input.status,
      note: input.note || null,
      changedBy: input.changedBy || null,
    })
    .returning();
  
  return entry;
}

/**
 * Update order status with audit trail
 * This is the preferred way to update order status
 */
export async function updateOrderStatusWithHistory(
  orderId: string,
  newStatus: Order['status'],
  changedBy?: string,
  note?: string
): Promise<Order | null> {
  // Get current order
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { status: true },
  });
  
  if (!order) {
    return null;
  }
  
  const result = await db.transaction(async (tx) => {
    // Update order status
    const [updatedOrder] = await tx
      .update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
    
    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }
    
    // Create audit history entry
    await tx.insert(orderStatusHistory).values({
      orderId,
      status: newStatus,
      note: note || null,
      changedBy: changedBy || null,
    });
    
    return updatedOrder;
  });
  
  return result;
}
