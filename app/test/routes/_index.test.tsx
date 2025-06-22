import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Index from '../../routes/_index';

test('homepage has no accessibility violations', async () => {
  const { container } = render(<Index />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}); 