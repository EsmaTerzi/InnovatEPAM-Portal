import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  const user = await getSessionUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { id: user.id, email: user.email, role: user.role },
    { status: 200 }
  );
}
