import { render } from '@testing-library/react';
import Index from './_index';
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';

describe('Homepage', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = render(<Index />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
}); 