# Directus Migration Plan for Focus Lab

## Overview
This document outlines the migration strategy for transitioning Focus Lab's project portfolio from static data to a Directus CMS backend.

## Current Architecture
- Static project data in `app/data/projects.ts`
- GitHub API integration for real-time stats
- Remix loaders for data fetching
- TypeScript interfaces for type safety

## Proposed Directus Architecture

### 1. Directus Collections Structure

#### Projects Collection
```typescript
interface DirectusProject {
  id: string;                    // UUID
  title: string;
  slug: string;                  // URL-friendly identifier
  description: string;           // Short description
  long_description: string;      // Rich text field
  status: 'active' | 'coming-soon' | 'archived';
  category: 'tool' | 'library' | 'application' | 'service';
  featured: boolean;
  sort_order: number;
  
  // URLs
  github_url?: string;
  demo_url?: string;
  docs_url?: string;
  
  // Media
  thumbnail?: string;            // Directus file reference
  gallery?: string[];           // Multiple images
  
  // Metadata
  install_command?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  
  // Relations
  technologies: ProjectTechnology[];
  features: ProjectFeature[];
  use_cases: ProjectUseCase[];
  
  // Cached GitHub stats (updated via cron/webhook)
  github_stars?: number;
  github_forks?: number;
  github_last_updated?: string;
  github_language?: string;
  github_open_issues?: number;
}
```

#### Technologies Collection
```typescript
interface Technology {
  id: string;
  name: string;
  slug: string;
  category: 'frontend' | 'backend' | 'database' | 'tool' | 'framework' | 'service';
  icon?: string;                 // Optional icon reference
  color?: string;               // Brand color
}
```

#### Project Features Collection
```typescript
interface ProjectFeature {
  id: string;
  feature: string;
  description?: string;
  sort_order: number;
}
```

### 2. Implementation Steps

#### Phase 1: Setup Directus Instance
1. Deploy Directus (self-hosted or cloud)
2. Configure collections and fields
3. Set up public read permissions
4. Configure CORS for your domain

#### Phase 2: Create Directus SDK Integration
```typescript
// app/lib/directus.ts
import { createDirectus, rest, readItems, readItem } from '@directus/sdk';
import type { DirectusProject, Technology } from '~/types/directus';

interface DirectusSchema {
  projects: DirectusProject[];
  technologies: Technology[];
  // ... other collections
}

const directusUrl = process.env.DIRECTUS_URL || 'https://cms.focuslab.dev';

export const directus = createDirectus<DirectusSchema>(directusUrl)
  .with(rest());

// Helper functions
export async function getProjects(options?: {
  filter?: Record<string, any>;
  sort?: string[];
  limit?: number;
}) {
  return directus.request(
    readItems('projects', {
      fields: [
        '*',
        { 
          technologies: ['id', 'name', 'slug', 'category'],
          features: ['feature', 'description']
        }
      ],
      ...options
    })
  );
}

export async function getProjectBySlug(slug: string) {
  const projects = await directus.request(
    readItems('projects', {
      filter: { slug: { _eq: slug } },
      fields: [
        '*',
        { 
          technologies: ['*'],
          features: ['*'],
          use_cases: ['*']
        }
      ],
      limit: 1
    })
  );
  
  return projects[0] || null;
}
```

#### Phase 3: Update Remix Routes
```typescript
// app/routes/projects.tsx
import { json } from '@remix-run/node';
import { getProjects } from '~/lib/directus';
import { githubService } from '~/services/github.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Build Directus filter from URL params
  const filter: Record<string, any> = {
    status: { _neq: 'archived' }
  };
  
  if (searchParams.get('category')) {
    filter.category = { _eq: searchParams.get('category') };
  }
  
  if (searchParams.get('technology')) {
    filter.technologies = {
      technology_id: {
        slug: { _eq: searchParams.get('technology') }
      }
    };
  }
  
  try {
    const projects = await getProjects({
      filter,
      sort: ['-featured', '-created_at']
    });
    
    // Optionally refresh GitHub stats for featured projects
    const featuredProjects = projects.filter(p => p.featured && p.github_url);
    if (featuredProjects.length > 0) {
      // Update stats asynchronously
      githubService.refreshProjectStats(featuredProjects).catch(console.error);
    }
    
    return json({ projects, success: true });
  } catch (error) {
    console.error('Failed to load projects:', error);
    // Fallback to cached or static data
    return json({ 
      projects: [], 
      success: false,
      error: 'Failed to load projects'
    });
  }
}
```

