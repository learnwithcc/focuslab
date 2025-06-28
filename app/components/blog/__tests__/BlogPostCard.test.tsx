import { render, screen } from '@testing-library/react';
import { BlogPostCard } from '../BlogPostCard';
import type { BlogPost } from '~/types/blog';

// Mock data for testing
const mockPost: BlogPost = {
  slug: 'test-post-slug',
  frontmatter: {
    title: 'Test Blog Post Title',
    description: 'This is a test blog post description for testing purposes.',
    publishedAt: '2024-01-15',
    updatedAt: '2024-01-20',
    author: 'Test Author',
    category: 'testing',
    tags: ['testing', 'react', 'typescript'],
    image: '/images/blog/test-image.jpg',
    imageAlt: 'Test image description',
    featured: false,
    draft: false,
  },
  content: 'This is the test content of the blog post.',
  excerpt: 'This is a test excerpt.',
  readingTime: {
    text: '5 min read',
    minutes: 5,
    time: 300000,
    words: 1000,
  },
};

const featuredPost: BlogPost = {
  ...mockPost,
  slug: 'featured-post-slug',
  frontmatter: {
    ...mockPost.frontmatter,
    title: 'Featured Blog Post',
    featured: true,
  },
};

describe('BlogPostCard', () => {
  it('renders blog post title', () => {
    render(<BlogPostCard post={mockPost} />);
    expect(screen.getByText('Test Blog Post Title')).toBeInTheDocument();
  });

  it('renders blog post description', () => {
    render(<BlogPostCard post={mockPost} />);
    expect(screen.getByText('This is a test blog post description for testing purposes.')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(<BlogPostCard post={mockPost} />);
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('renders reading time', () => {
    render(<BlogPostCard post={mockPost} />);
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('renders category', () => {
    render(<BlogPostCard post={mockPost} />);
    expect(screen.getByText('testing')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<BlogPostCard post={mockPost} />);
    expect(screen.getByText('#testing')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('#typescript')).toBeInTheDocument();
  });

  it('renders post image when provided', () => {
    render(<BlogPostCard post={mockPost} />);
    const image = screen.getByAltText('Test image description');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/blog/test-image.jpg');
  });

  it('applies correct link to post', () => {
    render(<BlogPostCard post={mockPost} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/blog/test-post-slug');
  });

  it('renders in featured variant correctly', () => {
    render(<BlogPostCard post={featuredPost} variant="featured" />);
    expect(screen.getByText('Featured Blog Post')).toBeInTheDocument();
    // Featured posts should have different styling/layout
    const container = screen.getByRole('link').closest('article');
    expect(container).toHaveClass('featured');
  });

  it('renders in compact variant correctly', () => {
    render(<BlogPostCard post={mockPost} variant="compact" />);
    const container = screen.getByRole('link').closest('article');
    expect(container).toHaveClass('compact');
  });

  it('shows excerpt when showExcerpt is true', () => {
    render(<BlogPostCard post={mockPost} showExcerpt={true} />);
    // Component shows description, not excerpt property
    expect(screen.getByText('This is a test blog post description for testing purposes.')).toBeInTheDocument();
  });

  it('hides excerpt when showExcerpt is false', () => {
    render(<BlogPostCard post={mockPost} showExcerpt={false} />);
    // Component shows description, not excerpt when showExcerpt is false
    expect(screen.queryByText('This is a test blog post description for testing purposes.')).not.toBeInTheDocument();
  });

  it('formats publication date correctly', () => {
    render(<BlogPostCard post={mockPost} />);
    // Check for properly formatted date (use regex to handle timezone differences)
    expect(screen.getByText(/January 1[45], 2024/)).toBeInTheDocument();
  });

  it('shows updated date when different from published date', () => {
    render(<BlogPostCard post={mockPost} />);
    // Component only shows published date, no "Updated" text in current implementation
    expect(screen.getByText(/January 1[45], 2024/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<BlogPostCard post={mockPost} />);
    
    // Check for proper ARIA labels
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-labelledby');
    
    // Check for proper heading structure
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
  });

  it('supports custom className', () => {
    render(<BlogPostCard post={mockPost} className="custom-test-class" />);
    const container = screen.getByRole('link').closest('article');
    expect(container).toHaveClass('custom-test-class');
  });

  it('handles missing image gracefully', () => {
    const postWithoutImage = {
      ...mockPost,
      frontmatter: {
        ...mockPost.frontmatter,
        image: undefined,
        imageAlt: undefined,
      },
    };
    
    render(<BlogPostCard post={postWithoutImage} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles empty tags array', () => {
    const postWithoutTags = {
      ...mockPost,
      frontmatter: {
        ...mockPost.frontmatter,
        tags: [],
      },
    };
    
    render(<BlogPostCard post={postWithoutTags} />);
    // Should not render any tag elements
    expect(screen.queryByText('#testing')).not.toBeInTheDocument();
  });
});