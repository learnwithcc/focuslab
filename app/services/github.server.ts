import { GitHubStats } from '~/types/project';
import { Redis } from '@upstash/redis';

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


interface CachedData {
  data: GitHubStats;
  timestamp: number;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private kvPrefix = 'github:stats:'; // Prefix for Redis keys
  private fallbackCache = new Map<string, CachedData>(); // Fallback in-memory cache
  private readonly apiTimeout = 10000; // 10 seconds timeout for GitHub API calls
  private redis: Redis | null = null;

  constructor() {
    // Initialize Redis connection if credentials are available
    const redisUrl = process.env['UPSTASH_REDIS_REST_URL'];
    const redisToken = process.env['UPSTASH_REDIS_REST_TOKEN'];
    
    if (redisUrl && redisToken) {
      this.redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });
    } else {
      console.warn('Redis credentials not found, using fallback in-memory cache');
    }
  }

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
    return `${this.kvPrefix}${owner}/${repo}`;
  }

  private getFallbackCacheKey(owner: string, repo: string): string {
    return `${owner}/${repo}`;
  }

  private async getCachedData(owner: string, repo: string): Promise<CachedData | null> {
    const redisKey = this.getCacheKey(owner, repo);
    const fallbackKey = this.getFallbackCacheKey(owner, repo);

    try {
      // Try Redis first
      if (this.redis) {
        const cached = await this.redis.get<CachedData>(redisKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
          return cached;
        }
      }
    } catch (error) {
      console.warn('Redis cache read failed, falling back to in-memory:', error);
    }

    // Fallback to in-memory cache
    const fallbackCached = this.fallbackCache.get(fallbackKey);
    if (fallbackCached && this.isCacheValid(fallbackCached.timestamp)) {
      return fallbackCached;
    }

    return null;
  }

  private async setCachedData(owner: string, repo: string, data: GitHubStats): Promise<void> {
    const redisKey = this.getCacheKey(owner, repo);
    const fallbackKey = this.getFallbackCacheKey(owner, repo);
    const cachedData: CachedData = {
      data,
      timestamp: Date.now(),
    };

    // Always set fallback cache
    this.fallbackCache.set(fallbackKey, cachedData);

    try {
      // Try to set Redis cache with TTL (expire after cache timeout)
      if (this.redis) {
        await this.redis.set(redisKey, cachedData, { 
          ex: Math.ceil(this.cacheTimeout / 1000) // Convert to seconds for Redis TTL
        });
      }
    } catch (error) {
      console.warn('Redis cache write failed, using fallback cache only:', error);
    }
  }

  async getRepositoryStats(githubUrl: string): Promise<{ success: true; data: GitHubStats } | { success: false; error: string }> {
    try {
      // Extract owner and repo from GitHub URL
      const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        return { success: false, error: 'Invalid GitHub URL format' };
      }

      const [, owner, repo] = urlMatch;

      // Check cache first
      const cached = await this.getCachedData(owner, repo);
      if (cached) {
        return { success: true, data: cached.data };
      }

      // Fetch from GitHub API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);
      
      try {
        const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
          headers: this.getHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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
        await this.setCachedData(owner, repo, stats);

        return { success: true, data: stats };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('GitHub API timeout:', fetchError);
          return { success: false, error: 'GitHub API request timed out' };
        }
        throw fetchError;
      }
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
  async clearCache(): Promise<void> {
    // Clear fallback cache
    this.fallbackCache.clear();

    try {
      // Clear KV cache by deleting keys with our prefix
      // Note: This is a simple implementation - in production, you might want to track keys
      console.warn('KV cache clearing requires manual key management or TTL expiration');
    } catch (error) {
      console.warn('KV cache clear failed:', error);
    }
  }

  // Get cache statistics for debugging
  getCacheStats(): { fallbackSize: number; fallbackKeys: string[]; kvSupported: boolean } {
    return {
      fallbackSize: this.fallbackCache.size,
      fallbackKeys: Array.from(this.fallbackCache.keys()),
      kvSupported: typeof kv !== 'undefined',
    };
  }
}

// Export a singleton instance
export const githubService = new GitHubService();

// Export the class for testing
export { GitHubService }; 