'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DocxViewerProps {
  url: string;
  filename: string;
}

export function DocxViewer({ url, filename }: DocxViewerProps) {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (html !== null) return; // already loaded
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch file (${res.status})`);
      const arrayBuffer = await res.arrayBuffer();
      // mammoth's package.json browser field handles the right build automatically
      const mammoth = (await import('mammoth')) as typeof import('mammoth');
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtml(result.value);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <a
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpen(); }}
        className="shrink-0 cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-800 border border-neutral-200 rounded px-2 py-1"
      >
        Open
      </a>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mt-8 mb-8">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
              <span className="text-sm font-medium text-neutral-700 truncate">{filename}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </Button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 min-h-40">
              {loading && (
                <p className="text-sm text-neutral-400 text-center py-12">Loading…</p>
              )}
              {error && (
                <p className="text-sm text-red-600 text-center py-12">{error}</p>
              )}
              {html !== null && !loading && (
                <div
                  className="text-sm text-neutral-800 leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-neutral-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-neutral-200 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-neutral-50"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-5 py-3 border-t border-neutral-200">
              <a
                href={url}
                download={filename}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-800 border border-neutral-200 rounded px-3 py-1.5"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
