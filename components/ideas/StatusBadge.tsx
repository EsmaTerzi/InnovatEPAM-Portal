import { Badge } from '@/components/ui/badge';
import type { IdeaStatus } from '@/lib/db/dao/ideas';

const STATUS_CONFIG: Record<
  IdeaStatus,
  { label: string; className: string }
> = {
  submitted: {
    label: 'Submitted',
    className:
      'bg-status-submitted-bg text-status-submitted-text border-status-submitted-border',
  },
  under_review: {
    label: 'Under Review',
    className:
      'bg-status-review-bg text-status-review-text border-status-review-border',
  },
  accepted: {
    label: 'Accepted',
    className:
      'bg-status-accepted-bg text-status-accepted-text border-status-accepted-border',
  },
  rejected: {
    label: 'Rejected',
    className:
      'bg-status-rejected-bg text-status-rejected-text border-status-rejected-border',
  },
};

export function StatusBadge({ status }: { status: IdeaStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
