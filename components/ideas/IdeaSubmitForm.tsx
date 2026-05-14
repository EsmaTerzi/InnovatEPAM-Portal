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
import { validateCategoryFields, validateAttachments } from '@/lib/utils/validation';
import { CategoryFieldsRenderer } from './CategoryFieldsRenderer';
import { GuidanceBanner } from './GuidanceBanner';
import { AttachmentUploadZone } from './AttachmentUploadZone';
import { AttachmentPreview } from './AttachmentPreview';

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as string[];

type BaseErrors = {
  title?: string;
  description?: string;
  category?: string;
  attachments?: string;
  server?: string;
};

export function IdeaSubmitForm() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [metadataFields, setMetadataFields] = useState<Record<string, string>>({});
  const [dismissedCategories, setDismissedCategories] = useState<Set<string>>(new Set());
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [baseErrors, setBaseErrors] = useState<BaseErrors>({});
  const [metaErrors, setMetaErrors] = useState<Record<string, string>>({});

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

  function handleFilesChange(files: File[]) {
    setStagedFiles(files);
    setAttachmentErrors(validateAttachments(files));
  }

  function handleRemoveFile(index: number) {
    const next = stagedFiles.filter((_, i) => i !== index);
    setStagedFiles(next);
    setAttachmentErrors(validateAttachments(next));
  }

  function validateBase(): boolean {
    const next: BaseErrors = {};
    if (!title.trim()) next.title = 'Title is required';
    if (!description.trim()) next.description = 'Description is required';
    if (!category) next.category = 'Please select a category';
    if (attachmentErrors.length > 0) next.attachments = attachmentErrors[0];
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
    for (const file of stagedFiles) {
      formData.append('attachments', file);
    }
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
        const { title: t, description: d, category: c, attachments: a, server: s, ...rest } =
          data.errors as Record<string, string>;
        setBaseErrors({ title: t, description: d, category: c, attachments: a, server: s });
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
            <Button type="button" size="sm" variant="outline" onClick={() => applyCategory(pendingCategory)}>
              Continue
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPendingCategory(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Guidance banner */}
      {showGuidance && (
        <GuidanceBanner
          guidance={CATEGORY_CONFIG[category].guidance}
          onDismiss={() => setDismissedCategories((prev) => new Set([...prev, category]))}
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

      {/* Attachments */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Attachments <span className="text-neutral-400 font-normal">(optional, max 3)</span>
        </label>
        <AttachmentUploadZone
          files={stagedFiles}
          onFilesChange={handleFilesChange}
          disabled={loading}
        />
        {stagedFiles.length > 0 && (
          <AttachmentPreview
            mode="edit"
            files={stagedFiles}
            onRemove={handleRemoveFile}
            errors={attachmentErrors}
          />
        )}
        {baseErrors.attachments && (
          <p className="text-sm text-red-600" role="alert">
            {baseErrors.attachments}
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
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
