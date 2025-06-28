# Blog System Migration Guide

## Overview

This guide provides detailed instructions for migrating the FocusLab blog system from its current file-based MDX implementation to a Directus-powered CMS backend while maintaining all functionality and SEO benefits.

## Migration Strategy

### Phase-Based Approach

The migration is designed as a seamless transition with zero downtime:

1. **Phase 1**: Directus Setup and Configuration
2. **Phase 2**: Content Export and Transformation  
3. **Phase 3**: Parallel System Implementation
4. **Phase 4**: Testing and Validation
5. **Phase 5**: Production Cutover
6. **Phase 6**: Cleanup and Optimization

### Architecture Overview

#### Current Architecture
```
File-based MDX → ContentService → Remix Routes → User Interface
```

#### Target Architecture
```
Directus CMS → ContentService → Remix Routes → User Interface
```

The ContentService abstraction layer ensures no changes to routes or UI components.

## Phase 1: Directus Setup

### Directus Installation

#### Cloud Setup (Recommended)

1. **Create Directus Cloud Account**
   - Sign up at [directus.cloud](https://directus.cloud)
   - Choose appropriate plan (Professional recommended)
   - Configure region close to users

2. **Initial Configuration**
   ```bash
   # Install Directus CLI for management
   npm install -g @directus/cli
   
   # Login to your instance
   npx directus-cli login https://your-instance.directus.app
   ```

#### Self-Hosted Setup (Alternative)

```bash
# Create new Directus project
npx create-directus-project focuslab-cms

# Configure environment
cd focuslab-cms
cp .env.example .env

# Edit .env with your database settings
DB_CLIENT="pg"
DB_HOST="localhost"
DB_PORT="5432"
DB_DATABASE="focuslab_cms"
DB_USER="directus"
DB_PASSWORD="your-secure-password"

# Initialize
npm start
```

### Schema Configuration

#### Collections Setup

Create the following collections in Directus:

1. **blog_posts**
   ```json
   {
     "collection": "blog_posts",
     "fields": [
       {
         "field": "id",
         "type": "uuid",
         "meta": { "hidden": true, "readonly": true }
       },
       {
         "field": "title",
         "type": "string",
         "meta": { "required": true, "width": "full" }
       },
       {
         "field": "slug",
         "type": "string",
         "meta": { "required": true, "readonly": true }
       },
       {
         "field": "description",
         "type": "text",
         "meta": { "required": true, "interface": "input-multiline" }
       },
       {
         "field": "content",
         "type": "text",
         "meta": { "interface": "input-rich-text-md" }
       },
       {
         "field": "published_at",
         "type": "dateTime",
         "meta": { "required": true }
       },
       {
         "field": "updated_at",
         "type": "dateTime"
       },
       {
         "field": "author",
         "type": "string",
         "meta": { "required": true }
       },
       {
         "field": "status",
         "type": "string",
         "meta": {
           "interface": "select-dropdown",
           "options": {
             "choices": [
               { "text": "Draft", "value": "draft" },
               { "text": "Published", "value": "published" },
               { "text": "Archived", "value": "archived" }
             ]
           }
         }
       },
       {
         "field": "featured",
         "type": "boolean",
         "meta": { "interface": "boolean" }
       },
       {
         "field": "image",
         "type": "uuid",
         "meta": { "interface": "file-image" }
       },
       {
         "field": "image_alt",
         "type": "string"
       },
       {
         "field": "category",
         "type": "uuid",
         "meta": { "interface": "select-dropdown-m2o" }
       }
     ]
   }
   ```

2. **blog_categories**
   ```json
   {
     "collection": "blog_categories",
     "fields": [
       {
         "field": "id",
         "type": "uuid",
         "meta": { "hidden": true, "readonly": true }
       },
       {
         "field": "name",
         "type": "string",
         "meta": { "required": true }
       },
       {
         "field": "slug",
         "type": "string",
         "meta": { "required": true, "readonly": true }
       },
       {
         "field": "description",
         "type": "text"
       }
     ]
   }
   ```

3. **blog_tags**
   ```json
   {
     "collection": "blog_tags",
     "fields": [
       {
         "field": "id",
         "type": "uuid"
       },
       {
         "field": "name",
         "type": "string",
         "meta": { "required": true }
       },
       {
         "field": "slug",
         "type": "string",
         "meta": { "required": true }
       }
     ]
   }
   ```

4. **blog_posts_tags** (Junction table)
   ```json
   {
     "collection": "blog_posts_tags",
     "fields": [
       {
         "field": "id",
         "type": "integer",
         "meta": { "hidden": true }
       },
       {
         "field": "blog_posts_id",
         "type": "uuid"
       },
       {
         "field": "blog_tags_id",
         "type": "uuid"
       }
     ]
   }
   ```

### Relationships Configuration

Set up relationships between collections:

1. **Categories → Posts** (One-to-Many)
   ```javascript
   // In blog_posts collection
   {
     "field": "category",
     "type": "uuid",
     "meta": {
       "interface": "select-dropdown-m2o",
       "options": {
         "template": "{{name}}"
       }
     },
     "schema": {
       "foreign_key_column": "category",
       "foreign_key_table": "blog_categories"
     }
   }
   ```

2. **Posts ↔ Tags** (Many-to-Many)
   ```javascript
   // In blog_posts collection
   {
     "field": "tags",
     "type": "alias",
     "meta": {
       "interface": "list-m2m",
       "special": ["m2m"]
     }
   }
   ```

### Permissions Setup

Configure role-based access:

1. **Content Manager Role**
   - Full CRUD access to blog collections
   - Image upload permissions
   - Cannot delete published posts

2. **Editor Role**
   - Create and edit draft posts
   - Cannot publish or delete
   - Read-only access to categories/tags

3. **Public Role**
   - Read-only access to published posts
   - Read access to categories and tags

```javascript
// Example permission configuration
{
  "role": "content-manager",
  "collection": "blog_posts",
  "action": "read",
  "permissions": {},
  "validation": {},
  "presets": {},
  "fields": ["*"]
}
```

## Phase 2: Content Export and Transformation

### Export Current Content

Use the built-in migration script:

```bash
# Export all blog content to Directus-compatible format
npm run migrate:export

# This creates:
# - migration-output/posts.json
# - migration-output/categories.json  
# - migration-output/tags.json
# - migration-output/redirects.json
```

### Data Transformation

The export script transforms MDX content:

```javascript
// Example transformation
const exportedPost = {
  title: frontmatter.title,
  slug: slug,
  description: frontmatter.description,
  content: convertMDXToMarkdown(content),
  published_at: frontmatter.publishedAt,
  updated_at: frontmatter.updatedAt,
  author: frontmatter.author,
  status: frontmatter.draft ? 'draft' : 'published',
  featured: frontmatter.featured || false,
  category: {
    name: frontmatter.category,
    slug: slugify(frontmatter.category)
  },
  tags: frontmatter.tags.map(tag => ({
    name: tag,
    slug: slugify(tag)
  }))
};
```

### Validation

Validate exported content:

```bash
# Validate migration data integrity
npm run migrate:validate

# Check for:
# - Missing required fields
# - Duplicate slugs
# - Invalid dates
# - Broken image references
```

## Phase 3: Parallel System Implementation

### Directus Content Service

Create new Directus-based content service:

```typescript
// app/services/directus-blog.server.ts
import { Directus } from '@directus/sdk';

interface DirectusCollections {
  blog_posts: DirectusPost;
  blog_categories: DirectusCategory;
  blog_tags: DirectusTag;
}

export class DirectusContentService implements ContentService {
  private directus: Directus<DirectusCollections>;

  constructor() {
    this.directus = new Directus(process.env.DIRECTUS_URL!, {
      auth: {
        staticToken: process.env.DIRECTUS_TOKEN!
      }
    });
  }

  async getAllPosts(
    filters?: BlogFilters,
    sort?: BlogSortOption,
    pagination?: Partial<BlogPagination>
  ): Promise<BlogSearchResult> {
    const query = this.buildPostQuery(filters, sort, pagination);
    
    const response = await this.directus.items('blog_posts').readByQuery({
      ...query,
      fields: [
        'id', 'title', 'slug', 'description', 'content',
        'published_at', 'updated_at', 'author', 'featured',
        'image.id', 'image.title', 'image.filename_download',
        'category.id', 'category.name', 'category.slug',
        'tags.blog_tags_id.id', 'tags.blog_tags_id.name', 'tags.blog_tags_id.slug'
      ]
    });

    return this.transformDirectusResponse(response);
  }

  private buildPostQuery(
    filters?: BlogFilters,
    sort?: BlogSortOption,
    pagination?: Partial<BlogPagination>
  ) {
    const query: any = {
      filter: { status: { _eq: 'published' } }
    };

    // Apply filters
    if (filters?.category) {
      query.filter.category = { slug: { _eq: filters.category } };
    }

    if (filters?.search) {
      query.filter._or = [
        { title: { _icontains: filters.search } },
        { description: { _icontains: filters.search } },
        { content: { _icontains: filters.search } }
      ];
    }

    // Apply sorting
    if (sort) {
      const direction = sort.direction === 'desc' ? '-' : '';
      query.sort = [`${direction}${sort.field}`];
    }

    // Apply pagination
    if (pagination) {
      query.limit = pagination.limit || 10;
      query.offset = ((pagination.page || 1) - 1) * (pagination.limit || 10);
      query.meta = ['total_count'];
    }

    return query;
  }

  private transformDirectusResponse(response: any): BlogSearchResult {
    const posts = response.data.map(this.transformDirectusPost);
    
    return {
      posts,
      pagination: {
        page: Math.floor(response.meta.offset / response.meta.limit) + 1,
        limit: response.meta.limit,
        total: response.meta.total_count,
        totalPages: Math.ceil(response.meta.total_count / response.meta.limit),
        hasNext: response.meta.offset + response.meta.limit < response.meta.total_count,
        hasPrev: response.meta.offset > 0
      },
      filters: {}, // Pass through filters
      sort: {} // Pass through sort
    };
  }

  private transformDirectusPost(directusPost: any): BlogPost {
    return {
      slug: directusPost.slug,
      frontmatter: {
        title: directusPost.title,
        description: directusPost.description,
        publishedAt: directusPost.published_at,
        updatedAt: directusPost.updated_at,
        author: directusPost.author,
        category: directusPost.category?.slug || '',
        tags: directusPost.tags?.map((t: any) => t.blog_tags_id.slug) || [],
        image: directusPost.image ? `/assets/${directusPost.image.filename_download}` : undefined,
        imageAlt: directusPost.image?.title,
        featured: directusPost.featured,
        draft: false
      },
      content: directusPost.content,
      readingTime: calculateReadingTime(directusPost.content),
      excerpt: generateExcerpt(directusPost.content)
    };
  }
}
```

### Environment-Based Service Selection

Update service factory:

```typescript
// app/services/blog.server.ts
function createContentService(): ContentService {
  if (process.env.USE_DIRECTUS === 'true') {
    return new DirectusContentService();
  }
  return new FileBasedContentService();
}

export const contentService = createContentService();
```

### Image Handling

For Directus images, update image URLs:

```typescript
// app/utils/image.ts
export function getImageUrl(imageField: any): string {
  if (!imageField) return '';
  
  if (process.env.USE_DIRECTUS === 'true') {
    // Directus image URL
    return `${process.env.DIRECTUS_URL}/assets/${imageField.filename_download}`;
  }
  
  // Local file-based image
  return imageField;
}
```

## Phase 4: Testing and Validation

### Testing Strategy

#### Unit Tests

Test Directus service implementation:

```typescript
// app/services/__tests__/directus-blog.test.ts
import { DirectusContentService } from '../directus-blog.server';

describe('DirectusContentService', () => {
  let service: DirectusContentService;

  beforeEach(() => {
    service = new DirectusContentService();
  });

  test('getAllPosts returns formatted posts', async () => {
    const result = await service.getAllPosts();
    
    expect(result.posts).toBeDefined();
    expect(result.pagination).toBeDefined();
    expect(result.posts[0]).toMatchObject({
      slug: expect.any(String),
      frontmatter: expect.objectContaining({
        title: expect.any(String),
        description: expect.any(String)
      })
    });
  });
});
```

#### Integration Tests

Test both services return compatible data:

```typescript
// app/services/__tests__/content-service-compatibility.test.ts
describe('Content Service Compatibility', () => {
  test('both services return compatible post structure', async () => {
    const fileService = new FileBasedContentService();
    const directusService = new DirectusContentService();

    const fileResult = await fileService.getAllPosts();
    const directusResult = await directusService.getAllPosts();

    // Structure should be identical
    expect(typeof fileResult).toBe(typeof directusResult);
    expect(Object.keys(fileResult)).toEqual(Object.keys(directusResult));
  });
});
```

### Content Migration Testing

#### Data Integrity Validation

```bash
# Compare exported vs original content
npm run migrate:validate

# Check specific post migration
npm run migrate:compare-post -- introducing-focuslab-blog
```

#### Feature Parity Testing

Test all blog features work with Directus:

1. **Blog Listing Page**
   - Posts load correctly
   - Pagination works
   - Filtering by category/tag works
   - Search functionality works

2. **Individual Post Pages**
   - Content renders correctly
   - Images display properly
   - Related posts appear
   - SEO meta tags generate correctly

3. **RSS Feed**
   - Feed validates as proper XML
   - All posts included
   - Content properly escaped

4. **Sitemap**
   - Blog URLs included
   - Last modified dates correct
   - Priority settings appropriate

### Performance Testing

Compare performance between systems:

```bash
# Lighthouse audit for both systems
lighthouse https://staging-file.focuslab.dev/blog --output=json > file-results.json
lighthouse https://staging-directus.focuslab.dev/blog --output=json > directus-results.json

# Compare Core Web Vitals
node scripts/compare-performance.js
```

## Phase 5: Production Cutover

### Pre-Cutover Checklist

- [ ] Directus instance fully configured and tested
- [ ] All content migrated and validated
- [ ] Performance testing completed
- [ ] Backup procedures in place
- [ ] Rollback plan prepared
- [ ] Team trained on new system

### Cutover Process

#### Step 1: Content Sync
```bash
# Final content export and import
npm run migrate:export
npm run migrate:import-to-directus
```

#### Step 2: Environment Update
```bash
# Update production environment variables
export USE_DIRECTUS=true
export DIRECTUS_URL=https://focuslab-cms.directus.app
export DIRECTUS_TOKEN=your-production-token
```

#### Step 3: Deployment
```bash
# Deploy with Directus configuration
npm run build
npm run deploy
```

#### Step 4: Verification
- [ ] All blog pages load correctly
- [ ] RSS feed accessible and valid
- [ ] Search functionality works
- [ ] Images display properly
- [ ] SEO meta tags present

### Rollback Procedure

If issues arise:

```bash
# Immediate rollback
export USE_DIRECTUS=false
npm run deploy

# Or rollback to previous deployment
vercel rollback --scope=focuslab
```

## Phase 6: Cleanup and Optimization

### File System Cleanup

After successful migration:

```bash
# Archive old MDX files
mkdir -p archive/content
mv content/blog archive/content/

# Remove migration scripts (optional)
rm -rf migration-output/
rm scripts/migrate-to-directus.ts
```

### Performance Optimization

#### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_blog_posts_status_published_at ON blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_featured ON blog_posts(featured) WHERE featured = true;

-- Full-text search indexes
CREATE INDEX idx_blog_posts_search ON blog_posts USING gin(to_tsvector('english', title || ' ' || description || ' ' || content));
```

#### Caching Strategy

Implement Directus-specific caching:

```typescript
// app/utils/cache.ts
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5 // 5 minutes
});

