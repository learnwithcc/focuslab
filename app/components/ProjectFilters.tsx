import { useSearchParams } from '@remix-run/react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Project, ProjectFilters as ProjectFiltersType, ProjectSortOption } from '~/types/project';

interface ProjectFiltersProps {
  projects: Project[];
  onFiltersChange?: (filters: ProjectFiltersType & { sort?: ProjectSortOption }) => void;
}

export function ProjectFilters({ projects, onFiltersChange }: ProjectFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Get current filter values from URL
  const currentFilters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
    technology: searchParams.get('technology') || '',
    sortField: (searchParams.get('sortField') as 'title' | 'lastUpdated' | 'stars') || 'title',
    sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc',
  };

  // Extract unique values for filter options
  const categories = Array.from(new Set(projects.map(p => p.category))).sort();
  const statuses = Array.from(new Set(projects.map(p => p.status))).sort();
  const technologies = Array.from(
    new Set(projects.flatMap(p => p.technologies.map(t => t.name)))
  ).sort();

  // Update URL parameters when filters change
  const updateFilters = (newFilters: Partial<typeof currentFilters>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries({ ...currentFilters, ...newFilters }).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    setSearchParams(params, { replace: true });
    
    // Notify parent component
    if (onFiltersChange) {
      const filters: ProjectFiltersType & { sort?: ProjectSortOption } = {};
      
      const search = newFilters.search || currentFilters.search;
      const category = newFilters.category || currentFilters.category;
      const status = newFilters.status || currentFilters.status;
      const technology = newFilters.technology || currentFilters.technology;
      
      if (search) filters.search = search;
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (technology) filters.technology = technology;
      
      if (newFilters.sortField || newFilters.sortDirection) {
        filters.sort = {
          field: (newFilters.sortField || currentFilters.sortField) as 'title' | 'lastUpdated' | 'stars',
          direction: (newFilters.sortDirection || currentFilters.sortDirection) as 'asc' | 'desc',
        };
      }
      
      onFiltersChange(filters);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  // Check if any filters are active
  const hasActiveFilters = currentFilters.search || currentFilters.category || 
                          currentFilters.status || currentFilters.technology;

  return (
    <div className="mb-8 space-y-4" role="search" aria-label="Project search and filters">
      {/* Search Bar */}
      <div className="relative">
        <label htmlFor="project-search" className="sr-only">
          Search projects by title, description, or technology
        </label>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id="project-search"
          type="search"
          placeholder="Search projects..."
          value={currentFilters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-describedby="search-help"
          autoComplete="off"
        />
        <div id="search-help" className="sr-only">
          Search through projects by title, description, or technology. Results update as you type.
        </div>
        {currentFilters.search && (
          <button
            onClick={() => updateFilters({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={`Clear search term: ${currentFilters.search}`}
            title="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <fieldset className="contents">
          <legend className="sr-only">Project filtering and sorting controls</legend>
          
          {/* Toggle Filters Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-expanded={isFilterOpen}
            aria-controls="filter-options"
            aria-describedby="filter-toggle-help"
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          <div id="filter-toggle-help" className="sr-only">
            Toggle visibility of project filter options including category, status, and technology filters
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="project-sort" className="text-sm font-medium">
              Sort by:
            </label>
            <select
              id="project-sort"
              value={`${currentFilters.sortField}-${currentFilters.sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [
                  'title' | 'lastUpdated' | 'stars',
                  'asc' | 'desc'
                ];
                updateFilters({ sortField: field, sortDirection: direction });
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-describedby="sort-help"
            >
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="lastUpdated-desc">Recently Updated</option>
              <option value="lastUpdated-asc">Oldest Updated</option>
              <option value="stars-desc">Most Stars</option>
              <option value="stars-asc">Least Stars</option>
            </select>
            <div id="sort-help" className="sr-only">
              Choose how to sort the project list. Options include alphabetical by title, by last update date, or by GitHub stars.
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-describedby="clear-filters-help"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear Filters
            </button>
          )}
          <div id="clear-filters-help" className="sr-only">
            Remove all active filters and show all projects
          </div>
        </fieldset>
      </div>

      {/* Filter Options (Collapsible) */}
      {isFilterOpen && (
        <div 
          id="filter-options"
          className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-3"
          role="region"
          aria-label="Project filter options"
        >
          <fieldset className="contents">
            <legend className="sr-only">Filter projects by category, status, and technology</legend>
            
            {/* Category Filter */}
            <div>
              <label htmlFor="project-category" className="mb-2 block text-sm font-medium">
                Category
              </label>
              <select
                id="project-category"
                value={currentFilters.category}
                onChange={(e) => updateFilters({ category: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-describedby="category-help"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <div id="category-help" className="sr-only">
                Filter projects by category type such as web application, mobile app, or library
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="project-status" className="mb-2 block text-sm font-medium">
                Status
              </label>
              <select
                id="project-status"
                value={currentFilters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-describedby="status-help"
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'coming-soon' ? 'Coming Soon' : 
                     status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <div id="status-help" className="sr-only">
                Filter projects by development status such as active, completed, or archived
              </div>
            </div>

            {/* Technology Filter */}
            <div>
              <label htmlFor="project-technology" className="mb-2 block text-sm font-medium">
                Technology
              </label>
              <select
                id="project-technology"
                value={currentFilters.technology}
                onChange={(e) => updateFilters({ technology: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-describedby="technology-help"
              >
                <option value="">All Technologies</option>
                {technologies.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </select>
              <div id="technology-help" className="sr-only">
                Filter projects by specific technology or programming language used
              </div>
            </div>
          </fieldset>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div 
          className="flex flex-wrap gap-2" 
          role="region" 
          aria-label="Active filters"
          aria-describedby="active-filters-help"
        >
          <div id="active-filters-help" className="sr-only">
            Currently active filters. Click the X button on any filter to remove it.
          </div>
          {currentFilters.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Category: {currentFilters.category.charAt(0).toUpperCase() + currentFilters.category.slice(1)}
              <button
                onClick={() => updateFilters({ category: '' })}
                className="ml-1 hover:text-primary/80"
                aria-label={`Remove category filter: ${currentFilters.category}`}
                title="Remove category filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          {currentFilters.status && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Status: {currentFilters.status === 'coming-soon' ? 'Coming Soon' : 
                      currentFilters.status.charAt(0).toUpperCase() + currentFilters.status.slice(1)}
              <button
                onClick={() => updateFilters({ status: '' })}
                className="ml-1 hover:text-primary/80"
                aria-label={`Remove status filter: ${currentFilters.status === 'coming-soon' ? 'Coming Soon' : currentFilters.status}`}
                title="Remove status filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          {currentFilters.technology && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Tech: {currentFilters.technology}
              <button
                onClick={() => updateFilters({ technology: '' })}
                className="ml-1 hover:text-primary/80"
                aria-label={`Remove technology filter: ${currentFilters.technology}`}
                title="Remove technology filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
} 