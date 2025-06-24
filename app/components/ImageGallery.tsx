import { useState, useRef } from 'react';
import { ResponsiveImage } from './ResponsiveImage';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useIsMounted, useEventListener, useBodyScrollLock } from '~/utils/ssr';

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  thumbnail?: string;
}

export interface ImageGalleryProps {
  images: GalleryImage[];
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto';
  spacing?: 'none' | 'tight' | 'normal' | 'loose';
  lightbox?: boolean;
  captions?: boolean;
  lazy?: boolean;
  quality?: number;
}

const spacingClasses = {
  none: 'gap-0',
  tight: 'gap-2',
  normal: 'gap-4',
  loose: 'gap-6',
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

/**
 * Image Gallery Component
 * 
 * Features:
 * - Responsive grid layout with customizable columns
 * - Lightbox modal for full-size viewing
 * - Keyboard navigation support
 * - Caption support
 * - Different aspect ratio modes
 * - Lazy loading support
 * - Touch/swipe support for mobile
 */
export function ImageGallery({
  images,
  className = '',
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  aspectRatio = 'auto',
  spacing = 'normal',
  lightbox = true,
  captions = true,
  lazy = true,
  quality = 80,
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const isMounted = useIsMounted();

  // Handle keyboard navigation (SSR-safe)
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!lightboxOpen) return;

    switch (event.key) {
      case 'Escape':
        setLightboxOpen(false);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNext();
        break;
    }
  };

  useEventListener('keydown', handleKeyDown);

  // Prevent body scroll when lightbox is open (SSR-safe)
  useBodyScrollLock(lightboxOpen);

  const openLightbox = (index: number) => {
    if (lightbox) {
      setCurrentImageIndex(index);
      setLightboxOpen(true);
    }
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const getGridClasses = () => {
    const classes = ['grid'];
    
    // Add spacing
    classes.push(spacingClasses[spacing]);
    
    // Add responsive columns
    if (columns.mobile) classes.push(columnClasses[columns.mobile as keyof typeof columnClasses]);
    if (columns.tablet) classes.push(`md:${columnClasses[columns.tablet as keyof typeof columnClasses]}`);
    if (columns.desktop) classes.push(`lg:${columnClasses[columns.desktop as keyof typeof columnClasses]}`);
    
    return classes.join(' ');
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'portrait':
        return 'aspect-[3/4]';
      case 'landscape':
        return 'aspect-[4/3]';
      default:
        return '';
    }
  };

  const currentImage = images[currentImageIndex];

  return (
    <>
      {/* Gallery Grid */}
      <div className={`${getGridClasses()} ${className}`}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`
              relative group cursor-pointer overflow-hidden rounded-lg
              ${aspectRatio !== 'auto' ? getAspectRatioClass() : ''}
              ${lightbox ? 'hover:opacity-90 transition-opacity duration-200' : ''}
            `}
            onClick={() => openLightbox(index)}
          >
            <ResponsiveImage
              src={image.thumbnail || image.src}
              alt={image.alt}
              width={image.width || 400}
              height={image.height || 300}
              quality={quality}
              lazy={lazy}
              className="w-full h-full"
              breakpoints={{
                mobile: 480,
                tablet: 768,
                desktop: 1024,
              }}
            />
            
            {/* Hover overlay */}
            {lightbox && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            )}
            
            {/* Caption overlay */}
            {captions && image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-sm font-medium truncate">
                  {image.caption}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightbox && lightboxOpen && currentImage && isMounted && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white hover:text-gray-300 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white hover:text-gray-300 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
          
          {/* Main image */}
          <div
            className="max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ResponsiveImage
              src={currentImage.src}
              alt={currentImage.alt}
              width={currentImage.width || 1200}
              height={currentImage.height || 800}
              quality={90}
              priority={true}
              lazy={false}
              className="max-w-full max-h-full object-contain"
                             breakpoints={{
                 mobile: 480,
                 tablet: 768,
                 desktop: 1024,
                 large: 1440,
               }}
            />
          </div>
          
          {/* Caption */}
          {captions && currentImage.caption && (
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-lg font-medium bg-black/50 rounded-lg px-4 py-2 backdrop-blur-sm">
                {currentImage.caption}
              </p>
            </div>
          )}
          
          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 text-white text-sm bg-black/50 rounded-lg px-3 py-1 backdrop-blur-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ImageGallery; 