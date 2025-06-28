// JSON-LD Structured Data Schemas for Focus Lab
import type { BlogPost } from '~/types/blog';

export interface ArticleSchema {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image?: string[] | undefined;
  datePublished: string;
  dateModified: string;
  author: {
    '@type': string;
    name: string;
    url?: string;
  };
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
      width: number;
      height: number;
    };
  };
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
  articleSection: string;
  keywords: string[];
  wordCount?: number | undefined;
  inLanguage: string;
  url: string;
}

export interface BlogSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  mainEntity: {
    '@type': string;
    name: string;
    description: string;
  };
}

export interface OrganizationSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  logo: string;
  image?: string;
  founder?: PersonSchema | PersonSchema[];
  sameAs: string[];
  contactPoint: {
    '@type': string;
    contactType: string;
    email?: string;
    url?: string;
  };
  address?: {
    '@type': string;
    addressCountry: string;
    addressRegion?: string;
  };
  knowsAbout: string[];
  specialty: string[];
}

export interface WebsiteSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  description: string;
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  potentialAction?: {
    '@type': string;
    target: string;
    'query-input': string;
  };
  about: string[];
  audience: {
    '@type': string;
    audienceType: string[];
  };
}

export interface PersonSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url?: string | undefined;
  image?: string | undefined;
  jobTitle: string;
  worksFor: {
    '@type': string;
    name: string;
    url: string;
  };
  knowsAbout: string[];
  expertise: string[];
  sameAs?: string[] | undefined;
}

export interface BreadcrumbListSchema {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item?: string;
  }>;
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Focus Lab',
    description: 'Development consultancy specializing in tools and solutions for neurodivergent developers. Creating accessible, intuitive development environments that work with different thinking styles.',
    url: 'https://focuslab.io',
    logo: 'https://focuslab.io/logo-light.png',
    image: 'https://focuslab.io/logo-light.png',
    sameAs: [
      'https://github.com/focus-lab-ltd',
      'https://twitter.com/focuslab_dev',
      'https://linkedin.com/company/focus-lab-dev'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: 'https://focuslab.io/contact'
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
      addressRegion: 'England'
    },
    knowsAbout: [
      'Web Development',
      'Accessibility',
      'Neurodivergent Development',
      'ADHD Development Tools',
      'Inclusive Design',
      'Software Development',
      'React',
      'TypeScript',
      'Remix',
      'Node.js'
    ],
    specialty: [
      'Neurodivergent Developer Tools',
      'Accessibility Consulting',
      'ADHD-Friendly Development Environments',
      'Inclusive Software Development',
      'Developer Productivity Tools',
      'Cognitive Load Reduction',
      'Autism-Friendly Interfaces'
    ]
  };
}

export function generateWebsiteSchema(): WebsiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Focus Lab - Neurodivergent Developer Tools',
    url: 'https://focuslab.io',
    description: 'Development consultancy creating tools and solutions specifically designed for neurodivergent developers. Specializing in ADHD development tools, accessibility solutions, and inclusive software development.',
    publisher: {
      '@type': 'Organization',
      name: 'Focus Lab',
      logo: {
        '@type': 'ImageObject',
        url: 'https://focuslab.io/logo-light.png'
      }
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://focuslab.io/projects?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    },
    about: [
      'Neurodivergent Development',
      'ADHD Development Tools',
      'Accessibility Solutions',
      'Inclusive Software Development',
      'Developer Productivity',
      'Web Accessibility',
      'Autism-Friendly Design'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: [
        'Neurodivergent Developers',
        'ADHD Developers',
        'Autistic Developers',
        'Accessibility Advocates',
        'Inclusive Design Practitioners',
        'Software Engineers',
        'Development Teams'
      ]
    }
  };
}

export function generatePersonSchema(options: {
  name: string;
  description: string;
  jobTitle: string;
  expertise: string[];
  url?: string;
  image?: string;
  sameAs?: string[];
}): PersonSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: options.name,
    description: options.description,
    url: options.url,
    image: options.image,
    jobTitle: options.jobTitle,
    worksFor: {
      '@type': 'Organization',
      name: 'Focus Lab',
              url: 'https://focuslab.io'
    },
    knowsAbout: [
      'Web Development',
      'Accessibility',
      'Neurodivergent Development',
      'ADHD Development Tools',
      'Inclusive Design',
      'React',
      'TypeScript',
      'Node.js',
      'Software Architecture',
      'Developer Experience'
    ],
    expertise: options.expertise,
    sameAs: options.sameAs
  };
}

