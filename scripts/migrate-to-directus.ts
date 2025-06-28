#!/usr/bin/env tsx

/**
 * Migration script for exporting MDX blog content to Directus-compatible format
 * 
 * Usage:
 *   npm run migrate:export         # Export to JSON files
 *   npm run migrate:validate       # Validate migration data
 *   npm run migrate:import         # Import to Directus (requires Directus setup)
 */

import fs from 'fs/promises';
import path from 'path';
import { contentService } from '../app/services/blog.server';
import { BlogMigrationUtils, convertToDirectusPost } from '../app/services/directus-migration.server';
import type { BlogPost } from '../app/types/blog';

const OUTPUT_DIR = path.join(process.cwd(), 'migration-output');
const POSTS_FILE = path.join(OUTPUT_DIR, 'posts.json');
const CATEGORIES_FILE = path.join(OUTPUT_DIR, 'categories.json');
const TAGS_FILE = path.join(OUTPUT_DIR, 'tags.json');
const REDIRECTS_FILE = path.join(OUTPUT_DIR, 'redirects.json');

async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
}

async function exportToDirectusFormat() {
  console.log('🚀 Starting MDX to Directus migration export...\n');

  try {
    // Ensure output directory exists
    await ensureOutputDir();

    // Get all posts from file-based system
    console.log('📖 Loading all blog posts...');
    const result = await contentService.getAllPosts();
    const posts = result.posts;
    console.log(`✅ Loaded ${posts.length} posts\n`);

    // Convert to Directus format
    console.log('🔄 Converting to Directus format...');
    const exportData = await BlogMigrationUtils.exportToDirectusFormat(posts);
    console.log(`✅ Converted ${exportData.posts.length} posts`);
    console.log(`✅ Found ${exportData.categories.length} categories`);
    console.log(`✅ Found ${exportData.tags.length} tags\n`);

    // Generate redirects mapping
    console.log('🔗 Generating URL redirects mapping...');
    const redirects = BlogMigrationUtils.generateRedirectMapping(posts);
    console.log(`✅ Generated ${redirects.length} redirect mappings\n`);

    // Write export files
    console.log('💾 Writing export files...');
    await Promise.all([
      fs.writeFile(POSTS_FILE, JSON.stringify(exportData.posts, null, 2)),
      fs.writeFile(CATEGORIES_FILE, JSON.stringify(exportData.categories, null, 2)),
      fs.writeFile(TAGS_FILE, JSON.stringify(exportData.tags, null, 2)),
      fs.writeFile(REDIRECTS_FILE, JSON.stringify(redirects, null, 2))
    ]);

    console.log(`✅ Posts exported to: ${POSTS_FILE}`);
    console.log(`✅ Categories exported to: ${CATEGORIES_FILE}`);
    console.log(`✅ Tags exported to: ${TAGS_FILE}`);
    console.log(`✅ Redirects exported to: ${REDIRECTS_FILE}\n`);

    // Generate summary
    const summary = {
      exportDate: new Date().toISOString(),
      totalPosts: exportData.posts.length,
      totalCategories: exportData.categories.length,
      totalTags: exportData.tags.length,
      featuredPosts: exportData.posts.filter(p => p.featured).length,
      draftPosts: exportData.posts.filter(p => p.status === 'draft').length,
      publishedPosts: exportData.posts.filter(p => p.status === 'published').length
    };

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'migration-summary.json'), 
      JSON.stringify(summary, null, 2)
    );

    console.log('📊 Migration Summary:');
    console.log(`   Total Posts: ${summary.totalPosts}`);
    console.log(`   Published: ${summary.publishedPosts}`);
    console.log(`   Drafts: ${summary.draftPosts}`);
    console.log(`   Featured: ${summary.featuredPosts}`);
    console.log(`   Categories: ${summary.totalCategories}`);
    console.log(`   Tags: ${summary.totalTags}\n`);

    console.log('🎉 Export completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up your Directus instance');
    console.log('2. Create the blog collections schema');
    console.log('3. Import the generated JSON files into Directus');
    console.log('4. Configure environment variables for Directus connection');
    console.log('5. Test the migration with USE_DIRECTUS=true\n');

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

async function validateMigration() {
  console.log('🔍 Validating migration data...\n');

  try {
    // Load original posts
    console.log('📖 Loading original posts...');
    const result = await contentService.getAllPosts();
    const originalPosts = result.posts;
    console.log(`✅ Loaded ${originalPosts.length} original posts\n`);

    // Load exported data
    console.log('📄 Loading exported data...');
    const [postsData, categoriesData, tagsData] = await Promise.all([
      fs.readFile(POSTS_FILE, 'utf8').then(JSON.parse),
      fs.readFile(CATEGORIES_FILE, 'utf8').then(JSON.parse),
      fs.readFile(TAGS_FILE, 'utf8').then(JSON.parse)
    ]);

    console.log(`✅ Loaded exported data`);
    console.log(`   Posts: ${postsData.length}`);
    console.log(`   Categories: ${categoriesData.length}`);
    console.log(`   Tags: ${tagsData.length}\n`);

    // Validate data integrity
    console.log('🔎 Validating data integrity...');
    
    // Mock converted posts for validation (in real scenario, these would come from Directus)
    const mockDirectusPosts = postsData.map((post: any) => ({
      id: 'mock-id',
      ...post
    }));

    const validation = BlogMigrationUtils.validateMigration(originalPosts, mockDirectusPosts);

    if (validation.valid) {
      console.log('✅ Migration validation passed!\n');
    } else {
      console.log('❌ Migration validation failed:\n');
      validation.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
      console.log();
    }

    // Additional checks
    console.log('🔍 Additional validation checks:');
    
    // Check for required fields
    const missingFields = postsData.filter((post: any) => !post.title || !post.slug || !post.content);
    if (missingFields.length > 0) {
      console.log(`❌ ${missingFields.length} posts missing required fields`);
    } else {
      console.log('✅ All posts have required fields');
    }

    // Check for duplicate slugs
    const slugs = postsData.map((post: any) => post.slug);
    const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicateSlugs.length > 0) {
      console.log(`❌ Duplicate slugs found: ${duplicateSlugs.join(', ')}`);
    } else {
      console.log('✅ All slugs are unique');
    }

    // Check category and tag consistency
    const categoryNames = new Set(postsData.map((post: any) => post.category.name));
    const exportedCategoryNames = new Set(categoriesData.map((cat: any) => cat.name));
    const missingCategories = Array.from(categoryNames).filter(name => !exportedCategoryNames.has(name));
    
    if (missingCategories.length > 0) {
      console.log(`❌ Missing categories: ${missingCategories.join(', ')}`);
    } else {
      console.log('✅ All categories properly exported');
    }

    console.log('\n🎉 Validation completed!');

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

async function showHelp() {
  console.log('📚 Directus Migration Tool\n');
  console.log('Available commands:');
  console.log('  export     Export MDX content to Directus format');
  console.log('  validate   Validate exported migration data');
  console.log('  help       Show this help message\n');
  console.log('Usage examples:');
  console.log('  npm run migrate:export');
  console.log('  npm run migrate:validate');
  console.log('  tsx scripts/migrate-to-directus.ts export\n');
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'export':
      await exportToDirectusFormat();
      break;
    case 'validate':
      await validateMigration();
      break;
    case 'help':
    case '--help':
    case '-h':
      await showHelp();
      break;
    default:
      console.log('❌ Unknown command. Use "help" to see available commands.\n');
      await showHelp();
      process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}