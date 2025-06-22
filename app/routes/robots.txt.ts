// Dynamic robots.txt Route for Focus Lab
import type { LoaderFunctionArgs } from '@remix-run/node';
import { createSEOHeaders } from '~/utils/security';

// Apply SEO-specific headers (includes X-Robots-Tag: noindex)
export const headers = createSEOHeaders;

export async function loader({ request }: LoaderFunctionArgs) {
  // Get the base URL from the request
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  // Enhanced robots.txt with comprehensive crawling instructions
  const robotsTxt = `# Robots.txt for Focus Lab
# Generated dynamically to include proper sitemap reference

# Allow all bots to crawl public content
User-agent: *
Allow: /

# Prevent crawling of API endpoints and sensitive areas
Disallow: /api/
Disallow: /.well-known/
Disallow: /admin/
Disallow: /_build/

# Prevent crawling of utility files and directories
Disallow: /build/
Disallow: /public/
Disallow: /node_modules/

# Allow specific important files
Allow: /favicon.ico
Allow: /robots.txt
Allow: /sitemap.xml

# Specific bot instructions
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Additional sitemaps (for future expansion)
# Sitemap: ${baseUrl}/sitemap-images.xml
# Sitemap: ${baseUrl}/sitemap-news.xml`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
} 