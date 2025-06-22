import { GitHubStats } from '~/types/project';

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  language: string | null;
  open_issues_count: number;
  private: boolean;
  archived: boolean;
}

interface GitHubError {
  message: string;
  status: number;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';
  private cache = new Map<string, { data: GitHubStats; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'FocusLab-Website/1.0',
    };

    // Add GitHub token if available for higher rate limits
    const token = process.env['GITHUB_TOKEN'];
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    return headers;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  private getCacheKey(owner: string, repo: string): string {
    return `${owner}/${repo}`;
  }

  async getRepositoryStats(githubUrl: string): Promise<{ success: true; data: GitHubStats } | { success: false; error: string }> {
    try {
      // Extract owner and repo from GitHub URL
      const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        return { success: false, error: 'Invalid GitHub URL format' };
      }

      const [, owner, repo] = urlMatch;
      const cacheKey = this.getCacheKey(owner, repo);

      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return { success: true, data: cached.data };
      }

      // Fetch from GitHub API
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Repository not found' };
        }
        if (response.status === 403) {
          return { success: false, error: 'Rate limit exceeded or access forbidden' };
        }
        return { success: false, error: `GitHub API error: ${response.status}` };
      }

      const repoData: GitHubRepoResponse = await response.json();

      // Transform to our GitHubStats interface
      const stats: GitHubStats = {
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        lastUpdated: repoData.updated_at,
        ...(repoData.language && { language: repoData.language }),
        openIssues: repoData.open_issues_count,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now(),
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('GitHub API error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async getMultipleRepositoryStats(githubUrls: string[]): Promise<{ [url: string]: GitHubStats | null }> {
    const results: { [url: string]: GitHubStats | null } = {};

    // Process requests in parallel with some concurrency control
    const batchSize = 5; // Limit concurrent requests to avoid rate limiting
    for (let i = 0; i < githubUrls.length; i += batchSize) {
      const batch = githubUrls.slice(i, i + batchSize);
      const batchPromises = batch.map(async (url) => {
        const result = await this.getRepositoryStats(url);
        return {
          url,
          stats: result.success ? result.data : null,
        };
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ url, stats }) => {
        results[url] = stats;
      });

      // Add a small delay between batches to be respectful to the API
      if (i + batchSize < githubUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics for debugging
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export a singleton instance
export const githubService = new GitHubService();

// Export the class for testing
export { GitHubService }; 