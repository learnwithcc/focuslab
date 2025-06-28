# Directus Migration Strategy

This document outlines the comprehensive strategy for migrating the FocusLab blog system from file-based MDX content to Directus CMS, while maintaining zero downtime and preserving SEO value.

## Overview

The blog system is architected with a `ContentService` interface that abstracts content fetching. This allows us to seamlessly migrate from file-based content to Directus without changing any React components or user-facing functionality.

## Architecture Benefits

### Current File-Based System
- ✅ Version controlled content alongside code
- ✅ Simple deployment (no external dependencies)
- ✅ Fast build-time compilation
- ✅ No additional infrastructure costs
- ❌ Limited editorial workflow
- ❌ No rich editing interface
- ❌ Requires developer access to publish

### Future Directus System
- ✅ Rich editorial interface
- ✅ Role-based access control
- ✅ Media management
- ✅ Workflow management
- ✅ API-first architecture
- ✅ Real-time publishing
- ❌ Additional infrastructure complexity
- ❌ External dependency
- ❌ Additional hosting costs

## Migration Timeline

### Phase 1: Preparation (Current)
- [x] Implement ContentService abstraction layer
- [x] Create blog components and UI
- [x] Establish TypeScript interfaces
- [x] Build migration utilities
- [ ] Set up Directus instance
- [ ] Configure collections and permissions

### Phase 2: Parallel Development (Next)
- [ ] Implement DirectusContentService
- [ ] Create content import scripts
- [ ] Set up staging environment
- [ ] Implement dual-mode support

### Phase 3: Testing & Validation
- [ ] Import existing content to Directus
- [ ] Test all blog functionality with Directus
- [ ] Performance comparison
- [ ] SEO validation
- [ ] User acceptance testing

### Phase 4: Migration (Future)
- [ ] DNS/CDN setup for Directus
- [ ] Final content sync
- [ ] Switch environment variable
- [ ] Monitor and validate
- [ ] Remove file-based code (optional)

## Technical Implementation

### ContentService Interface

The `ContentService` interface ensures both implementations provide identical functionality:

```typescript
interface ContentService {
  getAllPosts(filters?, sort?, pagination?): Promise<BlogSearchResult>;
  getPostBySlug(slug: string): Promise<BlogPost | null>;
  getFeaturedPosts(limit?: number): Promise<BlogPost[]>;
  // ... all other methods
}
```

### Environment-Based Switching

Content service selection is environment-driven:

```typescript
export function createContentService(): ContentService {
  if (shouldUseDirectus()) {
    return new DirectusContentService();
  } else {
    return new FileBasedContentService();
  }
}
```

### Data Model Mapping

The migration utilities handle conversion between formats:

| MDX Field | Directus Field | Notes |
|-----------|----------------|-------|
| `frontmatter.title` | `title` | Direct mapping |
| `frontmatter.publishedAt` | `published_at` | Date format preserved |
| `frontmatter.category` | `category` (relation) | Normalized to separate collection |
| `frontmatter.tags` | `tags` (M2M relation) | Many-to-many relationship |
| `content` | `content` | MDX content preserved |
| `slug` | `slug` | URL structure maintained |

## Directus Collections Schema

