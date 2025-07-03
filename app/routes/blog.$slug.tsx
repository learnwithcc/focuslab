import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Container, Section } from "~/components/Layout";
import { Card, Button, Breadcrumb, BlogCallout, InfoCallout, WarningCallout, SuccessCallout, ErrorCallout, TipCallout, MDXRenderer, AsyncErrorBoundary } from "~/components";
import { getBlogPostBySlug, getFeaturedBlogPosts } from "~/services/blog.server";
import { generateMeta, generatePageUrl } from "~/utils/seo";
import { generateArticleSchema, getBlogBreadcrumbItems, generateBreadcrumbSchema, generateStructuredDataMeta } from "~/utils/structured-data";
import type { BlogPost } from "~/types/blog";

export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
  if (!data?.post) {
    return generateMeta({
      title: "Post Not Found - FocusLab Blog",
      description: "The requested blog post could not be found.",
      url: generatePageUrl('/blog'),
    });
  }

  const { post } = data;
  const baseUrl = 'https://focuslab.io'; // Use production URL for consistent structured data
  
  // Generate structured data
  const articleSchema = generateArticleSchema(post, baseUrl);
  const breadcrumbItems = getBlogBreadcrumbItems(location.pathname, post.frontmatter.title);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);
  
  const structuredDataMeta = generateStructuredDataMeta([articleSchema, breadcrumbSchema]);
  
  const basicMeta = generateMeta({
    title: `${post.frontmatter.title} - FocusLab Blog`,
    description: post.frontmatter.description,
    url: generatePageUrl(`/blog/${post.slug}`),
    canonical: `https://focuslab.io/blog/${post.slug}`,
    ...(post.frontmatter.image && { image: `https://focuslab.io${post.frontmatter.image}` }),
    type: 'article',
  });

  // Combine basic meta with structured data
  return [
    ...basicMeta,
    ...structuredDataMeta,
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { slug } = params;
  
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const post = await getBlogPostBySlug(slug);
  
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  // Note: MDX compilation is now handled client-side by MDXRenderer component

  // Get related posts for sidebar
  const relatedPosts = await getFeaturedBlogPosts(3);

  return json({
    post,
    relatedPosts: relatedPosts.filter(p => p.slug !== post.slug).slice(0, 3),
  });
}

// MDX Components for custom rendering
const mdxComponents = {
  h1: (props: any) => (
    <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-6" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="font-heading text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6" {...props} />
  ),
  p: (props: any) => (
    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props} />
  ),
  ul: (props: any) => (
    <ul className="text-gray-700 dark:text-gray-300 mb-4 list-disc list-inside space-y-2" {...props} />
  ),
  ol: (props: any) => (
    <ol className="text-gray-700 dark:text-gray-300 mb-4 list-decimal list-inside space-y-2" {...props} />
  ),
  li: (props: any) => (
    <li className="leading-relaxed" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-primary-purple bg-gray-50 dark:bg-gray-900 p-4 mb-6 italic" {...props} />
  ),
  pre: (props: any) => (
    <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto" {...props} />
  ),
  code: (props: any) => {
    // Inline code
    if (!props.className) {
      return (
        <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded text-sm" {...props} />
      );
    }
    // Block code (handled by pre)
    return <code {...props} />;
  },
  a: (props: any) => (
    <a 
      className="text-primary-purple hover:text-primary-purple/80 underline transition-colors" 
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props} 
    />
  ),
  img: (props: any) => (
    <img className="w-full rounded-lg mb-6" loading="lazy" {...props} />
  ),
  hr: (props: any) => (
    <hr className="border-gray-200 dark:border-gray-800 my-8" {...props} />
  ),
  // Custom blog components for MDX
  BlogCallout,
  InfoCallout,
  WarningCallout,
  SuccessCallout,
  ErrorCallout,
  TipCallout,
};

type LoaderData = {
  post: BlogPost;
  relatedPosts: BlogPost[];
};

export default function BlogPost() {
  const { post, relatedPosts } = useLoaderData<LoaderData>();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  return (
    <div className="min-h-screen bg-white dark:bg-gray-975">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <Section spacing="sm">
          <Container maxWidth="7xl">
            <Breadcrumb
              items={[
                { name: 'Home', path: '/' },
                { name: 'Blog', path: '/blog' },
                { name: post.frontmatter.title, path: `/blog/${post.slug}`, isCurrentPage: true },
              ]}
            />
          </Container>
        </Section>
      </div>

      <Section spacing="lg">
        <Container maxWidth="7xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
              {/* Article Header */}
              <header className="mb-8">
                {post.frontmatter.image && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 mb-8">
                    <img
                      src={post.frontmatter.image}
                      alt={post.frontmatter.imageAlt || post.frontmatter.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Category and Reading Time */}
                <div className="mb-4 flex items-center gap-4 text-sm">
                  <Link 
                    to={`/blog?category=${post.frontmatter.category}`}
                    className="rounded-full bg-primary-purple/10 px-3 py-1 text-primary-purple hover:bg-primary-purple/20 transition-colors dark:bg-primary-purple/20 dark:text-purple-300"
                  >
                    {post.frontmatter.category}
                  </Link>
                  <span className="text-gray-500 dark:text-gray-400">
                    {post.readingTime.text}
                  </span>
                </div>

                {/* Title */}
                <h1 className="font-heading text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {post.frontmatter.title}
                </h1>

                {/* Description */}
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                  {post.frontmatter.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-6 dark:border-gray-800">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>By {post.frontmatter.author}</span>
                    <span>•</span>
                    <time dateTime={post.frontmatter.publishedAt}>
                      {formatDate(post.frontmatter.publishedAt)}
                    </time>
                    {post.frontmatter.updatedAt && (
                      <>
                        <span>•</span>
                        <span>Updated {formatDate(post.frontmatter.updatedAt)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.frontmatter.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog?tag=${tag}`}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </header>

              {/* Article Content */}
              <AsyncErrorBoundary operationName="Blog Content" resetKeys={[post.slug]}>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <MDXRenderer content={post.content} components={mdxComponents} />
                </div>
              </AsyncErrorBoundary>

              {/* Article Footer */}
              <footer className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <Link to="/blog">
                    <Button variant="secondary">← Back to Blog</Button>
                  </Link>
                </div>
              </footer>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-8">
                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <Card>
                    <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Related Posts
                    </h3>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => (
                        <Link
                          key={relatedPost.slug}
                          to={`/blog/${relatedPost.slug}`}
                          className="block group"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-purple transition-colors mb-1">
                            {relatedPost.frontmatter.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {relatedPost.frontmatter.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-500">
                            <span>{relatedPost.frontmatter.category}</span>
                            <span>•</span>
                            <span>{relatedPost.readingTime.text}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Newsletter CTA */}
                <Card>
                  <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Stay Updated
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Get notified when we publish new posts about neurodivergent-friendly development tools.
                  </p>
                  <Link to="/#newsletter">
                    <Button className="w-full">Subscribe to Newsletter</Button>
                  </Link>
                </Card>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </div>
  );
}