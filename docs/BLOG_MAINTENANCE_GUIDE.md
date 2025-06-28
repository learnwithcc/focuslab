# Blog System Maintenance Guide

## Overview

This guide provides system administrators and site maintainers with the information needed to keep the FocusLab MDX blog system running smoothly, including monitoring, updates, and troubleshooting procedures.

## System Monitoring

### Key Metrics to Track

#### Performance Metrics
- **Page Load Times**: Blog index and individual posts
- **Core Web Vitals**: LCP, FID, CLS for all blog pages
- **RSS Feed Response Time**: Monitor `/blog/rss.xml` endpoint
- **Search Functionality**: Client-side search response times

#### Content Metrics
- **Post Publishing Rate**: Frequency of new content
- **Content Engagement**: Page views, time on page, bounce rate
- **Search Usage**: Most searched terms and success rates
- **RSS Subscribers**: Feed subscription analytics

#### Error Monitoring
- **404 Errors**: Missing blog posts or broken internal links
- **Build Failures**: MDX compilation or content processing errors
- **SEO Issues**: Missing meta tags, structured data errors
- **Accessibility Violations**: WCAG compliance monitoring

### Monitoring Tools

#### Recommended Setup

```javascript
// Example monitoring configuration
const monitoring = {
  performance: {
    tool: 'Vercel Analytics',
    alerts: {
      slowPages: '> 3s load time',
      highBounceRate: '> 70%'
    }
  },
  errors: {
    tool: 'Sentry',
    integration: '@sentry/remix',
    alerts: ['build-failures', '404-errors', 'runtime-errors']
  },
  seo: {
    tools: ['Google Search Console', 'Lighthouse CI'],
    checks: ['structured-data', 'meta-tags', 'sitemap-health']
  }
};
```

#### Dashboard Setup

Create monitoring dashboards tracking:

1. **Blog Performance Dashboard**
   - Average page load times
   - Traffic patterns and peak usage
   - Most popular content
   - RSS feed health

2. **Content Health Dashboard**
   - Recently published posts
   - Draft posts pending review
   - Content with broken links
   - SEO score distribution

3. **System Health Dashboard**
   - Build success/failure rates
   - Deployment frequency
   - Error rates and types
   - Cache hit rates

## Routine Maintenance Tasks

### Daily Tasks

#### Content Review
- [ ] Check for new draft posts requiring review
- [ ] Monitor for spam or inappropriate comments (if comments are enabled)
- [ ] Verify RSS feed is updating correctly
- [ ] Review recent error logs

#### Performance Check
- [ ] Run Lighthouse audit on main blog pages
- [ ] Check Core Web Vitals in Google Search Console
- [ ] Verify CDN cache performance
- [ ] Monitor sitemap accessibility

### Weekly Tasks

#### Content Maintenance
- [ ] Review and update outdated content
- [ ] Check for broken external links
- [ ] Verify all images are loading correctly
- [ ] Update category and tag organization if needed

#### SEO Health Check
- [ ] Review Google Search Console for new issues
- [ ] Check structured data validity
- [ ] Monitor search rankings for target keywords
- [ ] Verify social media sharing previews

#### System Updates
- [ ] Check for dependency updates
- [ ] Review security advisories
- [ ] Backup content and configuration
- [ ] Test staging environment functionality

### Monthly Tasks

#### Comprehensive Audit
- [ ] Full site crawl to identify issues
- [ ] Review analytics for content performance trends
- [ ] Update documentation based on system changes
- [ ] Plan content strategy based on analytics

#### Performance Optimization
- [ ] Analyze bundle size and optimize if needed
- [ ] Review and optimize image assets
- [ ] Update caching strategies based on usage patterns
- [ ] Optimize database queries (for future Directus setup)

## Content Management

### Publishing Workflow

#### Standard Publishing Process
1. **Content Creation**: Author creates MDX file in `/content/blog/`
2. **Review Stage**: Set `draft: true` for internal review
3. **Quality Check**: Verify frontmatter, images, and formatting
4. **Publication**: Set `draft: false` and commit changes
5. **Verification**: Confirm post appears correctly on live site

#### Quality Checklist

Before publishing any post, verify:

