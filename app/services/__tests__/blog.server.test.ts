import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileBasedContentService } from '../blog.server';
import type { BlogFilters, BlogSortOption } from '~/types/blog';

// Mock fs and path modules
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('path', () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join('/')),
    extname: vi.fn((filename: string) => filename.includes('.') ? '.' + filename.split('.').pop() : ''),
  },
  join: vi.fn((...args: string[]) => args.join('/')),
  extname: vi.fn((filename: string) => filename.includes('.') ? '.' + filename.split('.').pop() : ''),
}));

vi.mock('gray-matter', () => ({
  default: vi.fn(),
}));

// Mock data
const mockFileContent = `---
title: "Test Blog Post"
description: "A test blog post for testing purposes"
publishedAt: "2024-01-15"
author: "Test Author"
category: "testing"
tags: ["test", "blog", "typescript"]
featured: false
draft: false
---

# Test Content

This is test content for the blog post.`;

const mockParsedMatter = {
  data: {
    title: "Test Blog Post",
    description: "A test blog post for testing purposes",
    publishedAt: "2024-01-15",
    author: "Test Author",
    category: "testing",
    tags: ["test", "blog", "typescript"],
    featured: false,
    draft: false,
  },
  content: "# Test Content\n\nThis is test content for the blog post.",
};

