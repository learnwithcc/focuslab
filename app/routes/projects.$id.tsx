import { MetaFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { projects } from '~/data/projects';
import { githubService } from '~/services/github.server';
import { Project } from '~/types/project';
import { generateMeta, generatePageUrl, DEFAULT_SEO } from '~/utils/seo';

import { Section, Container } from "~/components/Layout";
import { ArrowLeft, ExternalLink, Github, Star, GitFork, Clock, AlertCircle } from 'lucide-react';

type LoaderData = {
  project: Project;
  success: boolean;
  error?: string;
};

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  if (!data?.project) {
    return generateMeta({
      title: 'Project Not Found',
      description: 'The requested project could not be found. Explore our other neurodivergent developer tools and accessibility projects.',
      noIndex: true,
    });
  }

  const project = data.project;
  const projectKeywords = [
    ...DEFAULT_SEO.keywords,
    'project details',
    'technical documentation',
    ...project.technologies.map((tech: { name: string }) => tech.name.toLowerCase()),
    project.category,
    project.status,
  ];

  return generateMeta({
    title: `${project.title} - Developer Tool`,
    description: `${project.description} Built with ${project.technologies.map((t: { name: string }) => t.name).join(', ')}. A ${project.category} project focused on neurodivergent developer accessibility.`,
    keywords: projectKeywords,
    url: generatePageUrl(`/projects/${project.id}`),
    canonical: `https://focuslab.io/projects/${project.id}`,
    image: project.imageUrl || DEFAULT_SEO.image,
    type: 'article',
    includeBreadcrumbSchema: true,
    pathname: `/projects/${params['id']}`,
  });
};

export async function loader({ params }: LoaderFunctionArgs): Promise<Response> {
  const projectId = params['id'];
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    throw new Response('Project not found', { status: 404 });
  }

  try {
    // Fetch GitHub stats if available
    if (project.githubUrl) {
      const result = await githubService.getRepositoryStats(project.githubUrl);
      if (result.success) {
        const projectWithStats: Project = {
          ...project,
          githubStats: result.data,
        };
        return json<LoaderData>({ project: projectWithStats, success: true });
      } else {
        return json<LoaderData>({ 
          project, 
          success: false, 
          error: result.error 
        });
      }
    }

    return json<LoaderData>({ project, success: true });
  } catch (error) {
    console.error('Error loading project:', error);
    return json<LoaderData>({ 
      project, 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load project data'
    });
  }
}

export const handle = {
  breadcrumb: (data: LoaderData) => {
    if (!data?.project) return [];
    return [
      { name: 'Home', path: '/' },
      { name: 'Projects', path: '/projects' },
      { name: data.project.title, path: `/projects/${data.project.id}`, isCurrentPage: true }
    ];
  }
};

export default function ProjectPage() {
  const { project, success, error } = useLoaderData<LoaderData>();

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'coming-soon': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  const categoryColors = {
    tool: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    library: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    application: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    service: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    if (diffDays < 30) return `Updated ${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `Updated ${Math.ceil(diffDays / 30)} months ago`;
    return `Updated ${Math.ceil(diffDays / 365)} years ago`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Main Content Section */}
        <Section spacing="lg">
          <Container maxWidth="7xl">
            {/* Back Navigation */}
            <Link 
              to="/projects" 
              className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Header */}
                <div className="mb-6">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[project.status]}`}>
                      {project.status === 'coming-soon' ? 'Coming Soon' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[project.category]}`}>
                      {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                    </span>
                  </div>
                  
                  <h1 className="mb-4 text-4xl font-bold">{project.title}</h1>
                  <p className="text-xl text-muted-foreground">{project.description}</p>
                </div>

                {/* Project Image */}
                {project.imageUrl && (
                  <div className="mb-8 aspect-video overflow-hidden rounded-lg bg-muted">
                    <img
                      src={project.imageUrl}
                      alt={`${project.title} preview`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Long Description or Details */}
                <div className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold">About This Project</h2>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p>
                      This project demonstrates our commitment to building high-quality solutions 
                      that address real-world problems. We focus on creating tools and applications 
                      that are both powerful and user-friendly.
                    </p>
                    <p>
                      Built with modern technologies and best practices, this project showcases 
                      our expertise in software development and our dedication to delivering 
                      exceptional user experiences.
                    </p>
                  </div>
                </div>

                {/* Technologies */}
                <div className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold">Technologies Used</h2>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech.name}
                        className="inline-flex items-center rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium"
                      >
                        {tech.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                  {/* GitHub Stats */}
                  {project.githubStats && success && (
                    <div className="rounded-lg border border-border bg-card p-6">
                      <h3 className="mb-4 text-lg font-semibold">Repository Stats</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">Stars</span>
                          </div>
                          <span className="font-medium">{project.githubStats.stars.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GitFork className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Forks</span>
                          </div>
                          <span className="font-medium">{project.githubStats.forks.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Last Updated</span>
                          </div>
                          <span className="text-sm">{formatLastUpdated(project.githubStats.lastUpdated)}</span>
                        </div>
                        {project.githubStats.language && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Primary Language</span>
                            <span className="font-medium">{project.githubStats.language}</span>
                          </div>
                        )}
                        {project.githubStats.openIssues !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Open Issues</span>
                            <span className="font-medium">{project.githubStats.openIssues}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* GitHub Error */}
                  {!success && error && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                      <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">GitHub data unavailable</span>
                      </div>
                      <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">{error}</p>
                    </div>
                  )}

                  {/* Action Links */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
                    <div className="space-y-2">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          <Github className="h-4 w-4" />
                          View on GitHub
                        </a>
                      )}
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Live Demo
                        </a>
                      )}
                      {project.docsUrl && (
                        <a
                          href={project.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Documentation
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </Section>
    </div>
  );
} 