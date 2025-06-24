# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Commands
- `npm run dev` - Start development server (runs on port 5173, fallback to 3001)
- `npm run build` - Build for production using Remix + Vite
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript strict mode checks
- `npm run lint` - Run ESLint with caching
- `npm run test` - Run Vitest test suite  
- `npm run test:watch` - Run tests in watch mode

### Project Management (Task Master Integration)
This project uses Task Master AI for development workflow management. Key commands:
- `task-master list` - Show current tasks and status
- `task-master next` - Get next available task  
- `task-master show <id>` - View detailed task information
- `task-master set-status --id=<id> --status=done` - Mark task complete
- `task-master expand --id=<id> --research --force` - Break task into subtasks

## Architecture Overview

### Tech Stack
- **Framework**: Remix.js with Vite build system
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS with custom theme variables
- **Testing**: Vitest with happy-dom environment
- **Analytics**: Sentry, PostHog, and Vercel Analytics
- **Package Manager**: npm

### Core Application Structure

**Context-Driven Architecture**: The app uses React Context providers for cross-cutting concerns:
- `ThemeProvider` - Manages light/dark theme with localStorage persistence and system preference detection
- `CookieConsentProvider` - Handles GDPR-compliant cookie consent
- `PHProvider` - PostHog analytics integration
- `NonceProvider` - Security nonce generation for CSP

**Route-Based Pages**: Standard Remix file-based routing with these key routes:
- `/` - Homepage with hero, mission, and featured projects
- `/projects` - Project portfolio with GitHub integration and filtering
- `/projects/$id` - Individual project details
- `/contact` - Contact form with rate limiting
- `/about` - About page

**Component Architecture**: Centralized component exports through `~/components/index.ts` with:
- Base components (`Button`, `Input`, `Modal`, `Card`)
- Layout components (`Header`, `Navigation`, `Layout`)
- Feature components (`ThemeToggle`, `ProjectCard`, `ContactForm`)
- Icon system with custom SVG components

### Key Architectural Patterns

**Security-First Design**: 
- CSRF protection with token validation
- Rate limiting (3 attempts/hour for newsletter)
- Security headers with CSP nonces
- Input validation using Zod schemas

**Accessibility & Performance**:
- Axe-core integration for accessibility testing
- Motion-safe/motion-reduce CSS preferences
- Image optimization with Sharp
- Lighthouse-optimized meta tags and structured data

**Theme System Integration**:
- CSS custom properties for theme variables
- Tailwind dark mode with `class` strategy
- Client-side hydration handling for theme toggle
- System preference detection and localStorage persistence

## Import Path Aliases

The project uses TypeScript path mapping for clean imports:
- `~/components` → `app/components`
- `~/contexts` → `app/contexts`
- `~/utils` → `app/utils`
- `~/services` → `app/services`
- `~/types` → `app/types`
- `~/styles` → `app/styles`

## Environment Configuration

### Required Environment Variables
```bash
# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Newsletter Service (ConvertKit) 
CONVERTKIT_API_KEY=your_api_key
CONVERTKIT_DEFAULT_FORM_ID=your_form_id

# Analytics & Monitoring
SENTRY_DSN=your_sentry_dsn
```

Copy `.env.example` to `.env` and configure these values.

## Component Development Guidelines

### Component Structure
- All components exported through `~/components/index.ts`
- Use `BaseComponentProps` interface for consistent prop patterns
- Follow the existing component pattern with `forwardRef` and TypeScript interfaces
- Implement proper ARIA attributes and accessibility

### Theme-Aware Components
- Use Tailwind's `dark:` prefix for dark mode styles
- Leverage CSS custom properties when needed (`var(--primary-purple)`)
- Test both light and dark themes
- Handle client-side hydration for theme-dependent components

### Form Components  
- Implement Zod validation schemas
- Use CSRF protection for state-changing operations
- Include proper error handling and user feedback
- Follow the rate limiting pattern (3 attempts/hour per IP)

## Data Layer Architecture

**GitHub Integration**: 
- `GitHubService` class handles API calls with caching (5-minute timeout)
- Project data structure includes GitHub stats integration
- Error handling for API failures with graceful degradation

**Newsletter System**:
- Server-side validation with Zod schemas
- Rate limiting with Redis (Upstash)
- GDPR compliance with explicit consent
- ConvertKit API integration for email management

**Project Management**:
- TypeScript interfaces for `Project`, `GitHubStats`, `ProjectFilters`
- Static project data with dynamic GitHub stats
- Filtering and sorting capabilities

## Development Workflow (Task Master Integration)

This project follows the Task Master development methodology outlined in `.cursor/rules/dev_workflow.mdc`:

1. **Task Planning**: Use `task-master list` and `task-master next` to identify work
2. **Task Breakdown**: Complex tasks should be expanded with `task-master expand --id=<id> --research --force`
3. **Implementation Logging**: Use `task-master update-subtask --id=<id> --prompt="details"` to log progress
4. **Completion**: Mark tasks done with `task-master set-status --id=<id> --status=done`

### Tagged Workflows
The project supports advanced tagged task management for:
- Feature branches (`feature-*` tags)
- Team collaboration (isolated contexts)
- Experiment/prototype work (`experiment-*`, `mvp`, `prototype`)
- Production releases (`v1.0+`, `production`)

## Testing Strategy

- **Unit Tests**: Component testing with React Testing Library
- **Accessibility Tests**: Automated axe-core integration via vitest-axe
- **Integration Tests**: Route and service testing
- **Test Environment**: happy-dom for lightweight DOM simulation

Key test patterns:
- Test files located alongside source (`*.test.tsx`)
- Setup file: `app/test/setup-test-env.ts`
- Accessibility testing in every component test

## Security Considerations

**CSRF Protection**: All state-changing forms include CSRF tokens
**Rate Limiting**: Newsletter and contact forms protected (3 attempts/hour/IP)
**Content Security Policy**: Nonce-based CSP implementation
**Input Validation**: Server-side validation using Zod schemas
**Analytics Privacy**: PostHog configured for privacy compliance

## Performance Optimizations

- Image optimization with Sharp integration
- Vite build system with code splitting
- CSS-in-JS minimization (Tailwind utilities)
- GitHub API caching (5-minute TTL)
- Analytics lazy loading patterns

## Vercel Deployment

**IMPORTANT**: This project requires specific Vercel configuration. See `docs/VERCEL_DEPLOYMENT_FIX.md` for details.

Key requirements:
- Must have `@vercel/remix` package installed (NOT `@remix-run/vercel`)
- Must use `vercelPreset()` in `vite.config.ts`
- Keep `vercel.json` simple with just `"framework": "remix"`

The project is configured for zero-config Vercel deployment with proper serverless function support.