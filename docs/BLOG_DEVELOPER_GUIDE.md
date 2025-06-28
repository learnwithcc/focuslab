# Blog System Developer Guide

## Overview

This guide provides technical documentation for developers working with the FocusLab MDX blog system, including architecture details, API references, and customization instructions.

## Architecture

### Core Components

#### ContentService Interface

The blog system uses an abstraction layer for future CMS migration:

```typescript
interface ContentService {
  // Blog Posts
  getAllPosts(filters?: BlogFilters, sort?: BlogSortOption, pagination?: Partial<BlogPagination>): Promise<BlogSearchResult>;
  getPostBySlug(slug: string): Promise<BlogPost | null>;
  getFeaturedPosts(limit?: number): Promise<BlogPost[]>;
  getRelatedPosts(slug: string, limit?: number): Promise<BlogPost[]>;
  
  // Categories & Tags
  getAllCategories(): Promise<BlogCategory[]>;
  getAllTags(): Promise<BlogTag[]>;
  
  // RSS/Sitemap
  getPostsForRSS(): Promise<BlogPost[]>;
  getPostsForSitemap(): Promise<Pick<BlogPost, 'slug' | 'frontmatter'>[]>;
}
```

#### Current Implementation

The file-based implementation (`FileBasedContentService`) reads MDX files from `/content/blog/`:

```typescript
// app/services/blog.server.ts
class FileBasedContentService implements ContentService {
  private async getAllPostsFromDisk(): Promise<BlogPost[]> {
    // Reads and processes MDX files
  }
  
  private async processMarkdownFile(filePath: string): Promise<BlogPost> {
    // Parses frontmatter and compiles MDX
  }
}
```

### Data Types

#### BlogPost Interface

```typescript
interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  content: string;
  excerpt?: string;
  readingTime: {
    text: string;
    minutes: number;
    time: number;
    words: number;
  };
  html?: string;
}

interface BlogPostFrontmatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  imageAlt?: string;
  featured?: boolean;
  draft?: boolean;
}
```

#### Category and Tag Interfaces

```typescript
interface BlogCategory {
  name: string;
  slug: string;
  description?: string;
  postCount: number;
}

interface BlogTag {
  name: string;
  slug: string;
  postCount: number;
}
```

## Routes Implementation

### Blog Index Route (`/blog`)

**File**: `app/routes/blog._index.tsx`

**Features**:
- Paginated post listing
- Category and tag filtering
- Search functionality
- Responsive grid layout

**Key Functions**:
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const tag = url.searchParams.get('tag');
  const page = parseInt(url.searchParams.get('page') || '1', 10);

  const blogData = await getAllBlogPosts(
    { category, tag },
    { field: 'publishedAt', direction: 'desc' },
    { page, limit: 12 }
  );

  return json({ posts: blogData.posts, pagination: blogData.pagination });
}
```

### Individual Post Route (`/blog/$slug`)

**File**: `app/routes/blog.$slug.tsx`

**Features**:
- MDX content rendering
- Related posts sidebar
- Breadcrumb navigation
- SEO meta generation
- Structured data

**MDX Components**:
```typescript
const mdxComponents = {
  h1: (props) => <h1 className="font-heading text-3xl..." {...props} />,
  h2: (props) => <h2 className="font-heading text-2xl..." {...props} />,
  // Custom blog components
  BlogCallout,
  InfoCallout,
  WarningCallout,
  // ... other components
};
```

### RSS Feed (`/blog/rss.xml`)

**File**: `app/routes/blog.rss.xml.tsx`

**Features**:
- XML RSS 2.0 format
- Automatic content inclusion
- Proper caching headers
- Image enclosures

## Component API Reference

### BlogPostCard

Primary component for displaying post previews:

```typescript
interface BlogPostCardProps {
  post: BlogPost;
  variant?: 'default' | 'featured' | 'compact';
  showExcerpt?: boolean;
  className?: string;
}

// Usage
<BlogPostCard 
  post={post} 
  variant="featured"
  showExcerpt={true}
