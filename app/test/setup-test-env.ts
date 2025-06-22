import { expect, afterEach, vi } from 'vitest';
import * as matchers from 'vitest-axe/matchers';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

vi.mock('@remix-run/react', async () => {
  const original = await vi.importActual('@remix-run/react');
  return {
    ...original,
    Link: (props: any) => React.createElement('a', { ...props, href: props.to }),
  };
}); 