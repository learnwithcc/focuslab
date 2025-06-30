import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlogImage } from '../BlogImage';
import { FeaturedBlogSection } from '../FeaturedBlogSection';
import type { BlogPost } from '~/types/blog';

// Mock the image optimization utilities
const mockGenerateSrcSet = vi.fn((src) => `${src} 400w, ${src} 800w`);
const mockGenerateSizesAttribute = vi.fn(() => '(max-width: 640px) 100vw, 50vw');
const mockIsOptimizableImage = vi.fn(() => true);
const mockTrackImagePerformance = vi.fn();

vi.mock('~/utils/imageOptimization', () => ({
  generateSrcSet: mockGenerateSrcSet,
  generateSizesAttribute: mockGenerateSizesAttribute,
  isOptimizableImage: mockIsOptimizableImage,
  trackImagePerformance: mockTrackImagePerformance,
}));

const mockBlogPost: BlogPost = {
  slug: 'performance-test-post',
  frontmatter: {
    title: 'Performance Test Post',
    description: 'A test post for performance validation',
    publishedAt: '2025-06-29',
    author: 'Test Author',
    category: 'performance',
    tags: ['performance', 'optimization'],
    image: '/images/blog/performance-test.jpg',
    imageAlt: 'Performance test image',
    featured: true,
    draft: false,
    readingTime: 3
  },
  content: 'Performance test content',
  excerpt: 'Performance test excerpt',
  readingTime: { text: '3 min read', minutes: 3, time: 180000, words: 600 }
};

describe('Blog Image Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies performance optimization attributes', () => {
    render(
      <BlogImage
        src="/test-image.jpg"
        alt="Performance test image"
        variant="featured"
      />
    );

    const img = screen.getByAltText('Performance test image');
    
    // Check modern browser optimization attributes
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('loading', 'lazy');
    
    // Check responsive image attributes
    expect(img).toHaveAttribute('srcset');
    expect(img).toHaveAttribute('sizes');
  });

  it('uses eager loading for priority images', () => {
    render(
      <BlogImage
        src="/test-image.jpg"
        alt="Priority test image"
        variant="featured"
        priority={true}
      />
    );

    const img = screen.getByAltText('Priority test image');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('generates proper responsive image attributes', () => {
    render(
      <BlogImage
        src="/test-image.jpg"
        alt="Responsive test image"
        variant="featured"
      />
    );

    // Verify optimization utilities were called
    expect(mockGenerateSrcSet).toHaveBeenCalledWith('/test-image.jpg', 'featured');
    expect(mockGenerateSizesAttribute).toHaveBeenCalledWith('featured');
    expect(mockIsOptimizableImage).toHaveBeenCalledWith('/test-image.jpg');
  });

  it('tracks image performance metrics', async () => {
    const onLoad = vi.fn();
    render(
      <BlogImage
        src="/test-image.jpg"
        alt="Metrics test image"
        variant="featured"
        onLoad={onLoad}
      />
    );

    const img = screen.getByAltText('Metrics test image');
    
    // Simulate image load
    fireEvent.load(img);

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
      expect(mockTrackImagePerformance).toHaveBeenCalledWith(
        '/test-image.jpg',
        'featured',
        expect.any(Number),
        true
      );
    });
  });

  it('tracks image error metrics', async () => {
    const onError = vi.fn();
    render(
      <BlogImage
        src="/test-image.jpg"
        alt="Error test image"
        variant="featured"
        onError={onError}
      />
    );

    const img = screen.getByAltText('Error test image');
    
    // Simulate image error
    fireEvent.error(img);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
      expect(mockTrackImagePerformance).toHaveBeenCalledWith(
        '/test-image.jpg',
        'featured',
        expect.any(Number),
        false
      );
    });
  });

  it('provides smooth loading transitions', () => {
    render(
      <BlogImage
        src="/test-image.jpg"
        alt="Transition test image"
        variant="featured"
      />
    );

    const img = screen.getByAltText('Transition test image');
    
    // Check transition classes
    expect(img).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    
    // Should start with opacity-0 and be hidden initially
    expect(img).toHaveClass('opacity-0');
    expect(img).toHaveStyle({ display: 'none' });
  });

  it('implements proper loading skeleton', () => {
    render(
      <BlogImage
        src="/test-image.jpg"
        alt="Skeleton test image"
        variant="featured"
      />
    );

    const skeleton = screen.getByRole('img', { name: /loading image/i });
    
    // Check skeleton animation and accessibility
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading image...');
  });

  it('optimizes different image variants appropriately', () => {
    const { rerender } = render(
      <BlogImage
        src="/test-image.jpg"
        alt="Variant test image"
        variant="featured"
      />
    );
    
    expect(mockGenerateSrcSet).toHaveBeenCalledWith('/test-image.jpg', 'featured');

    rerender(
      <BlogImage
        src="/test-image.jpg"
        alt="Variant test image"
        variant="compact"
      />
    );
    
    expect(mockGenerateSrcSet).toHaveBeenCalledWith('/test-image.jpg', 'compact');
  });

  it('handles external images without optimization', () => {
    mockIsOptimizableImage.mockReturnValue(false);
    
    render(
      <BlogImage
        src="https://external.com/image.jpg"
        alt="External test image"
        variant="featured"
      />
    );

    const img = screen.getByAltText('External test image');
    
    // Should not have responsive attributes for external images
    expect(img).not.toHaveAttribute('srcset');
    expect(img).not.toHaveAttribute('sizes');
    
    // Should still have basic optimization attributes
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('implements efficient priority loading for featured blog posts', () => {
    render(
      <FeaturedBlogSection posts={[mockBlogPost]} />
    );

    const featuredImg = screen.getByAltText('Performance test image');
    
    // Featured images should use eager loading for better LCP
    expect(featuredImg).toHaveAttribute('loading', 'eager');
    expect(featuredImg).toHaveClass('group-hover:scale-105');
  });
});