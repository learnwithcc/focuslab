import type { 
  BlogPost, 
  BlogPostFrontmatter,
  DirectusPost, 
  DirectusCategory, 
  DirectusTag,
  ContentService 
} from '~/types/blog';

/**
 * Migration utilities for transitioning from file-based MDX content to Directus CMS
 * 
 * This module provides utilities to:
 * 1. Export existing MDX content to Directus-compatible format
 * 2. Create a Directus-based ContentService implementation
 * 3. Handle URL redirects and SEO preservation during migration
 */

// Directus API Configuration
interface DirectusConfig {
  url: string;
  token: string;
  collections: {
    posts: string;
    categories: string;
    tags: string;
  };
}

// Default configuration (should be moved to environment variables)
const DIRECTUS_CONFIG: DirectusConfig = {
  url: process.env.DIRECTUS_URL || 'http://localhost:8055',
  token: process.env.DIRECTUS_TOKEN || '',
  collections: {
    posts: 'blog_posts',
    categories: 'blog_categories', 
    tags: 'blog_tags'
  }
};

/**
 * Convert MDX BlogPost to Directus format
 */
export function convertToDirectusPost(post: BlogPost): Omit<DirectusPost, 'id'> {
  return {
    status: post.frontmatter.draft ? 'draft' : 'published',
    title: post.frontmatter.title,
    slug: post.slug,
    description: post.frontmatter.description,
    content: post.content,
    excerpt: post.excerpt,
    featured_image: post.frontmatter.image || null,
    featured_image_alt: post.frontmatter.imageAlt || null,
    author: post.frontmatter.author,
    category: {
      id: '', // Will be resolved during migration
      name: post.frontmatter.category,
      slug: post.frontmatter.category.toLowerCase().replace(/\s+/g, '-'),
      description: undefined
    },
    tags: post.frontmatter.tags.map(tag => ({
      id: '', // Will be resolved during migration
      name: tag,
      slug: tag.toLowerCase().replace(/\s+/g, '-')
    })),
    featured: post.frontmatter.featured || false,
    published_at: post.frontmatter.publishedAt,
    updated_at: post.frontmatter.updatedAt || post.frontmatter.publishedAt,
    created_at: post.frontmatter.publishedAt
  };
}

/**
 * Convert Directus post back to BlogPost format
 */
export function convertFromDirectusPost(directusPost: DirectusPost): BlogPost {
  // Calculate reading time from content
  const wordsPerMinute = 200;
  const words = directusPost.content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);

  return {
    slug: directusPost.slug,
    frontmatter: {
      title: directusPost.title,
      description: directusPost.description,
      publishedAt: directusPost.published_at,
      updatedAt: directusPost.updated_at,
      author: directusPost.author,
      category: directusPost.category.name,
      tags: directusPost.tags.map(tag => tag.name),
      image: directusPost.featured_image || undefined,
      imageAlt: directusPost.featured_image_alt || undefined,
      featured: directusPost.featured,
      draft: directusPost.status === 'draft',
      readingTime: minutes
    },
    content: directusPost.content,
    excerpt: directusPost.excerpt,
    readingTime: {
      text: `${minutes} min read`,
      minutes,
      time: words / wordsPerMinute * 60 * 1000,
      words
    }
  };
}

/**
 * Directus-based ContentService implementation
 * 
 * This class implements the same ContentService interface as the file-based service,
 * allowing for seamless migration without changing React components.
 */
export class DirectusContentService implements ContentService {
  private config: DirectusConfig;

  constructor(config?: Partial<DirectusConfig>) {
    this.config = { ...DIRECTUS_CONFIG, ...config };
  }