/>
```

**Variants**:
- `default`: Standard card layout
- `featured`: Larger hero-style layout
- `compact`: Minimal layout for sidebars

### Blog Callouts

Content highlighting components:

```typescript
interface BlogCalloutProps {
  type: 'info' | 'warning' | 'success' | 'error' | 'tip';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// Usage in MDX
<BlogCallout type="info" title="Pro Tip">
This is important information.
</BlogCallout>
```

### FeaturedBlogSection

Homepage blog integration:

```typescript
interface FeaturedBlogSectionProps {
  posts: BlogPost[];
  title?: string;
  showViewAll?: boolean;
  className?: string;
}
```

## SEO Implementation

### Structured Data

The system automatically generates JSON-LD structured data:

```typescript
// Article schema for individual posts
const articleSchema = generateArticleSchema(post, baseUrl);

// Blog schema for listing pages  
const blogSchema = generateBlogSchema(baseUrl);

// Breadcrumb schema
const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);
```

### Meta Tags

Automated meta tag generation using the SEO utility:

```typescript
export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
  const articleSchema = generateArticleSchema(data.post);
  const structuredDataMeta = generateStructuredDataMeta([articleSchema]);
  
  return [
    ...generateMeta({
      title: `${data.post.frontmatter.title} - FocusLab Blog`,
      description: data.post.frontmatter.description,
      type: 'article',
    }),
    ...structuredDataMeta,
  ];
};
```

### Sitemap Integration

Blog content is automatically included in the sitemap:

```typescript
// app/utils/sitemap.ts
export async function generateBlogUrls(): Promise<SitemapUrl[]> {
  const [posts, categories, tags] = await Promise.all([
    contentService.getPostsForSitemap(),
    contentService.getAllCategories(),
    contentService.getAllTags()
  ]);

  return [
    ...posts.map(post => ({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.frontmatter.updatedAt || post.frontmatter.publishedAt,
      changefreq: 'monthly',
      priority: 0.7
    })),
    // ... categories and tags
  ];
}
```

## Customization Guide

### Adding New Blog Components

1. Create component in `app/components/blog/`:

```typescript
// app/components/blog/CustomComponent.tsx
interface CustomComponentProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function CustomComponent({ children, variant = 'primary' }: CustomComponentProps) {
  return (
    <div className={`custom-component custom-component--${variant}`}>
      {children}
    </div>
  );
}
```

2. Export from index:

```typescript
// app/components/blog/index.ts
export { CustomComponent } from './CustomComponent';
```

3. Add to MDX components:

```typescript
// app/routes/blog.$slug.tsx
import { CustomComponent } from '~/components/blog';

const mdxComponents = {
  // ... existing components
  CustomComponent,
};
```

### Extending the ContentService

To add new functionality:

1. Update the interface:

```typescript
// app/types/blog.ts
interface ContentService {
  // ... existing methods
  getPostsByAuthor(author: string): Promise<BlogPost[]>;
  getArchive(): Promise<{ year: number; month: number; posts: BlogPost[] }[]>;
}
```

2. Implement in the service:

```typescript
// app/services/blog.server.ts
class FileBasedContentService implements ContentService {
  async getPostsByAuthor(author: string): Promise<BlogPost[]> {
    const allPosts = await this.getAllPosts();
    return allPosts.posts.filter(post => 
      post.frontmatter.author.toLowerCase() === author.toLowerCase()
    );
  }
}
```

### Custom Route Handlers

Add new blog-related routes:

```typescript
// app/routes/blog.authors.$author.tsx
export async function loader({ params }: LoaderFunctionArgs) {
  const { author } = params;
  const posts = await contentService.getPostsByAuthor(author);
  
  return json({ author, posts });
}

