import { CATEGORY_CONFIG } from '@/lib/config/categories';

describe('CATEGORY_CONFIG structure', () => {
  const EXPECTED_CATEGORIES = [
    'Technology',
    'Process Improvement',
    'Customer Experience',
    'Other',
  ];

  it('contains all four required categories', () => {
    for (const cat of EXPECTED_CATEGORIES) {
      expect(CATEGORY_CONFIG).toHaveProperty(cat);
    }
  });

  it('has no unexpected extra categories', () => {
    expect(Object.keys(CATEGORY_CONFIG)).toHaveLength(EXPECTED_CATEGORIES.length);
  });

  for (const cat of EXPECTED_CATEGORIES) {
    describe(`${cat}`, () => {
      it('has a non-empty guidance string', () => {
        expect(CATEGORY_CONFIG[cat].guidance.trim().length).toBeGreaterThan(0);
      });

      it('has at least one field', () => {
        expect(CATEGORY_CONFIG[cat].fields.length).toBeGreaterThan(0);
      });

      it('every field has a non-empty key, label, and helper', () => {
        for (const field of CATEGORY_CONFIG[cat].fields) {
          expect(field.key.trim().length).toBeGreaterThan(0);
          expect(field.label.trim().length).toBeGreaterThan(0);
          expect(field.helper.trim().length).toBeGreaterThan(0);
        }
      });

      it('every field type is text, textarea, or select', () => {
        for (const field of CATEGORY_CONFIG[cat].fields) {
          expect(['text', 'textarea', 'select']).toContain(field.type);
        }
      });

      it('every select field has at least one option', () => {
        for (const field of CATEGORY_CONFIG[cat].fields) {
          if (field.type === 'select') {
            expect(field.options).toBeDefined();
            expect(field.options!.length).toBeGreaterThan(0);
          }
        }
      });

      it('required flag is a boolean on every field', () => {
        for (const field of CATEGORY_CONFIG[cat].fields) {
          expect(typeof field.required).toBe('boolean');
        }
      });
    });
  }

  it('Technology has tech_stack and estimated_effort as required', () => {
    const tech = CATEGORY_CONFIG['Technology'];
    const required = tech.fields.filter((f) => f.required).map((f) => f.key);
    expect(required).toContain('tech_stack');
    expect(required).toContain('estimated_effort');
  });

  it('Technology has feasibility_notes as optional', () => {
    const tech = CATEGORY_CONFIG['Technology'];
    const optional = tech.fields.find((f) => f.key === 'feasibility_notes');
    expect(optional).toBeDefined();
    expect(optional!.required).toBe(false);
  });

  it('Other has no required fields', () => {
    const other = CATEGORY_CONFIG['Other'];
    const requiredFields = other.fields.filter((f) => f.required);
    expect(requiredFields).toHaveLength(0);
  });
});