#### Phase 4: Create Admin Interface
1. Use Directus Studio for content management
2. Create custom interfaces for:
   - Technology multi-select with icons
   - GitHub URL validator
   - Project status workflow

#### Phase 5: Migrate Existing Data
```typescript
// scripts/migrate-to-directus.ts
import { directus } from '../app/lib/directus';
import { createItems } from '@directus/sdk';
import { projects } from '../app/data/projects';

async function migrateProjects() {
  // First, create technologies
  const uniqueTechs = new Set<string>();
  projects.forEach(p => 
    p.technologies.forEach(t => uniqueTechs.add(t.name))
  );
  
  const techMap = new Map();
  for (const techName of uniqueTechs) {
    const tech = await directus.request(
      createItems('technologies', {
        name: techName,
        slug: techName.toLowerCase().replace(/\s+/g, '-'),
        category: 'tool' // You'd want to map these properly
      })
    );
    techMap.set(techName, tech.id);
  }
  
  // Then migrate projects
  for (const project of projects) {
    await directus.request(
      createItems('projects', {
        title: project.title,
        slug: project.id,
        description: project.description,
        long_description: project.longDescription,
        status: project.status,
        category: project.category,
        github_url: project.githubUrl,
        demo_url: project.demoUrl,
        docs_url: project.docsUrl,
        install_command: project.installCommand,
        // Map technologies
        technologies: project.technologies.map(t => ({
          technology_id: techMap.get(t.name)
        })),
        // Map features
        features: project.features.map((f, i) => ({
          feature: f,
          sort_order: i
        }))
      })
    );
  }
}
```

### 3. Additional Considerations

#### Caching Strategy
```typescript
// app/services/cache.server.ts
import { LRUCache } from 'lru-cache';

const projectCache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5 // 5 minutes
});

export async function getCachedProjects() {
  const cacheKey = 'all-projects';
  const cached = projectCache.get(cacheKey);
  
  if (cached) return cached;
  
  const projects = await getProjects();
  projectCache.set(cacheKey, projects);
  
  return projects;
}
```

#### GitHub Stats Sync
```typescript
// app/services/github-sync.server.ts
import { directus } from '~/lib/directus';
import { updateItem } from '@directus/sdk';
import { githubService } from './github.server';

export async function syncGitHubStats(projectId: string, githubUrl: string) {
  const stats = await githubService.getRepositoryStats(githubUrl);
  
  if (stats.success && stats.data) {
    await directus.request(
      updateItem('projects', projectId, {
        github_stars: stats.data.stars,
        github_forks: stats.data.forks,
        github_last_updated: stats.data.lastUpdated,
        github_language: stats.data.language,
        github_open_issues: stats.data.openIssues
      })
    );
  }
}
```

#### Environment Variables
```env
# .env
DIRECTUS_URL=https://cms.focuslab.dev
DIRECTUS_STATIC_TOKEN=your-static-token-for-server-side-requests
```

### 4. Benefits of Migration

1. **Content Management**: Non-technical users can manage projects
2. **Rich Media**: Built-in image optimization and storage
3. **Versioning**: Track content changes over time
4. **Workflows**: Implement review/approval processes
5. **Real-time Updates**: Changes reflect immediately
6. **API-First**: Easy to integrate with other services
7. **Scalability**: Better performance with caching
8. **Flexibility**: Easy to add new fields and relationships

### 5. Migration Timeline

- **Week 1**: Set up Directus instance and collections
- **Week 2**: Implement SDK integration and update routes
- **Week 3**: Migrate existing data and test
- **Week 4**: Deploy and monitor

### 6. Rollback Plan

Keep static data as fallback during transition:
```typescript
export async function loader() {
  try {
    const projects = await getProjects();
    return json({ projects, source: 'directus' });
  } catch (error) {
    // Fallback to static data
    const staticProjects = await import('~/data/projects');
    return json({ 
      projects: staticProjects.projects,
      source: 'static',
      error: 'Using cached data'
    });
  }
}
```