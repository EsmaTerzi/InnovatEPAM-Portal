/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryDetails } from './CategoryDetails';
import { CATEGORY_CONFIG } from '@/lib/config/categories';

describe('CategoryDetails', () => {
  it('returns null when metadata is an empty array', () => {
    const { container } = render(
      <CategoryDetails category="Technology" metadata={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders human-readable labels from CATEGORY_CONFIG', () => {
    render(
      <CategoryDetails
        category="Technology"
        metadata={[
          { field_key: 'tech_stack', field_val: 'Next.js, PostgreSQL' },
          { field_key: 'estimated_effort', field_val: '1–4 weeks' },
        ]}
      />,
    );
    expect(screen.getByText('Tech Stack')).toBeInTheDocument();
    expect(screen.getByText('Estimated Effort')).toBeInTheDocument();
    expect(screen.getByText('Next.js, PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('1–4 weeks')).toBeInTheDocument();
  });

  it('omits entries where field_val is empty or whitespace', () => {
    render(
      <CategoryDetails
        category="Technology"
        metadata={[
          { field_key: 'tech_stack', field_val: 'React' },
          { field_key: 'feasibility_notes', field_val: '   ' },
        ]}
      />,
    );
    expect(screen.getByText('Tech Stack')).toBeInTheDocument();
    expect(screen.queryByText('Feasibility Notes')).not.toBeInTheDocument();
  });

  it('omits entries whose field_key is not in CATEGORY_CONFIG for the category', () => {
    render(
      <CategoryDetails
        category="Technology"
        metadata={[
          { field_key: 'tech_stack', field_val: 'Vue' },
          { field_key: 'unknown_field', field_val: 'some value' },
        ]}
      />,
    );
    expect(screen.getByText('Tech Stack')).toBeInTheDocument();
    expect(screen.queryByText('some value')).not.toBeInTheDocument();
  });

  it('returns null when all metadata entries are empty after filtering', () => {
    const { container } = render(
      <CategoryDetails
        category="Technology"
        metadata={[{ field_key: 'feasibility_notes', field_val: '' }]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the section heading "Category Details"', () => {
    render(
      <CategoryDetails
        category="Process Improvement"
        metadata={[
          { field_key: 'current_pain_point', field_val: 'Too slow' },
        ]}
      />,
    );
    expect(screen.getByText('Category Details')).toBeInTheDocument();
  });

  it('renders all four categories correctly using CATEGORY_CONFIG labels', () => {
    // Spot-check each category
    const checks: Array<[string, string, string, string]> = [
      ['Technology', 'tech_stack', 'Rails', 'Tech Stack'],
      ['Process Improvement', 'proposed_change', 'New workflow', 'Proposed Change'],
      ['Customer Experience', 'target_audience', 'Enterprise', 'Target Audience'],
      ['Other', 'context', 'Background info', 'Additional Context'],
    ];
    for (const [category, key, val, label] of checks) {
      const { unmount } = render(
        <CategoryDetails category={category} metadata={[{ field_key: key, field_val: val }]} />,
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(val)).toBeInTheDocument();
      unmount();
    }
  });
});
