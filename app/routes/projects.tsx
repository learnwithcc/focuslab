import { MetaFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigation, useSearchParams, useLocation } from '@remix-run/react';
import { Section, Container } from "~/components/Layout";
import { ProjectCard } from '~/components/ProjectCard';
import { ProjectFilters } from '~/components/ProjectFilters';
import { Breadcrumb } from '~/components';
import { projects, filterAndSortProjects } from '~/data/projects';
import { githubService } from '~/services/github.server';
import { Project, ProjectFilters as ProjectFiltersType, ProjectSortOption } from '~/types/project';
import { generateMeta, generatePageUrl, generateBreadcrumbKeywords, DEFAULT_SEO } from '~/utils/seo';
import { getBreadcrumbItems } from '~/utils/structured-data';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export const meta: MetaFunction = () => {
  const breadcrumbKeywords = generateBreadcrumbKeywords('/projects');
  
  return generateMeta({
    title: 'Developer Tools & Projects Portfolio',
    description: 'Explore neurodivergent-friendly developer tools and accessibility projects by Focus Lab. Open source tools, ADHD development solutions, and innovative software.',
    keywords: [
      ...DEFAULT_SEO.keywords,
      ...breadcrumbKeywords,
      'portfolio',
      'Task Master AI',
      'Directus MCP Server',
      'development tools showcase'
    ],
    url: generatePageUrl('/projects'),
    canonical: 'https://focuslab.io/projects',
    includeOrganizationSchema: true,
    includeBreadcrumbSchema: true,
    pathname: '/projects',
  });
};

type LoaderData = {
  projects: Project[];
  allProjects: Project[];
  filters: ProjectFiltersType;
  sort: ProjectSortOption;
  success: true;
  timestamp: string;
} | {
  projects: Project[];
  allProjects: Project[];
  filters: ProjectFiltersType;
  sort: ProjectSortOption;
  success: false;
  error: string;
  timestamp: string;
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  try {
    // Parse URL parameters for filtering
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const filters: ProjectFiltersType = {};
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const technology = searchParams.get('technology');
    
    if (search) filters.search = search;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (technology) filters.technology = technology;
    
    const sort: ProjectSortOption = {
      field: (searchParams.get('sortField') as 'title' | 'lastUpdated' | 'stars') || 'title',
      direction: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc',
    };

    // Get all GitHub URLs from projects
    const githubUrls = projects
      .filter(project => project.githubUrl)
      .map(project => project.githubUrl!);

    // Fetch GitHub stats for all projects
    const githubStats = await githubService.getMultipleRepositoryStats(githubUrls);

    // Merge GitHub stats with project data
    const projectsWithStats: Project[] = projects.map(project => {
      if (project.githubUrl && githubStats[project.githubUrl]) {
        return {
          ...project,
          githubStats: githubStats[project.githubUrl]!,
        };
      }
      return project;
    });

    // Apply filtering and sorting
    const filteredAndSortedProjects = filterAndSortProjects(projectsWithStats, filters, sort);

    return json<LoaderData>({ 
      projects: filteredAndSortedProjects,
      allProjects: projectsWithStats, // Keep all projects for filter options
      filters,
      sort,
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    
    // Return projects without GitHub stats if there's an error
    return json<LoaderData>({ 
      projects: projects,
      allProjects: projects,
      filters: {},
      sort: { field: 'title', direction: 'asc' },
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load GitHub data',
      timestamp: new Date().toISOString()
    });
  }
}

// Loading skeleton component
function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm">
      {/* Badges skeleton */}
      <div className="mb-4 flex gap-2">
        <div className="h-5 w-16 animate-pulse bg-muted rounded-full"></div>
        <div className="h-5 w-12 animate-pulse bg-muted rounded-full"></div>
      </div>
      
      {/* Image skeleton */}
      <div className="mb-4 aspect-video animate-pulse bg-muted rounded-md"></div>
      
      {/* Title and description skeleton */}
      <div className="mb-4">
        <div className="mb-2 h-6 w-3/4 animate-pulse bg-muted rounded"></div>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse bg-muted rounded"></div>
          <div className="h-4 w-5/6 animate-pulse bg-muted rounded"></div>
          <div className="h-4 w-4/6 animate-pulse bg-muted rounded"></div>
        </div>
      </div>
      
      {/* Technologies skeleton */}
      <div className="mb-4 flex gap-1">
        <div className="h-6 w-16 animate-pulse bg-muted rounded"></div>
        <div className="h-6 w-12 animate-pulse bg-muted rounded"></div>
        <div className="h-6 w-20 animate-pulse bg-muted rounded"></div>
      </div>
      
      {/* GitHub stats skeleton */}
      <div className="mb-4 rounded-md bg-muted/30 p-3">
        <div className="flex gap-4">
          <div className="h-4 w-8 animate-pulse bg-muted rounded"></div>
          <div className="h-4 w-8 animate-pulse bg-muted rounded"></div>
          <div className="h-4 w-20 animate-pulse bg-muted rounded"></div>
        </div>
      </div>
      
      {/* Action buttons skeleton */}
      <div className="flex gap-2">
        <div className="h-9 w-20 animate-pulse bg-muted rounded-md"></div>
        <div className="h-9 w-24 animate-pulse bg-muted rounded-md"></div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const data = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const location = useLocation();
  const isLoading = navigation.state === 'loading';
  const breadcrumbItems = getBreadcrumbItems(location.pathname);

  // Show error state if GitHub data failed to load
  const hasGitHubError = !data.success && 'error' in data;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="w-full">
        {/* Hero Section */}
        <div className="w-full bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
          <Section spacing="lg">
            <Container maxWidth="7xl">
              <Breadcrumb items={breadcrumbItems} className="mb-8" />
              <div className="text-center">
                <h1 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                  Our Projects
                </h1>
                <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
                  Here are some of the projects we've been working on. From developer tools 
                  to business applications, we're building solutions that make a difference.
                </p>
                
                {/* GitHub API Status */}
                {hasGitHubError && (
                  <div className="mt-6 flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 max-w-2xl mx-auto">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">GitHub data temporarily unavailable</p>
                      <p className="text-xs opacity-90">Projects are shown without live statistics. {!data.success ? data.error : ''}</p>
                    </div>
                  </div>
                )}
              </div>
            </Container>
          </Section>
        </div>

        {/* Projects Content Section */}
        <div className="w-full bg-white dark:bg-gray-900">
          <Section spacing="lg">
            <Container maxWidth="7xl">
              {/* Project Filters */}
              <div className="mb-8">
                <ProjectFilters projects={data.allProjects} />
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <ProjectCardSkeleton key={index} />
                  ))}
                </div>
              )}

              {/* Results Summary */}
              {!isLoading && (
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {data.projects.length} of {data.allProjects.length} projects
                  </p>
                </div>
              )}

              {/* Projects Grid */}
              {!isLoading && (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {data.projects.map((project: Project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      loading={false}
                    />
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isLoading && data.projects.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No projects found matching your criteria.
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                    Try adjusting your filters or search terms.
                  </p>
                </div>
              )}
            </Container>
          </Section>
        </div>
      </main>
    </div>
  );
} 