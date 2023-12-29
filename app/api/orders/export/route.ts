import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { listOrders, type OrderWithItems } from '@/lib/queries/orders';
import * as XLSX from 'xlsx';

// ============================================================================
// GET /api/orders/export - Export orders to CSV or Excel
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    // Only admins can export orders
    if (session?.role !== 'admin' && session?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    
    // Validate format
    if (format !== 'csv' && format !== 'excel') {
      return NextResponse.json(
        { error: 'Invalid format. Use "csv" or "excel"' },
        { status: 400 }
      );
    }
    
    // Fetch all orders (no pagination for export)
    const result = await listOrders({
      page: 1,
      pageSize: 10000, // Large page size to get all orders
      status,
    });
    
    // Filter by date range if provided
    let orders = result.orders;
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      orders = orders.filter(order => new Date(order.createdAt) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      orders = orders.filter(order => new Date(order.createdAt) <= end);
    }
    
    // Transform orders to export format
    const exportData = orders.map(order => ({
      'Order Number': order.orderNumber,
      'Date': formatDate(order.createdAt),
      'Customer Name': `${order.customer.firstName} ${order.customer.lastName}`.trim(),
      'Customer Email': order.customer.email,
      'Status': formatStatus(order.status),
      'Total': formatCurrency(order.totalCents),
      'Items Count': order.items.reduce((sum, item) => sum + item.quantity, 0),
      'Payment Method': getPaymentMethod(order),
      'Shipping Address': formatShippingAddress(order),
    }));
    
    // Generate file based on format
    if (format === 'csv') {
      const csv = generateCSV(exportData);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="orders-${getDateString()}.csv"`,
        },
      });
    } else {
      // Excel format
      const buffer = generateExcel(exportData);
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="orders-${getDateString()}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending_payment': 'Menunggu Pembayaran',
    'processing': 'Diproses',
    'shipped': 'Dikirim',
    'delivered': 'Selesai',
    'cancelled': 'Dibatalkan',
    'refunded': 'Dikembalikan',
  };
  return statusMap[status] || status;
}

function formatCurrency(cents: number): string {
  const rupiah = cents / 100;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupiah);
}

function getPaymentMethod(order: OrderWithItems): string {
  if (order.payments.length === 0) return '-';
  const payment = order.payments[0];
  if (!payment) return '-';
  if (!payment.paymentMethod) return payment.provider;
  
  const methodMap: Record<string, string> = {
    'gopay': 'GoPay',
    'gopay_paylater': 'GoPay Paylater',
    'shopeepay': 'ShopeePay',
    'bank_transfer': 'Transfer Bank',
    'bca': 'BCA',
    'bni': 'BNI',
    'bri': 'BRI',
    'mandiri': 'Mandiri',
    'permata': 'Permata',
    'credit_card': 'Kartu Kredit',
    'qris': 'QRIS',
  };
  
  return methodMap[payment.paymentMethod] || payment.paymentMethod;
}

function formatShippingAddress(order: OrderWithItems): string {
  const parts = [
    order.shippingAddress1,
    order.shippingAddress2,
    order.shippingCity,
    order.shippingState,
    order.shippingPostalCode,
  ].filter(Boolean);
  
  return parts.join(', ');
}

function getDateString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function generateCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) {
    return '';
  }
  
  const firstRow = data[0];
  if (!firstRow) {
    return '';
  }
  
  const headers = Object.keys(firstRow);
  const rows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] ?? '';
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    rows.push(values.join(','));
  }
  
  return rows.join('\n');
}

function generateExcel(data: Record<string, unknown>[]): Uint8Array {
  if (data.length === 0) {
    // Create empty workbook with headers
    const ws = XLSX.utils.aoa_to_sheet([[]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new Uint8Array(buffer);
  }
  
  const firstRow = data[0];
  if (!firstRow) {
    const ws = XLSX.utils.aoa_to_sheet([[]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new Uint8Array(buffer);
  }
  
  // Create worksheet from JSON data
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const headers = Object.keys(firstRow);
  ws['!cols'] = headers.map(header => ({
    wch: Math.max(header.length, 15),
  }));
  
  // Create workbook and write to buffer
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buffer);
}
