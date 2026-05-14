import { CATEGORY_CONFIG } from '@/lib/config/categories';
import type { MetadataEntry } from '@/lib/db/dao/metadata';

interface Props {
  category: string;
  metadata: MetadataEntry[];
}

export function CategoryDetails({ category, metadata }: Props) {
  if (!metadata || metadata.length === 0) return null;

  const config = CATEGORY_CONFIG[category];
  if (!config) return null;

  // Build a label lookup from the config
  const labelMap: Record<string, string> = {};
  for (const field of config.fields) {
    labelMap[field.key] = field.label;
  }

  // Filter to entries that have a non-empty value and a known label
  const entries = metadata.filter(
    (entry) => entry.field_val.trim() !== '' && labelMap[entry.field_key],
  );

  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="category-details-heading">
      <h3
        id="category-details-heading"
        className="text-base font-semibold text-neutral-800 mb-3"
      >
        Category Details
      </h3>
      <dl className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.field_key}>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              {labelMap[entry.field_key]}
            </dt>
            <dd className="mt-0.5 text-sm text-neutral-800 whitespace-pre-wrap">
              {entry.field_val}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