### Blog Posts Collection (`blog_posts`)
```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'draft',
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image UUID REFERENCES directus_files(id),
  featured_image_alt TEXT,
  author VARCHAR(255),
  category UUID REFERENCES blog_categories(id),
  featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Categories Collection (`blog_categories`)
```sql
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tags Collection (`blog_tags`)
```sql
CREATE TABLE blog_tags (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Post-Tags Junction (`blog_posts_tags`)
```sql
CREATE TABLE blog_posts_tags (
  id UUID PRIMARY KEY,
  blog_posts_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  blog_tags_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE
);
```

## Migration Process

### 1. Content Export
```bash
# Export existing MDX content to Directus format
npm run blog:export-to-directus
```

### 2. Directus Setup
```bash
# Set up Directus instance
npx create-directus-project blog-cms
cd blog-cms
npm install
```

### 3. Schema Creation
```bash
# Apply schema to Directus
npm run directus:schema:apply
```

### 4. Content Import
```bash
# Import content to Directus
npm run directus:import
```

### 5. Environment Switch
```bash
# Enable Directus mode
export USE_DIRECTUS=true
export DIRECTUS_URL=https://cms.focuslab.dev
export DIRECTUS_TOKEN=your_token_here
```

## SEO Preservation

### URL Structure
- Blog URLs remain identical: `/blog/post-slug`
- Category URLs: `/blog/category/category-slug`
- Tag URLs: `/blog/tag/tag-slug`

### Meta Data
- All meta tags preserved
- Structured data maintained
- RSS feed compatibility
- Sitemap generation unchanged

### Redirects
- No redirects needed (URLs unchanged)
- 301 redirects for any slug changes
- Canonical URLs properly set

## Performance Considerations

### Caching Strategy
```typescript
// File-based: Build-time compilation
const posts = await compileMDXAtBuildTime();

// Directus: Runtime caching
const posts = await getCachedDirectusPosts();
```

### API Optimization
- GraphQL queries for efficient data fetching
- Image optimization through Directus
- CDN integration for global performance
- Edge caching for blog content

### Build Process
- File-based: Static generation at build time
- Directus: ISR (Incremental Static Regeneration)
- Background revalidation for fresh content

## Risk Mitigation

### Rollback Strategy
1. Environment variable switch back to file-based
2. Keep file-based content in sync during transition
3. Database backups before migration
4. Blue-green deployment approach

### Monitoring
- Performance metrics comparison
- Error tracking for API failures
- Content validation checks
- SEO impact monitoring

### Fallback Mechanisms
```typescript
async getPostBySlug(slug: string) {
  try {
    return await this.directusRequest(`/posts/${slug}`);
  } catch (error) {
    // Fallback to cached file-based content
    return await this.fileBasedFallback(slug);
  }
}
```

## Content Workflow

### File-Based (Current)
1. Write MDX file in `/content/blog/`
2. Commit to Git
3. Deploy triggers build
4. Content published

### Directus (Future)
1. Write in Directus admin interface
2. Set status to "published"
3. Webhook triggers revalidation
4. Content published instantly

## Team Training

### Content Editors
- Directus admin interface training
- Markdown formatting in rich text editor
- Media management workflow
- Publishing workflow

### Developers
- Directus API usage
- Schema management
- Migration utility usage
- Troubleshooting guide

## Success Metrics

### Technical
- [ ] Zero downtime migration
- [ ] Performance parity or improvement
- [ ] All URLs functioning correctly
- [ ] SEO metrics maintained

### Editorial
- [ ] Reduced time to publish
- [ ] Improved editing experience
- [ ] Better media management
- [ ] Enhanced collaboration

### Business
- [ ] Increased publishing frequency
- [ ] Improved content quality
- [ ] Better SEO performance
- [ ] Reduced technical debt

## Post-Migration

### Cleanup
- Archive file-based content
- Remove unused dependencies
- Update documentation
- Team knowledge transfer

### Optimization
- Performance tuning
- Content strategy refinement
- SEO enhancement
- Analytics improvement

## Emergency Procedures

### Migration Failure
1. Immediately switch `USE_DIRECTUS=false`
2. Verify file-based system functionality
3. Investigate and resolve Directus issues
4. Plan retry strategy

### Performance Issues
1. Enable additional caching layers
2. Optimize Directus queries
3. Consider CDN adjustments
4. Monitor resource usage

### Data Loss Prevention
- Daily automated backups
- Point-in-time recovery capability
- Content versioning in Directus
- File-based content retention

This migration strategy ensures a smooth transition while maintaining all current functionality and preserving SEO value.