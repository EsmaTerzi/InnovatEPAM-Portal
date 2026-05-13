import { NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/db/dao/users';
import { createSession } from '@/lib/db/dao/sessions';
import { hashPassword } from '@/lib/auth/password';
import { createSessionCookie } from '@/lib/auth/session';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = createUser(email, passwordHash, 'submitter');

  const expiresAt = new Date(Date.now() + 86400 * 1000);
  const session = createSession(user.id, expiresAt);

  await createSessionCookie(session.id);

  return NextResponse.json({ id: user.id }, { status: 201 });
}
