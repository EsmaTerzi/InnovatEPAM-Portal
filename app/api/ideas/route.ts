import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createIdea, findIdeasByUser, type IdeaCategory } from '@/lib/db/dao/ideas';
import { validateAndSaveFile } from '@/lib/uploads/handler';

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
  const file = formData.get('attachment') as File | null;

  const errors: Record<string, string> = {};
  if (!title) errors.title = 'Title is required';
  if (!description) errors.description = 'Description is required';
  if (!ALLOWED_CATEGORIES.includes(category as IdeaCategory)) {
    errors.category = 'Category must be one of the allowed values';
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  let attachmentPath: string | null = null;
  if (file && file.size > 0) {
    try {
      attachmentPath = await validateAndSaveFile(file);
    } catch (err) {
      return NextResponse.json(
        { errors: { attachment: (err as Error).message } },
        { status: 400 }
      );
    }
  }

  const idea = createIdea({
    title,
    description,
    category: category as IdeaCategory,
    submitted_by: user.id,
    attachment_path: attachmentPath,
  });

  return NextResponse.json({ id: idea.id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ideas = findIdeasByUser(user.id);
  return NextResponse.json(ideas);
}