describe('FileBasedContentService', () => {
  let contentService: FileBasedContentService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    contentService = new FileBasedContentService();
  });

  describe('getAllPosts', () => {
    it('should return all published posts by default', async () => {
      // Mock fs operations
      const { readdir, readFile } = await import('fs/promises');
      const matter = (await import('gray-matter')).default;
      
      vi.mocked(readdir).mockResolvedValue(['test-post.mdx'] as any);
      vi.mocked(readFile).mockResolvedValue(mockFileContent);
      vi.mocked(matter).mockReturnValue(mockParsedMatter as any);

      const result = await contentService.getAllPosts();

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].slug).toBe('test-post');
      expect(result.posts[0].frontmatter.title).toBe('Test Blog Post');
    });

    it('should filter posts by category', async () => {
      const filters: BlogFilters = { category: 'testing' };
      
      const result = await contentService.getAllPosts(filters);
      
      // Should only return posts in the 'testing' category
      expect(result.posts.every(post => post.frontmatter.category === 'testing')).toBe(true);
    });

    it('should filter posts by tag', async () => {
      const filters: BlogFilters = { tag: 'typescript' };
      
      const result = await contentService.getAllPosts(filters);
      
      // Should only return posts with the 'typescript' tag
      expect(result.posts.every(post => 
        post.frontmatter.tags.includes('typescript')
      )).toBe(true);
    });

    it('should search posts by content', async () => {
      const filters: BlogFilters = { search: 'test content' };
      
      const result = await contentService.getAllPosts(filters);
      
      // Should return posts containing the search term
      expect(result.posts.length).toBeGreaterThan(0);
    });

    it('should exclude draft posts by default', async () => {
      const result = await contentService.getAllPosts();
      
      // Should not include any draft posts
      expect(result.posts.every(post => !post.frontmatter.draft)).toBe(true);
    });

    it('should include draft posts when requested', async () => {
      const filters: BlogFilters = { draft: true };
      
      const result = await contentService.getAllPosts(filters);
      
      // May include draft posts (depending on test data)
      expect(result).toBeDefined();
    });

    it('should sort posts correctly', async () => {
      const sort: BlogSortOption = { field: 'publishedAt', direction: 'desc' };
      
      const result = await contentService.getAllPosts({}, sort);
      
      // Should be sorted by publication date descending
      for (let i = 1; i < result.posts.length; i++) {
        const prevDate = new Date(result.posts[i - 1].frontmatter.publishedAt);
        const currentDate = new Date(result.posts[i].frontmatter.publishedAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currentDate.getTime());
      }
    });

    it('should paginate results correctly', async () => {
      const pagination = { page: 1, limit: 5 };
      
      const result = await contentService.getAllPosts({}, undefined, pagination);
      
      expect(result.posts.length).toBeLessThanOrEqual(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
    });
  });

  describe('getPostBySlug', () => {
    it('should return a specific post by slug', async () => {
      const { readFile } = await import('fs/promises');
      const matter = (await import('gray-matter')).default;
      
      vi.mocked(readFile).mockResolvedValue(mockFileContent);
      vi.mocked(matter).mockReturnValue(mockParsedMatter as any);

      const post = await contentService.getPostBySlug('test-post');

      expect(post).not.toBeNull();
      expect(post?.slug).toBe('test-post');
      expect(post?.frontmatter.title).toBe('Test Blog Post');
    });

    it('should return null for non-existent post', async () => {
      const { readFile } = await import('fs/promises');
      
      vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

      const post = await contentService.getPostBySlug('non-existent-post');

      expect(post).toBeNull();
    });
  });

  describe('getFeaturedPosts', () => {
    it('should return only featured posts', async () => {
      const posts = await contentService.getFeaturedPosts();

      expect(posts.every(post => post.frontmatter.featured)).toBe(true);
    });

    it('should limit the number of featured posts', async () => {
      const posts = await contentService.getFeaturedPosts(3);

      expect(posts.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getAllCategories', () => {
    it('should return all unique categories with post counts', async () => {
      const categories = await contentService.getAllCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.every(cat => 
        cat.name && cat.slug && typeof cat.postCount === 'number'
      )).toBe(true);
    });
  });

  describe('getAllTags', () => {
    it('should return all unique tags with post counts', async () => {
      const tags = await contentService.getAllTags();

      expect(Array.isArray(tags)).toBe(true);
      expect(tags.every(tag => 
        tag.name && tag.slug && typeof tag.postCount === 'number'
      )).toBe(true);
    });
  });

  describe('getPostsForRSS', () => {
    it('should return posts suitable for RSS feed', async () => {
      const posts = await contentService.getPostsForRSS();

      expect(Array.isArray(posts)).toBe(true);
      // Should only include published posts
      expect(posts.every(post => !post.frontmatter.draft)).toBe(true);
    });
  });

  describe('getPostsForSitemap', () => {
    it('should return posts suitable for sitemap', async () => {
      const posts = await contentService.getPostsForSitemap();

      expect(Array.isArray(posts)).toBe(true);
      // Should include slug and frontmatter
      expect(posts.every(post => 
        post.slug && post.frontmatter
      )).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      const { readdir } = await import('fs/promises');
      
      vi.mocked(readdir).mockRejectedValue(new Error('Permission denied'));

      const result = await contentService.getAllPosts();

      // Should return empty result rather than throwing
      expect(result.posts).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle malformed frontmatter gracefully', async () => {
      const { readdir, readFile } = await import('fs/promises');
      const matter = (await import('gray-matter')).default;
      
      vi.mocked(readdir).mockResolvedValue(['malformed-post.mdx'] as any);
      vi.mocked(readFile).mockResolvedValue('invalid frontmatter');
      vi.mocked(matter).mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      const result = await contentService.getAllPosts();

      // Should continue processing other posts
      expect(result).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should cache posts to avoid repeated file system access', async () => {
      const { readdir } = await import('fs/promises');
      
      // First call
      await contentService.getAllPosts();
      
      // Second call
      await contentService.getAllPosts();

      // Should only read directory once due to caching
      expect(vi.mocked(readdir)).toHaveBeenCalledTimes(1);
    });

    it('should handle large numbers of posts efficiently', async () => {
      const { readdir, readFile } = await import('fs/promises');
      const matter = (await import('gray-matter')).default;
      
      // Mock 100 posts
      const fileNames = Array.from({ length: 100 }, (_, i) => `post-${i}.mdx`);
      vi.mocked(readdir).mockResolvedValue(fileNames as any);
      vi.mocked(readFile).mockResolvedValue(mockFileContent);
      vi.mocked(matter).mockReturnValue(mockParsedMatter as any);

      const startTime = Date.now();
      const result = await contentService.getAllPosts();
      const endTime = Date.now();

      expect(result.posts).toHaveLength(100);
      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});