import React, { forwardRef } from 'react';
import type { BaseComponentProps } from './types';
import { buildComponentClasses, layoutClasses } from './utils/styles';

// Header Component
export interface HeaderProps extends BaseComponentProps {
  sticky?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Header = forwardRef<HTMLElement, HeaderProps>(
  (
    {
      children,
      className = '',
      sticky = false,
      variant = 'primary',
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const headerClasses = buildComponentClasses(
      // Base header styles
      'w-full',
      sticky && 'sticky top-0 z-50',
      
      // Variant styles
      variant === 'primary' ? 'bg-white shadow-sm border-b border-gray-200' : 'bg-gray-900 border-b border-gray-700',
      
      className
    );

    return (
      <header
        ref={ref}
        className={headerClasses}
        role="banner"
        data-testid={testId}
        {...rest}
      >
        {children}
      </header>
    );
  }
);

Header.displayName = 'Header';

// Main Content Component
export interface MainProps extends BaseComponentProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  padding?: boolean;
}

export const Main = forwardRef<HTMLElement, MainProps>(
  (
    {
      children,
      className = '',
      maxWidth = '7xl',
      padding = true,
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const maxWidthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '7xl': 'max-w-7xl',
      full: 'max-w-full'
    };

    const mainClasses = buildComponentClasses(
      // Base main styles
      'flex-1',
      maxWidth !== 'full' && 'mx-auto',
      maxWidthClasses[maxWidth],
      padding && 'px-4 sm:px-6 lg:px-8',
      
      className
    );

    return (
      <main
        ref={ref}
        className={mainClasses}
        role="main"
        data-testid={testId}
        {...rest}
      >
        {children}
      </main>
    );
  }
);

Main.displayName = 'Main';

// Footer Component
export interface FooterProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary';
}

export const Footer = forwardRef<HTMLElement, FooterProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const footerClasses = buildComponentClasses(
      // Base footer styles
      'w-full',
      
      // Variant styles
      variant === 'primary' ? 'bg-white border-t border-gray-200' : 'bg-gray-900 border-t border-gray-700',
      
      className
    );

    return (
      <footer
        ref={ref}
        className={footerClasses}
        role="contentinfo"
        data-testid={testId}
        {...rest}
      >
        {children}
      </footer>
    );
  }
);

Footer.displayName = 'Footer';

// Page Layout Wrapper Component
export interface PageLayoutProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary';
}

export const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const layoutClasses = buildComponentClasses(
      // Base layout styles
      'min-h-screen flex flex-col',
      
      // Variant styles
      variant === 'primary' ? 'bg-gray-50' : 'bg-gray-900',
      
      className
    );

    return (
      <div
        ref={ref}
        className={layoutClasses}
        data-testid={testId}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

PageLayout.displayName = 'PageLayout';

// Section Component for content areas
export interface SectionProps extends BaseComponentProps {
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  centered?: boolean;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      children,
      className = '',
      spacing = 'md',
      maxWidth = '7xl',
      centered = true,
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const spacingClasses = {
      sm: 'py-8',
      md: 'py-12 md:py-16',
      lg: 'py-16 md:py-20',
      xl: 'py-20 md:py-24'
    };

    const maxWidthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '7xl': 'max-w-7xl',
      full: 'max-w-full'
    };

    const sectionClasses = buildComponentClasses(
      // Base section styles
      spacingClasses[spacing],
      centered && maxWidth !== 'full' && 'mx-auto px-4 sm:px-6 lg:px-8',
      maxWidthClasses[maxWidth],
      
      className
    );

    return (
      <section
        ref={ref}
        className={sectionClasses}
        data-testid={testId}
        {...rest}
      >
        {children}
      </section>
    );
  }
);

Section.displayName = 'Section';

// Container Component for wrapping content
export interface ContainerProps extends BaseComponentProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  padding?: boolean;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      children,
      className = '',
      maxWidth = '7xl',
      padding = true,
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const maxWidthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '7xl': 'max-w-7xl',
      full: 'max-w-full'
    };

    const containerClasses = buildComponentClasses(
      // Base container styles
      maxWidth !== 'full' ? 'mx-auto' : undefined,
      maxWidthClasses[maxWidth],
      padding ? 'px-4 sm:px-6 lg:px-8' : undefined,
      
      className
    );

    return (
      <div
        ref={ref}
        className={containerClasses}
        data-testid={testId}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container'; 