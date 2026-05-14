import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findIdeaById } from '@/lib/db/dao/ideas';
import { findCommentByIdeaId } from '@/lib/db/dao/comments';
import { findMetadataByIdeaId } from '@/lib/db/dao/metadata';
import { findAttachmentsByIdeaId } from '@/lib/db/dao/attachments';
import { IdeaDetail } from '@/components/ideas/IdeaDetail';
import { EvaluatePanel } from '@/components/admin/EvaluatePanel';

export default async function AdminIdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idea = findIdeaById(id);
  if (!idea) notFound();

  const comment = findCommentByIdeaId(id) ?? null;
  const metadata = findMetadataByIdeaId(id);
  const attachments = findAttachmentsByIdeaId(id);

  return (
    <div className="space-y-4">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Back to All Ideas
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <IdeaDetail idea={idea} comment={comment} metadata={metadata} attachments={attachments} />
        </div>
        <div>
          <EvaluatePanel ideaId={idea.id} currentStatus={idea.status} />
        </div>
      </div>
    </div>
  );
}
