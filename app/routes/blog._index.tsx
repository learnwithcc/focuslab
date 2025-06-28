import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Container, Section } from "~/components/Layout";
import { Button, BlogPostCard } from "~/components";
import { getAllBlogPosts, getBlogCategories, getBlogTags } from "~/services/blog.server";
import { generateMeta, generatePageUrl } from "~/utils/seo";
import { generateBlogSchema, getBlogBreadcrumbItems, generateBreadcrumbSchema, generateStructuredDataMeta } from "~/utils/structured-data";
import type { BlogPost, BlogCategory, BlogTag } from "~/types/blog";

export const meta: MetaFunction = ({ location }) => {
  const baseUrl = 'https://focuslab.io'; // Use production URL for consistent structured data
  
  // Generate structured data
  const blogSchema = generateBlogSchema(baseUrl);
  const breadcrumbItems = getBlogBreadcrumbItems(location.pathname);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);
  
  const structuredDataMeta = generateStructuredDataMeta([blogSchema, breadcrumbSchema]);
  
  const basicMeta = generateMeta({
    title: "Blog - FocusLab | Neurodivergent-Friendly Development Tools",
    description: "Insights, tutorials, and resources about building accessible, neurodivergent-friendly development tools and inclusive technology.",
    url: generatePageUrl('/blog'),
    canonical: 'https://focuslab.io/blog',
  });

  // Combine basic meta with structured data
  return [
    ...basicMeta,
    ...structuredDataMeta,
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const tag = url.searchParams.get('tag');
  const search = url.searchParams.get('search');
  const page = parseInt(url.searchParams.get('page') || '1', 10);

  // Get blog posts with filters (clean up undefined values)
  const filters: any = {};
  if (category) filters.category = category;
  if (tag) filters.tag = tag;
  if (search) filters.search = search;
  
  const blogData = await getAllBlogPosts(
    filters,
    { field: 'publishedAt', direction: 'desc' },
    { page, limit: 12 }
  );

  // Get categories and tags for filtering
  const [categories, tags] = await Promise.all([
    getBlogCategories(),
    getBlogTags()
  ]);

  return json({
    posts: blogData.posts,
    pagination: blogData.pagination,
    filters: blogData.filters,
    categories,
    tags,
  });
}

type LoaderData = {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: { category?: string; tag?: string; search?: string };
  categories: BlogCategory[];
  tags: BlogTag[];
};

export default function BlogIndex() {
  const { posts, pagination, filters, categories, tags } = useLoaderData<LoaderData>();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-975">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20">
        <Section spacing="lg">
          <Container maxWidth="7xl">
            <div className="text-center">
              <h1 className="font-heading text-4xl font-bold text-primary-purple dark:text-white sm:text-5xl lg:text-6xl">
                FocusLab Blog
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600 dark:text-gray-200 sm:text-xl">
                Insights, tutorials, and resources about building accessible, 
                neurodivergent-friendly development tools and inclusive technology.
              </p>
            </div>
          </Container>
        </Section>
      </div>

      {/* Filters Section */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <Section spacing="sm">
          <Container maxWidth="7xl">
            <div className="flex flex-wrap items-center gap-4">
              {/* Categories */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categories:</span>
                <Link 
                  to="/blog" 
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    !filters.category 
                      ? 'bg-primary-purple text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/blog?category=${category.slug}`}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      filters.category === category.slug
                        ? 'bg-primary-purple text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category.name} ({category.postCount})
                  </Link>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags:</span>
              {tags.slice(0, 8).map((tag) => (
                <Link
                  key={tag.slug}
                  to={`/blog?tag=${tag.slug}`}
                  className={`rounded-full px-2 py-1 text-xs transition-colors ${
                    filters.tag === tag.slug
                      ? 'bg-teal-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      </div>

      {/* Blog Posts Grid */}
      <Section spacing="lg">
        <Container maxWidth="7xl">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                No posts found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {filters.category || filters.tag || filters.search 
                  ? "Try adjusting your filters or search terms."
                  : "Check back soon for new content!"}
              </p>
              <Link to="/blog">
                <Button>View All Posts</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {filters.category && `Posts in "${filters.category}"`}
                  {filters.tag && `Posts tagged "${filters.tag}"`}
                  {filters.search && `Search results for "${filters.search}"`}
                  {!filters.category && !filters.tag && !filters.search && "Latest Posts"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {pagination.total} {pagination.total === 1 ? 'post' : 'posts'} found
                </p>
              </div>

              {/* Posts Grid */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogPostCard 
                    key={post.slug}
                    post={post}
                    variant={post.frontmatter.featured ? "featured" : "default"}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  {pagination.hasPrev && (
                    <Link
                      to={`/blog?${new URLSearchParams({
                        ...Object.fromEntries(
                          Object.entries(filters).filter(([_, value]) => value !== undefined)
                        ),
                        page: (pagination.page - 1).toString()
                      }).toString()}`}
                    >
                      <Button variant="secondary">Previous</Button>
                    </Link>
                  )}
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  {pagination.hasNext && (
                    <Link
                      to={`/blog?${new URLSearchParams({
                        ...Object.fromEntries(
                          Object.entries(filters).filter(([_, value]) => value !== undefined)
                        ),
                        page: (pagination.page + 1).toString()
                      }).toString()}`}
                    >
                      <Button variant="secondary">Next</Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </Container>
      </Section>
    </div>
  );
}