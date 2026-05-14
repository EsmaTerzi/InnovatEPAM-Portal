/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuidanceBanner } from './GuidanceBanner';

describe('GuidanceBanner', () => {
  it('renders the guidance text', () => {
    render(<GuidanceBanner guidance="Please describe your idea clearly." onDismiss={() => {}} />);
    expect(screen.getByText('Please describe your idea clearly.')).toBeInTheDocument();
  });

  it('has role="note"', () => {
    render(<GuidanceBanner guidance="Some guidance" onDismiss={() => {}} />);
    expect(screen.getByRole('note')).toBeInTheDocument();
  });

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    render(<GuidanceBanner guidance="Click to dismiss" onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
