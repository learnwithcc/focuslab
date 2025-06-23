import type { MetaDescriptor } from '@remix-run/node';
import { 
  generateOrganizationSchema, 
  generateWebsiteSchema, 
  generateFounderSchema,
  generateBreadcrumbSchema,
  getBreadcrumbItems,
  generateStructuredDataMeta,
  type OrganizationSchema,
  type WebsiteSchema,
  type PersonSchema,
  type BreadcrumbListSchema
} from './structured-data';

export interface SEOMetaOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  siteName?: string;
  locale?: string;
  noIndex?: boolean;
  canonical?: string;
  includeOrganizationSchema?: boolean;
  includeWebsiteSchema?: boolean;
  includePersonSchema?: boolean;
  includeBreadcrumbSchema?: boolean;
  pathname?: string; // For breadcrumb generation
  customSchemas?: Array<OrganizationSchema | WebsiteSchema | PersonSchema | BreadcrumbListSchema>;
}

export const DEFAULT_SEO = {
  siteName: 'Focus Lab',
  title: 'Focus Lab - Neurodivergent Developer Tools & Accessibility Solutions',
  description: 'Focus Lab creates innovative tools and solutions designed specifically for neurodivergent developers. Specializing in ADHD development tools, accessibility solutions, and inclusive software development.',
  keywords: [
    'neurodivergent developers',
    'ADHD development tools',
    'accessibility tools',
    'inclusive software development',
    'developer productivity',
    'focus tools',
    'software accessibility',
    'developer mental health'
  ],
  image: '/logo-light.png',
  locale: 'en-US',
  type: 'website' as const,
} as const;

/**
 * Normalize URL by ensuring consistent trailing slash behavior
 */
export function normalizeUrl(url: string, addTrailingSlash: boolean = false): string {
  try {
    const urlObj = new URL(url);
    
    // Remove trailing slash except for root
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    // Add trailing slash if requested (for specific routes)
    if (addTrailingSlash && urlObj.pathname !== '/' && !urlObj.pathname.endsWith('/')) {
      urlObj.pathname += '/';
    }
    
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Generate canonical URL with proper normalization
 */
export function generateCanonicalUrl(baseUrl: string, pathname: string): string {
  const fullUrl = new URL(pathname, baseUrl).toString();
  return normalizeUrl(fullUrl, false); // No trailing slashes for canonical URLs
}

/**
 * Check if URL needs redirect for trailing slash consistency
 */
export function shouldRedirectForTrailingSlash(pathname: string): string | null {
  // Only redirect if path has trailing slash and is not root
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return null;
}

/**
 * Validate URL structure and suggest improvements
 */
export function validateUrlStructure(url: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  try {
    const urlObj = new URL(url);
    
    // Check for double slashes
    if (urlObj.pathname.includes('//')) {
      issues.push('URL contains double slashes');
      suggestions.push('Remove double slashes from URL path');
    }
    
    // Check for uppercase characters
    if (urlObj.pathname !== urlObj.pathname.toLowerCase()) {
      issues.push('URL contains uppercase characters');
      suggestions.push('Use lowercase characters in URL paths');
    }
    
    // Check for special characters that should be encoded
    const invalidChars = /[^a-z0-9\-._~:/?#[\]@!$&'()*+,;=%]/i;
    if (invalidChars.test(urlObj.pathname)) {
      issues.push('URL contains invalid characters');
      suggestions.push('Encode special characters or use hyphens instead');
    }
    
    // Check for trailing slash consistency (warn but don't mark invalid)
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      suggestions.push('Consider removing trailing slash for consistency');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  } catch {
    return {
      isValid: false,
      issues: ['Invalid URL format'],
      suggestions: ['Ensure URL is properly formatted']
    };
  }
}

export function generateMeta(options: SEOMetaOptions = {}): MetaDescriptor[] {
  const {
    title = DEFAULT_SEO.title,
    description = DEFAULT_SEO.description,
    keywords = DEFAULT_SEO.keywords,
    image = DEFAULT_SEO.image,
    url,
    type = DEFAULT_SEO.type,
    siteName = DEFAULT_SEO.siteName,
    locale = DEFAULT_SEO.locale,
    noIndex = false,
    canonical,
    includeOrganizationSchema = false,
    includeWebsiteSchema = false,
    includePersonSchema = false,
    includeBreadcrumbSchema = false,
    pathname,
    customSchemas = [],
  } = options;

  const fullTitle = title === DEFAULT_SEO.title ? title : `${title} | ${siteName}`;
  const fullImageUrl = image.startsWith('http') ? image : `https://focuslab.dev${image}`;
  const keywordString = keywords.join(', ');

  const meta: MetaDescriptor[] = [
    { title: fullTitle },
    { name: 'description', content: description },
    { name: 'keywords', content: keywordString },
    { name: 'author', content: 'Focus Lab' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#000000' },
    { name: 'robots', content: noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
    { name: 'googlebot', content: noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
    
    // Open Graph tags
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:type', content: type },
    { property: 'og:image', content: fullImageUrl },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: locale },
    
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: fullImageUrl },
    { name: 'twitter:creator', content: '@focuslab_dev' },
    { name: 'twitter:site', content: '@focuslab_dev' },
  ];

  // Add URL if provided
  if (url) {
    meta.push({ property: 'og:url', content: url });
  }

  // Add canonical URL if provided
  if (canonical) {
    meta.push({ tagName: 'link', rel: 'canonical', href: canonical });
  }

  // Add structured data schemas
  const schemas: Array<OrganizationSchema | WebsiteSchema | PersonSchema | BreadcrumbListSchema> = [];
  
  if (includeOrganizationSchema) {
    schemas.push(generateOrganizationSchema());
  }
  
  if (includeWebsiteSchema) {
    schemas.push(generateWebsiteSchema());
  }
  
  if (includePersonSchema) {
    schemas.push(generateFounderSchema());
  }
  
  if (includeBreadcrumbSchema && pathname) {
    const breadcrumbItems = getBreadcrumbItems(pathname);
    schemas.push(generateBreadcrumbSchema(breadcrumbItems));
  }
  
  // Add any custom schemas
  if (customSchemas.length > 0) {
    schemas.push(...customSchemas);
  }
  
  // Note: Structured data (JSON-LD) should be added as script tags directly in the HTML,
  // not through Remix meta function which only supports 'meta' and 'link' tags

  return meta;
}

export function generatePageUrl(path: string, baseUrl = 'https://focuslab.dev'): string {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function generateBreadcrumbKeywords(routePath: string): string[] {
  const pathSegments = routePath.split('/').filter(Boolean);
  const breadcrumbKeywords: string[] = [];

  pathSegments.forEach(segment => {
    switch (segment) {
      case 'projects':
        breadcrumbKeywords.push('developer tools', 'open source projects', 'software development');
        break;
      case 'about':
        breadcrumbKeywords.push('neurodivergent developer', 'team information', 'company background');
        break;
      case 'contact':
        breadcrumbKeywords.push('contact developer', 'get in touch', 'support');
        break;
      case 'accessibility-statement':
        breadcrumbKeywords.push('accessibility commitment', 'inclusive design', 'ADHD friendly');
        break;
      default:
        break;
    }
  });

  return breadcrumbKeywords;
} 