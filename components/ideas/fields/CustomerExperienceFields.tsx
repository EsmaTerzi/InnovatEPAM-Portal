'use client';

import { CATEGORY_CONFIG } from '@/lib/config/categories';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  values: Record<string, string>;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

const FIELDS = CATEGORY_CONFIG['Customer Experience'].fields;

export function CustomerExperienceFields({ values, errors, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      {FIELDS.map((field) => {
        const error = errors[field.key];
        const value = values[field.key] ?? '';
        const hintId = `${field.key}-hint`;
        const errorId = `${field.key}-error`;
        const describedBy = [error ? errorId : null, hintId].filter(Boolean).join(' ') || undefined;

        return (
          <div key={field.key} className="space-y-1">
            <label
              htmlFor={field.key}
              className="block text-sm font-medium text-neutral-700"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'select' ? (
              <Select
                value={value}
                onValueChange={(val) => onChange(field.key, val)}
                disabled={disabled}
              >
                <SelectTrigger
                  id={field.key}
                  aria-invalid={!!error}
                  aria-describedby={describedBy}
                  data-error={error ? 'true' : undefined}
                >
                  <SelectValue placeholder={`Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field.key}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={describedBy}
                data-error={error ? 'true' : undefined}
              />
            )}

            <p id={hintId} className="text-xs text-neutral-400">
              {field.helper}
            </p>

            {error && (
              <p id={errorId} className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
