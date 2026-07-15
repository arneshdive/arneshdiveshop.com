import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { orders, orderStatusHistory } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { OrderStatus } from '@/lib/db/schema';

// ============================================================================
// Valid Status Transitions
// ============================================================================

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'], // Only cancel - payment confirmation comes from Midtrans webhook
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [], // Terminal state
  refunded: [], // Terminal state
};

// ============================================================================
// PATCH /api/orders/[id]/status - Update order status
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    // Require authentication
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Require admin or super_admin role
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const { id: orderId } = await params;
    const body = await request.json();
    
    // Validate request body
    const { status, note } = body;
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    
    // Validate status is a valid enum value
    const validStatuses: OrderStatus[] = [
      'pending_payment',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ];
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    
    // Get current order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const currentStatus = order.status as OrderStatus;
    const newStatus = status as OrderStatus;
    
    // Check if status is actually changing
    if (currentStatus === newStatus) {
      return NextResponse.json({ 
        error: 'Order already has this status',
        order 
      }, { status: 400 });
    }
    
    // Validate transition
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json({ 
        error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        allowedTransitions 
      }, { status: 400 });
    }
    
    // Update order status and create audit entry in a transaction
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
        changedBy: session.userId,
      });
      
      return updatedOrder;
    });
    
    return NextResponse.json({ 
      order: result,
      message: `Order status updated to ${newStatus}`
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/orders/[id]/status - Get order status history
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    // Require authentication
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: orderId } = await params;
    
    // Verify order exists
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Authorization: Admin can view any, customer can view their own
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      // Check if user owns this order via customer record
      const customer = await db.query.customers.findFirst({
        where: (customers, { eq, and }) => and(
          eq(customers.userId, session.userId!)
        ),
      });
      
      if (!customer || customer.id !== order.customerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    // Get status history
    const history = await db.query.orderStatusHistory.findMany({
      where: eq(orderStatusHistory.orderId, orderId),
      orderBy: [desc(orderStatusHistory.createdAt)],
    });
    
    return NextResponse.json({ 
      history,
      currentStatus: order.status,
    });
    
  } catch (error) {
    console.error('Error fetching order status history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order status history' },
      { status: 500 }
    );
  }
}
