import { test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Contact from '../../routes/contact';

// Mock Remix hooks
vi.mock('@remix-run/react', async () => {
  const actual = await vi.importActual('@remix-run/react');
  return {
    ...actual,
    useNavigation: () => ({ state: 'idle' }),
    useActionData: () => undefined,
  };
});

test('contact page has no accessibility violations', async () => {
  const { container } = render(<Contact />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}); 