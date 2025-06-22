import { test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import ContactPage from './contact.tsx';

vi.mock('@remix-run/react', async () => {
  const original = await vi.importActual('@remix-run/react');
  return {
    ...original,
    useNavigation: () => ({
      state: 'idle',
      form: undefined,
    }),
    useActionData: () => undefined,
    Link: (props: any) => <a {...props} href={props.to} />,
  };
});

test('contact page should have no accessibility violations', async () => {
  const { container } = render(<ContactPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}); 