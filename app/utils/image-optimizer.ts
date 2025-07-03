import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';

// Supported image formats and their MIME types
export const SUPPORTED_FORMATS = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
} as const;

export type SupportedFormat = keyof typeof SUPPORTED_FORMATS;

// Image processing configuration
export interface ImageConfig {
  width?: number;
  height?: number;
  format?: SupportedFormat;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
  blur?: number;
  sharpen?: boolean;
}

// Default quality settings for different formats
const DEFAULT_QUALITY = {
  jpeg: 85,
  jpg: 85,
  png: 90,
  webp: 80,
  avif: 75,
} as const;

// Common breakpoints for responsive images
export const BREAKPOINTS = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1600,
} as const;

// Pixel density multipliers
export const PIXEL_DENSITIES = [1, 2, 3] as const;

export class ImageOptimizer {
  private cacheDir: string;
  private publicDir: string;

  constructor(publicDir = 'public', cacheDir = 'public/cache/images') {
    this.publicDir = publicDir;
    this.cacheDir = cacheDir;
  }

  /**
   * Initialize the optimizer by creating necessary directories
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Generate cache key for processed images
   */
  private generateCacheKey(src: string, config: ImageConfig): string {
    const configString = JSON.stringify(config);
    const hash = Buffer.from(configString).toString('base64').replace(/[/+=]/g, '');
    const srcHash = Buffer.from(src).toString('base64').replace(/[/+=]/g, '').slice(0, 8);
    return `${srcHash}_${hash}`;
  }

  /**
   * Get cached image path
   */
  private getCachePath(cacheKey: string, format: SupportedFormat): string {
    return join(this.cacheDir, `${cacheKey}.${format}`);
  }

  /**
   * Check if cached image exists and is still valid
   */
  private async isCacheValid(cachePath: string, originalPath: string): Promise<boolean> {
    try {
      const [cacheStats, originalStats] = await Promise.all([
        fs.stat(cachePath),
        fs.stat(originalPath),
      ]);
      return cacheStats.mtime > originalStats.mtime;
    } catch {
      return false;
    }
  }

  /**
   * Detect format from file extension or buffer
   */
  async detectFormat(input: string | Buffer): Promise<SupportedFormat | null> {
    try {
      if (typeof input === 'string') {
        const ext = input.split('.').pop()?.toLowerCase();
        if (ext && ext in SUPPORTED_FORMATS) {
          return ext === 'jpg' ? 'jpeg' : ext as SupportedFormat;
        }
      }

      // Use Sharp to detect format from buffer
      const metadata = await sharp(input).metadata();
      const format = metadata.format;

      if (format && format in SUPPORTED_FORMATS) {
        return format as SupportedFormat;
      }
    } catch (error) {
      console.error('Failed to detect image format:', error);
    }

    return null;
  }

  /**
   * Get optimal format based on browser support
   */
  getOptimalFormat(acceptHeader?: string): SupportedFormat {
    if (!acceptHeader) return 'jpeg';

    // Check for AVIF support (most modern)
    if (acceptHeader.includes('image/avif')) {
      return 'avif';
    }

    // Check for WebP support
    if (acceptHeader.includes('image/webp')) {
      return 'webp';
    }

    // Fallback to JPEG
    return 'jpeg';
  }

