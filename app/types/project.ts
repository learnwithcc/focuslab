export interface GitHubStats {
  stars: number;
  forks: number;
  lastUpdated: string;
  language?: string;
  openIssues?: number;
}

export interface ProjectTech {
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'tool' | 'framework' | 'service';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  status: 'active' | 'coming-soon' | 'archived';
  category: 'tool' | 'library' | 'application' | 'service';
  githubUrl?: string;
  demoUrl?: string;
  docsUrl?: string;
  imageUrl?: string;
  technologies: ProjectTech[];
  features: string[];
  githubStats?: GitHubStats;
  installCommand?: string;
  useCases: string[];
}

export interface ProjectFilters {
  category?: string;
  status?: string;
  technology?: string;
  search?: string;
}

export interface ProjectSortOption {
  field: 'title' | 'lastUpdated' | 'stars';
  direction: 'asc' | 'desc';
} 