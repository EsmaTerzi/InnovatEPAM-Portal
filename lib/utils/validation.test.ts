import { validateCategoryFields, validateAttachments } from '@/lib/utils/validation';

describe('validateCategoryFields', () => {
  describe('Technology category', () => {
    it('returns errors for all required fields when all are missing', () => {
      const errors = validateCategoryFields('Technology', {});
      expect(errors).toHaveProperty('tech_stack');
      expect(errors).toHaveProperty('estimated_effort');
      expect(errors).not.toHaveProperty('feasibility_notes');
    });

    it('returns no errors when all required fields are present', () => {
      const errors = validateCategoryFields('Technology', {
        tech_stack: 'Next.js',
        estimated_effort: '1–4 weeks',
      });
      expect(errors).toEqual({});
    });

    it('returns no errors when only optional fields are missing', () => {
      const errors = validateCategoryFields('Technology', {
        tech_stack: 'React',
        estimated_effort: '< 1 week',
        // feasibility_notes omitted — optional
      });
      expect(errors).toEqual({});
    });

    it('returns error for a required field that is whitespace-only', () => {
      const errors = validateCategoryFields('Technology', {
        tech_stack: '   ',
        estimated_effort: '1–4 weeks',
      });
      expect(errors).toHaveProperty('tech_stack');
    });
  });

  describe('Process Improvement category', () => {
    it('returns errors for both required fields when missing', () => {
      const errors = validateCategoryFields('Process Improvement', {});
      expect(errors).toHaveProperty('current_pain_point');
      expect(errors).toHaveProperty('proposed_change');
      expect(errors).not.toHaveProperty('affected_teams');
    });

    it('returns no errors when required fields are present', () => {
      const errors = validateCategoryFields('Process Improvement', {
        current_pain_point: 'Manual reporting takes 2 hours',
        proposed_change: 'Automate with a script',
      });
      expect(errors).toEqual({});
    });
  });

  describe('Customer Experience category', () => {
    it('returns errors for required fields when missing', () => {
      const errors = validateCategoryFields('Customer Experience', {});
      expect(errors).toHaveProperty('target_audience');
      expect(errors).toHaveProperty('expected_impact');
      expect(errors).not.toHaveProperty('success_metric');
    });
  });

  describe('Other category', () => {
    it('returns no errors since all Other fields are optional', () => {
      const errors = validateCategoryFields('Other', {});
      expect(errors).toEqual({});
    });

    it('returns no errors even when context is provided', () => {
      const errors = validateCategoryFields('Other', { context: 'Some context' });
      expect(errors).toEqual({});
    });
  });

  describe('invalid category', () => {
    it('returns empty object for an unknown category string', () => {
      const errors = validateCategoryFields('NonExistentCategory', {
        some_field: 'value',
      });
      expect(errors).toEqual({});
    });

    it('returns empty object for an empty string category', () => {
      const errors = validateCategoryFields('', {});
      expect(errors).toEqual({});
    });
  });
});

// ── validateAttachments ───────────────────────────────────────────────────────

