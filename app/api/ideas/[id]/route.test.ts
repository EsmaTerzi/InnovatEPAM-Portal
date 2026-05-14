import { NextRequest } from 'next/server';
import { GET } from './route';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'submitter' as const,
};

const mockIdea = {
  id: 'idea-1',
  title: 'Test Idea',
  description: 'Desc',
  category: 'Technology',
  status: 'submitted',
  attachment_path: null,
  submitted_by: 'user-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

jest.mock('@/lib/auth/session', () => ({
  getSessionUser: jest.fn(),
}));

jest.mock('@/lib/db/dao/ideas', () => ({
  findIdeaById: jest.fn(),
}));

jest.mock('@/lib/db/dao/comments', () => ({
  findCommentByIdeaId: jest.fn(),
}));

jest.mock('@/lib/db/dao/metadata', () => ({
  findMetadataByIdeaId: jest.fn(),
}));

import { getSessionUser } from '@/lib/auth/session';
import { findIdeaById } from '@/lib/db/dao/ideas';
import { findCommentByIdeaId } from '@/lib/db/dao/comments';
import { findMetadataByIdeaId } from '@/lib/db/dao/metadata';

// ── Helper ────────────────────────────────────────────────────────────────────

function makeRequest(id: string): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost/api/ideas/${id}`);
  const ctx = { params: Promise.resolve({ id }) };
  return [req, ctx];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/ideas/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSessionUser as jest.Mock).mockResolvedValue(mockUser);
    (findIdeaById as jest.Mock).mockReturnValue(mockIdea);
    (findCommentByIdeaId as jest.Mock).mockReturnValue(null);
  });

  it('returns 401 when not authenticated', async () => {
    (getSessionUser as jest.Mock).mockResolvedValue(null);
    const [req, ctx] = makeRequest('idea-1');
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
  });

  it('returns 404 when idea does not exist', async () => {
    (findIdeaById as jest.Mock).mockReturnValue(null);
    (findMetadataByIdeaId as jest.Mock).mockReturnValue([]);
    const [req, ctx] = makeRequest('nonexistent');
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
  });

  it('includes metadata array in the response for an idea with metadata', async () => {
    const metadataRows = [
      { field_key: 'tech_stack', field_val: 'Next.js' },
      { field_key: 'estimated_effort', field_val: '1–4 weeks' },
    ];
    (findMetadataByIdeaId as jest.Mock).mockReturnValue(metadataRows);

    const [req, ctx] = makeRequest('idea-1');
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metadata).toEqual(metadataRows);
  });

  it('returns metadata: [] for a legacy idea (no rows in idea_metadata)', async () => {
    (findMetadataByIdeaId as jest.Mock).mockReturnValue([]);

    const [req, ctx] = makeRequest('idea-1');
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metadata).toEqual([]);
  });

  it('returns 403 when submitter tries to access another user\'s idea', async () => {
    (findIdeaById as jest.Mock).mockReturnValue({ ...mockIdea, submitted_by: 'other-user' });
    (findMetadataByIdeaId as jest.Mock).mockReturnValue([]);
    const [req, ctx] = makeRequest('idea-1');
    const res = await GET(req, ctx);
    expect(res.status).toBe(403);
  });

  it('includes the idea fields and comment in the response', async () => {
    const comment = { id: 'c1', comment_text: 'Good idea', created_at: '2026-01-01' };
    (findCommentByIdeaId as jest.Mock).mockReturnValue(comment);
    (findMetadataByIdeaId as jest.Mock).mockReturnValue([]);

    const [req, ctx] = makeRequest('idea-1');
    const res = await GET(req, ctx);
    const body = await res.json();
    expect(body.title).toBe('Test Idea');
    expect(body.comment).toEqual(comment);
  });
});
