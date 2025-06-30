import React, { useState, useEffect, useMemo } from 'react';
import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import * as devRuntime from 'react/jsx-dev-runtime';
import { MDXProvider } from '@mdx-js/react';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MDXRendererProps {
  content: string;
  components?: Record<string, React.ComponentType<any>>;
}

interface MDXRendererState {
  MDXContent: React.ComponentType | null;
  error: Error | null;
  isLoading: boolean;
}

export function MDXRenderer({ content, components = {} }: MDXRendererProps) {
  const [state, setState] = useState<MDXRendererState>({
    MDXContent: null,
    error: null,
    isLoading: true,
  });

  // Memoize the content to avoid unnecessary recompilation
  const memoizedContent = useMemo(() => content, [content]);

  useEffect(() => {
    let isCancelled = false;

    async function compileMDX() {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Compile MDX content
        const compiled = await compile(memoizedContent, {
          outputFormat: 'function-body',
          development: process.env.NODE_ENV === 'development',
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeHighlight],
        });

        // Run the compiled code with proper runtime
        const runtimeToUse = process.env.NODE_ENV === 'development' 
          ? { ...runtime, ...devRuntime }
          : runtime;
          
        const { default: MDXContent } = await run(compiled, {
          ...runtimeToUse,
          baseUrl: import.meta.url,
        });

        if (!isCancelled) {
          setState({
            MDXContent,
            error: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error compiling MDX:', error);
        if (!isCancelled) {
          setState({
            MDXContent: null,
            error: error as Error,
            isLoading: false,
          });
        }
      }
    }

    compileMDX();

    return () => {
      isCancelled = true;
    };
  }, [memoizedContent]);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-purple"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading content...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error rendering content</h3>
        <p className="text-red-600 dark:text-red-400 text-sm">
          {state.error.message}
        </p>
        <details className="mt-2">
          <summary className="text-red-600 dark:text-red-400 text-sm cursor-pointer">
            Technical details
          </summary>
          <pre className="text-xs text-red-500 dark:text-red-300 mt-1 bg-red-100 dark:bg-red-900 p-2 rounded overflow-x-auto">
            {state.error.stack}
          </pre>
        </details>
      </div>
    );
  }

  if (!state.MDXContent) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          No content available to render.
        </p>
      </div>
    );
  }

  return (
    <MDXProvider components={components}>
      <state.MDXContent />
    </MDXProvider>
  );
}