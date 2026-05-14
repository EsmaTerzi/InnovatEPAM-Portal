'use client';

import { X } from 'lucide-react';

interface Props {
  guidance: string;
  onDismiss: () => void;
}

export function GuidanceBanner({ guidance, onDismiss }: Props) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
    >
      <p className="flex-1">{guidance}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss guidance"
        className="mt-0.5 shrink-0 rounded hover:bg-blue-100 p-0.5 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
