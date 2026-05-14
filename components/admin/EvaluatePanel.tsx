'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ideas/StatusBadge';
import type { IdeaStatus } from '@/lib/db/dao/ideas';

interface EvaluatePanelProps {
  ideaId: string;
  currentStatus: IdeaStatus;
}

export function EvaluatePanel({ ideaId, currentStatus }: EvaluatePanelProps) {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function evaluate(newStatus: IdeaStatus) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/ideas/${ideaId}/evaluate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, comment: comment.trim() || undefined }),
      });

      if (res.ok) {
        setSuccess(`Status updated to "${newStatus.replace('_', ' ')}".`);
        setComment('');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Action failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isTerminal = currentStatus === 'accepted' || currentStatus === 'rejected';

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-2">
          Evaluation
        </h2>
        <StatusBadge status={currentStatus} />
      </div>

      {isTerminal ? (
        <p className="text-sm text-neutral-400">
          This idea has been {currentStatus}. No further actions available.
        </p>
      ) : (
        <>
          {(currentStatus === 'under_review') && (
            <div className="space-y-1">
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-neutral-700"
              >
                Comment{' '}
                <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Add a comment for the submitter…"
                disabled={loading}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {currentStatus === 'submitted' && (
              <Button
                variant="outline"
                onClick={() => evaluate('under_review')}
                disabled={loading}
              >
                Move to Under Review
              </Button>
            )}
            {currentStatus === 'under_review' && (
              <>
                <Button
                  className="bg-status-accepted-bg text-status-accepted-text border border-status-accepted-border hover:opacity-90"
                  variant="outline"
                  onClick={() => evaluate('accepted')}
                  disabled={loading}
                >
                  Accept
                </Button>
                <Button
                  className="bg-status-rejected-bg text-status-rejected-text border border-status-rejected-border hover:opacity-90"
                  variant="outline"
                  onClick={() => evaluate('rejected')}
                  disabled={loading}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600" role="status">
          {success}
        </p>
      )}
    </section>
  );
}
