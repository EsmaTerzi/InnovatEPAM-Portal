import { NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db/dao/users';
import { createSession } from '@/lib/db/dao/sessions';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionCookie } from '@/lib/auth/session';

const INVALID_CREDENTIALS = 'Invalid email or password';

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  const expiresAt = new Date(Date.now() + 86400 * 1000);
  const session = createSession(user.id, expiresAt);

  await createSessionCookie(session.id);

  return NextResponse.json({ id: user.id, role: user.role }, { status: 200 });
}
