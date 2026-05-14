'use client';

import { useRef } from 'react';
import { ATTACHMENT_CONFIG, MAX_ATTACHMENTS } from '@/lib/config/attachments';

const ACCEPT = ATTACHMENT_CONFIG.flatMap((c) => c.extensions).join(',');

interface AttachmentUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function AttachmentUploadZone({ files, onFilesChange, disabled }: AttachmentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const atLimit = files.length >= MAX_ATTACHMENTS;
  const isDisabled = disabled || atLimit;

  function openPicker() {
    if (!isDisabled) inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    onFilesChange([...files, ...selected].slice(0, MAX_ATTACHMENTS));
    // Reset input so the same file can be re-selected after removal
    e.target.value = '';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        aria-label="Upload attachments"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        className={[
          'flex items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors',
          isDisabled
            ? 'cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400'
            : 'cursor-pointer border-neutral-300 bg-white text-neutral-500 hover:border-brand-400 hover:text-neutral-700',
        ].join(' ')}
      >
        <span>
          {atLimit
            ? `Maximum ${MAX_ATTACHMENTS} files reached`
            : 'Click to browse or drop files here'}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        disabled={isDisabled}
        onChange={handleChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {atLimit && (
        <p className="text-sm text-red-600" role="alert">
          You can attach a maximum of {MAX_ATTACHMENTS} files.
        </p>
      )}
    </div>
  );
}
