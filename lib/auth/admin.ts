import { getSession } from './session';

/**
 * Check if the current user is authenticated and has admin privileges.
 * Returns the session if authorized, or an error response if not.
 */
export async function requireAdmin(): Promise<
  | { authorized: true; userId: string }
  | { authorized: false; error: Response }
> {
  const session = await getSession();
  
  if (!session) {
    return {
      authorized: false,
      error: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  
  if (session.role !== 'admin' && session.role !== 'super_admin') {
    return {
      authorized: false,
      error: Response.json({ error: 'Akses ditolak' }, { status: 403 }),
    };
  }
  
  return { authorized: true, userId: session.userId };
}
