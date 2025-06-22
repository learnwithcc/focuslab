import { ResponsiveImage, ResponsiveImageProps } from './ResponsiveImage';

export interface HeroImageProps extends Omit<ResponsiveImageProps, 'className'> {
  className?: string;
  overlayClassName?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
  aspectRatio?: 'video' | 'square' | 'wide' | 'ultrawide' | string;
  gradientOverlay?: boolean;
  gradientDirection?: 'to-t' | 'to-b' | 'to-l' | 'to-r' | 'to-tl' | 'to-tr' | 'to-bl' | 'to-br';
  parallax?: boolean;
  priority?: boolean;
}

const aspectRatios = {
  video: '16 / 9',
  square: '1 / 1',
  wide: '21 / 9',
  ultrawide: '32 / 9',
};

/**
 * Hero Image Component
 * 
 * A specialized responsive image component designed for hero sections with:
 * - Customizable aspect ratios
 * - Overlay support for better text readability
 * - Gradient overlays
 * - Parallax scrolling effect
 * - Content overlay support
 */
export function HeroImage({
  src,
  alt,
  className = '',
  overlayClassName = '',
  overlayOpacity = 0.4,
  children,
  aspectRatio = 'video',
  gradientOverlay = false,
  gradientDirection = 'to-t',
  parallax = false,
  priority = true,
  ...imageProps
}: HeroImageProps) {
  const aspectRatioValue = aspectRatios[aspectRatio as keyof typeof aspectRatios] || aspectRatio;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: aspectRatioValue }}
    >
      {/* Background Image */}
      <div 
        className={`absolute inset-0 ${parallax ? 'transform scale-110' : ''}`}
        style={{
          transform: parallax ? 'translateZ(0)' : undefined,
        }}
      >
        <ResponsiveImage
          src={src}
          alt={alt}
          width={1920}
          height={1080}
          priority={priority}
          lazy={!priority}
          quality={85}
          className="w-full h-full"
          formats={['avif', 'webp', 'jpeg']}
          breakpoints={{
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            large: 1440,
            xlarge: 1920,
          }}
          {...imageProps}
        />
      </div>

      {/* Gradient Overlay */}
      {gradientOverlay && (
        <div 
          className={`absolute inset-0 bg-gradient-${gradientDirection} from-black/60 to-transparent`}
          style={{ zIndex: 10 }}
        />
      )}

      {/* Custom Overlay */}
      {overlayOpacity > 0 && (
        <div 
          className={`absolute inset-0 bg-black ${overlayClassName}`}
          style={{ 
            opacity: overlayOpacity,
            zIndex: 11,
          }}
        />
      )}

      {/* Content Overlay */}
      {children && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-20"
        >
          <div className="text-center text-white">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default HeroImage; 