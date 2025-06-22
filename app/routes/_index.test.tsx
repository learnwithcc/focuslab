import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Index from './_index';

test('index page should have no accessibility violations', async () => {
  const { container } = render(<Index />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}); 