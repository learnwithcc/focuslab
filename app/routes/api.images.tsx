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
    
    // For missing images, return a 200 status with placeholder to prevent hydration errors
    const isNotFound = error instanceof Error && (
      error.message.includes('not found') || 
      error.message.includes('ENOENT') ||
      error.message.includes('no such file')
    );
    // Use 200 for missing images to prevent browser errors that cause hydration issues
    const statusCode = isNotFound ? 200 : 500;
    
    // Return a dynamic placeholder SVG based on requested dimensions
    const url = new URL(request.url);
    const width = url.searchParams.get('w');
    const height = url.searchParams.get('h');
    const errorWidth = width ? parseInt(width, 10) : 400;
    const errorHeight = height ? parseInt(height, 10) : 300;
    
    const placeholderSvg = `
      <svg width="${errorWidth}" height="${errorHeight}" viewBox="0 0 ${errorWidth} ${errorHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="${errorWidth}" height="${errorHeight}" fill="#f3f4f6"/>
        <circle cx="${errorWidth/2}" cy="${errorHeight/2 - 20}" r="30" fill="#e5e7eb"/>
        <path d="M${errorWidth/2 - 15} ${errorHeight/2 - 30}h30v20h-30z" fill="#9ca3af"/>
        <circle cx="${errorWidth/2 - 8}" cy="${errorHeight/2 - 22}" r="3" fill="#6b7280"/>
        <circle cx="${errorWidth/2 + 8}" cy="${errorHeight/2 - 22}" r="3" fill="#6b7280"/>
        <text x="${errorWidth/2}" y="${errorHeight/2 + 30}" text-anchor="middle" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="14">
          ${isNotFound ? 'Image not found' : 'Error loading image'}
        </text>
      </svg>
    `;

    return new Response(placeholderSvg, {
      status: statusCode,
      headers: {
        ...Object.fromEntries(getSecurityHeadersWithSEO('api').entries()),
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // Shorter cache for errors
      },
    });
  }
}