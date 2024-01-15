import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { updateAddress, deleteAddress, getAddressById } from '@/lib/queries/addresses';
import { getCustomerIdByUserId } from '@/lib/queries/profile';

// ============================================================================
// GET /api/addresses/[id] - Get single address
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const customerId = await getCustomerIdByUserId(session.userId);

    if (!customerId) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const address = await getAddressById(id, customerId);

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/addresses/[id] - Update address
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const customerId = await getCustomerIdByUserId(session.userId);

    if (!customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const address = await updateAddress(id, customerId, {
      name: body.name,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      address1: body.address1,
      address2: body.address2,
      rajaongkirCityId: body.rajaongkirCityId,
      rajaongkirCityName: body.rajaongkirCityName,
      rajaongkirProvince: body.rajaongkirProvince,
      rajaongkirCity: body.rajaongkirCity,
      rajaongkirDistrict: body.rajaongkirDistrict,
      rajaongkirSubdistrict: body.rajaongkirSubdistrict,
      rajaongkirPostalCode: body.rajaongkirPostalCode,
      isDefault: body.isDefault,
    });

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/addresses/[id] - Delete address
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const customerId = await getCustomerIdByUserId(session.userId);

    if (!customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await deleteAddress(id, customerId);

    if (!success) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
