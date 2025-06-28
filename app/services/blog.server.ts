import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { 
  BlogPost, 
  BlogPostFrontmatter, 
  BlogCategory, 
  BlogTag, 
  BlogFilters, 
  BlogSortOption, 
  BlogPagination,
  BlogSearchResult,
  ContentService
} from '~/types/blog';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');
const DEFAULT_PAGINATION = { page: 1, limit: 10 };

// Cache for processed posts (in production, consider using Redis or similar)
let postsCache: BlogPost[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

class FileBasedContentService implements ContentService {
  private async getAllPostsFromDisk(): Promise<BlogPost[]> {
    // Check cache first
    if (postsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
      return postsCache;
    }

    try {
      const files = await fs.readdir(CONTENT_DIR);
      const mdxFiles = files.filter(file => file.endsWith('.mdx'));
      
      const posts = await Promise.all(
        mdxFiles.map(async (file) => {
          const filePath = path.join(CONTENT_DIR, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const { data: frontmatter, content } = matter(fileContent);
          
          // Validate frontmatter
          const validatedFrontmatter = this.validateFrontmatter(frontmatter, file);
          
          // Generate slug from filename if not provided
          const slug = validatedFrontmatter.slug || file.replace('.mdx', '');
          
          // Calculate reading time
          const readingTimeStats = readingTime(content);
          
          // Generate excerpt from content (first 150 words)
          const excerpt = this.generateExcerpt(content);
          
          return {
            slug,
            frontmatter: {
              ...validatedFrontmatter,
              slug,
              readingTime: readingTimeStats.minutes
            },
            content,
            excerpt,
            readingTime: readingTimeStats
          };
        })
      );

      // Filter out draft posts in production
      const filteredPosts = process.env.NODE_ENV === 'production' 
        ? posts.filter(post => !post.frontmatter.draft)
        : posts;

      // Sort by published date (newest first)
      const sortedPosts = filteredPosts.sort((a, b) => 
        new Date(b.frontmatter.publishedAt).getTime() - new Date(a.frontmatter.publishedAt).getTime()
      );

      // Update cache
      postsCache = sortedPosts;
      cacheTimestamp = Date.now();

      return sortedPosts;
    } catch (error) {
      console.error('Error loading blog posts:', error);
      return [];
    }
  }

  private validateFrontmatter(frontmatter: any, filename: string): BlogPostFrontmatter {
    const required = ['title', 'description', 'publishedAt', 'author', 'category'];
    
    for (const field of required) {
      if (!frontmatter[field]) {
        throw new Error(`Missing required frontmatter field '${field}' in ${filename}`);
      }
    }

    return {
      title: frontmatter.title,
      description: frontmatter.description,
      publishedAt: frontmatter.publishedAt,
      updatedAt: frontmatter.updatedAt,
      author: frontmatter.author,
      category: frontmatter.category,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      image: frontmatter.image,
      imageAlt: frontmatter.imageAlt,
      featured: Boolean(frontmatter.featured),
      draft: Boolean(frontmatter.draft),
      slug: frontmatter.slug,
    };
  }

  private generateExcerpt(content: string): string {
    // Remove MDX/markdown syntax and get first 150 words
    const plainText = content
      .replace(/^---[\s\S]*?---/, '') // Remove frontmatter
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
      .replace(/`([^`]+)`/g, '$1') // Remove inline code formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic formatting
      .replace(/>\s+/g, '') // Remove blockquotes
      .trim();

    const words = plainText.split(/\s+/).slice(0, 30).join(' ');
    return words + (plainText.split(/\s+/).length > 30 ? '...' : '');
  }

  private applyFilters(posts: BlogPost[], filters?: BlogFilters): BlogPost[] {
    if (!filters) return posts;

    let filtered = posts;

    if (filters.category) {
      filtered = filtered.filter(post => 
        post.frontmatter.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    if (filters.tag) {
      filtered = filtered.filter(post =>
        post.frontmatter.tags.some(tag => 
          tag.toLowerCase() === filters.tag!.toLowerCase()
        )
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(post =>
        post.frontmatter.title.toLowerCase().includes(searchTerm) ||
        post.frontmatter.description.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.frontmatter.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.featured !== undefined) {
      filtered = filtered.filter(post => post.frontmatter.featured === filters.featured);
    }

    if (filters.draft !== undefined) {
      filtered = filtered.filter(post => 
        (post.frontmatter.draft || false) === filters.draft
      );
    }

    return filtered;
  }

  private applySort(posts: BlogPost[], sort?: BlogSortOption): BlogPost[] {
    if (!sort) return posts;

    return [...posts].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'publishedAt':
          aValue = new Date(a.frontmatter.publishedAt).getTime();
          bValue = new Date(b.frontmatter.publishedAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.frontmatter.updatedAt || a.frontmatter.publishedAt).getTime();
          bValue = new Date(b.frontmatter.updatedAt || b.frontmatter.publishedAt).getTime();
          break;
        case 'title':
          aValue = a.frontmatter.title.toLowerCase();
          bValue = b.frontmatter.title.toLowerCase();
          break;
        case 'readingTime':
          aValue = a.readingTime.minutes;
          bValue = b.readingTime.minutes;
          break;
        default:
          return 0;
      }

      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }

  private applyPagination(posts: BlogPost[], pagination?: Partial<BlogPagination>): {
    posts: BlogPost[];
    pagination: BlogPagination;
  } {
    const { page = 1, limit = 10 } = { ...DEFAULT_PAGINATION, ...pagination };
    const total = posts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      posts: posts.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Implementation of ContentService interface
  async getAllPosts(
    filters?: BlogFilters,
    sort?: BlogSortOption,
    pagination?: Partial<BlogPagination>
  ): Promise<BlogSearchResult> {
    const allPosts = await this.getAllPostsFromDisk();
    const filtered = this.applyFilters(allPosts, filters);
    const sorted = this.applySort(filtered, sort);
    const { posts, pagination: paginationResult } = this.applyPagination(sorted, pagination);

    return {
      posts,
      pagination: paginationResult,
      filters: filters || {},
      sort: sort || { field: 'publishedAt', direction: 'desc' },
    };
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const posts = await this.getAllPostsFromDisk();
    return posts.find(post => post.slug === slug) || null;
  }

  async getFeaturedPosts(limit = 3): Promise<BlogPost[]> {
    const posts = await this.getAllPostsFromDisk();
    return posts
      .filter(post => post.frontmatter.featured)
      .slice(0, limit);
  }

  async getRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
    const posts = await this.getAllPostsFromDisk();
    const currentPost = posts.find(post => post.slug === slug);
    
    if (!currentPost) return [];

    // Find posts with similar tags or same category
    const related = posts
      .filter(post => post.slug !== slug)
      .map(post => {
        let score = 0;
        
        // Same category
        if (post.frontmatter.category === currentPost.frontmatter.category) {
          score += 3;
        }
        
        // Shared tags
        const sharedTags = post.frontmatter.tags.filter(tag =>
          currentPost.frontmatter.tags.includes(tag)
        );
        score += sharedTags.length;
        
        return { post, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ post }) => post);

    return related;
  }

  async getAllCategories(): Promise<BlogCategory[]> {
    const posts = await this.getAllPostsFromDisk();
    const categoryMap = new Map<string, number>();

    posts.forEach(post => {
      const category = post.frontmatter.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries()).map(([name, postCount]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      postCount,
    }));
  }

  async getCategoryBySlug(slug: string): Promise<BlogCategory | null> {
    const categories = await this.getAllCategories();
    return categories.find(cat => cat.slug === slug) || null;
  }

  async getPostsByCategory(
    categorySlug: string,
    pagination?: Partial<BlogPagination>
  ): Promise<BlogSearchResult> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) {
      return {
        posts: [],
        pagination: { ...DEFAULT_PAGINATION, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        filters: { category: categorySlug },
        sort: { field: 'publishedAt', direction: 'desc' },
      };
    }

    return this.getAllPosts({ category: category.name }, undefined, pagination);
  }

  async getAllTags(): Promise<BlogTag[]> {
    const posts = await this.getAllPostsFromDisk();
    const tagMap = new Map<string, number>();

    posts.forEach(post => {
      post.frontmatter.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagMap.entries()).map(([name, postCount]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      postCount,
    }));
  }

  async getTagBySlug(slug: string): Promise<BlogTag | null> {
    const tags = await this.getAllTags();
    return tags.find(tag => tag.slug === slug) || null;
  }

  async getPostsByTag(
    tagSlug: string,
    pagination?: Partial<BlogPagination>
  ): Promise<BlogSearchResult> {
    const tag = await this.getTagBySlug(tagSlug);
    if (!tag) {
      return {
        posts: [],
        pagination: { ...DEFAULT_PAGINATION, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        filters: { tag: tagSlug },
        sort: { field: 'publishedAt', direction: 'desc' },
      };
    }

    return this.getAllPosts({ tag: tag.name }, undefined, pagination);
  }

  async searchPosts(
    query: string,
    pagination?: Partial<BlogPagination>
  ): Promise<BlogSearchResult> {
    return this.getAllPosts({ search: query }, undefined, pagination);
  }

  async getPostsForRSS(): Promise<BlogPost[]> {
    const posts = await this.getAllPostsFromDisk();
    return posts.slice(0, 20); // Latest 20 posts for RSS
  }

  async getPostsForSitemap(): Promise<Pick<BlogPost, 'slug' | 'frontmatter'>[]> {
    const posts = await this.getAllPostsFromDisk();
    return posts.map(post => ({
      slug: post.slug,
      frontmatter: post.frontmatter,
    }));
  }
}

// Export singleton instance
export const contentService = new FileBasedContentService();

// Helper functions for Remix loaders
export async function getAllBlogPosts(
  filters?: BlogFilters,
  sort?: BlogSortOption,
  pagination?: Partial<BlogPagination>
) {
  return contentService.getAllPosts(filters, sort, pagination);
}

export async function getBlogPostBySlug(slug: string) {
  return contentService.getPostBySlug(slug);
}

export async function getFeaturedBlogPosts(limit?: number) {
  return contentService.getFeaturedPosts(limit);
}

export async function getBlogCategories() {
  return contentService.getAllCategories();
}

export async function getBlogTags() {
  return contentService.getAllTags();
}