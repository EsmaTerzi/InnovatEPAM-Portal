'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORY_CONFIG } from '@/lib/config/categories';
import { validateCategoryFields } from '@/lib/utils/validation';
import { CategoryFieldsRenderer } from './CategoryFieldsRenderer';
import { GuidanceBanner } from './GuidanceBanner';

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as string[];

type BaseErrors = {
  title?: string;
  description?: string;
  category?: string;
  attachment?: string;
  server?: string;
};

export function IdeaSubmitForm() {
  const router = useRouter();

  // ── Base fields ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Category-specific metadata fields ──────────────────────────────────────
  const [metadataFields, setMetadataFields] = useState<Record<string, string>>({});

  // ── Guidance banner dismissal (session-scoped) ─────────────────────────────
  const [dismissedCategories, setDismissedCategories] = useState<Set<string>>(new Set());

  // ── Category-switch warning ────────────────────────────────────────────────
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  // ── Errors ─────────────────────────────────────────────────────────────────
  const [baseErrors, setBaseErrors] = useState<BaseErrors>({});
  const [metaErrors, setMetaErrors] = useState<Record<string, string>>({});

  // ── Helpers ────────────────────────────────────────────────────────────────
  function handleCategoryChange(newCategory: string) {
    const hasMetadataValues = Object.values(metadataFields).some((v) => v.trim() !== '');
    if (hasMetadataValues) {
      setPendingCategory(newCategory);
    } else {
      applyCategory(newCategory);
    }
  }

  function applyCategory(newCategory: string) {
    setCategory(newCategory);
    setMetadataFields({});
    setMetaErrors({});
    setPendingCategory(null);
  }

  function handleMetadataChange(key: string, value: string) {
    setMetadataFields((prev) => ({ ...prev, [key]: value }));
    if (metaErrors[key]) {
      setMetaErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validateBase(): boolean {
    const next: BaseErrors = {};
    if (!title.trim()) next.title = 'Title is required';
    if (!description.trim()) next.description = 'Description is required';
    if (!category) next.category = 'Please select a category';
    if (file && file.size > 10 * 1024 * 1024) next.attachment = 'File must be under 10 MB';
    setBaseErrors(next);
    return Object.keys(next).length === 0;
  }

  function scrollToFirstError() {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>('[data-error="true"], [aria-invalid="true"]');
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const baseOk = validateBase();
    const categoryErrors = validateCategoryFields(category, metadataFields);
    setMetaErrors(categoryErrors);

    if (!baseOk || Object.keys(categoryErrors).length > 0) {
      scrollToFirstError();
      return;
    }

    setLoading(true);
    setBaseErrors({});
    setMetaErrors({});

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    if (file) formData.append('attachment', file);
    if (Object.keys(metadataFields).length > 0) {
      formData.append('metadata', JSON.stringify(metadataFields));
    }

    try {
      const res = await fetch('/api/ideas', { method: 'POST', body: formData });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      const data = await res.json();
      if (data.errors) {
        const { title: t, description: d, category: c, attachment: a, server: s, ...rest } =
          data.errors as Record<string, string>;
        setBaseErrors({ title: t, description: d, category: c, attachment: a, server: s });
        setMetaErrors(rest);
        scrollToFirstError();
      } else {
        setBaseErrors({ server: data.error ?? 'Submission failed. Please try again.' });
      }
    } catch {
      setBaseErrors({ server: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  const showGuidance = !!category && !dismissedCategories.has(category);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!baseErrors.title}
          aria-describedby={baseErrors.title ? 'title-error' : undefined}
          disabled={loading}
          maxLength={200}
          data-error={baseErrors.title ? 'true' : undefined}
        />
        {baseErrors.title && (
          <p id="title-error" className="text-sm text-red-600" role="alert">
            {baseErrors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          aria-invalid={!!baseErrors.description}
          aria-describedby={baseErrors.description ? 'description-error' : undefined}
          disabled={loading}
          data-error={baseErrors.description ? 'true' : undefined}
        />
        {baseErrors.description && (
          <p id="description-error" className="text-sm text-red-600" role="alert">
            {baseErrors.description}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label htmlFor="category" className="block text-sm font-medium text-neutral-700">
          Category <span className="text-red-500">*</span>
        </label>
        <Select value={category} onValueChange={handleCategoryChange} disabled={loading}>
          <SelectTrigger
            id="category"
            aria-invalid={!!baseErrors.category}
            aria-describedby={baseErrors.category ? 'category-error' : undefined}
          >
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {baseErrors.category && (
          <p id="category-error" className="text-sm text-red-600" role="alert">
            {baseErrors.category}
          </p>
        )}
      </div>

      {/* Category-switch warning */}
      {pendingCategory && (
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 space-y-2"
        >
          <p>
            Switching to <strong>{pendingCategory}</strong> will clear your current
            category-specific answers. Continue?
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyCategory(pendingCategory)}
            >
              Continue
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPendingCategory(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Guidance banner */}
      {showGuidance && (
        <GuidanceBanner
          guidance={CATEGORY_CONFIG[category].guidance}
          onDismiss={() =>
            setDismissedCategories((prev) => new Set([...prev, category]))
          }
        />
      )}

      {/* Category-specific fields */}
      {category && !pendingCategory && (
        <CategoryFieldsRenderer
          category={category}
          values={metadataFields}
          errors={metaErrors}
          onChange={handleMetadataChange}
          disabled={loading}
        />
      )}

      {/* Attachment */}
      <div className="space-y-1">
        <label htmlFor="attachment" className="block text-sm font-medium text-neutral-700">
          Attachment <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <Input
          id="attachment"
          type="file"
          accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-describedby="attachment-hint"
          disabled={loading}
        />
        <p id="attachment-hint" className="text-xs text-neutral-400">
          PDF, DOCX, PPTX, PNG or JPEG · Max 10 MB
        </p>
        {baseErrors.attachment && (
          <p className="text-sm text-red-600" role="alert">
            {baseErrors.attachment}
          </p>
        )}
      </div>

      {baseErrors.server && (
        <p className="text-sm text-red-600" role="alert">
          {baseErrors.server}
        </p>
      )}

      {!category && (
        <p className="text-sm text-neutral-400">
          Select a category above to see additional fields specific to your idea type.
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Idea'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
