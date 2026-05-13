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

const CATEGORIES = [
  'Process Improvement',
  'Technology',
  'Customer Experience',
  'Other',
] as const;

type FormErrors = {
  title?: string;
  description?: string;
  category?: string;
  attachment?: string;
  server?: string;
};

export function IdeaSubmitForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!title.trim()) next.title = 'Title is required';
    if (!description.trim()) next.description = 'Description is required';
    if (!category) next.category = 'Please select a category';
    if (file && file.size > 10 * 1024 * 1024) {
      next.attachment = 'File must be under 10 MB';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    if (file) formData.append('attachment', file);

    try {
      const res = await fetch('/api/ideas', { method: 'POST', body: formData });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      const data = await res.json();
      if (data.errors) {
        setErrors(data.errors);
      } else {
        setErrors({ server: data.error ?? 'Submission failed. Please try again.' });
      }
    } catch {
      setErrors({ server: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

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
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          disabled={loading}
          maxLength={200}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-red-600" role="alert">
            {errors.title}
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
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          disabled={loading}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-red-600" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label htmlFor="category" className="block text-sm font-medium text-neutral-700">
          Category <span className="text-red-500">*</span>
        </label>
        <Select value={category} onValueChange={setCategory} disabled={loading}>
          <SelectTrigger
            id="category"
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : undefined}
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
        {errors.category && (
          <p id="category-error" className="text-sm text-red-600" role="alert">
            {errors.category}
          </p>
        )}
      </div>

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
        {errors.attachment && (
          <p className="text-sm text-red-600" role="alert">
            {errors.attachment}
          </p>
        )}
      </div>

      {errors.server && (
        <p className="text-sm text-red-600" role="alert">
          {errors.server}
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
