import { useEffect } from 'react';
import { useLocation } from '@remix-run/react';

const DEV_ENV = process.env.NODE_ENV === 'development';

export function useAxe() {
  const location = useLocation();

  useEffect(() => {
    if (!DEV_ENV) return;

    const checkA11y = async () => {
      try {
        const axe = await import('@axe-core/react');
        const React = await import('react');
        const ReactDOM = await import('react-dom');

        axe.default(React, ReactDOM, 1000);
      } catch (error) {
        console.error('Error loading or running axe-core:', error);
      }
    };

    // Debounce a11y checks
    const a11yCheckTimeout = setTimeout(() => {
      checkA11y();
    }, 500);

    return () => {
      clearTimeout(a11yCheckTimeout);
    };
  }, [location.pathname]); // Re-run on route change
} 