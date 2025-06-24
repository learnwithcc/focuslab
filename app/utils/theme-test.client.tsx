/**
 * Client-side theme testing utilities
 * This component helps detect and log theme hydration issues
 */

import { useEffect } from 'react';

export function ThemeHydrationTest() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;
    
    const checkThemeConsistency = () => {
      const root = document.documentElement;
      const classTheme = root.classList.contains('dark') ? 'dark' : 'light';
      const attrTheme = root.getAttribute('data-theme');
      const styleTheme = root.style.colorScheme;
      
      console.group('🎨 Theme Hydration Check');
      console.log('Class theme:', classTheme);
      console.log('Attribute theme:', attrTheme);
      console.log('Style theme:', styleTheme);
      
      const isConsistent = classTheme === attrTheme && classTheme === styleTheme;
      
      if (isConsistent) {
        console.log('✅ Theme is consistent across all properties');
      } else {
        console.error('❌ Theme mismatch detected! This may cause hydration errors.');
      }
      
      console.groupEnd();
    };
    
    // Check immediately
    checkThemeConsistency();
    
    // Check again after a short delay to catch post-hydration issues
    setTimeout(checkThemeConsistency, 100);
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      const relevantMutation = mutations.some(m => 
        m.attributeName === 'class' || 
        m.attributeName === 'data-theme' ||
        m.attributeName === 'style'
      );
      
      if (relevantMutation) {
        console.log('🔄 Theme changed');
        checkThemeConsistency();
      }
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    });
    
    return () => observer.disconnect();
  }, []);
  
  return null;
}