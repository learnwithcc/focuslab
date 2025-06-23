import { useState, useEffect } from 'react';

export function SimpleThemeToggle() {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    console.log('SimpleThemeToggle mounted');
    setMounted(true);
  }, []);

  console.log('SimpleThemeToggle render, mounted:', mounted);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    console.log('SimpleThemeToggle returning null - not mounted');
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '50px',
        right: '10px',
        backgroundColor: 'blue',
        color: 'white',
        padding: '10px',
        zIndex: 9999,
        border: '2px solid black'
      }}
    >
      SIMPLE THEME TOGGLE MOUNTED
    </div>
  );
}