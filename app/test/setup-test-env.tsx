import { installGlobals } from '@remix-run/node';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

installGlobals();

vi.mock('@remix-run/react', async () => {
  const original = await vi.importActual<typeof import('@remix-run/react')>(
    '@remix-run/react',
  );
  return {
    ...original,
    Link: vi.fn(({ children, to, ...props }) => (
      <a href={to as string} {...props}>
        {children}
      </a>
    )),
  };
}); 