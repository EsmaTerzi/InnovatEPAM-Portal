import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';
import { findIdeaById } from '@/lib/db/dao/ideas';
import { findCommentByIdeaId } from '@/lib/db/dao/comments';
import { IdeaDetail } from '@/components/ideas/IdeaDetail';

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const idea = findIdeaById(id);
  if (!idea) notFound();

  if (user.role === 'submitter' && idea.submitted_by !== user.id) {
    redirect('/dashboard');
  }

  const comment = findCommentByIdeaId(id) ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Back to My Ideas
      </Link>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <IdeaDetail idea={idea} comment={comment} />
      </div>
    </div>
  );
}