export async function getCachedPosts(key: string, fetcher: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetcher();
  cache.set(key, data);
  return data;
}
```

### Content Management Workflow

#### Editor Training

Train content creators on Directus interface:

1. **Creating Posts**: Use rich text editor with markdown support
2. **Managing Media**: Upload and organize images
3. **Categories/Tags**: Create and assign taxonomy
4. **Publishing**: Draft → Review → Publish workflow

#### Editorial Workflow

Set up approval process:

1. **Draft Creation**: Authors create drafts
2. **Review Stage**: Editors review and suggest changes
3. **Approval**: Content managers approve for publishing
4. **Publication**: Automated or manual publication

## Monitoring and Maintenance

### Post-Migration Monitoring

#### Key Metrics to Track

1. **Performance Metrics**
   - Page load times (compare to pre-migration)
   - Database query performance
   - API response times

2. **Content Metrics**
   - Content creation velocity
   - Editorial workflow efficiency
   - User engagement (unchanged expected)

3. **Error Monitoring**
   - API failures
   - Content rendering errors
   - Image loading issues

#### Directus-Specific Monitoring

```javascript
// Directus health check endpoint
app.get('/api/health/directus', async (req, res) => {
  try {
    await directus.server.health();
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});
```

### Long-term Maintenance

#### Regular Tasks

1. **Weekly**: Monitor Directus performance and logs
2. **Monthly**: Review and optimize database queries
3. **Quarterly**: Evaluate content workflow efficiency
4. **Annually**: Plan for Directus updates and migrations

#### Backup Strategy

```bash
# Automated Directus backup
#!/bin/bash
# Export all Directus data
npx directus schema snapshot --yes ./backups/schema-$(date +%Y%m%d).yaml
npx directus database export ./backups/data-$(date +%Y%m%d).sql

# Upload to cloud storage
aws s3 cp ./backups/ s3://focuslab-directus-backups/ --recursive
```

## Troubleshooting

### Common Migration Issues

#### Content Formatting Problems

**Issue**: MDX components not rendering in Directus
**Solution**: Update content to use HTML or implement custom Directus interfaces

**Issue**: Image paths broken after migration
**Solution**: Update image references to use Directus asset URLs

#### Performance Issues

**Issue**: Slower page loads after migration
**Solution**: 
- Implement query optimization
- Add database indexes
- Enable Directus caching
- Use CDN for assets

#### API Errors

**Issue**: Directus API timeouts
**Solution**:
- Optimize database queries
- Increase server resources
- Implement query pagination
- Add error handling and retries

### Support and Resources

#### Directus Documentation
- [Official Documentation](https://docs.directus.io/)
- [API Reference](https://docs.directus.io/reference/introduction/)
- [Community Forum](https://github.com/directus/directus/discussions)

#### Migration Support
- Review migration logs for specific errors
- Test individual content pieces if issues arise
- Use staging environment for debugging
- Contact Directus support for platform issues

## Conclusion

This migration guide provides a comprehensive roadmap for transitioning from file-based MDX to Directus CMS while maintaining all existing functionality. The phased approach ensures minimal risk and allows for thorough testing at each stage.

Key success factors:
- Thorough testing in staging environment
- Proper backup and rollback procedures
- Team training on new workflow
- Performance monitoring throughout transition
- Clear communication with stakeholders

The ContentService abstraction layer makes this migration possible without changing any user-facing functionality, ensuring a seamless transition for both content creators and end users.