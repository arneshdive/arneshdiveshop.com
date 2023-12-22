// lib/auth/seamless-signup.ts

import { db, users, customers } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

interface CheckoutSessionForSignup {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  userId?: string | null;
}

/**
 * Create user account from checkout session
 * Called for guest users who don't have an account
 */
export async function createAccountFromCheckout(
  checkoutSession: CheckoutSessionForSignup
): Promise<{ userId: string; customerId: string; isNewUser: boolean }> {
  const { email, phone, fullName, userId: existingUserId } = checkoutSession;

  // If user already logged in, just return their IDs
  if (existingUserId) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.userId, existingUserId),
    });
    
    if (customer) {
      return { userId: existingUserId, customerId: customer.id, isNewUser: false };
    }
  }

  // Check if user exists by email
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    // User exists, get their customer record
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, email),
    });

    if (customer) {
      // Log them in
      const token = await createSession({
        userId: existingUser.id,
        role: existingUser.role,
      });
      await setSessionCookie(token);

      return { userId: existingUser.id, customerId: customer.id, isNewUser: false };
    }
  }

  // Create new user with random password
  // They can reset password later or use magic link
  const randomPassword = randomBytes(32).toString('hex');
  const hashedPassword = await hash(randomPassword, 12);

  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') || '-';

  // Create user
  const [newUser] = await db.insert(users).values({
    email,
    name: fullName,
    password: hashedPassword,
    role: 'customer',
    emailVerified: new Date(), // Auto-verify from checkout
  }).returning();

  if (!newUser) {
    throw new Error('Failed to create user');
  }

  // Create customer
  const [newCustomer] = await db.insert(customers).values({
    userId: newUser.id,
    email,
    phone,
    firstName,
    lastName,
  }).returning();

  if (!newCustomer) {
    throw new Error('Failed to create customer');
  }

  // Create session and set cookie (auto-login)
  const token = await createSession({
    userId: newUser.id,
    role: newUser.role,
  });
  await setSessionCookie(token);

  return { userId: newUser.id, customerId: newCustomer.id, isNewUser: true };
}
