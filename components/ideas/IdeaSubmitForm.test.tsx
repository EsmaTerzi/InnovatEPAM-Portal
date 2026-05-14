/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdeaSubmitForm } from './IdeaSubmitForm';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, refresh: mockRefresh }),
}));

// shadcn Select (Radix UI) is not interactive in jsdom.
// This mock has Select inspect its children tree to collect the id (from SelectTrigger),
// placeholder (from SelectValue), and options (from SelectContent/SelectItem), then renders
// one native <select> element so userEvent.selectOptions works correctly.
jest.mock('@/components/ui/select', () => {
  const React = require('react');

  // Sentinel types — referenced by identity inside Select.collect()
  const SelectValue = ({ placeholder: _p }) => null;
  const SelectContent = ({ children: _c }) => null;
  const SelectItem = ({ value, children }) => <option value={value}>{children}</option>;
  const SelectTrigger = ({ id: _id, children: _c }) => null;

  const Select = ({ value, onValueChange, disabled, children }) => {
    let id;
    let placeholder;
    const options = [];

    const collect = (nodes) => {
      React.Children.forEach(nodes, (child) => {
        if (!React.isValidElement(child)) return;
        const t = child.type;
        if (t === SelectTrigger) {
          id = child.props.id;
          collect(child.props.children);
        } else if (t === SelectValue) {
          placeholder = child.props.placeholder;
        } else if (t === SelectContent) {
          React.Children.forEach(child.props.children, (item) => options.push(item));
        }
      });
    };
    collect(children);

    return (
      <select
        id={id}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options}
      </select>
    );
  };

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function selectCategory(category) {
  // The label htmlFor="category" links to the <select id="category">
  const sel = screen.getByLabelText(/^category/i);
  return userEvent.selectOptions(sel, category);
}

// ── Tests: US2 — Guidance Banner (T019) ──────────────────────────────────────

describe('IdeaSubmitForm — guidance banner (US2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows guidance banner after selecting a category', async () => {
    render(<IdeaSubmitForm />);
    await selectCategory('Technology');
    expect(screen.getByRole('note')).toBeInTheDocument();
  });

  it('hides guidance banner after clicking dismiss', async () => {
    render(<IdeaSubmitForm />);
    await selectCategory('Technology');
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('does not re-show dismissed banner when same category is re-selected', async () => {
    render(<IdeaSubmitForm />);
    await selectCategory('Technology');
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    await selectCategory('Other');
    await selectCategory('Technology');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('shows the new category banner when switching to a different category', async () => {
    render(<IdeaSubmitForm />);
    await selectCategory('Technology');
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    await selectCategory('Other');
    expect(screen.getByRole('note')).toBeInTheDocument();
  });
});

// ── Tests: US3 — Validation (T022) ───────────────────────────────────────────

describe('IdeaSubmitForm — category-specific validation (US3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('shows error on required category field when left empty', async () => {
    render(<IdeaSubmitForm />);
    await userEvent.type(screen.getByLabelText(/^title/i), 'My Idea');
    await userEvent.type(screen.getByLabelText(/^description/i), 'Some description');
    await selectCategory('Technology');
    await userEvent.click(screen.getByRole('button', { name: /submit idea/i }));
    expect(await screen.findByText(/tech stack is required/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not clear valid base field values when invalid fields are flagged', async () => {
    render(<IdeaSubmitForm />);
    await userEvent.type(screen.getByLabelText(/^title/i), 'Kept Title');
    await userEvent.type(screen.getByLabelText(/^description/i), 'Kept Description');
    await selectCategory('Technology');
    await userEvent.type(screen.getByLabelText(/feasibility notes/i), 'Some notes');
    await userEvent.click(screen.getByRole('button', { name: /submit idea/i }));
    await screen.findByText(/tech stack is required/i);
    expect(screen.getByLabelText(/^title/i).value).toBe('Kept Title');
    expect(screen.getByLabelText(/^description/i).value).toBe('Kept Description');
  });

  it('clears the per-field error when the field is filled in', async () => {
    render(<IdeaSubmitForm />);
    await userEvent.type(screen.getByLabelText(/^title/i), 'T');
    await userEvent.type(screen.getByLabelText(/^description/i), 'D');
    await selectCategory('Technology');
    await userEvent.click(screen.getByRole('button', { name: /submit idea/i }));
    await screen.findByText(/tech stack is required/i);
    await userEvent.type(screen.getByLabelText(/tech stack/i), 'Next.js');
    expect(screen.queryByText(/tech stack is required/i)).not.toBeInTheDocument();
  });
});

// ── Tests: US4 — Safe Category Switching (T027) ───────────────────────────────

describe('IdeaSubmitForm — category-switch warning (US4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('does not show warning when switching with no category-specific values entered', async () => {
    render(<IdeaSubmitForm />);
    await selectCategory('Technology');
    await selectCategory('Other');
    expect(screen.queryByText(/switching/i)).not.toBeInTheDocument();
  });

  it('shows warning when switching after filling a category-specific field', async () => {
    render(<IdeaSubmitForm />);
    await selectCategory('Technology');
    await userEvent.type(screen.getByLabelText(/tech stack/i), 'Next.js');
    await selectCategory('Process Improvement');
    expect(screen.getByRole('alert')).toHaveTextContent(/process improvement/i);
  });

  it('Cancel reverts to previous category without clearing fields', async () => {
    render(<IdeaSubmitForm />);
    await selectCategory('Technology');
    await userEvent.type(screen.getByLabelText(/tech stack/i), 'Next.js');
    await selectCategory('Process Improvement');
    // Scope to the switch-warning alert to avoid ambiguity with the form's Cancel button
    const warning = screen.getByRole('alert');
    await userEvent.click(within(warning).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/switching/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/tech stack/i)).toBeInTheDocument();
  });

  it('Continue switches category and clears category-specific fields', async () => {
    render(<IdeaSubmitForm />);
    await selectCategory('Technology');
    await userEvent.type(screen.getByLabelText(/tech stack/i), 'Next.js');
    await selectCategory('Process Improvement');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.queryByText(/switching/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/tech stack/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/current pain point/i)).toBeInTheDocument();
  });

  it('preserves title and description after Continue', async () => {
    render(<IdeaSubmitForm />);
    await userEvent.type(screen.getByLabelText(/^title/i), 'Persistent Title');
    await userEvent.type(screen.getByLabelText(/^description/i), 'Persistent Desc');
    await selectCategory('Technology');
    await userEvent.type(screen.getByLabelText(/tech stack/i), 'Rails');
    await selectCategory('Other');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByLabelText(/^title/i).value).toBe('Persistent Title');
    expect(screen.getByLabelText(/^description/i).value).toBe('Persistent Desc');
  });
});
