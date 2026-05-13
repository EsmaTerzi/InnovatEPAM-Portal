import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/db/dao/sessions';
import { clearSessionCookie, getSessionToken } from '@/lib/auth/session';

export async function POST() {
  const token = await getSessionToken();

  if (token) {
    deleteSession(token);
  }

  await clearSessionCookie();

  return NextResponse.json({ ok: true }, { status: 200 });
}
