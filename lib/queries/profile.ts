import { db } from '@/lib/db';
import { users, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ============================================================================
// Types
// ============================================================================

export interface UserProfile {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  customerId: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  totalSpentCents: number | null;
  createdAt: Date;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// ============================================================================
// Profile Queries
// ============================================================================

/**
 * Get user profile with customer data
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return null;
  }

  // Get customer profile if exists
  const customer = await db.query.customers.findFirst({
    where: eq(customers.userId, userId),
  });

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: customer?.id ?? null,
    firstName: customer?.firstName ?? null,
    lastName: customer?.lastName ?? null,
    phone: customer?.phone ?? null,
    totalSpentCents: customer?.totalSpentCents ?? null,
    createdAt: user.createdAt,
  };
}

/**
 * Update user profile
 * Updates both users.name and customers fields
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfile | null> {
  // Get existing user and customer
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return null;
  }

  const customer = await db.query.customers.findFirst({
    where: eq(customers.userId, userId),
  });

  // Update user name
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(' ');
  if (fullName) {
    await db
      .update(users)
      .set({ name: fullName, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Update or create customer
  if (customer) {
    await db
      .update(customers)
      .set({
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customer.id));
  } else {
    // Create customer record if doesn't exist
    await db.insert(customers).values({
      userId,
      email: user.email,
      firstName: input.firstName || '',
      lastName: input.lastName || '',
      phone: input.phone || null,
    });
  }

  return getUserProfile(userId);
}

/**
 * Get customer ID by user ID
 */
export async function getCustomerIdByUserId(userId: string): Promise<string | null> {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.userId, userId),
    columns: { id: true },
  });

  return customer?.id ?? null;
}
