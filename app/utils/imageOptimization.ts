/**
 * Image optimization utilities for better performance and user experience
 */

export interface ImageSizes {
  width: number;
  height: number;
  quality?: number;
}

export interface ResponsiveImageSizes {
  mobile: ImageSizes;
  tablet: ImageSizes;
  desktop: ImageSizes;
}

/**
 * Generate optimized image URLs with query parameters for size and quality
 * Uses our internal image optimization API for local images
 */
export function generateOptimizedImageUrl(
  baseUrl: string,
  sizes: ImageSizes,
  format: 'webp' | 'jpeg' | 'png' = 'webp'
): string {
  if (!baseUrl) return '';
  
  // Skip optimization for external URLs
  if (baseUrl.startsWith('http')) {
    return baseUrl;
  }

  // Skip optimization if this is already an API URL (prevents recursive calls)
  if (baseUrl.includes('/api/images?')) {
    return baseUrl;
  }

  // Use our image optimization API for local images
  const params = new URLSearchParams();
  params.set('src', baseUrl);
  params.set('w', sizes.width.toString());
  params.set('h', sizes.height.toString());
  params.set('q', (sizes.quality || 80).toString());
  params.set('f', format);

  return `/api/images?${params.toString()}`;
}

/**
 * Generate responsive image sizes for different variants
 */
export function getResponsiveImageSizes(variant: 'featured' | 'default' | 'compact'): ResponsiveImageSizes {
  switch (variant) {
    case 'featured':
      return {
        mobile: { width: 400, height: 300, quality: 75 },
        tablet: { width: 600, height: 400, quality: 80 },
        desktop: { width: 800, height: 400, quality: 85 }
      };
    
    case 'default':
      return {
        mobile: { width: 350, height: 200, quality: 75 },
        tablet: { width: 500, height: 281, quality: 80 },
        desktop: { width: 640, height: 360, quality: 85 }
      };
    
    case 'compact':
      return {
        mobile: { width: 64, height: 64, quality: 75 },
        tablet: { width: 64, height: 64, quality: 80 },
        desktop: { width: 64, height: 64, quality: 85 }
      };
    
    default:
      return {
        mobile: { width: 400, height: 300, quality: 75 },
        tablet: { width: 600, height: 400, quality: 80 },
        desktop: { width: 800, height: 400, quality: 85 }
      };
  }
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  variant: 'featured' | 'default' | 'compact'
): string {
  if (!baseUrl) return '';
  
  const sizes = getResponsiveImageSizes(variant);
  
  const srcsetEntries = [
    `${generateOptimizedImageUrl(baseUrl, sizes.mobile)} ${sizes.mobile.width}w`,
    `${generateOptimizedImageUrl(baseUrl, sizes.tablet)} ${sizes.tablet.width}w`,
    `${generateOptimizedImageUrl(baseUrl, sizes.desktop)} ${sizes.desktop.width}w`
  ];

  return srcsetEntries.join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(variant: 'featured' | 'default' | 'compact'): string {
  switch (variant) {
    case 'featured':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    
    case 'default':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';
    
    case 'compact':
      return '64px';
    
    default:
      return '100vw';
  }
}

/**
 * Check if image URL is optimizable (local vs external)
 */
export function isOptimizableImage(url: string): boolean {
  if (!url) return false;
  
  // Don't optimize external URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return false;
  }
  
  // Only optimize common image formats
  const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp'];
  return supportedFormats.some(format => url.toLowerCase().includes(format));
}

/**
 * Preload critical images for performance
 */
export function preloadImage(src: string, variant: 'featured' | 'default' | 'compact'): void {
  if (typeof window === 'undefined' || !src) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  
  if (isOptimizableImage(src)) {
    const sizes = getResponsiveImageSizes(variant);
    link.href = generateOptimizedImageUrl(src, sizes.mobile);
    link.imageSrcset = generateSrcSet(src, variant);
    link.imageSizes = generateSizesAttribute(variant);
  } else {
    link.href = src;
  }

  document.head.appendChild(link);
}

/**
 * Get fallback placeholder images for different variants
 */
export function getFallbackPlaceholder(variant: 'featured' | 'default' | 'compact'): string {
  switch (variant) {
    case 'featured':
      return '/images/blog/placeholder-featured.jpg';
    case 'compact':
      return '/images/blog/placeholder-default.jpg';
    case 'default':
    default:
      return '/images/blog/placeholder-default.jpg';
  }
}

/**
 * Generate SVG placeholder for immediate display
 */
export function generateSVGPlaceholder(
  width: number, 
  height: number, 
  text: string = 'Loading...',
  bgColor: string = '#f3f4f6',
  textColor: string = '#9ca3af'
): string {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" 
            fill="${textColor}" font-family="system-ui, -apple-system, sans-serif" 
            font-size="${Math.min(width, height) / 8}">
        ${text}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Check if image URL is available (non-empty and not a placeholder)
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url) return false;
  if (url.trim().length === 0) return false;
  if (url.includes('placeholder')) return false;
  return true;
}

/**
 * Get optimized image URL or fallback
 */
export function getImageUrlWithFallback(
  imageUrl: string | undefined | null,
  variant: 'featured' | 'default' | 'compact',
  useOptimization: boolean = true
): string {
  // If no image URL provided, use fallback immediately
  if (!isValidImageUrl(imageUrl)) {
    return getFallbackPlaceholder(variant);
  }

  // If optimization is disabled or this is an external URL, return as-is
  if (!useOptimization || imageUrl!.startsWith('http')) {
    return imageUrl!;
  }

  // For local images, optionally use optimization
  if (isOptimizableImage(imageUrl!)) {
    const sizes = getResponsiveImageSizes(variant);
    return generateOptimizedImageUrl(imageUrl!, sizes.desktop, 'webp');
  }

  return imageUrl!;
}

/**
 * Image loading performance monitoring
 */
export function trackImagePerformance(
  imageUrl: string,
  variant: string,
  loadTime: number,
  success: boolean
): void {
  // In a real application, you'd send this to your analytics service
  if (typeof window !== 'undefined' && window.console) {
    console.debug(`Image Performance: ${imageUrl} (${variant}) - ${loadTime}ms - ${success ? 'Success' : 'Failed'}`);
    
    // Track failures for debugging
    if (!success) {
      console.warn(`Image load failed: ${imageUrl}`, {
        variant,
        loadTime,
        timestamp: new Date().toISOString()
      });
    }
  }
}