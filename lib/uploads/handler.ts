import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ATTACHMENT_CONFIG } from '@/lib/config/attachments';
import type { AttachmentInsert } from '@/lib/db/dao/attachments';

function sanitiseFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100);
}

function resolveTypeConfig(mimeType: string) {
  return ATTACHMENT_CONFIG.find((c) => c.mimeTypes.includes(mimeType)) ?? null;
}

export async function validateAndSaveAttachment(file: File): Promise<AttachmentInsert> {
  const typeConfig = resolveTypeConfig(file.type);

  if (!typeConfig) {
    throw new Error(`"${file.name}" has an unsupported file type.`);
  }

  if (file.size > typeConfig.maxSizeBytes) {
    const limitMb = typeConfig.maxSizeBytes / (1024 * 1024);
    throw new Error(
      `"${file.name}" exceeds the ${limitMb} MB limit for ${typeConfig.label} files.`,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name);
  const safeName = `${uuidv4()}-${sanitiseFilename(path.basename(file.name, ext))}${ext}`;
  const uploadsDir = path.join(process.cwd(), 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, safeName);
  fs.writeFileSync(filePath, buffer);

  return {
    original_name: sanitiseFilename(file.name),
    stored_path: `/uploads/${safeName}`,
    mime_type: file.type,
    size_bytes: file.size,
  };
}

export async function validateAndSaveAttachments(files: File[]): Promise<AttachmentInsert[]> {
  const results: AttachmentInsert[] = [];
  for (const file of files) {
    results.push(await validateAndSaveAttachment(file));
  }
  return results;
}
