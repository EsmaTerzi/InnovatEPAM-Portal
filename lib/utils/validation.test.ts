import { validateCategoryFields } from '@/lib/utils/validation';

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
