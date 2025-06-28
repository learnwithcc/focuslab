import { ReactNode } from 'react';

interface BlogCalloutProps {
  children: ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error' | 'tip';
  title?: string;
  className?: string;
}

export function BlogCallout({ 
  children, 
  type = 'info', 
  title,
  className = '' 
}: BlogCalloutProps) {
  const getIcon = () => {
    switch (type) {
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'tip':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-800 dark:text-blue-300',
          content: 'text-blue-700 dark:text-blue-200'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-800 dark:text-yellow-300',
          content: 'text-yellow-700 dark:text-yellow-200'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-800 dark:text-green-300',
          content: 'text-green-700 dark:text-green-200'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-800 dark:text-red-300',
          content: 'text-red-700 dark:text-red-200'
        };
      case 'tip':
        return {
          container: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
          icon: 'text-purple-600 dark:text-purple-400',
          title: 'text-purple-800 dark:text-purple-300',
          content: 'text-purple-700 dark:text-purple-200'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800',
          icon: 'text-gray-600 dark:text-gray-400',
          title: 'text-gray-800 dark:text-gray-300',
          content: 'text-gray-700 dark:text-gray-200'
        };
    }
  };

  const styles = getStyles();
  const headingId = title ? `callout-heading-${Math.random().toString(36).substr(2, 9)}` : undefined;

  return (
    <div 
      className={`border-l-4 p-4 my-6 rounded-r-lg ${styles.container} ${type} ${className}`}
      role="region"
      aria-labelledby={headingId}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h4 id={headingId} className={`text-sm font-semibold mb-2 ${styles.title}`}>
              {title}
            </h4>
          )}
          <div className={`text-sm ${styles.content} prose prose-sm max-w-none`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Convenience components for different types
export const InfoCallout = ({ children, title, className }: Omit<BlogCalloutProps, 'type'>) => (
  <BlogCallout type="info" {...(title !== undefined && { title })} {...(className !== undefined && { className })}>{children}</BlogCallout>
);

export const WarningCallout = ({ children, title, className }: Omit<BlogCalloutProps, 'type'>) => (
  <BlogCallout type="warning" {...(title !== undefined && { title })} {...(className !== undefined && { className })}>{children}</BlogCallout>
);

export const SuccessCallout = ({ children, title, className }: Omit<BlogCalloutProps, 'type'>) => (
  <BlogCallout type="success" {...(title !== undefined && { title })} {...(className !== undefined && { className })}>{children}</BlogCallout>
);

export const ErrorCallout = ({ children, title, className }: Omit<BlogCalloutProps, 'type'>) => (
  <BlogCallout type="error" {...(title !== undefined && { title })} {...(className !== undefined && { className })}>{children}</BlogCallout>
);

export const TipCallout = ({ children, title, className }: Omit<BlogCalloutProps, 'type'>) => (
  <BlogCallout type="tip" {...(title !== undefined && { title })} {...(className !== undefined && { className })}>{children}</BlogCallout>
);