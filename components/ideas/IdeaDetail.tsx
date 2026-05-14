import { StatusBadge } from './StatusBadge';
import { CategoryDetails } from './CategoryDetails';
import { AttachmentPreview } from './AttachmentPreview';
import { formatDate } from '@/lib/utils/format-date';
import type { Idea } from '@/lib/db/dao/ideas';
import type { EvaluationComment } from '@/lib/db/dao/comments';
import type { MetadataEntry } from '@/lib/db/dao/metadata';
import type { AttachmentResponse } from '@/lib/db/dao/attachments';

interface IdeaDetailProps {
  idea: Idea;
  comment: EvaluationComment | null;
  metadata?: MetadataEntry[];
  attachments?: AttachmentResponse[];
}

export function IdeaDetail({ idea, comment, metadata = [], attachments = [] }: IdeaDetailProps) {
  return (
    <article className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-neutral-900">{idea.title}</h1>
        <StatusBadge status={idea.status} />
      </div>

      {/* Meta */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-neutral-500">Category</dt>
          <dd className="font-medium text-neutral-900">{idea.category}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Submitted</dt>
          <dd className="font-medium text-neutral-900">{formatDate(idea.created_at)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Last updated</dt>
          <dd className="font-medium text-neutral-900">{formatDate(idea.updated_at)}</dd>
        </div>
      </dl>

      {/* Description */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Description
        </h2>
        <p className="whitespace-pre-wrap text-neutral-800 leading-relaxed">
          {idea.description}
        </p>
      </section>

      {/* Category Details */}
      {metadata.length > 0 && (
        <CategoryDetails category={idea.category} metadata={metadata} />
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Attachments
          </h2>
          <AttachmentPreview mode="readonly" attachments={attachments} />
        </section>
      )}

      {/* Evaluation comment */}
      {comment && (
        <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <h2 className="mb-2 text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Evaluator&apos;s Comment
          </h2>
          <p className="whitespace-pre-wrap text-neutral-800 leading-relaxed">
            {comment.comment_text}
          </p>
          <p className="mt-2 text-xs text-neutral-400">{formatDate(comment.created_at)}</p>
        </section>
      )}
    </article>
  );
}
