export interface BlogPostFrontmatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  imageAlt?: string;
  featured?: boolean;
  draft?: boolean;
  readingTime?: number;
  slug?: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  content: string;
  excerpt?: string;
  readingTime: {
    text: string;
    minutes: number;
    time: number;
    words: number;
  };
  html?: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
  description?: string;
  postCount: number;
}

export interface BlogTag {
  name: string;
  slug: string;
  postCount: number;
}

export interface BlogFilters {
  category?: string;
  tag?: string;
  search?: string;
  featured?: boolean;
  draft?: boolean;
}

export interface BlogSortOption {
  field: 'publishedAt' | 'updatedAt' | 'title' | 'readingTime';
  direction: 'asc' | 'desc';
}

export interface BlogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BlogSearchResult {
  posts: BlogPost[];
  pagination: BlogPagination;
  filters: BlogFilters;
  sort: BlogSortOption;
}

// Content Service Interface for Future Directus Migration
export interface ContentService {
  // Blog Posts
  getAllPosts(filters?: BlogFilters, sort?: BlogSortOption, pagination?: Partial<BlogPagination>): Promise<BlogSearchResult>;
  getPostBySlug(slug: string): Promise<BlogPost | null>;
  getFeaturedPosts(limit?: number): Promise<BlogPost[]>;
  getRelatedPosts(slug: string, limit?: number): Promise<BlogPost[]>;
  
  // Categories
  getAllCategories(): Promise<BlogCategory[]>;
  getCategoryBySlug(slug: string): Promise<BlogCategory | null>;
  getPostsByCategory(categorySlug: string, pagination?: Partial<BlogPagination>): Promise<BlogSearchResult>;
  
  // Tags
  getAllTags(): Promise<BlogTag[]>;
  getTagBySlug(slug: string): Promise<BlogTag | null>;
  getPostsByTag(tagSlug: string, pagination?: Partial<BlogPagination>): Promise<BlogSearchResult>;
  
  // Search
  searchPosts(query: string, pagination?: Partial<BlogPagination>): Promise<BlogSearchResult>;
  
  // RSS/Sitemap
  getPostsForRSS(): Promise<BlogPost[]>;
  getPostsForSitemap(): Promise<Pick<BlogPost, 'slug' | 'frontmatter'>[]>;
}

// Directus Migration Types (Future Use)
export interface DirectusPost {
  id: string;
  status: 'published' | 'draft' | 'archived';
  title: string;
  slug: string;
  description: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  featured_image_alt?: string;
  author: string;
  category: DirectusCategory;
  tags: DirectusTag[];
  featured: boolean;
  published_at: string;
  updated_at: string;
  created_at: string;
}

export interface DirectusCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface DirectusTag {
  id: string;
  name: string;
  slug: string;
}