export default function AuthorPage() {
  const { author, posts } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Posts by {author}</h1>
      {posts.map(post => (
        <BlogPostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
```

## Performance Optimization

### Caching Strategy

The blog system implements multi-layer caching:

1. **Build-time**: Static generation of all content
2. **Runtime**: In-memory post caching
3. **HTTP**: Cache headers for RSS and sitemap
4. **CDN**: Browser and CDN caching for static assets

### Bundle Optimization

- **Code Splitting**: Blog routes are lazy-loaded
- **Component Chunking**: Blog components are in separate chunks
- **Image Optimization**: Automatic image optimization for blog images

### Database Queries (Future Directus)

When migrating to Directus, implement these optimizations:

```typescript
// Efficient queries with field selection
const posts = await directus.items('posts').readByQuery({
  fields: ['id', 'title', 'slug', 'published_date'],
  filter: { status: { _eq: 'published' } },
  sort: ['-published_date'],
  limit: 10
});

// Batch loading for related data
const [posts, categories] = await Promise.all([
  directus.items('posts').readByQuery(postsQuery),
  directus.items('categories').readByQuery(categoriesQuery)
]);
```

## Testing

### Unit Tests

Test individual components and utilities:

```typescript
// app/components/blog/__tests__/BlogPostCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BlogPostCard } from '../BlogPostCard';

const mockPost = {
  slug: 'test-post',
  frontmatter: {
    title: 'Test Post',
    description: 'Test description',
    // ... other required fields
  },
  // ... other required fields
};

test('renders blog post card with title', () => {
  render(<BlogPostCard post={mockPost} />);
  expect(screen.getByText('Test Post')).toBeInTheDocument();
});
```

### Integration Tests

Test route behavior:

```typescript
// app/routes/__tests__/blog._index.test.tsx
import { createRemixStub } from '@remix-run/testing';

test('blog index loads posts correctly', async () => {
  const RemixStub = createRemixStub([
    {
      path: '/blog',
      Component: BlogIndex,
      loader,
    },
  ]);

  render(<RemixStub initialEntries={['/blog']} />);
  
  await waitFor(() => {
    expect(screen.getByText('Latest Posts')).toBeInTheDocument();
  });
});
```

### E2E Tests

Test complete user workflows:

```typescript
// e2e/blog.spec.ts
import { test, expect } from '@playwright/test';

test('user can browse and read blog posts', async ({ page }) => {
  await page.goto('/blog');
  
  // Should show blog listing
  await expect(page.locator('h1')).toContainText('FocusLab Blog');
  
  // Click on first post
  await page.locator('[data-testid="blog-post-card"]').first().click();
  
  // Should navigate to post page
  await expect(page.locator('article')).toBeVisible();
});
```

## Deployment

### Build Process

The blog system is built during the standard Remix build:

```bash
npm run build
```

This processes:
- MDX files compilation
- Route generation
- Static asset optimization
- Sitemap and RSS generation

### Environment Variables

No additional environment variables required for the file-based system. For future Directus integration:

```env
DIRECTUS_URL=https://cms.focuslab.dev
DIRECTUS_TOKEN=your-access-token
USE_DIRECTUS=true
```

### Vercel Configuration

The system works with standard Vercel Remix deployment. Ensure:

- Build command: `npm run build`
- Output directory: `build`
- Node.js version: 18+

## Migration to Directus

### Preparation

1. Set up Directus instance
2. Create content collections matching the schema
3. Run migration script to export existing content

### Migration Script

```bash
# Export current content to Directus format
npm run migrate:export

# Validate migration data
npm run migrate:validate

# Import to Directus (requires setup)
npm run migrate:import
```

### Environment Switching

Toggle between file-based and Directus:

```typescript
// app/services/blog.server.ts
const contentService = process.env.USE_DIRECTUS === 'true' 
  ? new DirectusContentService()
  : new FileBasedContentService();
```

## Troubleshooting

### Common Issues

**MDX compilation errors:**
- Check frontmatter YAML syntax
- Verify all required frontmatter fields
- Ensure MDX components are properly imported

**Build failures:**
- Check for TypeScript errors
- Verify all image paths exist
- Ensure proper file permissions

**Performance issues:**
- Monitor bundle size with `npm run build`
- Check for unnecessary re-renders
- Optimize image sizes and formats

### Debug Mode

Enable debug logging:

```typescript
// app/services/blog.server.ts
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Loading posts from:', contentDir);
}
```

### Monitoring

In production, monitor:
- RSS feed access patterns
- Blog page performance
- Search functionality usage
- 404 errors for blog routes