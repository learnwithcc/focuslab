import { MetaFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigation } from '@remix-run/react';
import { ProjectCard } from '~/components/ProjectCard';
import { projects } from '~/data/projects';
import { githubService } from '~/services/github.server';
import { Project } from '~/types/project';
import { AlertCircle, Loader2 } from 'lucide-react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Our Projects | Focus Lab' },
    {
      name: 'description',
      content: 'Explore the projects and tools developed by Focus Lab. From developer tools to business applications, we\'re building solutions that make a difference.',
    },
  ];
};

type LoaderData = {
  projects: Project[];
  success: true;
  timestamp: string;
} | {
  projects: Project[];
  success: false;
  error: string;
  timestamp: string;
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  try {
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

    return json<LoaderData>({ 
      projects: projectsWithStats,
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    
    // Return projects without GitHub stats if there's an error
    return json<LoaderData>({ 
      projects: projects,
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
  const isLoading = navigation.state === 'loading';

  // Show error state if GitHub data failed to load
  const hasGitHubError = !data.success && 'error' in data;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Our Projects</h1>
        <p className="text-lg text-muted-foreground">
          Here are some of the projects we've been working on. From developer tools 
          to business applications, we're building solutions that make a difference.
        </p>
        
        {/* GitHub API Status */}
        {hasGitHubError && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">GitHub data temporarily unavailable</p>
              <p className="text-xs opacity-90">Projects are shown without live statistics. {!data.success ? data.error : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
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

      {/* Empty State (if no projects) */}
      {!isLoading && data.projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="mb-2 text-lg font-semibold">No projects found</h3>
          <p className="text-muted-foreground">
            We're working on some exciting projects. Check back soon!
          </p>
        </div>
      )}

      {/* Data freshness indicator */}
      {!isLoading && data.timestamp && (
        <div className="mt-8 text-center text-xs text-muted-foreground">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      )}
    </main>
  );
} 