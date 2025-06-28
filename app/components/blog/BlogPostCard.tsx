import { Link } from "@remix-run/react";
import { Card } from "~/components";
import type { BlogPost } from "~/types/blog";

interface BlogPostCardProps {
  post: BlogPost;
  variant?: 'default' | 'featured' | 'compact';
  showExcerpt?: boolean;
  className?: string;
}

export function BlogPostCard({ 
  post, 
  variant = 'default', 
  showExcerpt = true,
  className = '' 
}: BlogPostCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (variant === 'compact') {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className={`group block transition-colors ${className}`}
      >
        <div className="flex items-start gap-4">
          {post.frontmatter.image && (
            <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <img
                src={post.frontmatter.image}
                alt={post.frontmatter.imageAlt || post.frontmatter.title}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-purple transition-colors line-clamp-2">
              {post.frontmatter.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {post.frontmatter.category}
              </span>
              <span>•</span>
              <time dateTime={post.frontmatter.publishedAt}>
                {formatDate(post.frontmatter.publishedAt)}
              </time>
              <span>•</span>
              <span>{post.readingTime.text}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className={`group block transition-transform duration-200 hover:-translate-y-1 ${className}`}
      >
        <Card variant="elevated" className="h-full flex flex-col overflow-hidden">
          {post.frontmatter.image && (
            <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={post.frontmatter.image}
                alt={post.frontmatter.imageAlt || post.frontmatter.title}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          
          <div className="flex-1 p-6">
            {/* Featured Badge */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-accent/10 text-orange-accent dark:bg-orange-accent/20">
                  ⭐ Featured
                </span>
                <span className="rounded-full bg-primary-purple/10 px-2 py-1 text-xs text-primary-purple dark:bg-primary-purple/20 dark:text-purple-300">
                  {post.frontmatter.category}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {post.readingTime.text}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-purple transition-colors mb-3">
              {post.frontmatter.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
              {post.frontmatter.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {post.frontmatter.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  #{tag}
                </span>
              ))}
              {post.frontmatter.tags.length > 4 && (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  +{post.frontmatter.tags.length - 4} more
                </span>
              )}
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <span>By {post.frontmatter.author}</span>
              <time dateTime={post.frontmatter.publishedAt}>
                {formatDate(post.frontmatter.publishedAt)}
              </time>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`group block transition-transform duration-200 hover:-translate-y-1 ${className}`}
    >
      <Card variant="elevated" className="h-full flex flex-col">
        {post.frontmatter.image && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
            <img
              src={post.frontmatter.image}
              alt={post.frontmatter.imageAlt || post.frontmatter.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex-1 p-6">
          {/* Category and Reading Time */}
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="rounded-full bg-primary-purple/10 px-2 py-1 text-primary-purple dark:bg-primary-purple/20 dark:text-purple-300">
              {post.frontmatter.category}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {post.readingTime.text}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-purple transition-colors">
            {post.frontmatter.title}
          </h3>

          {/* Description */}
          {showExcerpt && (
            <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-3">
              {post.frontmatter.description}
            </p>
          )}

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-1">
            {post.frontmatter.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                #{tag}
              </span>
            ))}
            {post.frontmatter.tags.length > 3 && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                +{post.frontmatter.tags.length - 3} more
              </span>
            )}
          </div>

          {/* Meta Info */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <span>{post.frontmatter.author}</span>
            <time dateTime={post.frontmatter.publishedAt}>
              {formatDate(post.frontmatter.publishedAt)}
            </time>
          </div>
        </div>
      </Card>
    </Link>
  );
}