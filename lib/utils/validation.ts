import { CATEGORY_CONFIG } from '@/lib/config/categories';
import { ATTACHMENT_CONFIG, MAX_ATTACHMENTS } from '@/lib/config/attachments';

/**
 * Validates category-specific fields against the required rules in CATEGORY_CONFIG.
 * Returns a Record of fieldKey → errorMessage for every required field that is missing.
 * Returns an empty object when all required fields are present.
 */
export function validateCategoryFields(
  category: string,
  fields: Record<string, string>,
): Record<string, string> {
  const config = CATEGORY_CONFIG[category];
  if (!config) return {};

  const errors: Record<string, string> = {};

  for (const field of config.fields) {
    if (!field.required) continue;
    const value = (fields[field.key] ?? '').trim();
    if (!value) {
      errors[field.key] = `${field.label} is required.`;
    }
  }

  return errors;
}

/**
 * Validates an array of File objects against ATTACHMENT_CONFIG rules.
 * Returns a list of human-readable error strings (one per violation found).
 * Returns an empty array when all files are valid.
 */
export function validateAttachments(files: File[]): string[] {
  const errors: string[] = [];

  if (files.length > MAX_ATTACHMENTS) {
    errors.push(`You can attach a maximum of ${MAX_ATTACHMENTS} files.`);
    return errors;
  }

  for (const file of files) {
    const typeConfig = ATTACHMENT_CONFIG.find((c) => c.mimeTypes.includes(file.type));

    if (!typeConfig) {
      errors.push(`"${file.name}" has an unsupported file type.`);
      continue;
    }

    if (file.size > typeConfig.maxSizeBytes) {
      const limitMb = typeConfig.maxSizeBytes / (1024 * 1024);
      errors.push(
        `"${file.name}" exceeds the ${limitMb} MB limit for ${typeConfig.label} files.`,
      );
    }
  }

  return errors;
}

