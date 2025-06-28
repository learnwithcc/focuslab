// Dynamic XML Sitemap Route for Focus Lab
import type { LoaderFunctionArgs } from '@remix-run/node';
import { generateAllSitemapUrls, generateSitemapXml, validateSitemapSize } from '~/utils/sitemap';
import { createSEOHeaders } from '~/utils/security';

// Apply SEO-specific headers (includes X-Robots-Tag: noindex)
export const headers = createSEOHeaders;

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Generate all sitemap URLs
    const sitemapUrls = await generateAllSitemapUrls({ 
      baseUrl,
      currentDate: new Date()
    });
    
    // Validate sitemap size
    const validation = validateSitemapSize(sitemapUrls);
    if (!validation.isValid) {
      console.warn(`Sitemap contains ${validation.count} URLs, exceeding limit of ${validation.maxCount}`);
    }
    
    // Generate XML sitemap
    const sitemapXml = generateSitemapXml(sitemapUrls);
    
    // Return XML response with proper headers
    return new Response(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a minimal sitemap if there's an error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://focuslab.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new Response(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes on error
      },
    });
  }
}

// This route should not be rendered as a React component
export default function SitemapXml() {
  return null;
} 