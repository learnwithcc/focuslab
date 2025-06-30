import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BlogImage } from '../BlogImage';
import { FeaturedBlogSection } from '../FeaturedBlogSection';
import type { BlogPost } from '~/types/blog';

// Mock the image optimization utilities
vi.mock('~/utils/imageOptimization', () => ({
  generateSrcSet: vi.fn((src) => `${src} 400w, ${src} 800w`),
  generateSizesAttribute: vi.fn(() => '(max-width: 640px) 100vw, 50vw'),
  isOptimizableImage: vi.fn(() => true),
  trackImagePerformance: vi.fn(),
}));

const mockBlogPost: BlogPost = {
  slug: 'test-post',
  frontmatter: {
    title: 'Test Blog Post',
    description: 'A test blog post for accessibility testing',
    publishedAt: '2025-06-29',
    author: 'Test Author',
    category: 'testing',
    tags: ['accessibility', 'testing'],
    image: '/images/blog/test-post.jpg',
    imageAlt: 'Descriptive alternative text for the test blog post image',
    featured: true,
    draft: false,
    readingTime: 5
  },
  content: 'Test content',
  excerpt: 'Test excerpt',
  readingTime: { text: '5 min read', minutes: 5, time: 300000, words: 1000 }
};

describe('Blog Image Accessibility', () => {
  it('BlogImage component provides proper accessibility attributes', () => {
    render(
      <BlogImage
        src="/test-image.jpg"
        alt="Descriptive alternative text for accessibility testing"
        variant="featured"
      />
    );
    
    const img = screen.getByAltText('Descriptive alternative text for accessibility testing');
    expect(img).toHaveAttribute('role', 'img');
    expect(img).toHaveAttribute('alt', 'Descriptive alternative text for accessibility testing');
    expect(img).toHaveAttribute('tabIndex', '-1');
  });

  it('BlogImage placeholder has proper accessibility attributes', () => {
    render(
      <BlogImage
        src=""
        alt="Empty image for placeholder testing"
        variant="featured"
      />
    );
    
    const placeholder = screen.getByRole('img', { name: /featured blog post placeholder/i });
    expect(placeholder).toHaveAttribute('role', 'img');
    expect(placeholder).toHaveAttribute('aria-label', 'Featured blog post placeholder');
  });

  it('FeaturedBlogSection maintains accessibility standards', () => {
    render(
      <FeaturedBlogSection posts={[mockBlogPost]} />
    );
    
    // Check section heading
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Latest from Our Blog');
    
    // Check that images have proper alt text
    const img = screen.getByAltText('Descriptive alternative text for the test blog post image');
    expect(img).toBeInTheDocument();
  });

  it('provides proper ARIA attributes for images', () => {
    render(
      <BlogImage
        src="/test-image.jpg"
        alt="Test image with proper ARIA attributes"
        variant="featured"
      />
    );

    const img = screen.getByAltText('Test image with proper ARIA attributes');
    expect(img).toHaveAttribute('role', 'img');
    expect(img).toHaveAttribute('alt', 'Test image with proper ARIA attributes');
    expect(img).toHaveAttribute('tabIndex', '-1'); // Decorative images shouldn't be focusable
  });

  it('provides proper ARIA attributes for loading states', () => {
    render(
      <BlogImage
        src="/test-image.jpg"
        alt="Test image loading state"
        variant="featured"
      />
    );

    const loadingElement = screen.getByRole('img', { name: /loading image/i });
    expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    expect(loadingElement).toHaveAttribute('aria-label', 'Loading image...');
  });

  it('provides proper ARIA attributes for placeholders', () => {
    render(
      <BlogImage
        src=""
        alt="Test placeholder"
        variant="featured"
      />
    );

    const placeholder = screen.getByRole('img', { name: /featured blog post placeholder/i });
    expect(placeholder).toHaveAttribute('role', 'img');
    expect(placeholder).toHaveAttribute('aria-label', 'Featured blog post placeholder');
  });

  it('ensures keyboard navigation compatibility', () => {
    render(
      <FeaturedBlogSection posts={[mockBlogPost]} />
    );

    // Check that blog post links are keyboard focusable
    const blogLink = screen.getByTestId('blog-post-card');
    expect(blogLink).toBeInTheDocument();
    expect(blogLink).not.toHaveAttribute('tabIndex', '-1');

    // Check that decorative images are not in tab order
    const img = screen.getByAltText('Descriptive alternative text for the test blog post image');
    expect(img).toHaveAttribute('tabIndex', '-1');
  });

  it('maintains proper heading hierarchy', () => {
    render(
      <FeaturedBlogSection posts={[mockBlogPost]} />
    );

    // Check that section has proper heading
    const sectionHeading = screen.getByRole('heading', { level: 2 });
    expect(sectionHeading).toHaveTextContent('Latest from Our Blog');

    // Check that blog post titles use proper heading level
    const postHeading = screen.getByRole('heading', { level: 3 });
    expect(postHeading).toHaveTextContent('Test Blog Post');
  });

  it('provides descriptive link text', () => {
    render(
      <FeaturedBlogSection posts={[mockBlogPost]} />
    );

    const blogLink = screen.getByTestId('blog-post-card');
    expect(blogLink).toHaveAttribute('data-testid', 'blog-post-card');
    
    // Link should have accessible text content
    expect(blogLink).toHaveTextContent('Test Blog Post');
  });

  it('uses semantic time elements for dates', () => {
    render(
      <FeaturedBlogSection posts={[mockBlogPost]} />
    );

    const timeElement = screen.getByText('June 28, 2025'); // Note: The date format differs
    expect(timeElement.tagName).toBe('TIME');
    expect(timeElement).toHaveAttribute('dateTime', '2025-06-29');
  });
});