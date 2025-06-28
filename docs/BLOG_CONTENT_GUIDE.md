# Blog Content Creation Guide

## Overview

This guide covers everything content creators need to know about writing and publishing blog posts using the FocusLab MDX blog system.

## Getting Started

### 1. File Structure

All blog posts are stored in the `/content/blog/` directory as MDX files:

```
content/blog/
├── my-first-post.mdx
├── accessibility-tips.mdx
└── react-best-practices.mdx
```

### 2. File Naming Conventions

- Use lowercase with hyphens: `accessibility-first-design.mdx`
- Keep names descriptive but concise
- Avoid special characters and spaces
- The filename becomes the URL slug: `/blog/accessibility-first-design`

## Writing Blog Posts

### 1. Frontmatter

Every blog post must start with frontmatter containing metadata:

```yaml
---
title: "Accessibility-First Design: Building for Everyone"
description: "Learn how to implement accessibility best practices from the start of your design process, ensuring inclusive experiences for all users."
publishedAt: "2024-01-15"
updatedAt: "2024-01-20"
author: "FocusLab Team"
category: "accessibility"
tags: ["accessibility", "design", "inclusive-design", "UX"]
image: "/images/blog/accessibility-hero.jpg"
imageAlt: "Diverse group of people using various assistive technologies"
featured: true
draft: false
---
```

#### Required Fields

- **title**: The post title (used in SEO and navigation)
- **description**: Brief summary (used for meta description and previews)
- **publishedAt**: Publication date (YYYY-MM-DD format)
- **author**: Author name or "FocusLab Team"
- **category**: Single category (lowercase, hyphenated)
- **tags**: Array of relevant tags

#### Optional Fields

- **updatedAt**: Last modification date
- **image**: Featured image path (relative to public directory)
- **imageAlt**: Alt text for the featured image
- **featured**: Boolean to mark as featured post
- **draft**: Boolean to keep post unpublished

### 2. Content Writing

#### Basic Markdown

Use standard Markdown syntax for most content:

```markdown
# Main Heading (H1)
## Section Heading (H2)
### Subsection (H3)

**Bold text** and *italic text*

- Bullet point lists
- Another item

1. Numbered lists
2. Second item

[Link text](https://example.com)

> Blockquotes for important callouts
```

#### Code Blocks

Use fenced code blocks with language specification:

````markdown
```javascript
function greetUser(name) {
  return `Hello, ${name}!`;
}
```

```css
.button {
  background-color: var(--primary-purple);
  color: white;
}
```
````

#### Images

Add images using standard Markdown syntax:

```markdown
![Alt text for accessibility](/images/blog/example-image.jpg)
```

**Image Guidelines:**
- Store images in `/public/images/blog/`
- Use descriptive filenames
- Optimize for web (WebP preferred)
- Include meaningful alt text
- Maximum width: 1200px

### 3. Custom Components

The blog system includes custom MDX components for enhanced content:

#### Blog Callouts

```mdx
<BlogCallout type="info" title="Pro Tip">
This is helpful information that stands out from the main content.
</BlogCallout>

<BlogCallout type="warning" title="Important">
Pay attention to this critical information.
</BlogCallout>

<BlogCallout type="success" title="Well Done">
Great job following these guidelines!
</BlogCallout>
```

Available types: `info`, `warning`, `success`, `error`, `tip`

#### Individual Callout Types

```mdx
<InfoCallout title="Quick Info">
General information that might be helpful.
</InfoCallout>

<WarningCallout title="Heads Up">
Something important to be aware of.
</WarningCallout>

<SuccessCallout title="Success">
Positive reinforcement or achievement.
</SuccessCallout>

<ErrorCallout title="Error">
Something that went wrong or to avoid.
</ErrorCallout>

<TipCallout title="Pro Tip">
Expert advice or best practices.
</TipCallout>
```

## Categories and Tags

### Categories

Categories are broad topic areas. Use one category per post:

- `accessibility` - Accessibility and inclusive design
- `development` - Development tools and techniques
- `design` - Design principles and processes
- `productivity` - Productivity tools and workflows
- `research` - User research and insights
- `tools` - Tool reviews and tutorials

### Tags

Tags are specific topics within categories. Use 3-5 relevant tags:

**Good tag examples:**
- `react`, `typescript`, `remix`
- `ADHD`, `neurodivergent`, `focus-tools`
- `screen-readers`, `keyboard-navigation`, `color-contrast`
- `figma`, `prototyping`, `user-testing`

**Tag guidelines:**
- Use lowercase
- Hyphenate multi-word tags
- Be specific and descriptive
- Don't repeat the category as a tag

## SEO Best Practices

### Title Optimization

- Keep titles under 60 characters
- Include primary keyword naturally
- Make titles compelling and descriptive
- Use title case capitalization

### Description Writing

- Keep descriptions 150-160 characters
- Include primary and secondary keywords
- Write compelling copy that encourages clicks
- Avoid duplicate descriptions across posts

### Internal Linking

Link to other relevant blog posts and site pages:

```markdown
Check out our [guide to ADHD-friendly development tools](/blog/adhd-development-tools)
or learn more about [our accessibility services](/services/accessibility).
```

## Publishing Workflow

### 1. Draft Creation

Set `draft: true` in frontmatter while writing:

```yaml
---
title: "Work in Progress"
# ... other fields
draft: true
---
```

### 2. Review Process

1. Complete the content
2. Review for spelling and grammar
3. Check all links work correctly
4. Verify images display properly
5. Ensure frontmatter is complete

### 3. Publishing

1. Set `draft: false`
2. Add final `publishedAt` date
3. Commit and push changes
4. Content automatically appears on the blog

### 4. Updates

To update existing posts:

1. Modify the MDX file
2. Update `updatedAt` date in frontmatter
3. Commit changes
4. Updates deploy automatically

## Content Guidelines

### Writing Style

- **Tone**: Professional but approachable
- **Voice**: Helpful and encouraging
- **Perspective**: Focus on practical solutions
- **Audience**: Developers and designers interested in accessibility

### Accessibility in Content

- Use descriptive headings in logical order
- Provide alt text for all images
- Use meaningful link text (avoid "click here")
- Ensure good color contrast in any custom styling
- Keep paragraphs reasonably short for readability

### Technical Content

- Provide context for technical concepts
- Include practical examples and code samples
- Link to relevant documentation
- Consider different skill levels of readers

## Troubleshooting

### Common Issues

**Post not appearing:**
- Check `draft: false` in frontmatter
- Verify the file is in `/content/blog/`
- Ensure frontmatter syntax is correct

**Images not loading:**
- Verify image path starts with `/`
- Check image exists in `/public/images/blog/`
- Ensure correct filename and extension

**Build errors:**
- Check frontmatter YAML syntax
- Verify all required fields are present
- Look for unclosed MDX components

### Getting Help

- Check the [Developer Guide](./BLOG_DEVELOPER_GUIDE.md) for technical issues
- Review existing posts for examples
- Contact the development team for assistance

## Content Ideas

### Post Types

1. **Tutorials**: Step-by-step guides
2. **Best Practices**: Proven approaches and methodologies
3. **Tool Reviews**: Evaluations of development and design tools
4. **Case Studies**: Real-world problem-solving examples
5. **Industry Insights**: Trends and observations
6. **Personal Stories**: Experiences and lessons learned

### Topics of Interest

- Accessibility implementation techniques
- ADHD-friendly development workflows
- Inclusive design principles
- Tool productivity tips
- User research methodologies
- Design system development
- Neurodivergent-friendly interfaces