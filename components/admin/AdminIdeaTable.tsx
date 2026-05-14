import Link from 'next/link';
import { StatusBadge } from '@/components/ideas/StatusBadge';
import { formatDate } from '@/lib/utils/format-date';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { IdeaWithEmail } from '@/lib/db/dao/ideas';

export function AdminIdeaTable({ ideas }: { ideas: IdeaWithEmail[] }) {
  if (ideas.length === 0) {
    return (
      <p className="text-sm text-neutral-500">No ideas have been submitted yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Submitter</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ideas.map((idea) => (
            <TableRow key={idea.id}>
              <TableCell>
                <Link
                  href={`/admin/ideas/${idea.id}`}
                  className="font-medium text-brand-600 hover:underline line-clamp-1"
                >
                  {idea.title}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-neutral-600">
                {idea.submitter_email}
              </TableCell>
              <TableCell className="text-sm text-neutral-600">{idea.category}</TableCell>
              <TableCell>
                <StatusBadge status={idea.status} />
              </TableCell>
              <TableCell className="text-sm text-neutral-500">
                {formatDate(idea.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
