import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlogImage } from '../BlogImage';

// Mock the image optimization utilities
vi.mock('~/utils/imageOptimization', () => ({
  generateSrcSet: vi.fn((src) => `${src} 400w, ${src} 800w`),
  generateSizesAttribute: vi.fn(() => '(max-width: 640px) 100vw, 50vw'),
  isOptimizableImage: vi.fn(() => true),
  trackImagePerformance: vi.fn(),
}));

describe('BlogImage', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image',
    variant: 'default' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    render(<BlogImage {...defaultProps} />);
    
    const skeleton = screen.getByRole('img', { name: /loading image/i });
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
  });

  it('renders placeholder when no src provided', () => {
    render(<BlogImage {...defaultProps} src="" />);
    
    const placeholder = screen.getByRole('img', { name: /blog post image placeholder/i });
    expect(placeholder).toBeInTheDocument();
  });

  it('renders variant-specific placeholders', () => {
    const { rerender } = render(<BlogImage {...defaultProps} src="" variant="featured" />);
    expect(screen.getByRole('img', { name: /featured blog post placeholder/i })).toBeInTheDocument();

    rerender(<BlogImage {...defaultProps} src="" variant="compact" />);
    expect(screen.getByRole('img', { name: /blog post thumbnail placeholder/i })).toBeInTheDocument();
  });

  it('applies priority loading for above-the-fold images', () => {
    render(<BlogImage {...defaultProps} priority={true} />);
    
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('uses lazy loading by default', () => {
    render(<BlogImage {...defaultProps} />);
    
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('handles image load success', async () => {
    const onLoad = vi.fn();
    render(<BlogImage {...defaultProps} onLoad={onLoad} />);
    
    const img = screen.getByAltText('Test image');
    
    // Simulate image load
    fireEvent.load(img);
    
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('handles image load error', async () => {
    const onError = vi.fn();
    render(<BlogImage {...defaultProps} onError={onError} />);
    
    const img = screen.getByAltText('Test image');
    
    // Simulate image error
    fireEvent.error(img);
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
      expect(screen.getByRole('img', { name: /blog post image placeholder/i })).toBeInTheDocument();
    });
  });

  it('includes performance optimization attributes', () => {
    render(<BlogImage {...defaultProps} />);
    
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('role', 'img');
    expect(img).toHaveAttribute('tabIndex', '-1');
  });

  it('applies responsive image attributes for optimizable images', () => {
    render(<BlogImage {...defaultProps} />);
    
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('srcset');
    expect(img).toHaveAttribute('sizes');
  });

  it('provides proper accessibility attributes', () => {
    render(<BlogImage {...defaultProps} alt="Descriptive alt text" />);
    
    const img = screen.getByAltText('Descriptive alt text');
    expect(img).toHaveAttribute('alt', 'Descriptive alt text');
    expect(img).toHaveAttribute('role', 'img');
  });
});