import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSessionUser } from '@/lib/auth/session';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Prevent path traversal: ensure resolved path stays within uploads dir
function safePath(segments: string[]): string | null {
  const joined = segments.join('/');
  // Reject any segment containing .. or absolute paths
  if (segments.some((s) => s.includes('..') || path.isAbsolute(s))) {
    return null;
  }
  const resolved = path.resolve(UPLOADS_DIR, joined);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep) && resolved !== UPLOADS_DIR) {
    return null;
  }
  return resolved;
}

const MIME_MAP: Record<string, string> = {
  '.pdf':  'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Must be authenticated
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path: segments } = await params;
  const filePath = safePath(segments);

  if (!filePath) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] ?? 'application/octet-stream';
  const fileBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
