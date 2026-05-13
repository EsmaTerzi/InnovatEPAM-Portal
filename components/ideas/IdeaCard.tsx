import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '@/lib/utils/format-date';
import type { Idea } from '@/lib/db/dao/ideas';

export function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-brand-200"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-neutral-900 line-clamp-2">
          {idea.title}
        </h3>
        <StatusBadge status={idea.status} />
      </div>
      <p className="mt-1 text-sm text-neutral-500">{idea.category}</p>
      <p className="mt-1 text-xs text-neutral-400">{formatDate(idea.created_at)}</p>
    </Link>
  );
}
