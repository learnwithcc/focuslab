import { useState, useEffect, useRef } from 'react';
import { useIsMounted, useIntersectionObserver, isBrowser } from '~/utils/ssr';

// Breakpoint definitions for responsive images
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1440,
  xlarge: 1920,
} as const;

// Pixel density variants
export const PIXEL_DENSITIES = [1, 2, 3] as const;

// Image formats in order of preference (modern to fallback)
export const IMAGE_FORMATS = ['avif', 'webp', 'jpeg', 'png'] as const;

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
  quality?: number;
  sizes?: string;
  breakpoints?: Partial<typeof BREAKPOINTS>;
  pixelDensities?: number[];
  formats?: string[];
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
  onError?: () => void;
}

interface GeneratedSource {
  srcSet: string;
  type: string;
  sizes: string;
}

/**
 * Generate image URLs for different formats, sizes, and pixel densities
 */
function generateImageSources(
  src: string,
  breakpoints: typeof BREAKPOINTS,
  pixelDensities: number[],
  formats: string[],
  quality?: number
): GeneratedSource[] {
  const sources: GeneratedSource[] = [];

  // Generate sources for each format
  formats.forEach(format => {
    const srcSet: string[] = [];

    // Generate sources for each breakpoint and pixel density
    Object.entries(breakpoints).forEach(([, width]) => {
      pixelDensities.forEach(density => {
        const actualWidth = Math.round(width * density);
        const params = new URLSearchParams({
          url: src,
          w: actualWidth.toString(),
          format,
          ...(quality && { q: quality.toString() }),
        });
        
        const imageUrl = `/api/images?${params.toString()}`;
        srcSet.push(`${imageUrl} ${actualWidth}w`);
      });
    });

    // Generate sizes attribute based on breakpoints
    const sizes = Object.entries(breakpoints)
      .map(([, width], index, array) => {
        if (index === array.length - 1) {
          // Last breakpoint doesn't need media query
          return `${width}px`;
        }
        return `(max-width: ${width}px) ${width}px`;
      })
      .join(', ');

    sources.push({
      srcSet: srcSet.join(', '),
      type: `image/${format}`,
      sizes,
    });
  });

  return sources;
}

/**
 * Generate placeholder image data URL (SSR-safe)
 */
function generatePlaceholder(width: number, height: number): string {
  if (!isBrowser) return '';
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!canvas || !ctx) return '';
    
    canvas.width = width;
    canvas.height = height;
    
    // Create a subtle gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    return canvas.toDataURL('image/jpeg', 0.1);
  } catch (error) {
    console.warn('Error generating placeholder:', error);
    return '';
  }
}

/**
 * Responsive Image Component
 * 
 * Features:
 * - Multiple breakpoint support
 * - Pixel density variants (1x, 2x, 3x)
 * - Modern format support (AVIF, WebP) with fallbacks
 * - Lazy loading with Intersection Observer
 * - Blur placeholder support
 * - Automatic sizes attribute generation
 */
export function ResponsiveImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  lazy = true,
  quality = 80,
  sizes,
  breakpoints = BREAKPOINTS,
  pixelDensities = [...PIXEL_DENSITIES],
  formats = [...IMAGE_FORMATS],
  placeholder = 'blur',
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy || priority);
  const [placeholderSrc, setPlaceholderSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const isMounted = useIsMounted();

  // Generate placeholder on client side only
  useEffect(() => {
    if (placeholder === 'blur' && isMounted) {
      setPlaceholderSrc(generatePlaceholder(width, height));
    }
  }, [width, height, placeholder, isMounted]);

  // Use intersection observer for lazy loading (SSR-safe)
  const { isIntersecting } = useIntersectionObserver(imgRef, {
    rootMargin: '50px', // Start loading 50px before entering viewport
    threshold: 0.01,
  });

  // Update visibility based on intersection
  useEffect(() => {
    if (!lazy || priority) {
      setIsVisible(true);
    } else if (isIntersecting) {
      setIsVisible(true);
    }
  }, [lazy, priority, isIntersecting]);

  // Merge provided breakpoints with defaults
  const mergedBreakpoints = { ...BREAKPOINTS, ...breakpoints };

  // Generate image sources for different formats and sizes
  const sources = generateImageSources(
    src,
    mergedBreakpoints,
    pixelDensities,
    formats,
    quality
  );

  // Generate fallback image URL
  const fallbackParams = new URLSearchParams({
    url: src,
    w: width.toString(),
    ...(quality && { q: quality.toString() }),
  });
  const fallbackSrc = `/api/images?${fallbackParams.toString()}`;

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Generate custom sizes attribute if provided
  const sizesAttribute = sizes || sources[0]?.sizes;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* Placeholder or blur effect */}
      {!isLoaded && placeholder === 'blur' && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm"
          style={{ 
            transform: 'scale(1.1)', // Slight scale to hide blur edges
            zIndex: 1 
          }}
        />
      )}

      {/* Loading placeholder */}
      {!isLoaded && !placeholderSrc && placeholder !== 'empty' && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"
          style={{ zIndex: 1 }}
        />
      )}

      {/* Main responsive image */}
      {isVisible && (
        <picture className="relative z-10">
          {/* Modern format sources */}
          {sources.map((source, index) => (
            <source
              key={index}
              srcSet={source.srcSet}
              type={source.type}
              sizes={sizesAttribute}
            />
          ))}
          
          {/* Fallback image */}
          <img
            ref={imgRef}
            src={fallbackSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={`
              w-full h-full object-cover transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
              ${isError ? 'opacity-50' : ''}
            `}
            onLoad={handleLoad}
            onError={handleError}
            style={{ zIndex: 2 }}
          />
        </picture>
      )}

      {/* Error state */}
      {isError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500"
          style={{ zIndex: 3 }}
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 opacity-50">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c0-1.1-.9-2-2-2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </div>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Utility hook for responsive image breakpoints (SSR-safe)
 */
export function useResponsiveBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof typeof BREAKPOINTS>('desktop');
  const isMounted = useIsMounted();

  useEffect(() => {
    if (!isMounted) return;

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= BREAKPOINTS.xlarge) {
        setCurrentBreakpoint('xlarge');
      } else if (width >= BREAKPOINTS.large) {
        setCurrentBreakpoint('large');
      } else if (width >= BREAKPOINTS.desktop) {
        setCurrentBreakpoint('desktop');
      } else if (width >= BREAKPOINTS.tablet) {
        setCurrentBreakpoint('tablet');
      } else {
        setCurrentBreakpoint('mobile');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, [isMounted]);

  return currentBreakpoint;
}

/**
 * Utility function to generate responsive image props
 */
export function getResponsiveImageProps(
  src: string,
  alt: string,
  options: Partial<ResponsiveImageProps> = {}
): ResponsiveImageProps {
  return {
    src,
    alt,
    width: 800,
    height: 600,
    quality: 80,
    lazy: true,
    placeholder: 'blur',
    ...options,
  };
}

export default ResponsiveImage; 