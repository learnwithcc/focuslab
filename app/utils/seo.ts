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

  // Add robots meta if noIndex is true
  if (noIndex) {
    meta.push({ name: 'robots', content: 'noindex, nofollow' });
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
  
  // Generate structured data meta tags
  if (schemas.length > 0) {
    meta.push(...generateStructuredDataMeta(schemas));
  }

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