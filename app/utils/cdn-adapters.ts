import { ImageConfig } from './image-optimizer';

export interface CDNTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  gravity?: 'auto' | 'center' | 'north' | 'south' | 'east' | 'west' | 'face' | 'faces';
  crop?: 'scale' | 'fit' | 'limit' | 'mfit' | 'fill' | 'lfill' | 'pad' | 'lpad' | 'mpad' | 'crop' | 'thumb' | 'imagga_scale' | 'imagga_crop';
  dpr?: number; // Device pixel ratio
  progressive?: boolean;
  strip?: boolean; // Remove metadata
  blur?: number;
  sharpen?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

export interface CDNAdapter {
  name: string;
  generateUrl(imageUrl: string, options: CDNTransformOptions): string;
  getSupportedFormats(): string[];
  getOptimalFormat(userAgent?: string, acceptHeader?: string): string;
  validateConfig(): boolean;
}

/**
 * Cloudinary CDN Adapter
 * Documentation: https://cloudinary.com/documentation/image_transformation_reference
 */
export class CloudinaryAdapter implements CDNAdapter {
  public readonly name = 'cloudinary';
  
  constructor(
    private cloudName: string,
    private apiKey?: string,
    private apiSecret?: string
  ) {}

  generateUrl(imageUrl: string, options: CDNTransformOptions): string {
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/fetch`;
    const transformations: string[] = [];

    // Size transformations
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.dpr && options.dpr > 1) transformations.push(`dpr_${options.dpr}`);

    // Quality and format
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);

    // Crop and fit
    const cropMap = {
      cover: 'fill',
      contain: 'fit',
      fill: 'fill',
      inside: 'fit',
      outside: 'fill',
    };
    if (options.fit) transformations.push(`c_${cropMap[options.fit] || 'fill'}`);
    if (options.gravity && options.gravity !== 'auto') transformations.push(`g_${options.gravity}`);

    // Effects
    if (options.progressive) transformations.push('fl_progressive');
    if (options.strip) transformations.push('fl_strip_profile');
    if (options.blur) transformations.push(`e_blur:${options.blur}`);
    if (options.sharpen) transformations.push(`e_sharpen:${options.sharpen}`);
    if (options.brightness) transformations.push(`e_brightness:${options.brightness}`);
    if (options.contrast) transformations.push(`e_contrast:${options.contrast}`);
    if (options.saturation) transformations.push(`e_saturation:${options.saturation}`);

    const transformStr = transformations.length > 0 ? `/${transformations.join(',')}` : '';
    return `${baseUrl}${transformStr}/${encodeURIComponent(imageUrl)}`;
  }

  getSupportedFormats(): string[] {
    return ['webp', 'avif', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'tiff', 'ico'];
  }

  getOptimalFormat(userAgent?: string, acceptHeader?: string): string {
    if (acceptHeader?.includes('image/avif')) return 'avif';
    if (acceptHeader?.includes('image/webp')) return 'webp';
    if (userAgent?.includes('Chrome') || userAgent?.includes('Firefox')) return 'webp';
    return 'jpeg';
  }

  validateConfig(): boolean {
    return !!this.cloudName;
  }
}

/**
 * ImageKit CDN Adapter
 * Documentation: https://docs.imagekit.io/features/image-transformations
 */
export class ImageKitAdapter implements CDNAdapter {
  public readonly name = 'imagekit';
  
  constructor(
    private urlEndpoint: string,
    private publicKey?: string,
    private privateKey?: string
  ) {}

  generateUrl(imageUrl: string, options: CDNTransformOptions): string {
    const baseUrl = `${this.urlEndpoint.replace(/\/$/, '')}`;
    const transformations: string[] = [];

    // Size transformations
    if (options.width) transformations.push(`w-${options.width}`);
    if (options.height) transformations.push(`h-${options.height}`);
    if (options.dpr && options.dpr > 1) transformations.push(`dpr-${options.dpr}`);

    // Quality and format
    if (options.quality) transformations.push(`q-${options.quality}`);
    if (options.format) transformations.push(`f-${options.format}`);

    // Crop and fit
    const cropMap = {
      cover: 'maintain_ratio',
      contain: 'pad_resize',
      fill: 'force',
      inside: 'at_max',
      outside: 'at_least',
    };
    if (options.fit) transformations.push(`c-${cropMap[options.fit] || 'maintain_ratio'}`);
    if (options.gravity && options.gravity !== 'auto') transformations.push(`fo-${options.gravity}`);

    // Effects
    if (options.progressive) transformations.push('pr-true');
    if (options.blur) transformations.push(`bl-${options.blur}`);
    if (options.sharpen) transformations.push(`e-sharpen-${options.sharpen}`);
    if (options.brightness) transformations.push(`e-brightness-${options.brightness}`);
    if (options.contrast) transformations.push(`e-contrast-${options.contrast}`);
    if (options.saturation) transformations.push(`e-saturation-${options.saturation}`);

    const transformStr = transformations.length > 0 ? `/tr:${transformations.join(',')}` : '';
    
    // Handle both direct URLs and ImageKit paths
    if (imageUrl.startsWith('http')) {
      // External URL
      return `${baseUrl}${transformStr}/${encodeURIComponent(imageUrl)}`;
    } else {
      // ImageKit path
      return `${baseUrl}${transformStr}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
  }

