import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

describe('Footer', () => {
  beforeEach(() => {
    const mockDate = new Date('2024-01-01T00:00:00.000Z');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the copyright notice', () => {
    render(<Footer />);
    const copyright = screen.getByText(`© 2023 Focus Lab. All rights reserved.`);
    expect(copyright).toBeInTheDocument();
  });

  it('renders links to terms of service and privacy policy', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms-of-service');
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy-policy');
  });
}); 