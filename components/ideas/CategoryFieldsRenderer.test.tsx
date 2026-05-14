/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryFieldsRenderer } from './CategoryFieldsRenderer';

const noop = () => {};

describe('CategoryFieldsRenderer', () => {
  it('renders Technology-specific fields for "Technology"', () => {
    render(
      <CategoryFieldsRenderer
        category="Technology"
        values={{}}
        errors={{}}
        onChange={noop}
        disabled={false}
      />,
    );
    // TechnologyFields has a field labelled "Tech Stack"
    expect(screen.getByLabelText(/tech stack/i)).toBeInTheDocument();
  });

  it('renders Process Improvement fields for "Process Improvement"', () => {
    render(
      <CategoryFieldsRenderer
        category="Process Improvement"
        values={{}}
        errors={{}}
        onChange={noop}
        disabled={false}
      />,
    );
    expect(screen.getByLabelText(/current pain point/i)).toBeInTheDocument();
  });

  it('renders Customer Experience fields for "Customer Experience"', () => {
    render(
      <CategoryFieldsRenderer
        category="Customer Experience"
        values={{}}
        errors={{}}
        onChange={noop}
        disabled={false}
      />,
    );
    expect(screen.getByLabelText(/target audience/i)).toBeInTheDocument();
  });

  it('renders Other fields for "Other"', () => {
    render(
      <CategoryFieldsRenderer
        category="Other"
        values={{}}
        errors={{}}
        onChange={noop}
        disabled={false}
      />,
    );
    expect(screen.getByLabelText(/context/i)).toBeInTheDocument();
  });

  it('renders nothing for an empty string category', () => {
    const { container } = render(
      <CategoryFieldsRenderer
        category=""
        values={{}}
        errors={{}}
        onChange={noop}
        disabled={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for an unknown category', () => {
    const { container } = render(
      <CategoryFieldsRenderer
        category="Unknown Category"
        values={{}}
        errors={{}}
        onChange={noop}
        disabled={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('removes Technology fields when category switches to Other', () => {
    const { rerender } = render(
      <CategoryFieldsRenderer
        category="Technology"
        values={{}}
        errors={{}}
        onChange={noop}
        disabled={false}
      />,
    );
    expect(screen.getByLabelText(/tech stack/i)).toBeInTheDocument();

    rerender(
      <CategoryFieldsRenderer
        category="Other"
        values={{}}
        errors={{}}
        onChange={noop}
        disabled={false}
      />,
    );
    expect(screen.queryByLabelText(/tech stack/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/context/i)).toBeInTheDocument();
  });
});