function makeFile(name: string, type: string, sizeBytes = 512): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe('validateAttachments', () => {
  it('returns empty array for a valid set of files', () => {
    const files = [
      makeFile('brief.pdf', 'application/pdf', 1024),
      makeFile('mockup.png', 'image/png', 2048),
    ];
    expect(validateAttachments(files)).toEqual([]);
  });

  it('returns empty array for zero files', () => {
    expect(validateAttachments([])).toEqual([]);
  });

  it('returns an error when more than 3 files are provided', () => {
    const files = Array.from({ length: 4 }, (_, i) =>
      makeFile(`file${i}.pdf`, 'application/pdf'),
    );
    const errors = validateAttachments(files);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/maximum of 3/i);
  });

  it('returns an error naming the file for an unsupported MIME type', () => {
    const files = [makeFile('virus.exe', 'application/x-msdownload')];
    const errors = validateAttachments(files);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('virus.exe');
    expect(errors[0]).toMatch(/unsupported file type/i);
  });

  it('returns an error naming the file and 100 MB limit for an oversized video', () => {
    const OVER_100MB = 101 * 1024 * 1024;
    const files = [makeFile('demo.mp4', 'video/mp4', OVER_100MB)];
    const errors = validateAttachments(files);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('demo.mp4');
    expect(errors[0]).toContain('100 MB');
  });

  it('returns an error naming the file and 10 MB limit for an oversized document', () => {
    const OVER_10MB = 11 * 1024 * 1024;
    const files = [makeFile('report.pdf', 'application/pdf', OVER_10MB)];
    const errors = validateAttachments(files);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('report.pdf');
    expect(errors[0]).toContain('10 MB');
  });

  it('returns separate errors for each invalid file in the list', () => {
    const files = [
      makeFile('bad.exe', 'application/x-msdownload'),
      makeFile('large.pdf', 'application/pdf', 11 * 1024 * 1024),
    ];
    const errors = validateAttachments(files);
    expect(errors).toHaveLength(2);
  });

  it('does not error on a file exactly at the size limit', () => {
    const files = [makeFile('exactly.pdf', 'application/pdf', 10 * 1024 * 1024)];
    expect(validateAttachments(files)).toEqual([]);
  });
});


describe('validateCategoryFields', () => {
  describe('Technology category', () => {
    it('returns errors for all required fields when all are missing', () => {
      const errors = validateCategoryFields('Technology', {});
      expect(errors).toHaveProperty('tech_stack');
      expect(errors).toHaveProperty('estimated_effort');
      expect(errors).not.toHaveProperty('feasibility_notes');
    });

    it('returns no errors when all required fields are present', () => {
      const errors = validateCategoryFields('Technology', {
        tech_stack: 'Next.js',
        estimated_effort: '1–4 weeks',
      });
      expect(errors).toEqual({});
    });

    it('returns no errors when only optional fields are missing', () => {
      const errors = validateCategoryFields('Technology', {
        tech_stack: 'React',
        estimated_effort: '< 1 week',
        // feasibility_notes omitted — optional
      });
      expect(errors).toEqual({});
    });

    it('returns error for a required field that is whitespace-only', () => {
      const errors = validateCategoryFields('Technology', {
        tech_stack: '   ',
        estimated_effort: '1–4 weeks',
      });
      expect(errors).toHaveProperty('tech_stack');
    });
  });

  describe('Process Improvement category', () => {
    it('returns errors for both required fields when missing', () => {
      const errors = validateCategoryFields('Process Improvement', {});
      expect(errors).toHaveProperty('current_pain_point');
      expect(errors).toHaveProperty('proposed_change');
      expect(errors).not.toHaveProperty('affected_teams');
    });

    it('returns no errors when required fields are present', () => {
      const errors = validateCategoryFields('Process Improvement', {
        current_pain_point: 'Manual reporting takes 2 hours',
        proposed_change: 'Automate with a script',
      });
      expect(errors).toEqual({});
    });
  });

  describe('Customer Experience category', () => {
    it('returns errors for required fields when missing', () => {
      const errors = validateCategoryFields('Customer Experience', {});
      expect(errors).toHaveProperty('target_audience');
      expect(errors).toHaveProperty('expected_impact');
      expect(errors).not.toHaveProperty('success_metric');
    });
  });

  describe('Other category', () => {
    it('returns no errors since all Other fields are optional', () => {
      const errors = validateCategoryFields('Other', {});
      expect(errors).toEqual({});
    });

    it('returns no errors even when context is provided', () => {
      const errors = validateCategoryFields('Other', { context: 'Some context' });
      expect(errors).toEqual({});
    });
  });

  describe('invalid category', () => {
    it('returns empty object for an unknown category string', () => {
      const errors = validateCategoryFields('NonExistentCategory', {
        some_field: 'value',
      });
      expect(errors).toEqual({});
    });

    it('returns empty object for an empty string category', () => {
      const errors = validateCategoryFields('', {});
      expect(errors).toEqual({});
    });
  });
});
