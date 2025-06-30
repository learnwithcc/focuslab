import { useState, useEffect } from 'react';
import { 
  generateSrcSet, 
  generateSizesAttribute, 
  isOptimizableImage,
  trackImagePerformance 
} from '~/utils/imageOptimization';

interface BlogImageProps {
  src: string;
  alt: string;
  className?: string;
  variant?: 'featured' | 'default' | 'compact';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean; // For above-the-fold images
}

export function BlogImage({ 
  src, 
  alt, 
  className = '',
  variant = 'default',
  loading = 'lazy',
  onLoad,
  onError,
  priority = false
}: BlogImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadStartTime] = useState(() => Date.now());

  // Preload critical images for better performance
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      
      if (isOptimizableImage(src)) {
        link.href = src;
        link.imageSrcset = generateSrcSet(src, variant);
        link.imageSizes = generateSizesAttribute(variant);
      } else {
        link.href = src;
      }
      
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [src, priority, variant]);

  // Enhanced accessibility and performance optimized placeholder
  const getPlaceholderContent = () => {
    const commonClasses = "flex items-center justify-center text-gray-400 dark:text-gray-500";
    const baseStyle = "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 h-full w-full";
    
    switch (variant) {
      case 'featured':
        return (
          <div 
            className={`${commonClasses} ${baseStyle}`}
            role="img"
            aria-label="Featured blog post placeholder"
          >
            <div className="text-center">
              <div className="mb-2 text-4xl" role="presentation" aria-hidden="true">📖</div>
              <div className="text-sm font-medium">Featured Blog Post</div>
            </div>
          </div>
        );
      case 'compact':
        return (
          <div 
            className={`${commonClasses} ${baseStyle}`}
            role="img"
            aria-label="Blog post thumbnail placeholder"
          >
            <div className="text-xl" role="presentation" aria-hidden="true">📝</div>
          </div>
        );
      default:
        return (
          <div 
            className={`${commonClasses} ${baseStyle}`}
            role="img"
            aria-label="Blog post image placeholder"
          >
            <div className="text-center">
              <div className="mb-2 text-3xl" role="presentation" aria-hidden="true">📰</div>
              <div className="text-xs">Blog Post</div>
            </div>
          </div>
        );
    }
  };

  // Accessibility-enhanced loading skeleton
  const LoadingSkeleton = () => (
    <div 
      className="animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 h-full w-full"
      role="img"
      aria-label="Loading image..."
      aria-live="polite"
    />
  );

  // Image event handlers with performance monitoring
  const handleImageLoad = () => {
    const loadTime = Date.now() - loadStartTime;
    setImageLoading(false);
    setImageLoaded(true);
    trackImagePerformance(src, variant, loadTime, true);
    onLoad?.();
  };

  const handleImageError = () => {
    const loadTime = Date.now() - loadStartTime;
    setImageError(true);
    setImageLoading(false);
    trackImagePerformance(src, variant, loadTime, false);
    onError?.();
  };

  // Don't render image if no source provided
  if (!src || imageError) {
    return (
      <div className={className}>
        {getPlaceholderContent()}
      </div>
    );
  }

  return (
    <div className={className}>
      {imageLoading && <LoadingSkeleton />}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-all duration-300 ease-in-out ${
          imageLoading ? 'opacity-0 absolute' : 'opacity-100'
        }`}
        loading={priority ? 'eager' : loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          display: imageLoading ? 'none' : 'block'
        }}
        // Performance optimizations
        decoding="async"
        // Enhanced accessibility
        role="img"
        tabIndex={-1}
        // Responsive image optimization
        {...(isOptimizableImage(src) && {
          srcSet: generateSrcSet(src, variant),
          sizes: generateSizesAttribute(variant),
        })}
      />
    </div>
  );
}