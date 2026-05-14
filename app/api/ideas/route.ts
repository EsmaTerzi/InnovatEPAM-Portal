import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
import { createIdea, findIdeasByUser, type IdeaCategory } from '@/lib/db/dao/ideas';
import { createMetadataEntries, findMetadataByIdeaId } from '@/lib/db/dao/metadata';
import { createAttachments, findAttachmentsByIdeaId } from '@/lib/db/dao/attachments';
import { validateCategoryFields, validateAttachments } from '@/lib/utils/validation';
import { CATEGORY_CONFIG } from '@/lib/config/categories';
import { MAX_ATTACHMENTS } from '@/lib/config/attachments';
import { validateAndSaveAttachments } from '@/lib/uploads/handler';

const ALLOWED_CATEGORIES: IdeaCategory[] = [
  'Process Improvement',
  'Technology',
  'Customer Experience',
  'Other',
];

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const title = (formData.get('title') as string | null)?.trim() ?? '';
  const description = (formData.get('description') as string | null)?.trim() ?? '';
  const category = (formData.get('category') as string | null)?.trim() ?? '';
  const files = formData.getAll('attachments') as File[];
  const metadataRaw = formData.get('metadata') as string | null;

  // Enforce attachment count limit
  if (files.length > MAX_ATTACHMENTS) {
    return NextResponse.json(
      { errors: { attachments: `You can attach a maximum of ${MAX_ATTACHMENTS} files.` } },
      { status: 400 },
    );
  }

  // Validate attachment types and sizes
  const attachmentErrors = validateAttachments(files.filter((f) => f.size > 0));
  if (attachmentErrors.length > 0) {
    return NextResponse.json(
      { errors: { attachments: attachmentErrors[0] } },
      { status: 400 },
    );
  }

  // Parse metadata JSON if present
  let metadataInput: Record<string, string> = {};
  if (metadataRaw) {
    try {
      const parsed = JSON.parse(metadataRaw);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        metadataInput = parsed as Record<string, string>;
      } else {
        return NextResponse.json(
          { errors: { metadata: 'Invalid metadata format.' } },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { errors: { metadata: 'Invalid metadata format.' } },
        { status: 400 },
      );
    }
  }

  // Strip keys not defined in CATEGORY_CONFIG for the selected category
  const allowedKeys = new Set(
    (CATEGORY_CONFIG[category]?.fields ?? []).map((f) => f.key),
  );
  const sanitisedMetadata: Record<string, string> = {};
  for (const [k, v] of Object.entries(metadataInput)) {
    if (allowedKeys.has(k) && typeof v === 'string') {
      sanitisedMetadata[k] = v;
    }
  }

  const errors: Record<string, string> = {};
  if (!title) errors.title = 'Title is required';
  if (!description) errors.description = 'Description is required';
  if (!ALLOWED_CATEGORIES.includes(category as IdeaCategory)) {
    errors.category = 'Invalid category.';
  }

  const categoryErrors = validateCategoryFields(category, sanitisedMetadata);
  Object.assign(errors, categoryErrors);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // Save files to disk
  const validFiles = files.filter((f) => f.size > 0);
  let savedAttachments: Awaited<ReturnType<typeof validateAndSaveAttachments>> = [];
  if (validFiles.length > 0) {
    try {
      savedAttachments = await validateAndSaveAttachments(validFiles);
    } catch (err) {
      return NextResponse.json(
        { errors: { attachments: (err as Error).message } },
        { status: 400 },
      );
    }
  }

  // Insert idea + metadata + attachments in one transaction
  const db = getDb();
  const idea = db.transaction(() => {
    const created = createIdea({
      title,
      description,
      category: category as IdeaCategory,
      submitted_by: user.id,
    });
    createMetadataEntries(created.id, sanitisedMetadata, db);
    if (savedAttachments.length > 0) {
      createAttachments(created.id, savedAttachments);
    }
    return created;
  })();

  const metadata = findMetadataByIdeaId(idea.id);
  const attachments = findAttachmentsByIdeaId(idea.id);
  return NextResponse.json({ ...idea, metadata, attachments }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ideas = findIdeasByUser(user.id);
  return NextResponse.json(ideas);
}
