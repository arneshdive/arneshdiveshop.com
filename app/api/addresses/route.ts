import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getCustomerAddresses, createAddress } from '@/lib/queries/addresses';
import { getCustomerIdByUserId as getCustomerId } from '@/lib/queries/profile';

// ============================================================================
// GET /api/addresses - List user's addresses
// ============================================================================

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = await getCustomerId(session.userId);

    if (!customerId) {
      // User has no customer record yet
      return NextResponse.json({ addresses: [] });
    }

    const addresses = await getCustomerAddresses(customerId);

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/addresses - Create new address
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const {
      name,
      firstName,
      lastName,
      phone,
      address1,
      rajaongkirCityId,
      rajaongkirCityName,
    } = body;

    if (!name || !firstName || !phone || !address1 || !rajaongkirCityId || !rajaongkirCityName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or verify customer
    let customerId = await getCustomerId(session.userId);

    if (!customerId) {
      // Create customer record if doesn't exist
      const { db } = await import('@/lib/db');
      const { customers } = await import('@/lib/db/schema');
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, session.userId),
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const [newCustomer] = await db.insert(customers).values({
        userId: session.userId,
        email: user.email,
        firstName: firstName,
        lastName: lastName || '',
        phone: phone,
      }).returning();

      if (!newCustomer) {
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }

      customerId = newCustomer.id;
    }

    const address = await createAddress(customerId, {
      name,
      firstName,
      lastName: lastName || '',
      phone,
      address1,
      address2: body.address2,
      rajaongkirCityId,
      rajaongkirCityName,
      rajaongkirProvince: body.rajaongkirProvince,
      rajaongkirCity: body.rajaongkirCity,
      rajaongkirDistrict: body.rajaongkirDistrict,
      rajaongkirSubdistrict: body.rajaongkirSubdistrict,
      rajaongkirPostalCode: body.rajaongkirPostalCode,
      isDefault: body.isDefault,
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}