export function generateFounderSchema(): PersonSchema {
  return generatePersonSchema({
    name: 'Focus Lab Founder',
    description: 'Neurodivergent developer and founder of Focus Lab, specializing in creating development tools that work with different thinking styles. Passionate about accessibility, inclusive design, and empowering neurodivergent developers.',
    jobTitle: 'Founder & Lead Developer',
    url: 'https://focuslab.io/about',
    expertise: [
      'Neurodivergent Development Environments',
      'ADHD-Friendly Tool Design',
      'Accessibility Engineering',
      'Inclusive Software Architecture',
      'Developer Productivity Optimization',
      'Cognitive Load Reduction',
      'Autism-Friendly Interface Design',
      'Mental Health in Tech'
    ],
    sameAs: [
      'https://github.com/focus-lab-ltd',
      'https://twitter.com/focuslab_dev'
    ]
  });
}

export interface BreadcrumbItem {
  name: string;
  path: string;
  isCurrentPage?: boolean;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.isCurrentPage ? {} : { item: `https://focuslab.io${item.path}` })
    }))
  };
}

export function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [
    { name: 'Home', path: '/' }
  ];

  let currentPath = '';
  
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const isCurrentPage = i === segments.length - 1;
    
    // Generate human-readable names for common routes
    let name = segments[i];
    switch (segments[i]) {
      case 'about':
        name = 'About Us';
        break;
      case 'contact':
        name = 'Contact';
        break;
      case 'projects':
        name = 'Projects';
        break;
      case 'privacy-policy':
        name = 'Privacy Policy';
        break;
      case 'terms-of-service':
        name = 'Terms of Service';
        break;
      case 'accessibility-statement':
        name = 'Accessibility Statement';
        break;
      default:
        // For dynamic segments like project IDs, capitalize and format
        name = segments[i].split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    items.push({
      name,
      path: currentPath,
      isCurrentPage
    });
  }

  return items;
}

export function injectStructuredData(schemas: Array<OrganizationSchema | WebsiteSchema | PersonSchema | BreadcrumbListSchema>): string {
  return schemas.map(schema => 
    `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
  ).join('\n');
}

// Utility function to generate JSON-LD script tags for Remix meta
export function generateStructuredDataMeta(schemas: Array<OrganizationSchema | WebsiteSchema | PersonSchema | BreadcrumbListSchema | ArticleSchema | BlogSchema>) {
  return schemas.map((schema, index) => ({
    tagName: 'script',
    type: 'application/ld+json',
    children: JSON.stringify(schema, null, 2),
    key: `structured-data-${index}`
  }));
}

/**
 * Generate Article structured data for individual blog posts
 */
export function generateArticleSchema(post: BlogPost, baseUrl: string = 'https://focuslab.io'): ArticleSchema {
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  
  const images: string[] = [];
  if (post.frontmatter.image) {
    // Ensure image URLs are absolute
    const imageUrl = post.frontmatter.image.startsWith('http') 
      ? post.frontmatter.image 
      : `${baseUrl}${post.frontmatter.image}`;
    images.push(imageUrl);
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    image: images.length > 0 ? images : undefined,
    datePublished: new Date(post.frontmatter.publishedAt).toISOString(),
    dateModified: new Date(post.frontmatter.updatedAt || post.frontmatter.publishedAt).toISOString(),
    author: {
      '@type': 'Person',
      name: post.frontmatter.author,
      url: `${baseUrl}/about`
    },
    publisher: {
      '@type': 'Organization',
      name: 'Focus Lab',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo-light.png`,
        width: 144,
        height: 144
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl
    },
    articleSection: post.frontmatter.category,
    keywords: post.frontmatter.tags,
    wordCount: post.readingTime?.words,
    inLanguage: 'en-US',
    url: postUrl
  };
}

/**
 * Generate Blog structured data for blog listing pages
 */
export function generateBlogSchema(baseUrl: string = 'https://focuslab.io'): BlogSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Focus Lab Blog',
    description: 'Insights, tutorials, and resources about building accessible, neurodivergent-friendly development tools and inclusive technology.',
    url: `${baseUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'Focus Lab',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo-light.png`
      }
    },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Blog Posts',
      description: 'Latest articles from Focus Lab'
    }
  };
}

/**
 * Update breadcrumb items generation to handle blog routes
 */
export function getBlogBreadcrumbItems(pathname: string, postTitle?: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [
    { name: 'Home', path: '/' }
  ];

  let currentPath = '';
  
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const isCurrentPage = i === segments.length - 1;
    
    // Generate human-readable names for routes
    let name = segments[i];
    switch (segments[i]) {
      case 'blog':
        name = isCurrentPage ? 'Blog' : 'Blog';
        break;
      default:
        // For blog post slugs, use the post title if provided
        if (i === segments.length - 1 && segments[0] === 'blog' && postTitle) {
          name = postTitle;
        } else {
          // Capitalize and format slug
          name = segments[i].split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
    }
    
    items.push({
      name,
      path: currentPath,
      isCurrentPage
    });
  }

  return items;
} 