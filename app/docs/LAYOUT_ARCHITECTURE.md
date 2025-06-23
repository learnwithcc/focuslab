# Layout Architecture Documentation

## Overview

This document outlines the layout architecture for the FocusLab application, established to prevent component duplication (particularly Header components) and ensure consistent hydration between server and client rendering.

## Architecture Principles

### Single Source of Truth
- **Header Component**: Rendered only once in `app/root.tsx` Layout component
- **Global Elements**: Cookie management, analytics, and theme providers at root level
- **Route Content**: Individual routes should only render their specific content

### Hydration Consistency
- Client-side only components wrapped in `ClientOnlyWrapper`
- No conditional rendering based on `typeof window` or browser APIs in Layout
- Server-side and client-side rendering produce identical DOM structure

### Error Boundaries
- Layout-level error boundary protects against global failures
- Route-level error boundary isolates page-specific errors
- Graceful degradation with meaningful error messages

## Component Hierarchy

```
App (Sentry wrapper)
├── NonceProvider (CSP security)
└── Layout
    ├── ErrorBoundary (layout-level)
    ├── PHProvider (analytics)
    ├── CookieConsentProvider
    │   ├── Header (SINGLE SOURCE - NO DUPLICATION)
    │   ├── main#main-content
    │   │   ├── ErrorBoundary (route-level)
    │   │   └── {children} (route content via Outlet)
    │   └── ClientOnlyWrapper
    │       └── CookieManager
    └── Scripts/Analytics
```

## Layout Component Responsibilities

### Root Layout (`app/root.tsx` Layout function)
- **Global Header rendering** (single source across all routes)
- **Main content wrapper** with semantic HTML and ARIA roles
- **Provider hierarchy** for contexts and analytics
- **Error boundary protection** at multiple levels
- **Hydration-safe rendering** for client-side components

### Route Components
- **Route-specific content only** (no global elements)
- **No Header imports or rendering** (rely on root layout)
- **Semantic HTML structure** for content areas
- **Accessibility considerations** for page content

## Anti-Patterns to Avoid

### ❌ DO NOT DO
```tsx
// Route component rendering Header
import { Header } from '~/components';

export default function SomeRoute() {
  return (
    <div>
      <Header /> {/* WRONG: Creates duplication */}
      <main>Route content</main>
    </div>
  );
}
```

```tsx
// Conditional rendering without hydration safety
export function Layout() {
  return (
    <div>
      <Header />
      {typeof window !== 'undefined' && <SomeComponent />} {/* WRONG: Hydration mismatch */}
    </div>
  );
}
```

### ✅ CORRECT PATTERNS
```tsx
// Route component with only route-specific content
export default function SomeRoute() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Page Title</h1>
      <p>Route-specific content only</p>
    </div>
  );
}
```

```tsx
// Hydration-safe client-side rendering
export function Layout() {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <ClientOnlyWrapper>
        <ClientSideComponent />
      </ClientOnlyWrapper>
    </div>
  );
}
```

## Testing Guidelines

### Header Duplication Prevention
1. **Visual Testing**: Check each route for single Header instance
2. **React DevTools**: Verify component tree shows only one Header
3. **DOM Inspection**: Confirm no duplicate header elements in HTML
4. **Console Monitoring**: Watch for hydration warnings or React errors

### Hydration Consistency
1. **Server/Client Comparison**: Compare SSR HTML with client-rendered HTML
2. **Console Warnings**: Monitor for hydration mismatch warnings
3. **Client-Only Components**: Verify they don't render during SSR
4. **State Initialization**: Ensure consistent initial state across renders

### Error Boundary Testing
1. **Layout Errors**: Trigger errors at layout level and verify graceful handling
2. **Route Errors**: Test route-specific error boundaries
3. **Fallback UI**: Ensure error fallbacks are user-friendly
4. **Recovery**: Test error recovery and navigation

## Development Workflow

### Adding New Routes
1. Create route component with only route-specific content
2. Do NOT import or render Header component
3. Use semantic HTML with proper ARIA roles
4. Test for Header duplication after implementation

### Adding Global Components
1. Add to root Layout component, not individual routes
2. Consider hydration implications for client-side components
3. Wrap client-side components in ClientOnlyWrapper if needed
4. Add to error boundary hierarchy appropriately

### Modifying Layout Structure
1. Update this documentation when making architectural changes
2. Test all routes for consistency after layout modifications
3. Verify hydration behavior across different environments
4. Update TypeScript interfaces for layout props

## Troubleshooting

### Header Appears Twice
- Check if route component renders its own Header
- Verify Header import is only in root Layout
- Inspect DOM for duplicate header elements

### Hydration Mismatch Errors
- Identify components using browser APIs during render
- Wrap problematic components in ClientOnlyWrapper
- Ensure consistent initial state between server and client

### Layout Breaks on Specific Routes
- Check route component for global element rendering
- Verify route follows established patterns
- Test error boundary behavior

## Migration Notes

This architecture was established to resolve Header duplication issues identified in Task #15. Key changes made:

1. Removed duplicate header from `app/routes/terms-of-service.tsx`
2. Enhanced root Layout with proper TypeScript typing
3. Added error boundaries and hydration safety measures
4. Established clear component composition patterns

Future modifications should follow these established patterns to maintain consistency and prevent regressions. 