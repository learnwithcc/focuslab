// Sitemap generation utilities for Focus Lab
import { projects } from '~/data/projects';
import { contentService } from '~/services/blog.server';

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
    changefreq: 'daily',
    priority: 0.9
  }, // Blog
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
  '/blog',
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
 * Generate sitemap URLs for blog posts, categories, and tags
 */
export async function generateBlogUrls(options: SitemapOptions = {}): Promise<SitemapUrl[]> {
  const { baseUrl = DEFAULT_BASE_URL } = options;
  
  try {
    const [posts, categories, tags] = await Promise.all([
      contentService.getPostsForSitemap(),
      contentService.getAllCategories(),
      contentService.getAllTags()
    ]);

    const blogUrls: SitemapUrl[] = [];

    // Add individual blog posts
    posts.forEach(post => {
      const lastmod = post.frontmatter.updatedAt || post.frontmatter.publishedAt;
      blogUrls.push({
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: new Date(lastmod).toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.7
      });
    });

    // Add category pages
    categories.forEach(category => {
      blogUrls.push({
        loc: `${baseUrl}/blog?category=${category.slug}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.6
      });
    });

    // Add tag pages (limit to most popular tags to avoid too many URLs)
    tags
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 20) // Limit to top 20 tags
      .forEach(tag => {
        blogUrls.push({
          loc: `${baseUrl}/blog?tag=${tag.slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.5
        });
      });

    return blogUrls;
  } catch (error) {
    console.error('Error generating blog URLs for sitemap:', error);
    return [];
  }
}

/**
 * Generate complete sitemap URLs including static and dynamic content
 */
export async function generateAllSitemapUrls(options: SitemapOptions = {}): Promise<SitemapUrl[]> {
  const staticUrls = generateStaticUrls(options);
  const projectUrls = generateProjectUrls(options);
  const blogUrls = await generateBlogUrls(options);
  
  return [...staticUrls, ...projectUrls, ...blogUrls];
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