  /**
   * Process image with given configuration
   */
  async processImage(src: string, config: ImageConfig = {}): Promise<{
    buffer: Buffer;
    contentType: string;
    cacheKey: string;
  }> {
    // Extract the actual image path if this is an API URL
    let imagePath = src;
    if (src.includes('/api/images?')) {
      // This is likely a recursive call, extract the src parameter
      try {
        const url = new URL(src, 'http://localhost');
        const srcParam = url.searchParams.get('src');
        if (srcParam) {
          imagePath = decodeURIComponent(srcParam);
        }
      } catch (error) {
        console.error('Failed to parse image URL:', src, error);
        throw new Error(`Invalid image URL: ${src}`);
      }
    }

    const originalPath = join(this.publicDir, imagePath.startsWith('/') ? imagePath.slice(1) : imagePath);

    // Check if original file exists
    try {
      await fs.access(originalPath);
    } catch {
      throw new Error(`Image file not found: ${originalPath}`);
    }

    // Generate cache key using the actual image path
    const cacheKey = this.generateCacheKey(imagePath, config);
    const format = config.format || 'jpeg';
    const cachePath = this.getCachePath(cacheKey, format);

    // Check if cached version exists and is valid
    if (await this.isCacheValid(cachePath, originalPath)) {
      try {
        const buffer = await fs.readFile(cachePath);
        return {
          buffer,
          contentType: SUPPORTED_FORMATS[format],
          cacheKey,
        };
      } catch {
        // Cache read failed, continue with processing
      }
    }

    // Process the image
    let sharpInstance = sharp(originalPath);

    // Apply transformations
    if (config.width || config.height) {
      sharpInstance = sharpInstance.resize(config.width, config.height, {
        fit: config.fit || 'cover',
        position: config.position || 'center',
        withoutEnlargement: true,
      });
    }

    // Apply effects
    if (config.blur) {
      sharpInstance = sharpInstance.blur(config.blur);
    }

    if (config.sharpen) {
      sharpInstance = sharpInstance.sharpen();
    }

    // Set format and quality
    const quality = config.quality || DEFAULT_QUALITY[format];

    switch (format) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({
          quality,
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality,
          effort: 6,
        });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality,
          effort: 9,
        });
        break;
    }

    const buffer = await sharpInstance.toBuffer();

    // Cache the processed image
    try {
      await fs.writeFile(cachePath, buffer);
    } catch (error) {
      console.error('Failed to cache processed image:', error);
    }

    return {
      buffer,
      contentType: SUPPORTED_FORMATS[format],
      cacheKey,
    };
  }

  /**
   * Generate multiple sizes for responsive images
   */
  async generateResponsiveSizes(
    src: string,
    sizes: number[],
    format?: SupportedFormat,
    quality?: number
  ): Promise<Array<{
    width: number;
    url: string;
    buffer: Buffer;
    contentType: string;
  }>> {
    const results = await Promise.all(
      sizes.map(async (width) => {
        const config: ImageConfig = {
          width,
          format: format || 'jpeg',
          quality: quality || DEFAULT_QUALITY[format || 'jpeg'],
          fit: 'cover',
        };

        const result = await this.processImage(src, config);
        
        return {
          width,
          url: `/api/images?src=${encodeURIComponent(src)}&w=${width}&f=${format || 'jpeg'}&q=${quality || DEFAULT_QUALITY[format || 'jpeg']}`,
          buffer: result.buffer,
          contentType: result.contentType,
        };
      })
    );

    return results;
  }

  /**
   * Generate low-quality image placeholder (LQIP)
   */
  async generatePlaceholder(src: string, width = 20): Promise<{
    dataUrl: string;
    color: string;
  }> {
    try {
      const originalPath = join(this.publicDir, src.startsWith('/') ? src.slice(1) : src);
      
      // Generate tiny, heavily blurred version
      const buffer = await sharp(originalPath)
        .resize(width, null, { 
          withoutEnlargement: false,
          fit: 'cover' 
        })
        .blur(2)
        .jpeg({ quality: 20 })
        .toBuffer();

      const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;

      // Extract dominant color
      const { data } = await sharp(originalPath)
        .resize(1, 1)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const color = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;

      return { dataUrl, color };
    } catch (error) {
      console.error('Failed to generate placeholder:', error);
      return {
        dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo=',
        color: '#f3f4f6',
      };
    }
  }

  /**
   * Clean up old cached images
   */
  async cleanupCache(maxAge = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();

      await Promise.all(
        files.map(async (file) => {
          const filePath = join(this.cacheDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
          }
        })
      );
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  /**
   * Get image metadata
   */
  async getMetadata(src: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  } | null> {
    try {
      const originalPath = join(this.publicDir, src.startsWith('/') ? src.slice(1) : src);
      const metadata = await sharp(originalPath).metadata();
      const stats = await fs.stat(originalPath);

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: stats.size,
      };
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      return null;
    }
  }
}

// Create singleton instance
export const imageOptimizer = new ImageOptimizer();

// Initialize on module load
imageOptimizer.init().catch(console.error); 