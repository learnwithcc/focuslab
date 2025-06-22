// Sitemap generation utilities for Focus Lab
import { projects } from '~/data/projects';

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface SitemapOptions {
  baseUrl?: string;
  currentDate?: Date;
}

const DEFAULT_BASE_URL = 'https://focuslab.dev';

// Static route configuration
const STATIC_ROUTES: Omit<SitemapUrl, 'loc' | 'lastmod'>[] = [
  {
    changefreq: 'daily',
    priority: 1.0
  }, // Homepage
  {
    changefreq: 'monthly', 
    priority: 0.8
  }, // About
  {
    changefreq: 'monthly',
    priority: 0.7
  }, // Contact
  {
    changefreq: 'weekly',
    priority: 0.9
  }, // Projects
  {
    changefreq: 'yearly',
    priority: 0.3
  }, // Privacy Policy
  {
    changefreq: 'yearly',
    priority: 0.3
  }, // Terms of Service
  {
    changefreq: 'yearly',
    priority: 0.4
  }, // Accessibility Statement
];

const STATIC_PATHS = [
  '/',
  '/about',
  '/contact', 
  '/projects',
  '/privacy-policy',
  '/terms-of-service',
  '/accessibility-statement'
];

/**
 * Generate sitemap URLs for all static routes
 */
export function generateStaticUrls(options: SitemapOptions = {}): SitemapUrl[] {
  const { baseUrl = DEFAULT_BASE_URL, currentDate = new Date() } = options;
  const lastmod = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  return STATIC_PATHS.map((path, index) => ({
    loc: `${baseUrl}${path}`,
    lastmod,
    ...STATIC_ROUTES[index]
  }));
}

/**
 * Generate sitemap URLs for dynamic project pages
 */
export function generateProjectUrls(options: SitemapOptions = {}): SitemapUrl[] {
  const { baseUrl = DEFAULT_BASE_URL, currentDate = new Date() } = options;
  const defaultLastmod = currentDate.toISOString().split('T')[0];

  return projects.map((project) => {
    // Use project's GitHub last updated date if available, otherwise current date
    let lastmod = defaultLastmod;
    if (project.githubStats?.lastUpdated) {
      try {
        const projectDate = new Date(project.githubStats.lastUpdated);
        lastmod = projectDate.toISOString().split('T')[0];
      } catch {
        // If date parsing fails, use default
        lastmod = defaultLastmod;
      }
    }

    return {
      loc: `${baseUrl}/projects/${project.id}`,
      lastmod,
      changefreq: 'monthly' as const,
      priority: 0.8
    };
  });
}

/**
 * Generate complete sitemap URLs including static and dynamic content
 */
export function generateAllSitemapUrls(options: SitemapOptions = {}): SitemapUrl[] {
  const staticUrls = generateStaticUrls(options);
  const projectUrls = generateProjectUrls(options);
  
  return [...staticUrls, ...projectUrls];
}

/**
 * Generate XML sitemap string
 */
export function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Get sitemap index for large sites (future expansion)
 */
export function generateSitemapIndex(sitemapUrls: string[], baseUrl: string = DEFAULT_BASE_URL): string {
  const currentDate = new Date().toISOString();
  
  const sitemapEntries = sitemapUrls.map(url => `
  <sitemap>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}

/**
 * Validate sitemap URL count (search engines typically limit to 50,000 URLs)
 */
export function validateSitemapSize(urls: SitemapUrl[]): { isValid: boolean; count: number; maxCount: number } {
  const maxCount = 50000;
  return {
    isValid: urls.length <= maxCount,
    count: urls.length,
    maxCount
  };
} 