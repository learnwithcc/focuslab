import { Project, ProjectFilters, ProjectSortOption } from '~/types/project';

export const projects: Project[] = [
  {
    id: 'formflex',
    title: 'FormFlex',
    description: 'A flexible, type-safe form builder for React applications with built-in validation, accessibility, and theming support.',
    longDescription: 'FormFlex is a comprehensive form building solution that combines the flexibility of dynamic form generation with the safety of TypeScript. It provides a declarative API for creating complex forms with advanced validation, accessibility features, and customizable themes.',
    status: 'coming-soon',
    category: 'library',
    technologies: [
      { name: 'React', category: 'frontend' },
      { name: 'TypeScript', category: 'frontend' },
      { name: 'Zod', category: 'tool' },
      { name: 'Tailwind CSS', category: 'frontend' },
    ],
    features: [
      'Type-safe form definitions',
      'Built-in validation with Zod integration',
      'Accessibility-first design',
      'Customizable themes and components',
      'Multi-step form support',
      'Real-time validation and error handling',
    ],
    useCases: [
      'Dynamic survey and questionnaire forms',
      'Multi-step onboarding flows',
      'Configuration and settings panels',
      'Data collection and lead generation forms',
    ],
  },
  {
    id: 'leadwave',
    title: 'LeadWave',
    description: 'An intelligent lead scoring and nurturing platform that uses AI to analyze prospect behavior and optimize conversion funnels.',
    longDescription: 'LeadWave combines advanced analytics with AI-powered insights to help businesses identify, score, and nurture leads more effectively. The platform provides real-time lead scoring, automated nurturing campaigns, and detailed conversion analytics.',
    status: 'coming-soon',
    category: 'application',
    technologies: [
      { name: 'Next.js', category: 'frontend' },
      { name: 'PostgreSQL', category: 'database' },
      { name: 'Prisma', category: 'backend' },
      { name: 'OpenAI', category: 'tool' },
      { name: 'Stripe', category: 'service' },
    ],
    features: [
      'AI-powered lead scoring algorithms',
      'Automated email nurturing campaigns',
      'Real-time behavior tracking',
      'Conversion funnel analytics',
      'CRM integrations',
      'A/B testing for campaigns',
    ],
    useCases: [
      'B2B lead qualification and scoring',
      'Automated sales funnel optimization',
      'Customer journey mapping and analysis',
      'Marketing campaign performance tracking',
    ],
  },
  {
    id: 'airschema',
    title: 'AirSchema',
    description: 'A cloud-native schema registry and data validation service that ensures data consistency across distributed systems.',
    longDescription: 'AirSchema provides a centralized schema registry for managing data schemas across microservices and distributed systems. It offers schema evolution, validation, and compatibility checking to ensure data consistency and reliability.',
    status: 'coming-soon',
    category: 'service',
    technologies: [
      { name: 'Go', category: 'backend' },
      { name: 'Redis', category: 'database' },
      { name: 'Apache Kafka', category: 'backend' },
      { name: 'Docker', category: 'tool' },
      { name: 'Kubernetes', category: 'tool' },
    ],
    features: [
      'Centralized schema management',
      'Schema evolution and versioning',
      'Real-time validation and compatibility checking',
      'Multi-format support (JSON Schema, Avro, Protobuf)',
      'High availability and scalability',
      'Integration with popular streaming platforms',
    ],
    useCases: [
      'Microservices data contract management',
      'Event streaming schema governance',
      'API schema validation and evolution',
      'Data pipeline consistency enforcement',
    ],
  },
];

export function getProjectById(id: string): Project | undefined {
  return projects.find(project => project.id === id);
}

export function getProjectsByCategory(category: string): Project[] {
  return projects.filter(project => project.category === category);
}

export function getProjectsByStatus(status: string): Project[] {
  return projects.filter(project => project.status === status);
}

// Filter projects based on search criteria
export function filterProjects(projects: Project[], filters: ProjectFilters): Project[] {
  return projects.filter(project => {
    // Search filter (searches in title, description, and technologies)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableText = [
        project.title,
        project.description,
        project.longDescription || '',
        ...project.technologies.map(t => t.name),
        ...project.features,
        ...project.useCases,
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    // Category filter
    if (filters.category && project.category !== filters.category) {
      return false;
    }

    // Status filter
    if (filters.status && project.status !== filters.status) {
      return false;
    }

    // Technology filter
    if (filters.technology) {
      const hasTechnology = project.technologies.some(
        tech => tech.name === filters.technology
      );
      if (!hasTechnology) {
        return false;
      }
    }

    return true;
  });
}

// Sort projects based on criteria
export function sortProjects(projects: Project[], sort: ProjectSortOption): Project[] {
  return [...projects].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'lastUpdated':
        const aDate = a.githubStats?.lastUpdated ? new Date(a.githubStats.lastUpdated) : new Date(0);
        const bDate = b.githubStats?.lastUpdated ? new Date(b.githubStats.lastUpdated) : new Date(0);
        comparison = aDate.getTime() - bDate.getTime();
        break;
      case 'stars':
        const aStars = a.githubStats?.stars || 0;
        const bStars = b.githubStats?.stars || 0;
        comparison = aStars - bStars;
        break;
    }

    return sort.direction === 'desc' ? -comparison : comparison;
  });
}

// Combined filter and sort function
export function filterAndSortProjects(
  projects: Project[], 
  filters: ProjectFilters, 
  sort?: ProjectSortOption
): Project[] {
  let result = filterProjects(projects, filters);
  
  if (sort) {
    result = sortProjects(result, sort);
  }
  
  return result;
} 