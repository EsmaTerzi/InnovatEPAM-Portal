import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/auth/session';
import { findIdeaById, updateIdeaStatus, type IdeaStatus } from '@/lib/db/dao/ideas';
import { createComment } from '@/lib/db/dao/comments';
import { isLegalTransition } from '@/lib/db/dao/transitions';

const VALID_STATUSES: IdeaStatus[] = ['submitted', 'under_review', 'accepted', 'rejected'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const idea = findIdeaById(id);
  if (!idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: { status?: string; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const newStatus = body.status as IdeaStatus | undefined;
  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  if (!isLegalTransition(idea.status, newStatus)) {
    return NextResponse.json(
      {
        error: `Transition from "${idea.status}" to "${newStatus}" is not allowed`,
      },
      { status: 400 }
    );
  }

  updateIdeaStatus(id, newStatus);

  if ((newStatus === 'accepted' || newStatus === 'rejected') && body.comment?.trim()) {
    try {
      createComment(id, user.id, body.comment.trim());
    } catch (err) {
      console.error('[evaluate] createComment failed:', err);
      // UNIQUE constraint: comment already exists — silently skip
    }
  }

  // Revalidate both the admin and user-facing detail pages so the
  // Next.js router cache is cleared and router.replace() gets fresh data.
  revalidatePath(`/admin/ideas/${id}`);
  revalidatePath(`/ideas/${id}`);

  return NextResponse.json({ ok: true });
}