  getSupportedFormats(): string[] {
    return ['webp', 'avif', 'jpeg', 'png', 'gif', 'svg'];
  }

  getOptimalFormat(userAgent?: string, acceptHeader?: string): string {
    if (acceptHeader?.includes('image/avif')) return 'avif';
    if (acceptHeader?.includes('image/webp')) return 'webp';
    return 'jpeg';
  }

  validateConfig(): boolean {
    return !!this.urlEndpoint;
  }
}

/**
 * Generic CDN Adapter for custom implementations
 */
export class GenericCDNAdapter implements CDNAdapter {
  public readonly name = 'generic';
  
  constructor(
    private baseUrl: string,
    private urlTemplate: string = '{baseUrl}/{transformations}/{imageUrl}',
    private transformationMap: Record<string, string> = {}
  ) {}

  generateUrl(imageUrl: string, options: CDNTransformOptions): string {
    const transformations: string[] = [];

    // Build transformations based on mapping
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const mappedKey = this.transformationMap[key] || key;
        transformations.push(`${mappedKey}=${value}`);
      }
    });

    const transformStr = transformations.join('&');
    
    return this.urlTemplate
      .replace('{baseUrl}', this.baseUrl)
      .replace('{transformations}', transformStr)
      .replace('{imageUrl}', encodeURIComponent(imageUrl));
  }

  getSupportedFormats(): string[] {
    return ['webp', 'jpeg', 'png', 'gif'];
  }

  getOptimalFormat(userAgent?: string, acceptHeader?: string): string {
    if (acceptHeader?.includes('image/webp')) return 'webp';
    return 'jpeg';
  }

  validateConfig(): boolean {
    return !!this.baseUrl;
  }
}

/**
 * CDN Configuration and Management
 */
export interface CDNConfig {
  provider: 'cloudinary' | 'imagekit' | 'generic' | 'none';
  config: Record<string, any>;
  fallbackToLocal?: boolean;
  enableAutoFormat?: boolean;
  cacheMaxAge?: number;
}

export class CDNManager {
  private adapter: CDNAdapter | null = null;

  constructor(private config: CDNConfig) {
    this.initializeAdapter();
  }

  private initializeAdapter(): void {
    try {
      switch (this.config.provider) {
        case 'cloudinary':
          this.adapter = new CloudinaryAdapter(
            this.config.config['cloudName'],
            this.config.config['apiKey'],
            this.config.config['apiSecret']
          );
          break;
        case 'imagekit':
          this.adapter = new ImageKitAdapter(
            this.config.config['urlEndpoint'],
            this.config.config['publicKey'],
            this.config.config['privateKey']
          );
          break;
        case 'generic':
          this.adapter = new GenericCDNAdapter(
            this.config.config['baseUrl'],
            this.config.config['urlTemplate'],
            this.config.config['transformationMap']
          );
          break;
        default:
          this.adapter = null;
      }

      if (this.adapter && !this.adapter.validateConfig()) {
        console.warn(`CDN adapter ${this.config.provider} configuration is invalid`);
        this.adapter = null;
      }
    } catch (error) {
      console.error('Failed to initialize CDN adapter:', error);
      this.adapter = null;
    }
  }

