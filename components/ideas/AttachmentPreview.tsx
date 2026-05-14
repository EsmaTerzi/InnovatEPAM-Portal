'use client';

import { useEffect, useState } from 'react';
import { FileText, FileImage, Film, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AttachmentResponse } from '@/lib/db/dao/attachments';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditModeProps {
  mode: 'edit';
  files: File[];
  onRemove: (index: number) => void;
  errors?: string[];
}

interface ReadonlyModeProps {
  mode: 'readonly';
  attachments: AttachmentResponse[];
}

type AttachmentPreviewProps = EditModeProps | ReadonlyModeProps;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-500 shrink-0" />;
  if (mimeType.startsWith('video/')) return <Film className="h-5 w-5 text-purple-500 shrink-0" />;
  if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500 shrink-0" />;
  return <File className="h-5 w-5 text-neutral-400 shrink-0" />;
}

// ── Edit-mode item ────────────────────────────────────────────────────────────

function EditItem({
  file,
  index,
  objectUrl,
  onRemove,
}: {
  file: File;
  index: number;
  objectUrl: string | undefined;
  onRemove: (index: number) => void;
}) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  return (
    <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3">
      {/* Preview */}
      <div className="shrink-0 w-20 h-20 rounded overflow-hidden bg-neutral-100 flex items-center justify-center">
        {isImage && objectUrl && (
          <img src={objectUrl} alt={file.name} className="w-full h-full object-cover" />
        )}
        {isVideo && objectUrl && (
          <video
            src={objectUrl}
            controls
            muted
            preload="metadata"
            className="w-full h-full object-cover"
          />
        )}
        {(!objectUrl || (!isImage && !isVideo)) && <FileTypeIcon mimeType={file.type} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-neutral-800 truncate">{file.name}</p>
        <p className="text-xs text-neutral-400">{formatBytes(file.size)}</p>
      </div>

      {/* Remove */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={`Remove ${file.name}`}
        onClick={() => onRemove(index)}
        className="text-neutral-400 hover:text-red-600"
      >
        ✕
      </Button>
    </li>
  );
}

// ── Readonly-mode item ────────────────────────────────────────────────────────

function ReadonlyItem({ attachment }: { attachment: AttachmentResponse }) {
  const isImage = attachment.mime_type.startsWith('image/');
  const isVideo = attachment.mime_type.startsWith('video/');
  const url = attachment.stored_path.replace('/uploads/', '/api/uploads/');

  return (
    <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3">
      {/* Preview */}
      <div className="shrink-0 w-20 h-20 rounded overflow-hidden bg-neutral-100 flex items-center justify-center">
        {isImage && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
            <img
              src={url}
              alt={attachment.original_name}
              className="w-full h-full object-cover"
            />
          </a>
        )}
        {isVideo && (
          <video
            src={url}
            controls
            muted
            preload="metadata"
            className="w-full h-full object-cover"
          />
        )}
        {!isImage && !isVideo && <FileTypeIcon mimeType={attachment.mime_type} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {isImage ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-brand-600 hover:underline truncate block"
          >
            {attachment.original_name}
          </a>
        ) : (
          <a
            href={url}
            download={attachment.original_name}
            className="text-sm font-medium text-brand-600 hover:underline truncate block"
          >
            {attachment.original_name}
          </a>
        )}
        <p className="text-xs text-neutral-400">{formatBytes(attachment.size_bytes)}</p>
      </div>
    </li>
  );
}

// ── Edit-mode list (manages object URL lifecycle) ─────────────────────────────

function EditList({
  files,
  onRemove,
  errors,
}: {
  files: File[];
  onRemove: (index: number) => void;
  errors?: string[];
}) {
  const [urlMap, setUrlMap] = useState<Map<number, string>>(new Map());

  // Create object URLs for new files; revoke removed ones; trigger re-render
  useEffect(() => {
    setUrlMap((prev) => {
      const next = new Map<number, string>();
      files.forEach((file, i) => {
        next.set(i, prev.get(i) ?? URL.createObjectURL(file));
      });
      // Revoke URLs for indices that are no longer present
      prev.forEach((url, i) => {
        if (!next.has(i)) URL.revokeObjectURL(url);
      });
      return next;
    });
  }, [files]);

  // Revoke all on unmount
  useEffect(() => {
    return () => {
      setUrlMap((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return new Map();
      });
    };
  }, []);

  if (files.length === 0) return null;

  return (
    <div className="space-y-2 min-h-24">
      {errors && errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="text-sm text-red-600" role="alert">
              {err}
            </li>
          ))}
        </ul>
      )}
      <ul className="space-y-2">
        {files.map((file, i) => (
          <EditItem
            key={i}
            file={file}
            index={i}
            objectUrl={urlMap.get(i)}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AttachmentPreview(props: AttachmentPreviewProps) {
  if (props.mode === 'edit') {
    return (
      <EditList files={props.files} onRemove={props.onRemove} errors={props.errors} />
    );
  }

  if (props.attachments.length === 0) return null;

  return (
    <ul className="space-y-2">
      {props.attachments.map((att) => (
        <ReadonlyItem key={att.id} attachment={att} />
      ))}
    </ul>
  );
}
