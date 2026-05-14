import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { findIdeaById } from '@/lib/db/dao/ideas';
import { findCommentByIdeaId } from '@/lib/db/dao/comments';
import { findMetadataByIdeaId } from '@/lib/db/dao/metadata';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const idea = findIdeaById(id);

  if (!idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (user.role === 'submitter' && idea.submitted_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const comment = findCommentByIdeaId(id);
  const metadata = findMetadataByIdeaId(id);
  return NextResponse.json({ ...idea, comment: comment ?? null, metadata });
}
