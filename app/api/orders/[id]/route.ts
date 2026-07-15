import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getOrderById, getOrderByNumber, getCustomerIdByUserId } from '@/lib/queries/orders';
import { getPublicShopSettings } from '@/lib/queries/settings';

// ============================================================================
// GET /api/orders/[id] - Get order details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;
    
    // Try to find order by ID or order number
    let order = await getOrderById(id);
    
    if (!order) {
      order = await getOrderByNumber(id);
    }
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Authorization check
    // Admin can view any order
    if (session?.role === 'admin' || session?.role === 'super_admin') {
      const shopSettings = await getPublicShopSettings();
      return NextResponse.json({ order, shopSettings });
    }
    
    // Logged-in customer can view their own orders
    if (session?.userId) {
      const customerId = await getCustomerIdByUserId(session.userId);
      
      if (customerId === order.customerId) {
        const shopSettings = await getPublicShopSettings();
        return NextResponse.json({ order, shopSettings });
      }
    }
    
    // Guest checkout - allow access if they have the order number and matching email
    // This is secure because order numbers are unique and not easily guessable
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (email && email.toLowerCase() === order.customer.email.toLowerCase()) {
      const shopSettings = await getPublicShopSettings();
      return NextResponse.json({ order, shopSettings });
    }
    
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
