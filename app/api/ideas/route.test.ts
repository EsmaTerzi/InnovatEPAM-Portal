import { NextRequest } from 'next/server';
import { POST, GET } from './route';

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
  description: 'Test Description',
  category: 'Technology',
  status: 'submitted',
  submitted_by: 'user-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const mockAttachment = {
  id: 'att-1',
  original_name: 'brief.pdf',
  stored_path: '/uploads/abc-brief.pdf',
  mime_type: 'application/pdf',
  size_bytes: 1024,
  created_at: '2026-01-01T00:00:00.000Z',
};

jest.mock('@/lib/auth/session', () => ({
  getSessionUser: jest.fn(),
}));

jest.mock('@/lib/db/dao/ideas', () => ({
  createIdea: jest.fn(),
  findIdeasByUser: jest.fn(),
}));

jest.mock('@/lib/db/dao/metadata', () => ({
  createMetadataEntries: jest.fn(),
  findMetadataByIdeaId: jest.fn(),
}));

jest.mock('@/lib/db/dao/attachments', () => ({
  createAttachments: jest.fn(),
  findAttachmentsByIdeaId: jest.fn(),
}));

jest.mock('@/lib/uploads/handler', () => ({
  validateAndSaveAttachments: jest.fn(),
}));

jest.mock('@/lib/db/client', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { getSessionUser } from '@/lib/auth/session';
import { createIdea, findIdeasByUser } from '@/lib/db/dao/ideas';
import { createMetadataEntries, findMetadataByIdeaId } from '@/lib/db/dao/metadata';
import { createAttachments, findAttachmentsByIdeaId } from '@/lib/db/dao/attachments';
import { validateAndSaveAttachments } from '@/lib/uploads/handler';
import getDb from '@/lib/db/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

function setupDb() {
  const mockDb = {
    transaction: jest.fn((fn: () => unknown) => () => fn()),
  };
  (getDb as jest.Mock).mockReturnValue(mockDb);
  (createIdea as jest.Mock).mockReturnValue(mockIdea);
  (findMetadataByIdeaId as jest.Mock).mockReturnValue([]);
  (createMetadataEntries as jest.Mock).mockReturnValue(undefined);
  (createAttachments as jest.Mock).mockReturnValue(undefined);
  (findAttachmentsByIdeaId as jest.Mock).mockReturnValue([]);
  (validateAndSaveAttachments as jest.Mock).mockResolvedValue([]);
}

function buildFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v);
  }
  return fd;
}

function makeRequest(formData: FormData): NextRequest {
  return new NextRequest('http://localhost/api/ideas', {
    method: 'POST',
    body: formData,
  });
}

