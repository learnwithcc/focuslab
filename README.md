# FocusLab - Neurodivergent Developer Tools & Inclusive Technology

[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1+-blue.svg)](https://www.typescriptlang.org/)
[![Remix](https://img.shields.io/badge/Remix-2.16+-orange.svg)](https://remix.run/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4+-blue.svg)](https://tailwindcss.com/)

FocusLab creates innovative tools and solutions designed specifically for neurodivergent developers, with a focus on ADHD-friendly development environments, accessibility solutions, and inclusive software development practices.

## 🌟 Features

### 🚀 **Modern Technology Stack**
- **Remix.js**: Full-stack web framework with server-side rendering
- **TypeScript**: End-to-end type safety with strict mode
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Vite**: Lightning-fast build tool and development server

### 📝 **MDX Blog System**
- **Content Management**: File-based MDX posts with rich frontmatter
- **Categories & Tags**: Hierarchical content organization
- **Search & Filtering**: Fast client-side search and filtering
- **SEO Optimized**: Automated meta tags, structured data, and RSS feeds
- **Future-Ready**: Built-in Directus CMS migration path

### ♿ **Accessibility First**
- **WCAG 2.1 AA Compliance**: Comprehensive accessibility implementation
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: High contrast ratios for visual accessibility
- **Reduced Motion**: Respects user motion preferences

### 🎨 **Design System**
- **Consistent Components**: Reusable, accessible UI components
- **Dark Mode**: Automatic theme switching with user preferences
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Focus Management**: Neurodivergent-friendly focus indicators

### ⚡ **Performance Optimized**
- **Core Web Vitals**: Optimized for Google's performance metrics
- **Image Optimization**: Automatic image compression and lazy loading
- **Code Splitting**: Efficient bundle splitting for faster loads
- **Caching Strategy**: Multi-layer caching for optimal performance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/focuslab-dev/focuslab.git
cd focuslab

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env` file with the following variables:

```env
# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Newsletter Service (ConvertKit)
CONVERTKIT_API_KEY=your_api_key
CONVERTKIT_DEFAULT_FORM_ID=your_form_id

# Analytics & Monitoring
SENTRY_DSN=your_sentry_dsn

# Future Directus Integration (Optional)
DIRECTUS_URL=your_directus_url
DIRECTUS_TOKEN=your_directus_token
USE_DIRECTUS=false
```

## 📖 Documentation

### For Users
- [Blog Content Creation Guide](./docs/BLOG_CONTENT_GUIDE.md)
- [Blog System Overview](./docs/BLOG_SYSTEM_OVERVIEW.md)

### For Developers
- [Developer Guide](./docs/BLOG_DEVELOPER_GUIDE.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

### For Administrators
- [Maintenance Guide](./docs/BLOG_MAINTENANCE_GUIDE.md)
- [Migration Guide](./docs/BLOG_MIGRATION_GUIDE.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)

## 🏗️ Architecture

### Project Structure

```
app/
├── components/           # Reusable UI components
│   ├── blog/            # Blog-specific components
│   ├── forms/           # Form components
│   └── icons/           # Icon components
├── contexts/            # React context providers
├── routes/              # Remix route files
├── services/            # Business logic and API calls
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── styles/              # Global styles and Tailwind config

content/
└── blog/               # MDX blog posts

docs/                   # Documentation
public/                 # Static assets
scripts/                # Build and deployment scripts
```

### Key Design Principles

1. **Accessibility First**: Every component is built with accessibility in mind
2. **Type Safety**: Comprehensive TypeScript coverage
3. **Performance**: Optimized for Core Web Vitals
4. **Maintainability**: Clean, documented, and testable code
5. **Scalability**: Architecture supports growth and feature additions

## 🧪 Testing

### Test Suites

```bash
# Unit and integration tests
npm run test

# End-to-end tests
npm run test:e2e

# Accessibility testing
npm run test:a11y

# Performance testing
npm run test:performance
```

### Testing Strategy

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: Route and service testing
- **E2E Tests**: Complete user workflow testing
- **Accessibility Tests**: Automated and manual accessibility validation
- **Performance Tests**: Core Web Vitals and load testing

## 📝 Blog System

### Creating Content

1. Create a new MDX file in `content/blog/`
2. Add frontmatter with metadata
3. Write content using Markdown and custom components
4. Commit and deploy

Example post structure:

```mdx
---
title: "Accessibility-First Design"
description: "Building inclusive experiences from the ground up"
publishedAt: "2024-01-15"
author: "FocusLab Team"
category: "accessibility"
tags: ["accessibility", "design", "UX"]
featured: true
---

# Your Content Here

<BlogCallout type="info" title="Pro Tip">
Use our custom components to enhance your content!
</BlogCallout>
```

### Available Components

- `<BlogCallout>` - Information highlighting
- `<InfoCallout>` - General information
- `<WarningCallout>` - Important warnings
- `<SuccessCallout>` - Positive reinforcement
- `<ErrorCallout>` - Error information
- `<TipCallout>` - Expert tips

## 🚀 Deployment

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Production

The application is optimized for deployment on Vercel:

```bash
# Deploy to Vercel
vercel

# Or build and deploy to your preferred platform
npm run build
npm start
```

### Build Requirements

- Node.js 18+
- Build time: ~2-3 minutes
- Memory requirements: 512MB minimum
- Storage: ~100MB for build artifacts

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Run TypeScript checks
npm run lint         # Run ESLint
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run storybook    # Start Storybook component development
```

### Storybook Configuration

The project includes Storybook for component development and documentation. Due to the Remix + Vite setup, Storybook requires specific configuration:

**Key Configuration Requirements:**
- The `STORYBOOK=true` environment variable must be set when running Storybook to exclude the Remix plugin from the main Vite config
- This is automatically handled in the npm scripts, so use `npm run storybook` rather than running Storybook directly
- Storybook uses its own dedicated Vite config at `.storybook/vite.config.ts` that's merged with Storybook's default configuration

**Usage:**
```bash
npm run storybook        # Start Storybook dev server (http://localhost:6006)
npm run build-storybook  # Build static Storybook for production
```

**If you need to modify Storybook configuration:**
- Component stories: Place in `app/components/**/*.stories.tsx`  
- Main config: `.storybook/main.ts`
- Vite config: `.storybook/vite.config.ts`
- Preview config: `.storybook/preview.tsx`

⚠️ **Important:** If you modify the main Vite config or Remix setup, ensure the `STORYBOOK=true` exclusion logic in `vite.config.ts` remains intact to prevent conflicts.

### ✅ **Validation & Testing**
The Storybook configuration has been thoroughly tested using Playwright to ensure actual functionality (not just server startup). To validate Storybook works correctly:

```bash
npm run test:storybook        # Run comprehensive Storybook validation tests
npm run test:storybook:ui     # Interactive test debugging
```

**Test Coverage:**
- ✅ Component story loading and rendering
- ✅ Dynamic import resolution (`~/components`)  
- ✅ Console error detection and analysis
- ✅ Cross-browser compatibility
- ✅ Theme switching functionality
- ✅ Performance validation

This testing approach validates real browser functionality rather than assumptions based on server startup messages.

### Code Quality

- **ESLint**: Code linting with accessibility rules
- **TypeScript**: Strict type checking
- **Prettier**: Code formatting (configured in .editorconfig)
- **Husky**: Pre-commit hooks for quality assurance

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit changes: `git commit -m 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Submit a pull request

## 🌐 Accessibility

### Compliance

- **WCAG 2.1 AA**: Full compliance with accessibility guidelines
- **Section 508**: US federal accessibility standards
- **EN 301 549**: European accessibility standard

### Features

- Screen reader compatibility
- Keyboard navigation support
- High contrast ratios
- Reduced motion support
- Focus management
- Alternative text for images
- Semantic HTML structure

### Testing Tools

- **axe-core**: Automated accessibility testing
- **Lighthouse**: Performance and accessibility audits
- **Screen Readers**: Manual testing with NVDA, VoiceOver
- **Keyboard Only**: Full keyboard navigation testing

## 📊 Performance

### Core Web Vitals

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Optimization Techniques

- Server-side rendering (SSR)
- Code splitting and lazy loading
- Image optimization with Sharp
- Critical CSS inlining
- Resource preloading
- Efficient caching strategies

## 🛠️ Customization

### Theme Configuration

Modify `tailwind.config.ts` to customize the design system:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          purple: '#8B5CF6',
          // ... other colors
        }
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }
    }
  }
}
```

### Component Customization

All components support className overrides and custom styling:

```tsx
<Button 
  variant="primary" 
  size="lg"
  className="custom-styles"
>
  Custom Button
</Button>
```

## 🔮 Future Roadmap

### Planned Features

- [ ] Directus CMS integration
- [ ] Advanced search with Algolia
- [ ] Multi-language support (i18n)
- [ ] Progressive Web App (PWA) features
- [ ] Advanced analytics dashboard
- [ ] Comment system for blog posts
- [ ] Newsletter integration improvements

### Technology Upgrades

- [ ] Remix v3 migration
- [ ] React 19 adoption
- [ ] Enhanced TypeScript strict mode
- [ ] Advanced performance monitoring

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

### Getting Help

- **Documentation**: Check the [docs](./docs/) directory
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join GitHub Discussions for questions
- **Email**: Contact us at hello@focuslab.dev

### Community

- [GitHub Discussions](https://github.com/focuslab-dev/focuslab/discussions)
- [Twitter](https://twitter.com/focuslab_dev)
- [LinkedIn](https://linkedin.com/company/focus-lab-dev)

## 🙏 Acknowledgments

- [Remix.js](https://remix.run/) - Full-stack web framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [MDX](https://mdxjs.com/) - Markdown for the component era
- [Vercel](https://vercel.com/) - Deployment and hosting platform
- [The a11y community](https://www.a11yproject.com/) - Accessibility resources and guidance

---

Built with ❤️ by the FocusLab team to create more inclusive development experiences for neurodivergent developers everywhere.
