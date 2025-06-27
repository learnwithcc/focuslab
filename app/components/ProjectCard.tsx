import { Link } from '@remix-run/react';
import { ExternalLink, Github, Star, GitFork, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Project } from '~/types/project';
import { useState } from 'react';
import { trackEvent } from '~/utils/posthog';

interface ProjectCardProps {
  project: Project;
  loading?: boolean;
}

export function ProjectCard({ project, loading = false }: ProjectCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleProjectClick = (action: 'github' | 'demo' | 'docs' | 'detail', url?: string) => {
    trackEvent('project_interaction', {
      project_id: project.id,
      project_title: project.title,
      action,
      url,
      category: project.category,
      status: project.status,
      has_github_stats: !!project.githubStats,
      technologies: project.technologies.map(t => t.name).slice(0, 5), // First 5 technologies
      timestamp: Date.now(),
    });
  };

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

  // Format the last updated date more nicely
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
    <div 
      className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:shadow-primary/5 motion-safe:hover:scale-[1.02] motion-reduce:hover:scale-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Loading overlay for the entire card */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading project data...</span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Status and Category Badges */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200 ${statusColors[project.status]} ${isHovered ? 'scale-105' : ''}`}>
            {project.status === 'coming-soon' ? 'Coming Soon' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200 ${categoryColors[project.category]} ${isHovered ? 'scale-105' : ''}`}>
            {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
          </span>
        </div>

        {/* Project Image with Enhanced Loading */}
        {project.imageUrl && (
          <div className="mb-4 aspect-video overflow-hidden rounded-md bg-muted relative">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {imageError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
                <AlertCircle className="h-6 w-6 mb-2" />
                <span className="text-sm">Image failed to load</span>
              </div>
            )}
            <img
              src={project.imageUrl}
              alt={`${project.title} preview`}
              className={`h-full w-full object-cover transition-all duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } ${isHovered ? 'scale-110' : 'scale-100'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Project Title and Description */}
        <div className="mb-4">
          <h3 className="mb-2 text-xl font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 transition-colors duration-200 group-hover:text-foreground/80">
            {project.description}
          </p>
        </div>

        {/* Technologies with hover effect */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {project.technologies.slice(0, 4).map((tech, index) => (
              <span
                key={tech.name}
                className={`inline-flex items-center rounded px-2 py-1 text-xs bg-muted text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary ${
                  isHovered ? 'translate-y-[-1px]' : ''
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {tech.name}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className={`inline-flex items-center rounded px-2 py-1 text-xs bg-muted text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary ${
                isHovered ? 'translate-y-[-1px]' : ''
              }`}>
                +{project.technologies.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* GitHub Stats with Enhanced Display */}
        {project.githubStats && !loading && (
          <div className="mb-4 rounded-md bg-muted/30 p-3 transition-all duration-200 hover:bg-muted/50">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 transition-colors duration-200 hover:text-yellow-600">
                <Star className="h-4 w-4" />
                <span className="font-medium">{project.githubStats.stars.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 transition-colors duration-200 hover:text-blue-600">
                <GitFork className="h-4 w-4" />
                <span className="font-medium">{project.githubStats.forks.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 transition-colors duration-200 hover:text-green-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium text-xs">
                  {formatLastUpdated(project.githubStats.lastUpdated)}
                </span>
              </div>
            </div>
            {project.githubStats.language && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>{project.githubStats.language}</span>
                {project.githubStats.openIssues !== undefined && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{project.githubStats.openIssues} open issues</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Loading State for GitHub Stats */}
        {loading && project.githubUrl && (
          <div className="mb-4 rounded-md bg-muted/30 p-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <div className="h-4 w-8 animate-pulse bg-muted rounded"></div>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-4 w-4" />
                <div className="h-4 w-8 animate-pulse bg-muted rounded"></div>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <div className="h-4 w-20 animate-pulse bg-muted rounded"></div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse bg-muted rounded-full"></div>
              <div className="h-3 w-16 animate-pulse bg-muted rounded"></div>
            </div>
          </div>
        )}

        {/* Action Links with Enhanced Interactions */}
        <div className="flex flex-wrap gap-2">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleProjectClick('github', project.githubUrl)}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleProjectClick('demo', project.demoUrl)}
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <ExternalLink className="h-4 w-4" />
              Demo
            </a>
          )}
          {project.docsUrl && (
            <a
              href={project.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleProjectClick('docs', project.docsUrl)}
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <ExternalLink className="h-4 w-4" />
              Docs
            </a>
          )}
          <Link
            to={`/projects/${project.id}`}
            onClick={() => handleProjectClick('detail', `/projects/${project.id}`)}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
} 