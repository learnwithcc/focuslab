import { render } from '@testing-library/react';
import Index from '../../routes/_index';
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';
import { screen } from '@testing-library/react';

describe('Homepage', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = render(<Index />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});

describe('Index Route', () => {
  it('renders the main heading', () => {
    render(<Index />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders the newsletter form', () => {
    render(<Index />);
    expect(screen.getByText(/stay updated/i)).toBeInTheDocument();
  });

  it('renders the contact section', () => {
    render(<Index />);
    expect(screen.getByText(/get in touch/i)).toBeInTheDocument();
  });
}); 