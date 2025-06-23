import { useState, useEffect } from 'react';

export function ThemeToggleDebug() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    console.log('ThemeToggleDebug mounted');
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleToggle = () => {
    console.log('Theme toggle clicked');
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="fixed top-1/2 right-4 z-50 transform -translate-y-1/2">
      <button
        className="relative flex items-center justify-center h-10 w-10 rounded-full border shadow-lg backdrop-blur-sm cursor-pointer bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
        onClick={handleToggle}
        aria-label="Toggle theme"
        type="button"
      >
        <span className="text-sm">
          {theme === 'light' ? '🌙' : '☀️'}
        </span>
      </button>
    </div>
  );
}