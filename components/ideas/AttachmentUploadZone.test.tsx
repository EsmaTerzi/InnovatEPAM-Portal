import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentUploadZone } from './AttachmentUploadZone';

function makeFile(name: string, type: string, sizeBytes = 512): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe('AttachmentUploadZone', () => {
  const onFilesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a file input with accept derived from ATTACHMENT_CONFIG', () => {
    render(<AttachmentUploadZone files={[]} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toContain('.pdf');
    expect(input.accept).toContain('.mp4');
    expect(input.accept).toContain('.png');
  });

  it('calls onFilesChange with a new file when one is selected', () => {
    render(<AttachmentUploadZone files={[]} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile('doc.pdf', 'application/pdf');
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFilesChange).toHaveBeenCalledWith([file]);
  });

  it('disables the input when files.length equals MAX_ATTACHMENTS (3)', () => {
    const files = [
      makeFile('a.pdf', 'application/pdf'),
      makeFile('b.png', 'image/png'),
      makeFile('c.mp4', 'video/mp4'),
    ];
    render(<AttachmentUploadZone files={files} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('shows inline error message when limit is reached', () => {
    const files = [
      makeFile('a.pdf', 'application/pdf'),
      makeFile('b.png', 'image/png'),
      makeFile('c.mp4', 'video/mp4'),
    ];
    render(<AttachmentUploadZone files={files} onFilesChange={onFilesChange} />);
    expect(screen.getByText(/maximum of 3/i)).toBeInTheDocument();
  });

  it('does not show the limit error when fewer than 3 files are staged', () => {
    render(<AttachmentUploadZone files={[makeFile('a.pdf', 'application/pdf')]} onFilesChange={onFilesChange} />);
    expect(screen.queryByText(/maximum of 3/i)).not.toBeInTheDocument();
  });

  it('is keyboard-accessible: has role="button" and tabIndex=0', () => {
    render(<AttachmentUploadZone files={[]} onFilesChange={onFilesChange} />);
    const zone = screen.getByRole('button', { name: /upload attachments/i });
    expect(zone).toBeInTheDocument();
    expect(zone).toHaveAttribute('tabindex', '0');
  });

  // ── Validation error propagation (T013) ─────────────────────────────────────

  it('still calls onFilesChange when an unsupported file type is selected (validation is parent responsibility)', () => {
    render(<AttachmentUploadZone files={[]} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = makeFile('virus.exe', 'application/x-msdownload');
    fireEvent.change(input, { target: { files: [badFile] } });
    // Zone passes file through; parent (IdeaSubmitForm) validates and sets errors
    expect(onFilesChange).toHaveBeenCalledWith([badFile]);
  });

  it('still calls onFilesChange when an oversized video is selected (validation is parent responsibility)', () => {
    render(<AttachmentUploadZone files={[]} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // 101 MB video (over the 100 MB limit)
    const bigVideo = makeFile('demo.mp4', 'video/mp4', 101 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [bigVideo] } });
    expect(onFilesChange).toHaveBeenCalledWith([bigVideo]);
  });

  it('does not show validation errors itself (errors come from parent via AttachmentPreview)', () => {
    render(<AttachmentUploadZone files={[]} onFilesChange={onFilesChange} />);
    expect(screen.queryByText(/unsupported/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exceeds/i)).not.toBeInTheDocument();
  });
});


function makeFile(name: string, type: string, sizeBytes = 512): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe('AttachmentUploadZone', () => {
  const onFilesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a file input with accept derived from ATTACHMENT_CONFIG', () => {
    render(<AttachmentUploadZone files={[]} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toContain('.pdf');
    expect(input.accept).toContain('.mp4');
    expect(input.accept).toContain('.png');
  });

  it('calls onFilesChange with a new file when one is selected', () => {
    render(<AttachmentUploadZone files={[]} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile('doc.pdf', 'application/pdf');
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFilesChange).toHaveBeenCalledWith([file]);
  });

  it('disables the input when files.length equals MAX_ATTACHMENTS (3)', () => {
    const files = [
      makeFile('a.pdf', 'application/pdf'),
      makeFile('b.png', 'image/png'),
      makeFile('c.mp4', 'video/mp4'),
    ];
    render(<AttachmentUploadZone files={files} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('shows inline error message when limit is reached', () => {
    const files = [
      makeFile('a.pdf', 'application/pdf'),
      makeFile('b.png', 'image/png'),
      makeFile('c.mp4', 'video/mp4'),
    ];
    render(<AttachmentUploadZone files={files} onFilesChange={onFilesChange} />);
    expect(screen.getByText(/maximum of 3/i)).toBeInTheDocument();
  });

  it('does not show the limit error when fewer than 3 files are staged', () => {
    render(<AttachmentUploadZone files={[makeFile('a.pdf', 'application/pdf')]} onFilesChange={onFilesChange} />);
    expect(screen.queryByText(/maximum of 3/i)).not.toBeInTheDocument();
  });

  it('is keyboard-accessible: has role="button" and tabIndex=0', () => {
    render(<AttachmentUploadZone files={[]} onFilesChange={onFilesChange} />);
    const zone = screen.getByRole('button', { name: /upload attachments/i });
    expect(zone).toBeInTheDocument();
    expect(zone).toHaveAttribute('tabindex', '0');
  });
});