  /**
   * Generate optimized image URL using CDN or fallback to local
   */
  generateImageUrl(
    imageUrl: string, 
    options: CDNTransformOptions,
    request?: Request
  ): string {
    // If no CDN adapter or fallback enabled, use local API
    if (!this.adapter || this.config.fallbackToLocal) {
      return this.generateLocalUrl(imageUrl, options);
    }

    try {
      // Auto-detect optimal format if enabled
      if (this.config.enableAutoFormat && !options.format) {
        const userAgent = request?.headers.get('User-Agent') || '';
        const acceptHeader = request?.headers.get('Accept') || '';
        options.format = this.adapter.getOptimalFormat(userAgent, acceptHeader);
      }

      return this.adapter.generateUrl(imageUrl, options);
    } catch (error) {
      console.error('Failed to generate CDN URL:', error);
      
      // Fallback to local if CDN fails
      if (this.config.fallbackToLocal !== false) {
        return this.generateLocalUrl(imageUrl, options);
      }
      
      return imageUrl; // Return original URL as last resort
    }
  }

  /**
   * Generate local API URL for image processing
   */
  private generateLocalUrl(imageUrl: string, options: CDNTransformOptions): string {
    const params = new URLSearchParams();
    params.set('url', imageUrl);
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);
    if (options.dpr && options.dpr > 1) params.set('dpr', options.dpr.toString());

    return `/api/images?${params.toString()}`;
  }

  /**
   * Get supported formats for current adapter
   */
  getSupportedFormats(): string[] {
    return this.adapter?.getSupportedFormats() || ['webp', 'jpeg', 'png'];
  }

  /**
   * Check if CDN is available and configured
   */
  isEnabled(): boolean {
    return !!this.adapter;
  }

  /**
   * Get current adapter info
   */
  getAdapterInfo(): { name: string; enabled: boolean } | null {
    if (!this.adapter) return null;
    
    return {
      name: this.adapter.name,
      enabled: this.adapter.validateConfig(),
    };
  }
}

// Default CDN configuration (can be overridden via environment variables)
export function createDefaultCDNConfig(): CDNConfig {
  const provider = (process.env['CDN_PROVIDER'] as CDNConfig['provider']) || 'none';
  
  const configs: Record<string, Record<string, any>> = {
    cloudinary: {
      cloudName: process.env['CLOUDINARY_CLOUD_NAME'],
      apiKey: process.env['CLOUDINARY_API_KEY'],
      apiSecret: process.env['CLOUDINARY_API_SECRET'],
    },
    imagekit: {
      urlEndpoint: process.env['IMAGEKIT_URL_ENDPOINT'],
      publicKey: process.env['IMAGEKIT_PUBLIC_KEY'],
      privateKey: process.env['IMAGEKIT_PRIVATE_KEY'],
    },
    generic: {
      baseUrl: process.env['CDN_BASE_URL'],
      urlTemplate: process.env['CDN_URL_TEMPLATE'],
      transformationMap: process.env['CDN_TRANSFORMATION_MAP'] ? 
        JSON.parse(process.env['CDN_TRANSFORMATION_MAP']) : {},
    },
  };

  return {
    provider,
    config: configs[provider] || {},
    fallbackToLocal: process.env['CDN_FALLBACK_TO_LOCAL'] !== 'false',
    enableAutoFormat: process.env['CDN_AUTO_FORMAT'] !== 'false',
    cacheMaxAge: parseInt(process.env['CDN_CACHE_MAX_AGE'] || '31536000'), // 1 year default
  };
}

// Global CDN manager instance
export const cdnManager = new CDNManager(createDefaultCDNConfig()); 