  private async directusRequest(endpoint: string, options?: RequestInit): Promise<any> {
    const url = `${this.config.url}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Directus API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAllPosts(filters?, sort?, pagination?) {
    // This would implement the actual Directus API calls
    // For now, this is a placeholder implementation
    throw new Error('DirectusContentService not yet implemented');
  }

  async getPostBySlug(slug: string) {
    // Implementation would query Directus for post by slug
    throw new Error('DirectusContentService not yet implemented');
  }

  async getFeaturedPosts(limit = 3) {
    // Implementation would query Directus for featured posts
    throw new Error('DirectusContentService not yet implemented');
  }

  async getRelatedPosts(slug: string, limit = 3) {
    // Implementation would query Directus for related posts
    throw new Error('DirectusContentService not yet implemented');
  }

  async getAllCategories() {
    // Implementation would query Directus categories
    throw new Error('DirectusContentService not yet implemented');
  }

  async getCategoryBySlug(slug: string) {
    // Implementation would query Directus for category by slug
    throw new Error('DirectusContentService not yet implemented');
  }

  async getPostsByCategory(categorySlug: string, pagination?) {
    // Implementation would query Directus for posts by category
    throw new Error('DirectusContentService not yet implemented');
  }

  async getAllTags() {
    // Implementation would query Directus tags
    throw new Error('DirectusContentService not yet implemented');
  }

  async getTagBySlug(slug: string) {
    // Implementation would query Directus for tag by slug
    throw new Error('DirectusContentService not yet implemented');
  }

  async getPostsByTag(tagSlug: string, pagination?) {
    // Implementation would query Directus for posts by tag
    throw new Error('DirectusContentService not yet implemented');
  }

  async searchPosts(query: string, pagination?) {
    // Implementation would use Directus search functionality
    throw new Error('DirectusContentService not yet implemented');
  }

  async getPostsForRSS() {
    // Implementation would query Directus for RSS posts
    throw new Error('DirectusContentService not yet implemented');
  }

  async getPostsForSitemap() {
    // Implementation would query Directus for sitemap posts
    throw new Error('DirectusContentService not yet implemented');
  }
}

/**
 * Migration utilities
 */
export class BlogMigrationUtils {
  /**
   * Export all MDX posts to JSON format for Directus import
   */
  static async exportToDirectusFormat(posts: BlogPost[]): Promise<{
    posts: Omit<DirectusPost, 'id'>[];
    categories: Omit<DirectusCategory, 'id'>[];
    tags: Omit<DirectusTag, 'id'>[];
  }> {
    const directusPosts = posts.map(convertToDirectusPost);
    
    // Extract unique categories
    const categoryMap = new Map<string, Omit<DirectusCategory, 'id'>>();
    directusPosts.forEach(post => {
      const category = post.category;
      if (!categoryMap.has(category.slug)) {
        categoryMap.set(category.slug, {
          name: category.name,
          slug: category.slug,
          description: category.description
        });
      }
    });

    // Extract unique tags  
    const tagMap = new Map<string, Omit<DirectusTag, 'id'>>();
    directusPosts.forEach(post => {
      post.tags.forEach(tag => {
        if (!tagMap.has(tag.slug)) {
          tagMap.set(tag.slug, {
            name: tag.name,
            slug: tag.slug
          });
        }
      });
    });

    return {
      posts: directusPosts,
      categories: Array.from(categoryMap.values()),
      tags: Array.from(tagMap.values())
    };
  }

  /**
   * Generate URL redirect mapping for SEO preservation
   */
  static generateRedirectMapping(posts: BlogPost[]): Array<{
    from: string;
    to: string;
    status: number;
  }> {
    // Assuming same URL structure, no redirects needed
    // But this could handle cases where slug format changes
    return posts.map(post => ({
      from: `/blog/${post.slug}`,
      to: `/blog/${post.slug}`,
      status: 200 // No redirect needed
    }));
  }

  /**
   * Validate migration completeness
   */
  static validateMigration(originalPosts: BlogPost[], migratedPosts: DirectusPost[]): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (originalPosts.length !== migratedPosts.length) {
      issues.push(`Post count mismatch: ${originalPosts.length} original vs ${migratedPosts.length} migrated`);
    }

    // Check for missing posts
    const originalSlugs = new Set(originalPosts.map(p => p.slug));
    const migratedSlugs = new Set(migratedPosts.map(p => p.slug));
    
    originalSlugs.forEach(slug => {
      if (!migratedSlugs.has(slug)) {
        issues.push(`Missing post after migration: ${slug}`);
      }
    });

    // Check content integrity (basic validation)
    migratedPosts.forEach(migratedPost => {
      const original = originalPosts.find(p => p.slug === migratedPost.slug);
      if (original) {
        if (original.frontmatter.title !== migratedPost.title) {
          issues.push(`Title mismatch for ${migratedPost.slug}`);
        }
        if (original.content !== migratedPost.content) {
          issues.push(`Content mismatch for ${migratedPost.slug}`);
        }
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

/**
 * Environment detection utility
 */
export function shouldUseDirectus(): boolean {
  return process.env.USE_DIRECTUS === 'true' && 
         Boolean(process.env.DIRECTUS_URL) && 
         Boolean(process.env.DIRECTUS_TOKEN);
}

/**
 * Content service factory
 * 
 * This factory function returns the appropriate content service based on environment configuration.
 * It allows for seamless switching between file-based and Directus-based content.
 */
export function createContentService(): ContentService {
  if (shouldUseDirectus()) {
    console.log('Using Directus ContentService');
    return new DirectusContentService();
  } else {
    console.log('Using file-based ContentService');
    // Import dynamically to avoid circular dependencies
    const { contentService } = require('./blog.server');
    return contentService;
  }
}