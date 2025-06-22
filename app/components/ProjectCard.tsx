import { Link } from '@remix-run/react';
import { ExternalLink, Github, Star, GitFork, Clock } from 'lucide-react';
import { Project } from '~/types/project';

interface ProjectCardProps {
  project: Project;
  loading?: boolean;
}

export function ProjectCard({ project, loading = false }: ProjectCardProps) {
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

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md motion-safe:hover:scale-[1.02] motion-reduce:hover:scale-100">
      {/* Status and Category Badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[project.status]}`}>
          {project.status === 'coming-soon' ? 'Coming Soon' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[project.category]}`}>
          {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
        </span>
      </div>

      {/* Project Image */}
      {project.imageUrl && (
        <div className="mb-4 aspect-video overflow-hidden rounded-md bg-muted">
          <img
            src={project.imageUrl}
            alt={`${project.title} preview`}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      {/* Project Title and Description */}
      <div className="mb-4">
        <h3 className="mb-2 text-xl font-semibold text-foreground">{project.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
      </div>

      {/* Technologies */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {project.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech.name}
              className="inline-flex items-center rounded px-2 py-1 text-xs bg-muted text-muted-foreground"
            >
              {tech.name}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className="inline-flex items-center rounded px-2 py-1 text-xs bg-muted text-muted-foreground">
              +{project.technologies.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* GitHub Stats */}
      {project.githubStats && !loading && (
        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>{project.githubStats.stars.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-4 w-4" />
            <span>{project.githubStats.forks.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{new Date(project.githubStats.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* Loading State for GitHub Stats */}
      {loading && project.githubUrl && (
        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
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
            <div className="h-4 w-16 animate-pulse bg-muted rounded"></div>
          </div>
        </div>
      )}

      {/* Action Links */}
      <div className="flex flex-wrap gap-2">
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
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
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Docs
          </a>
        )}
        <Link
          to={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
} 