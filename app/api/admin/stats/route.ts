import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db, orders, products, customers, payments } from '@/lib/db';
import { and, gte, sql, eq } from 'drizzle-orm';

/**
 * GET /api/admin/stats
 * Get dashboard statistics for admin panel
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get total orders
    const [totalOrdersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders);
    const totalOrders = totalOrdersResult?.count ?? 0;

    // Get orders in last 30 days
    const [ordersLast30DaysResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(gte(orders.createdAt, thirtyDaysAgo));
    const ordersLast30Days = ordersLast30DaysResult?.count ?? 0;

    // Get orders in previous 30 days for comparison
    const [ordersPrev30DaysResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(
        gte(orders.createdAt, sixtyDaysAgo),
        sql`${orders.createdAt} < ${thirtyDaysAgo}`
      ));
    const ordersPrev30Days = ordersPrev30DaysResult?.count ?? 0;

    // Calculate order trend
    const ordersTrend = ordersPrev30Days > 0 
      ? Math.round(((ordersLast30Days - ordersPrev30Days) / ordersPrev30Days) * 100)
      : (ordersLast30Days > 0 ? 100 : 0);

    // Get total revenue (sum of paid payments)
    const [revenueResult] = await db
      .select({ total: sql<number>`coalesce(sum(amount_cents), 0)::int` })
      .from(payments)
      .where(eq(payments.status, 'paid'));
    const totalRevenueCents = revenueResult?.total ?? 0;

    // Get revenue last 30 days
    const [revenueLast30DaysResult] = await db
      .select({ total: sql<number>`coalesce(sum(amount_cents), 0)::int` })
      .from(payments)
      .where(and(
        eq(payments.status, 'paid'),
        gte(payments.paidAt, thirtyDaysAgo)
      ));
    const revenueLast30DaysCents = revenueLast30DaysResult?.total ?? 0;

    // Get revenue previous 30 days
    const [revenuePrev30DaysCentsResult] = await db
      .select({ total: sql<number>`coalesce(sum(amount_cents), 0)::int` })
      .from(payments)
      .where(and(
        eq(payments.status, 'paid'),
        gte(payments.paidAt, sixtyDaysAgo),
        sql`${payments.paidAt} < ${thirtyDaysAgo}`
      ));
    const revenuePrev30DaysCents = revenuePrev30DaysCentsResult?.total ?? 0;

    // Calculate revenue trend
    const revenueTrend = revenuePrev30DaysCents > 0
      ? Math.round(((revenueLast30DaysCents - revenuePrev30DaysCents) / revenuePrev30DaysCents) * 100)
      : (revenueLast30DaysCents > 0 ? 100 : 0);

    // Get total customers
    const [totalCustomersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers);
    const totalCustomers = totalCustomersResult?.count ?? 0;

    // Get customers last 30 days
    const [customersLast30DaysResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(gte(customers.createdAt, thirtyDaysAgo));
    const customersLast30Days = customersLast30DaysResult?.count ?? 0;

    // Get customers previous 30 days
    const [customersPrev30DaysResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(and(
        gte(customers.createdAt, sixtyDaysAgo),
        sql`${customers.createdAt} < ${thirtyDaysAgo}`
      ));
    const customersPrev30Days = customersPrev30DaysResult?.count ?? 0;

    // Calculate customer trend
    const customersTrend = customersPrev30Days > 0
      ? Math.round(((customersLast30Days - customersPrev30Days) / customersPrev30Days) * 100)
      : (customersLast30Days > 0 ? 100 : 0);

    // Get total products
    const [totalProductsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(sql`deleted_at IS NULL`);
    const totalProducts = totalProductsResult?.count ?? 0;

    // Get recent orders (last 5)
    const recentOrders = await db.query.orders.findMany({
      limit: 5,
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      with: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    // Get sales chart data (last 7 days)
    const salesChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStart = new Date(date.setHours(0, 0, 0, 0));
      const dateEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const [dayRevenue] = await db
        .select({ total: sql<number>`coalesce(sum(amount_cents), 0)::int` })
        .from(payments)
        .where(and(
          eq(payments.status, 'paid'),
          gte(payments.paidAt, dateStart),
          sql`${payments.paidAt} <= ${dateEnd}`
        ));
      
      salesChartData.push({
        date: dateStart.toISOString().split('T')[0],
        revenue: (dayRevenue?.total ?? 0) / 100,
      });
    }

    return NextResponse.json({
      stats: {
        orders: {
          total: totalOrders,
          last30Days: ordersLast30Days,
          trend: ordersTrend,
        },
        revenue: {
          totalCents: totalRevenueCents,
          last30DaysCents: revenueLast30DaysCents,
          trend: revenueTrend,
        },
        customers: {
          total: totalCustomers,
          last30Days: customersLast30Days,
          trend: customersTrend,
        },
        products: {
          total: totalProducts,
        },
      },
      recentOrders,
      salesChartData,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
