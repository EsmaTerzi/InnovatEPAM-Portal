export interface AttachmentTypeConfig {
  label: string;
  mimeTypes: string[];
  extensions: string[];
  maxSizeBytes: number;
}

export const ATTACHMENT_CONFIG: AttachmentTypeConfig[] = [
  {
    label: 'document',
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    extensions: ['.pdf', '.docx', '.pptx'],
    maxSizeBytes: 10 * 1024 * 1024,
  },
  {
    label: 'image',
    mimeTypes: ['image/png', 'image/jpeg'],
    extensions: ['.png', '.jpg', '.jpeg'],
    maxSizeBytes: 10 * 1024 * 1024,
  },
  {
    label: 'video',
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    extensions: ['.mp4', '.webm', '.mov'],
    maxSizeBytes: 100 * 1024 * 1024,
  },
];

export const MAX_ATTACHMENTS = 3;
