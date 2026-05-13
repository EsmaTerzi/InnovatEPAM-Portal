import { cookies } from 'next/headers';
import { findSession } from '@/lib/db/dao/sessions';
import { findUserById, type User } from '@/lib/db/dao/users';

const COOKIE_NAME = 'session_token';
const MAX_AGE = 86400; // 24 hours in seconds

export async function createSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function getSessionUser(
  request?: Request
): Promise<User | null> {
  let token: string | undefined;

  if (request) {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));
    token = match?.split('=')[1];
  } else {
    token = await getSessionToken();
  }

  if (!token) return null;

  const session = findSession(token);
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) return null;

  return findUserById(session.user_id) ?? null;
}
