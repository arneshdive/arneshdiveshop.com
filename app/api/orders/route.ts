import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  createOrderFromCheckout,
  listOrders,
  getCustomerIdByUserId,
} from '@/lib/queries/orders';

// ============================================================================
// GET /api/orders - List orders
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const status = searchParams.get('status') || undefined;
    
    // Admin can see all orders
    if (session?.role === 'admin' || session?.role === 'super_admin') {
      const result = await listOrders({ page, pageSize, status });
      return NextResponse.json(result);
    }
    
    // Logged-in customer can see their own orders
    if (session?.userId) {
      const customerId = await getCustomerIdByUserId(session.userId);
      
      if (!customerId) {
        return NextResponse.json({
          orders: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        });
      }
      
      const result = await listOrders({
        page,
        pageSize,
        customerId,
        status,
      });
      
      return NextResponse.json(result);
    }
    
    // Guest - not authorized to list orders
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error listing orders:', error);
    return NextResponse.json(
      { error: 'Failed to list orders' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/orders - Create order from checkout session
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { checkoutSessionId, idempotencyKey, paymentProvider, paymentMethod, providerTransactionId } = body;
    
    if (!checkoutSessionId || !idempotencyKey || !paymentProvider) {
      return NextResponse.json(
        { error: 'Missing required fields: checkoutSessionId, idempotencyKey, paymentProvider' },
        { status: 400 }
      );
    }
    
    // Create order (handles idempotency internally)
    const order = await createOrderFromCheckout({
      checkoutSessionId,
      idempotencyKey,
      paymentProvider,
      paymentMethod,
      providerTransactionId,
    });
    
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    
    // Handle specific errors
    const message = error instanceof Error ? error.message : 'Failed to create order';
    
    if (message.includes('not found') || message.includes('empty')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    if (message.includes('not pending')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