- [ ] **Frontmatter Complete**: All required fields present and correct
- [ ] **Content Quality**: Spelling, grammar, and factual accuracy
- [ ] **Links Functional**: All internal and external links work
- [ ] **Images Optimized**: Proper file sizes and alt text
- [ ] **SEO Optimized**: Title, description, and keywords appropriate
- [ ] **Accessibility**: Proper heading structure and alt text
- [ ] **Mobile Responsive**: Content displays well on all devices

### Content Organization

#### Category Management

Keep categories focused and consistent:

```yaml
# Standard categories
accessibility: "Accessibility and inclusive design"
development: "Development tools and techniques"  
design: "Design principles and processes"
productivity: "Productivity tools and workflows"
research: "User research and insights"
tools: "Tool reviews and tutorials"
```

#### Tag Maintenance

Regularly review and consolidate tags:

```bash
# Check for duplicate or similar tags
npm run blog:analyze-tags

# Suggested tag cleanup process
1. List all tags with post counts
2. Identify synonyms or near-duplicates  
3. Consolidate related tags
4. Update affected posts
5. Update tag documentation
```

### Image Management

#### File Organization

Maintain consistent image organization:

```
public/images/blog/
├── 2024/
│   ├── 01/  # January 2024
│   ├── 02/  # February 2024
│   └── ...
├── authors/
│   ├── author-name.jpg
│   └── ...
└── categories/
    ├── accessibility-icon.svg
    └── ...
```

#### Optimization Guidelines

- **Format**: Use WebP for photographs, SVG for icons
- **Size**: Maximum 1200px wide for hero images
- **Compression**: Aim for under 100KB per image
- **Alt Text**: Always include descriptive alt text
- **Filename**: Use descriptive, SEO-friendly names

## Backup and Recovery

### Backup Strategy

#### Content Backup

Since content is stored in Git, ensure:

1. **Repository Backup**: Multiple Git remotes (GitHub, GitLab, etc.)
2. **Image Backup**: Regular backup of `/public/images/blog/`
3. **Configuration Backup**: Environment variables and settings

```bash
# Automated backup script example
#!/bin/bash
# Backup blog images to cloud storage
aws s3 sync ./public/images/blog/ s3://focuslab-blog-backup/images/

# Export all blog content metadata
npm run blog:export-metadata > backup/blog-metadata-$(date +%Y%m%d).json
```

#### System Backup

- **Database**: Not applicable for file-based system
- **Configuration**: Vercel settings and environment variables
- **Build Artifacts**: Optional, can be regenerated

### Recovery Procedures

#### Content Recovery

**Scenario: Accidental content deletion**

1. Check Git history for deleted files:
```bash
git log --diff-filter=D --summary | grep delete
```

2. Restore specific files:
```bash
git checkout HEAD~1 -- content/blog/deleted-post.mdx
```

3. Verify content and recommit

**Scenario: Corrupted images**

1. Restore from cloud backup:
```bash
aws s3 sync s3://focuslab-blog-backup/images/ ./public/images/blog/
```

2. Verify image links in posts
3. Update any broken references

#### System Recovery

**Scenario: Build failures**

1. Check build logs for specific errors
2. Verify all dependencies are installed
3. Check for MDX syntax errors
4. Restore from last known good commit if needed

**Scenario: Complete site failure**

1. Deploy from backup branch
2. Restore environment variables
3. Verify all services are functional
4. Investigate root cause

## Performance Optimization

### Caching Strategy

#### Browser Caching

Ensure proper cache headers:

```javascript
// RSS feed caching
headers: {
  'Cache-Control': 'public, max-age=3600', // 1 hour
  'Content-Type': 'application/xml'
}

// Blog post caching
headers: {
  'Cache-Control': 'public, max-age=86400', // 24 hours
  'Vary': 'Accept-Encoding'
}
```

#### CDN Configuration

Optimize CDN settings for blog content:

- **Static Assets**: Long cache times (1 year)
- **HTML Pages**: Medium cache times (1 hour)
- **RSS/Sitemap**: Short cache times (1 hour)
- **Images**: Long cache times with version headers

### Database Optimization (Future Directus)

When migrating to Directus:

#### Query Optimization
```javascript
// Efficient post loading
const posts = await directus.items('posts').readByQuery({
  fields: ['id', 'title', 'slug', 'excerpt', 'published_date'],
  filter: { status: { _eq: 'published' } },
  sort: ['-published_date'],
  limit: 20,
  meta: ['total_count']
});
```