function makeFile(name: string, type: string, sizeBytes = 512): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/ideas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSessionUser as jest.Mock).mockResolvedValue(mockUser);
    setupDb();
  });

  it('returns 401 when user is not authenticated', async () => {
    (getSessionUser as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest(buildFormData({ title: 'T', description: 'D', category: 'Technology' })));
    expect(res.status).toBe(401);
  });

  it('returns 400 when a required category-specific field is missing', async () => {
    const fd = buildFormData({
      title: 'Test',
      description: 'Desc',
      category: 'Technology',
      // tech_stack and estimated_effort missing
    });
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.errors).toHaveProperty('tech_stack');
    expect(body.errors).toHaveProperty('estimated_effort');
  });

  it('returns 400 with "Invalid category." for an unknown category', async () => {
    const fd = buildFormData({
      title: 'Test',
      description: 'Desc',
      category: 'InvalidCat',
    });
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.errors.category).toBe('Invalid category.');
  });

  it('strips unknown metadata keys and returns 201', async () => {
    const metadata = JSON.stringify({
      tech_stack: 'Next.js',
      estimated_effort: '1–4 weeks',
      unknown_field: 'should be stripped',
    });
    const fd = buildFormData({
      title: 'Test',
      description: 'Desc',
      category: 'Technology',
      metadata,
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(201);
    const callArgs = (createMetadataEntries as jest.Mock).mock.calls[0][1] as Record<string, string>;
    expect(callArgs).not.toHaveProperty('unknown_field');
    expect(callArgs).toHaveProperty('tech_stack', 'Next.js');
  });

  it('returns 201 with metadata: [] when no metadata is provided', async () => {
    const fd = buildFormData({
      title: 'Test',
      description: 'Desc',
      category: 'Technology',
      metadata: JSON.stringify({ tech_stack: 'Rails', estimated_effort: '< 1 week' }),
    });
    (findMetadataByIdeaId as jest.Mock).mockReturnValue([]);
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.metadata).toEqual([]);
  });

  it('returns 400 with malformed metadata JSON', async () => {
    const fd = buildFormData({
      title: 'Test',
      description: 'Desc',
      category: 'Technology',
      metadata: '{not valid json',
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
  });

  it('returns 201 when all required fields are present', async () => {
    const metadata = JSON.stringify({
      tech_stack: 'React',
      estimated_effort: '< 1 week',
    });
    const fd = buildFormData({
      title: 'Valid Idea',
      description: 'Valid Desc',
      category: 'Technology',
      metadata,
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('idea-1');
  });

  it('returns ideas list for GET', async () => {
    (findIdeasByUser as jest.Mock).mockReturnValue([mockIdea]);
    const req = new NextRequest('http://localhost/api/ideas');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });

  // ── Multi-file attachment tests (Phase 03) ──────────────────────────────

  it('returns 201 with attachments:[] when no files are attached', async () => {
    const fd = buildFormData({
      title: 'No Files',
      description: 'Desc',
      category: 'Technology',
      metadata: JSON.stringify({ tech_stack: 'Node', estimated_effort: '< 1 week' }),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.attachments).toEqual([]);
  });

  it('returns 201 and includes attachments array when files are valid', async () => {
    const savedAttachments = [mockAttachment];
    (validateAndSaveAttachments as jest.Mock).mockResolvedValue([
      { original_name: 'brief.pdf', stored_path: '/uploads/abc-brief.pdf', mime_type: 'application/pdf', size_bytes: 1024 },
    ]);
    (findAttachmentsByIdeaId as jest.Mock).mockReturnValue(savedAttachments);

    const fd = new FormData();
    fd.append('title', 'With Files');
    fd.append('description', 'Desc');
    fd.append('category', 'Technology');
    fd.append('metadata', JSON.stringify({ tech_stack: 'Node', estimated_effort: '< 1 week' }));
    fd.append('attachments', makeFile('brief.pdf', 'application/pdf'));

    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.attachments).toHaveLength(1);
    expect(body.attachments[0].mime_type).toBe('application/pdf');
  });

  it('returns 400 when more than 3 files are attached', async () => {
    const fd = new FormData();
    fd.append('title', 'Too Many');
    fd.append('description', 'Desc');
    fd.append('category', 'Other');
    for (let i = 0; i < 4; i++) {
      fd.append('attachments', makeFile(`file${i}.pdf`, 'application/pdf'));
    }

    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors.attachments).toMatch(/maximum of 3/i);
  });
});


describe('POST /api/ideas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSessionUser as jest.Mock).mockResolvedValue(mockUser);
    setupDb();
  });

  it('returns 401 when user is not authenticated', async () => {
    (getSessionUser as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest(buildFormData({ title: 'T', description: 'D', category: 'Technology' })));
    expect(res.status).toBe(401);
  });

  it('returns 400 when a required category-specific field is missing', async () => {
    const fd = buildFormData({
      title: 'Test',
      description: 'Desc',
      category: 'Technology',
      // tech_stack and estimated_effort missing
    });
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.errors).toHaveProperty('tech_stack');
    expect(body.errors).toHaveProperty('estimated_effort');
  });

  it('returns 400 with "Invalid category." for an unknown category', async () => {
    const fd = buildFormData({
      title: 'Test',
      description: 'Desc',
      category: 'InvalidCat',
    });
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.errors.category).toBe('Invalid category.');
  });

  it('strips unknown metadata keys and returns 201', async () => {
    const metadata = JSON.stringify({
      tech_stack: 'Next.js',
      estimated_effort: '1–4 weeks',
      unknown_field: 'should be stripped',
    });
    const fd = buildFormData({
      title: 'Test',
      description: 'Desc',
      category: 'Technology',
      metadata,
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(201);
    // createMetadataEntries should have been called without the unknown_field
    const callArgs = (createMetadataEntries as jest.Mock).mock.calls[0][1] as Record<string, string>;
    expect(callArgs).not.toHaveProperty('unknown_field');
    expect(callArgs).toHaveProperty('tech_stack', 'Next.js');
  });

  it('returns 201 with metadata: [] when no metadata is provided', async () => {
    const fd = buildFormData({
      title: 'Test',
      description: 'Desc',
      category: 'Technology',
      metadata: JSON.stringify({ tech_stack: 'Rails', estimated_effort: '< 1 week' }),
    });
    (findMetadataByIdeaId as jest.Mock).mockReturnValue([]);
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.metadata).toEqual([]);
  });

  it('returns 400 with malformed metadata JSON', async () => {
    const fd = buildFormData({
      title: 'Test',
      description: 'Desc',
      category: 'Technology',
      metadata: '{not valid json',
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
  });

  it('returns 201 when all required fields are present', async () => {
    const metadata = JSON.stringify({
      tech_stack: 'React',
      estimated_effort: '< 1 week',
    });
    const fd = buildFormData({
      title: 'Valid Idea',
      description: 'Valid Desc',
      category: 'Technology',
      metadata,
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('idea-1');
  });

  it('returns ideas list for GET', async () => {
    (findIdeasByUser as jest.Mock).mockReturnValue([mockIdea]);
    const req = new NextRequest('http://localhost/api/ideas');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});
