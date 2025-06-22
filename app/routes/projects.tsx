import { MetaFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { ProjectCard } from '~/components/ProjectCard';
import { projects } from '~/data/projects';
import { githubService } from '~/services/github.server';
import { Project } from '~/types/project';

export const meta: MetaFunction = () => {
  return [
    { title: 'Our Projects | Focus Lab' },
    {
      name: 'description',
      content: 'Explore the projects and tools developed by Focus Lab.',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
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

  return json({ projects: projectsWithStats });
}

export default function ProjectsPage() {
  const { projects } = useLoaderData<typeof loader>();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Our Projects</h1>
        <p className="text-lg text-muted-foreground">
          Here are some of the projects we've been working on. From developer tools 
          to business applications, we're building solutions that make a difference.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Empty State (if no projects) */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="mb-2 text-lg font-semibold">No projects found</h3>
          <p className="text-muted-foreground">
            We're working on some exciting projects. Check back soon!
          </p>
        </div>
      )}
    </main>
  );
} 