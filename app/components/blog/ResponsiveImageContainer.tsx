import { ReactNode } from 'react';

interface ResponsiveImageContainerProps {
  children: ReactNode;
  variant?: 'featured' | 'default' | 'compact';
  className?: string;
}

export function ResponsiveImageContainer({ 
  children, 
  variant = 'default',
  className = ''
}: ResponsiveImageContainerProps) {
  // Define responsive aspect ratios for different variants
  const getAspectClasses = () => {
    switch (variant) {
      case 'featured':
        // More flexible aspect ratio for featured images
        return 'aspect-[4/3] sm:aspect-[3/2] lg:aspect-[2/1]';
      case 'default':
        // Standard video aspect ratio with mobile adjustment
        return 'aspect-[4/3] sm:aspect-video';
      case 'compact':
        // Square aspect for compact cards
        return 'aspect-square';
      default:
        return 'aspect-video';
    }
  };

  return (
    <div 
      className={`
        w-full overflow-hidden
        ${getAspectClasses()}
        ${className}
      `}
    >
      {children}
    </div>
  );
}