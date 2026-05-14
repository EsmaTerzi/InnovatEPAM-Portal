'use client';

import { useEffect, useState } from 'react';
import { FileText, FileImage, Film, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocxViewer } from './DocxViewer';
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

// ── Generic modal wrapper ─────────────────────────────────────────────────────

function PreviewModal({
  filename,
  onClose,
  downloadUrl,
  children,
}: {
  filename: string;
  onClose: () => void;
  downloadUrl: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mt-8 mb-8">
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
          <span className="text-sm font-medium text-neutral-700 truncate">{filename}</span>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">✕</Button>
        </div>
        <div className="overflow-hidden">{children}</div>
        <div className="flex justify-end px-5 py-3 border-t border-neutral-200">
          <a
            href={downloadUrl}
            download={filename}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-800 border border-neutral-200 rounded px-3 py-1.5"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Readonly-mode item ────────────────────────────────────────────────────────

function ReadonlyItem({ attachment }: { attachment: AttachmentResponse }) {
  const [modalOpen, setModalOpen] = useState(false);
  const isImage = attachment.mime_type.startsWith('image/');
  const isVideo = attachment.mime_type.startsWith('video/');
  const isDocx =
    attachment.mime_type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isPptx =
    attachment.mime_type ===
    'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  const isPdf = attachment.mime_type === 'application/pdf';
  const url = attachment.stored_path.replace('/uploads/', '/api/uploads/');

  // Thumbnail for the list row
  const thumbnail = isImage ? (
    <div className="shrink-0 w-14 h-14 rounded overflow-hidden bg-neutral-100">
      <img src={url} alt={attachment.original_name} className="w-full h-full object-cover" />
    </div>
  ) : (
    <div className="shrink-0 w-10 h-10 rounded bg-neutral-100 flex items-center justify-center">
      <FileTypeIcon mimeType={attachment.mime_type} />
    </div>
  );

  // Action button
  const actionButton = isDocx ? (
    <DocxViewer url={url} filename={attachment.original_name} />
  ) : isPptx ? (
    <a
      href={url}
      download={attachment.original_name}
      className="shrink-0 text-xs font-medium text-neutral-500 hover:text-neutral-800 border border-neutral-200 rounded px-2 py-1"
    >
      Download
    </a>
  ) : (
    <button
      type="button"
      onClick={() => setModalOpen(true)}
      className="shrink-0 cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-800 border border-neutral-200 rounded px-2 py-1"
    >
      Open
    </button>
  );

  return (
    <>
      <li className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
        {thumbnail}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-800 truncate">{attachment.original_name}</p>
          <p className="text-xs text-neutral-400 mt-0.5">{formatBytes(attachment.size_bytes)}</p>
        </div>
        {actionButton}
      </li>

      {modalOpen && (
        <PreviewModal filename={attachment.original_name} onClose={() => setModalOpen(false)} downloadUrl={url}>
          {isImage && (
            <img
              src={url}
              alt={attachment.original_name}
              className="w-full object-contain max-h-[70vh]"
            />
          )}
          {isVideo && (
            <video
              src={url}
              controls
              autoPlay
              preload="metadata"
              className="w-full max-h-[70vh] bg-black"
            />
          )}
          {isPdf && (
            <iframe
              src={url}
              title={attachment.original_name}
              className="w-full"
              style={{ height: '70vh' }}
            />
          )}
        </PreviewModal>
      )}
    </>
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
