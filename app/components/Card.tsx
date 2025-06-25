import React, { forwardRef } from 'react';
import type { BaseComponentProps } from './types';
import { buildComponentClasses, baseStyles } from './utils/styles';

export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = '',
      variant = 'default',
      padding = 'md',
      interactive = false,
      onClick,
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    const variantClasses = {
      default: 'bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800',
      elevated: 'bg-white dark:bg-gray-950 shadow-lg border border-gray-200 dark:border-gray-800',
      outlined: 'bg-white dark:bg-gray-950 border-2 border-gray-300 dark:border-gray-700'
    };

    const cardClasses = buildComponentClasses(
      // Base card styles
      baseStyles.borderRadius,
      baseStyles.transition,
      variantClasses[variant],
      paddingClasses[padding],
      
      // Interactive styles
      interactive && baseStyles.interactive,
      interactive && 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
      interactive && 'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600',
      
      className
    );

    if (interactive) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          className={cardClasses}
          onClick={onClick}
          data-testid={testId}
          {...rest}
        >
          {children}
        </button>
      );
    }

    return (
      <div
        ref={ref}
        className={cardClasses}
        data-testid={testId}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
export interface CardHeaderProps extends BaseComponentProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  (
    {
      children,
      className = '',
      level = 3,
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const HeaderElement = `h${level}` as keyof JSX.IntrinsicElements;
    
    const headerClasses = buildComponentClasses(
      'text-lg font-semibold text-gray-900 mb-2',
      className
    );

    return (
      <div
        ref={ref}
        className="mb-4"
        data-testid={testId}
        {...rest}
      >
        <HeaderElement className={headerClasses}>
          {children}
        </HeaderElement>
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content Component
export interface CardContentProps extends BaseComponentProps {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  (
    {
      children,
      className = '',
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const contentClasses = buildComponentClasses(
      'text-gray-600',
      className
    );

    return (
      <div
        ref={ref}
        className={contentClasses}
        data-testid={testId}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer Component
export interface CardFooterProps extends BaseComponentProps {
  justify?: 'start' | 'center' | 'end' | 'between';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  (
    {
      children,
      className = '',
      justify = 'start',
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between'
    };

    const footerClasses = buildComponentClasses(
      'flex items-center mt-4 pt-4 border-t border-gray-200',
      justifyClasses[justify],
      className
    );

    return (
      <div
        ref={ref}
        className={footerClasses}
        data-testid={testId}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// Card Image Component
export interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill';
  'data-testid'?: string;
}

export const CardImage = forwardRef<HTMLImageElement, CardImageProps>(
  (
    {
      className = '',
      aspectRatio = 'auto',
      objectFit = 'cover',
      alt = '',
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    const aspectRatioClasses = {
      square: 'aspect-square',
      video: 'aspect-video',
      wide: 'aspect-[3/1]',
      auto: ''
    };

    const objectFitClasses = {
      cover: 'object-cover',
      contain: 'object-contain',
      fill: 'object-fill'
    };

    const imageClasses = buildComponentClasses(
      'w-full rounded-t-md',
      aspectRatioClasses[aspectRatio],
      objectFitClasses[objectFit],
      className
    );

    return (
      <img
        ref={ref}
        className={imageClasses}
        alt={alt}
        data-testid={testId}
        {...rest}
      />
    );
  }
);

CardImage.displayName = 'CardImage'; 