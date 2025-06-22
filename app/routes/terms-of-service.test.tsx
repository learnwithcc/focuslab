import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Terms from './terms-of-service.tsx';

test('terms of service page should have no accessibility violations', async () => {
  const { container } = render(<Terms />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}); 