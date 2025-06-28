import { Link } from "@remix-run/react";
import { Container, Section } from "~/components/Layout";
import { Button } from "~/components";
import { BlogPostCard } from "./BlogPostCard";
import type { BlogPost } from "~/types/blog";

interface FeaturedBlogSectionProps {
  posts: BlogPost[];
  className?: string;
}

export function FeaturedBlogSection({ posts, className = '' }: FeaturedBlogSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className={`w-full bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20 ${className}`}>
      <Section spacing="lg">
        <Container maxWidth="7xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-primary-purple dark:text-white sm:text-4xl">
              Latest from Our Blog
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600 dark:text-gray-200">
              Insights, tutorials, and resources about building accessible, 
              neurodivergent-friendly development tools and inclusive technology.
            </p>
          </div>

          {/* Featured Posts Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Main Featured Post */}
            {posts[0] && (
              <div className="lg:col-span-8">
                <BlogPostCard 
                  post={posts[0]} 
                  variant="featured"
                  className="h-full"
                />
              </div>
            )}

            {/* Secondary Posts */}
            {posts.length > 1 && (
              <div className="lg:col-span-4 space-y-6">
                {posts.slice(1, 4).map((post) => (
                  <BlogPostCard 
                    key={post.slug}
                    post={post} 
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <Link to="/blog">
              <Button className="px-8 py-3 text-lg">
                View All Posts
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </div>
  );
}