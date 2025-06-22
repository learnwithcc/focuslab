// JSON-LD Structured Data Schemas for Focus Lab
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

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Focus Lab',
    description: 'Development consultancy specializing in tools and solutions for neurodivergent developers. Creating accessible, intuitive development environments that work with different thinking styles.',
    url: 'https://focuslab.dev',
    logo: 'https://focuslab.dev/logo-light.png',
    image: 'https://focuslab.dev/logo-light.png',
    sameAs: [
      'https://github.com/focus-lab-ltd',
      'https://twitter.com/focuslab_dev',
      'https://linkedin.com/company/focus-lab-dev'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'hello@focuslab.dev',
      url: 'https://focuslab.dev/contact'
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
    url: 'https://focuslab.dev',
    description: 'Development consultancy creating tools and solutions specifically designed for neurodivergent developers. Specializing in ADHD development tools, accessibility solutions, and inclusive software development.',
    publisher: {
      '@type': 'Organization',
      name: 'Focus Lab',
      logo: {
        '@type': 'ImageObject',
        url: 'https://focuslab.dev/logo-light.png'
      }
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://focuslab.dev/projects?search={search_term_string}',
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
      url: 'https://focuslab.dev'
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
    url: 'https://focuslab.dev/about',
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

export function injectStructuredData(schemas: Array<OrganizationSchema | WebsiteSchema | PersonSchema>): string {
  return schemas.map(schema => 
    `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
  ).join('\n');
}

// Utility function to generate JSON-LD script tags for Remix meta
export function generateStructuredDataMeta(schemas: Array<OrganizationSchema | WebsiteSchema | PersonSchema>) {
  return schemas.map((schema, index) => ({
    tagName: 'script',
    type: 'application/ld+json',
    children: JSON.stringify(schema, null, 2),
    key: `structured-data-${index}`
  }));
} 