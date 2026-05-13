import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function sanitiseFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100);
}

export async function validateAndSaveFile(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      `File type "${file.type}" is not allowed. Allowed types: PDF, DOCX, PPTX, PNG, JPEG.`
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`File size exceeds the 10 MB limit.`);
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

  return `/uploads/${safeName}`;
}
