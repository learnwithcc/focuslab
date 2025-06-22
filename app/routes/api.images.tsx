import type { LoaderFunctionArgs } from '@remix-run/node';
import { imageOptimizer, type SupportedFormat, type ImageConfig } from '~/utils/image-optimizer';
import { getSecurityHeadersWithSEO } from '~/utils/security';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const src = url.searchParams.get('src');
    const width = url.searchParams.get('w');
    const height = url.searchParams.get('h');
    const format = url.searchParams.get('f') as SupportedFormat;
    const quality = url.searchParams.get('q');
    const fit = url.searchParams.get('fit') as 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    const blur = url.searchParams.get('blur');

    // Validate required parameters
    if (!src) {
      return new Response('Missing src parameter', { 
        status: 400,
        headers: getSecurityHeadersWithSEO('api')
      });
    }

    // Validate format if provided
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'avif'];
    if (format && !supportedFormats.includes(format)) {
      return new Response('Unsupported format', { 
        status: 400,
        headers: getSecurityHeadersWithSEO('api')
      });
    }

    // Get optimal format based on browser support if not specified
    const acceptHeader = request.headers.get('accept');
    const optimalFormat = format || imageOptimizer.getOptimalFormat(acceptHeader || undefined);

    // Parse and validate parameters
    const parsedWidth = width ? parseInt(width, 10) : undefined;
    const parsedHeight = height ? parseInt(height, 10) : undefined;
    const parsedQuality = quality ? parseInt(quality, 10) : undefined;
    const parsedBlur = blur ? parseFloat(blur) : undefined;

    // Validate dimensions
    if (parsedWidth && (parsedWidth < 1 || parsedWidth > 3000)) {
      return new Response('Invalid width parameter', { 
        status: 400,
        headers: getSecurityHeadersWithSEO('api')
      });
    }

    if (parsedHeight && (parsedHeight < 1 || parsedHeight > 3000)) {
      return new Response('Invalid height parameter', { 
        status: 400,
        headers: getSecurityHeadersWithSEO('api')
      });
    }

    // Validate quality
    if (parsedQuality && (parsedQuality < 1 || parsedQuality > 100)) {
      return new Response('Invalid quality parameter', { 
        status: 400,
        headers: getSecurityHeadersWithSEO('api')
      });
    }

    // Build config object with only defined values
    const config: ImageConfig = {
      format: optimalFormat,
      fit: fit || 'cover',
    };

    if (parsedWidth) config.width = parsedWidth;
    if (parsedHeight) config.height = parsedHeight;
    if (parsedQuality) config.quality = parsedQuality;
    if (parsedBlur) config.blur = parsedBlur;

    // Process the image
    const result = await imageOptimizer.processImage(src, config);

    // Create response headers
    const headers = new Headers({
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': `"${result.cacheKey}"`,
      'Content-Length': result.buffer.length.toString(),
    });

    // Merge with security headers
    const securityHeaders = getSecurityHeadersWithSEO('api');
    securityHeaders.forEach((value, name) => {
      if (!headers.has(name)) {
        headers.set(name, value);
      }
    });

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === `"${result.cacheKey}"`) {
      return new Response(null, { 
        status: 304, 
        headers 
      });
    }

    return new Response(result.buffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Image processing error:', error);
    
    // Return a placeholder image on error
    const placeholderSvg = `
      <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f3f4f6"/>
        <path d="M200 120c-22.091 0-40 17.909-40 40s17.909 40 40 40 40-17.909 40-40-17.909-40-40-40zm0 60c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20z" fill="#9ca3af"/>
        <path d="M180 140h40v20h-40z" fill="#9ca3af"/>
      </svg>
    `;

    return new Response(placeholderSvg, {
      status: 200,
      headers: {
        ...Object.fromEntries(getSecurityHeadersWithSEO('api').entries()),
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
} 