# Vercel Deployment Fix Documentation

## Problem Summary

The Remix application failed to deploy on Vercel with the following error:
```
Error: ENOENT: no such file or directory, open '/vercel/path0/build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0/server-index.mjs'
```

This occurred even though the build completed successfully locally and in Vercel's build environment.

## Root Cause Analysis

### 1. File Path Mismatch
- **What Remix built**: `build/server/index.js`
- **What Vercel expected**: `build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0/server-index.mjs`

The base64 string `eyJydW50aW1lIjoibm9kZWpzIn0` decodes to `{"runtime":"nodejs"}`, indicating Vercel uses runtime-specific directory structures for serverless functions.

### 2. Missing Vercel Adapter
The project was missing the proper Vercel adapter that transforms Remix's build output to match Vercel's serverless function expectations.

### 3. Deprecated Approach
Initial attempts used deprecated patterns:
- ❌ `@remix-run/vercel` (deprecated package)
- ❌ Manual `/api` directory with custom serverless functions
- ❌ Complex routing configurations in `vercel.json`

## The Solution

### Step 1: Install the Vercel Remix Adapter
```bash
npm install @vercel/remix --save --legacy-peer-deps
```

**Important**: This is `@vercel/remix` (maintained by Vercel), NOT the deprecated `@remix-run/vercel`.

### Step 2: Configure Vite with Vercel Preset
Update `vite.config.ts`:

```typescript
// Add import at the top
import { vercelPreset } from '@vercel/remix/vite';

// In the Remix plugin configuration
export default defineConfig({
  plugins: [
    !process.env['VITEST'] && !process.env['STORYBOOK'] && remix({
      presets: [vercelPreset()],  // Add this line
      future: {
        // ... your existing future flags
      },
    }),
    // ... other plugins
  ],
  // ... rest of config
});
```

### Step 3: Use Simple Vercel Configuration
Create/update `vercel.json`:

```json
{
  "framework": "remix",
  "buildCommand": "npm run build",
  "installCommand": "rm -rf package-lock.json node_modules && npm install --legacy-peer-deps"
}
```

**Note**: No custom routes, functions, or output directories needed!

### Step 4: Remove Deprecated Configurations
- Delete any `/api` directory with manual serverless functions
- Remove `@remix-run/vercel` if it exists
- Remove complex routing from `vercel.json`

## Why This Works

1. **Vercel Preset**: The `vercelPreset()` configures Vite to output files in Vercel's expected structure
2. **Runtime Directories**: Creates the `nodejs-eyJydW50aW1lIjoibm9kZWpzIn0` directory automatically
3. **Proper Module Format**: Handles the CommonJS to ES modules transformation
4. **Framework Detection**: `"framework": "remix"` tells Vercel to use its built-in Remix support

## Verification

After implementing these changes, the build output will show:
```
build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0/.vite/manifest.json
build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0/assets/server-build-*.css
build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0/index.js
```

This matches exactly what Vercel expects for deployment.

## Common Pitfalls to Avoid

1. **Don't use `@remix-run/vercel`** - It's deprecated
2. **Don't create manual `/api` routes** - Vercel handles this automatically
3. **Don't skip the `vercelPreset()`** - It's required for proper build output
4. **Don't overcomplicate `vercel.json`** - Keep it simple with framework detection

## Environment Considerations

- Ensure all environment variables are set in Vercel's dashboard
- Use `--legacy-peer-deps` if you encounter peer dependency conflicts
- Node.js version should match between local and Vercel (>=20.0.0)

## Summary

The fix requires:
1. `@vercel/remix` package (NOT `@remix-run/vercel`)
2. `vercelPreset()` in `vite.config.ts`
3. Simple `vercel.json` with `"framework": "remix"`
4. No manual serverless function configuration

This approach uses Vercel's native Remix support and eliminates the file path mismatch errors.