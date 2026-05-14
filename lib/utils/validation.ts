import { CATEGORY_CONFIG } from '@/lib/config/categories';

/**
 * Validates category-specific fields against the required rules in CATEGORY_CONFIG.
 * Returns a Record of fieldKey → errorMessage for every required field that is missing.
 * Returns an empty object when all required fields are present.
 *
 * @param category - The selected idea category (must match a key in CATEGORY_CONFIG)
 * @param fields   - Map of field_key → submitted value
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
