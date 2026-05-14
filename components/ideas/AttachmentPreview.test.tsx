import React from 'react';
import { render, screen } from '@testing-library/react';
import { AttachmentPreview } from './AttachmentPreview';
import type { AttachmentResponse } from '@/lib/db/dao/attachments';

const pdfAttachment: AttachmentResponse = {
  id: 'att-1',
  original_name: 'brief.pdf',
  stored_path: '/uploads/abc-brief.pdf',
  mime_type: 'application/pdf',
  size_bytes: 204800,
  created_at: '2026-01-01T00:00:00.000Z',
};

const imageAttachment: AttachmentResponse = {
  id: 'att-2',
  original_name: 'mockup.png',
  stored_path: '/uploads/abc-mockup.png',
  mime_type: 'image/png',
  size_bytes: 51200,
  created_at: '2026-01-01T00:00:00.000Z',
};

const videoAttachment: AttachmentResponse = {
  id: 'att-3',
  original_name: 'demo.mp4',
  stored_path: '/uploads/abc-demo.mp4',
  mime_type: 'video/mp4',
  size_bytes: 5 * 1024 * 1024,
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('AttachmentPreview — readonly mode', () => {
  it('renders nothing when attachments array is empty', () => {
    const { container } = render(
      <AttachmentPreview mode="readonly" attachments={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a download link for a PDF attachment', () => {
    render(<AttachmentPreview mode="readonly" attachments={[pdfAttachment]} />);
    const link = screen.getByRole('link', { name: /brief\.pdf/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('download');
  });

  it('renders an image thumbnail wrapped in a link to the full image for PNG', () => {
    render(<AttachmentPreview mode="readonly" attachments={[imageAttachment]} />);
    const img = screen.getByRole('img', { name: /mockup\.png/i });
    expect(img).toBeInTheDocument();
    const link = img.closest('a');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders an inline video player for an MP4 attachment', () => {
    render(<AttachmentPreview mode="readonly" attachments={[videoAttachment]} />);
    const video = document.querySelector('video');
    expect(video).toBeTruthy();
    expect(video).toHaveAttribute('controls');
  });

  it('does not render Remove buttons in readonly mode', () => {
    render(<AttachmentPreview mode="readonly" attachments={[pdfAttachment, imageAttachment]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders all attachments when multiple are provided', () => {
    render(
      <AttachmentPreview
        mode="readonly"
        attachments={[pdfAttachment, imageAttachment, videoAttachment]}
      />,
    );
    expect(screen.getByText('brief.pdf')).toBeInTheDocument();
    expect(screen.getByText('mockup.png')).toBeInTheDocument();
    expect(document.querySelector('video')).toBeTruthy();
  });
});

describe('AttachmentPreview — edit mode', () => {
  const onRemove = jest.fn();

  beforeAll(() => {
    // jsdom doesn't implement URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = jest.fn();
  });

  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when files array is empty', () => {
    const { container } = render(
      <AttachmentPreview mode="edit" files={[]} onRemove={onRemove} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a Remove button for each staged file', () => {
    const files = [
      new File([''], 'a.pdf', { type: 'application/pdf' }),
      new File([''], 'b.png', { type: 'image/png' }),
    ];
    render(<AttachmentPreview mode="edit" files={files} onRemove={onRemove} />);
    const removeButtons = screen.getAllByRole('button');
    expect(removeButtons).toHaveLength(2);
  });

  it('renders each Remove button with aria-label containing the filename', () => {
    const files = [new File([''], 'report.pdf', { type: 'application/pdf' })];
    render(<AttachmentPreview mode="edit" files={files} onRemove={onRemove} />);
    expect(screen.getByRole('button', { name: /remove report\.pdf/i })).toBeInTheDocument();
  });

  it('renders validation error messages when errors prop is provided', () => {
    const files = [new File([''], 'a.pdf', { type: 'application/pdf' })];
    render(
      <AttachmentPreview
        mode="edit"
        files={files}
        onRemove={onRemove}
        errors={['"bad.exe" has an unsupported file type.']}
      />,
    );
    expect(screen.getByText(/"bad\.exe" has an unsupported file type\./i)).toBeInTheDocument();
  });
});
