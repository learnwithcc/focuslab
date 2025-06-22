import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import TermsOfService from '../../routes/terms-of-service';

test('terms of service page has no accessibility violations', async () => {
  const { container } = render(<TermsOfService />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}); 