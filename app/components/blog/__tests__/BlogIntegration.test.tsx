import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FeaturedBlogSection } from '../FeaturedBlogSection';
import type { BlogPost } from '~/types/blog';

// Mock the image optimization utilities
vi.mock('~/utils/imageOptimization', () => ({
  generateSrcSet: vi.fn((src) => `${src} 400w, ${src} 800w`),
  generateSizesAttribute: vi.fn(() => '(max-width: 640px) 100vw, 50vw'),
  isOptimizableImage: vi.fn(() => true),
  trackImagePerformance: vi.fn(),
}));

const mockBlogPosts: BlogPost[] = [
  {
    slug: 'featured-post',
    frontmatter: {
      title: 'Featured Blog Post',
      description: 'This is a featured blog post description',
      publishedAt: '2025-06-29',
      author: 'Test Author',
      category: 'technology',
      tags: ['react', 'testing'],
      image: '/images/blog/featured-post.jpg',
      imageAlt: 'Featured post image',
      featured: true,
      draft: false,
      readingTime: 5
    },
    content: 'Post content here',
    excerpt: 'Post excerpt',
    readingTime: { text: '5 min read', minutes: 5, time: 300000, words: 1000 }
  },
  {
    slug: 'regular-post-1',
    frontmatter: {
      title: 'Regular Blog Post 1',
      description: 'This is a regular blog post description',
      publishedAt: '2025-06-28',
      author: 'Test Author',
      category: 'development',
      tags: ['javascript'],
      image: '/images/blog/regular-post-1.jpg',
      imageAlt: 'Regular post 1 image',
      featured: false,
      draft: false,
      readingTime: 3
    },
    content: 'Post content here',
    excerpt: 'Post excerpt',
    readingTime: { text: '3 min read', minutes: 3, time: 180000, words: 600 }
  },
  {
    slug: 'regular-post-2',
    frontmatter: {
      title: 'Regular Blog Post 2',
      description: 'Another regular blog post description',
      publishedAt: '2025-06-27',
      author: 'Test Author',
      category: 'design',
      tags: ['ui', 'ux'],
      featured: false,
      draft: false,
      readingTime: 4
    },
    content: 'Post content here',
    excerpt: 'Post excerpt',
    readingTime: { text: '4 min read', minutes: 4, time: 240000, words: 800 }
  }
];

describe('Blog Image Integration', () => {
  it('renders FeaturedBlogSection with proper image handling', () => {
    render(<FeaturedBlogSection posts={mockBlogPosts} />);
    
    // Check that the section renders
    expect(screen.getByText('Latest from Our Blog')).toBeInTheDocument();
    
    // Check that featured post renders with proper image
    expect(screen.getByAltText('Featured post image')).toBeInTheDocument();
    
    // Check that featured post has eager loading (priority)
    const featuredImg = screen.getByAltText('Featured post image');
    expect(featuredImg).toHaveAttribute('loading', 'eager');
    
    // Check that compact posts render
    expect(screen.getByText('Regular Blog Post 1')).toBeInTheDocument();
    expect(screen.getByText('Regular Blog Post 2')).toBeInTheDocument();
  });

  it('handles posts without images gracefully', () => {
    const postsWithoutImages = mockBlogPosts.map(post => ({
      ...post,
      frontmatter: {
        ...post.frontmatter,
        image: undefined,
        imageAlt: undefined
      }
    }));

    render(<FeaturedBlogSection posts={postsWithoutImages} />);
    
    // Should still render the section
    expect(screen.getByText('Latest from Our Blog')).toBeInTheDocument();
    
    // Should render placeholder images
    expect(screen.getByRole('img', { name: /featured blog post placeholder/i })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /blog post thumbnail placeholder/i })).toHaveLength(2);
  });

  it('applies proper FocusLab design system classes', () => {
    const { container } = render(<FeaturedBlogSection posts={mockBlogPosts} />);
    
    // Check that design system gradient background is applied to the outer container
    const outerSection = container.querySelector('.bg-gradient-to-r');
    expect(outerSection).toBeInTheDocument();
    expect(outerSection).toHaveClass('from-gray-50', 'to-blue-50');
    
    // Check that featured badge styling is applied
    const featuredBadge = screen.getByText('⭐ Featured');
    expect(featuredBadge).toHaveClass('bg-orange-accent/10', 'text-orange-accent');
    
    // Check that category tags use proper styling
    const categoryTag = screen.getByText('technology');
    expect(categoryTag).toHaveClass('bg-primary-purple/10', 'text-primary-purple');
  });

  it('maintains responsive grid layout', () => {
    render(<FeaturedBlogSection posts={mockBlogPosts} />);
    
    // Check main grid container
    const gridContainer = screen.getByText('Featured Blog Post').closest('[class*="grid"]');
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-12');
    
    // Check featured post container
    const featuredContainer = screen.getByText('Featured Blog Post').closest('[class*="col-span"]');
    expect(featuredContainer).toHaveClass('lg:col-span-7');
  });

  it('renders empty state when no posts provided', () => {
    const { container } = render(<FeaturedBlogSection posts={[]} />);
    
    // Should render nothing when no posts
    expect(container.firstChild).toBeNull();
  });
});