#### Index Strategy
```sql
-- Recommended database indexes
CREATE INDEX idx_posts_status_date ON posts(status, published_date DESC);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
```

## Security Maintenance

### Content Security

#### Input Validation

Even with MDX files, validate content:

- Check for malicious script injection
- Validate image sources and alt text
- Ensure external links are safe
- Monitor for spam content

#### Access Control

- **Repository Access**: Limit who can commit to main branch
- **Content Review**: Require pull request reviews
- **Environment Variables**: Secure API keys and tokens
- **Build Process**: Monitor for unauthorized changes

### Regular Security Updates

Monthly security checklist:

- [ ] Update all npm dependencies
- [ ] Review and apply security patches
- [ ] Check for vulnerabilities in dependencies
- [ ] Update deployment platform (Vercel) if needed
- [ ] Review access logs for unusual activity

## Troubleshooting Guide

### Common Issues

#### Build Failures

**MDX Compilation Error**

```
Error: Unexpected token in frontmatter
```

**Solution:**
1. Check YAML syntax in frontmatter
2. Verify all quotes are properly escaped
3. Ensure date formats are correct

**Missing Images**

```
Error: Image not found: /images/blog/missing.jpg
```

**Solution:**
1. Verify image exists in public directory
2. Check file path and capitalization
3. Ensure image was committed to repository

#### Runtime Issues

**Slow Page Loads**

**Diagnosis:**
1. Run Lighthouse performance audit
2. Check network waterfall in dev tools
3. Monitor Core Web Vitals

**Solutions:**
- Optimize images (compress, use WebP)
- Implement lazy loading
- Review bundle size and code splitting

**RSS Feed Errors**

**Common Issue: Invalid XML**

**Diagnosis:**
```bash
curl -I https://focuslab.dev/blog/rss.xml
xmllint --valid https://focuslab.dev/blog/rss.xml
```

**Solutions:**
- Escape special characters in content
- Verify XML structure
- Check character encoding

### Emergency Procedures

#### Site Down

1. **Immediate Response** (0-15 minutes)
   - Check Vercel deployment status
   - Verify domain DNS settings
   - Check for recent commits that might have caused issues

2. **Investigation** (15-30 minutes)
   - Review error logs and monitoring alerts
   - Check third-party service status
   - Identify root cause

3. **Resolution** (30+ minutes)
   - Rollback to last known good deployment if needed
   - Fix underlying issue
   - Monitor for recovery

#### Content Issues

1. **Immediate Response**
   - Remove or hide problematic content
   - Update RSS feed if affected
   - Notify stakeholders

2. **Investigation**
   - Determine cause of content issue
   - Review publishing process
   - Check for systematic problems

3. **Resolution**
   - Fix or replace content
   - Update processes to prevent recurrence
   - Document lessons learned

## Documentation Updates

### Keeping Documentation Current

#### Regular Review Schedule

- **Monthly**: Review and update maintenance procedures
- **Quarterly**: Update troubleshooting guides based on issues encountered
- **Annually**: Comprehensive documentation review and restructuring

#### Change Management

When making system changes:

1. Update relevant documentation first
2. Test changes in staging environment
3. Deploy changes to production
4. Verify documentation accuracy
5. Update team on changes

#### Version Control

Keep documentation in sync with code:

- Store documentation in same repository
- Include documentation updates in feature branches
- Review documentation changes as part of code review
- Tag documentation versions with releases

## Contact and Escalation

### Support Contacts

- **Primary Developer**: [Contact information]
- **System Administrator**: [Contact information]  
- **Content Manager**: [Contact information]
- **Emergency Contact**: [Contact information]

### Escalation Procedures

1. **Level 1**: Content issues, minor bugs
   → Content Manager or Primary Developer

2. **Level 2**: System performance, build failures
   → System Administrator or Senior Developer  

3. **Level 3**: Site outages, security incidents
   → Emergency Contact and Full Team

### Service Level Agreements

- **Content Issues**: Response within 4 hours
- **Performance Problems**: Response within 2 hours
- **Site Outages**: Response within 30 minutes
- **Security Incidents**: Immediate response