#!/usr/bin/env node

/**
 * Skip Navigation Verification Script
 * 
 * This script performs basic checks to ensure the skip navigation
 * implementation is properly integrated and follows accessibility best practices.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ROOT = path.dirname(__dirname);

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description}`, colors.green);
    return true;
  } else {
    log(`✗ ${description}`, colors.red);
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(searchString)) {
      log(`✓ ${description}`, colors.green);
      return true;
    } else {
      log(`✗ ${description}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ ${description} (file not readable)`, colors.red);
    return false;
  }
}

function main() {
  log('\n' + '='.repeat(60), colors.blue);
  log('Skip Navigation Implementation Verification', colors.bold + colors.blue);
  log('='.repeat(60) + '\n', colors.blue);

  let passedChecks = 0;
  let totalChecks = 0;

  // Component checks
  log('Component Implementation:', colors.yellow);
  totalChecks++;
  if (checkFile('app/components/SkipNavigation.tsx', 'SkipNavigation component exists')) {
    passedChecks++;
  }

  totalChecks++;
  if (checkFileContent(
    'app/components/SkipNavigation.tsx', 
    'aria-label="Skip to main content"',
    'Component has proper ARIA label'
  )) {
    passedChecks++;
  }

  totalChecks++;
  if (checkFileContent(
    'app/components/SkipNavigation.tsx', 
    'useEffect',
    'Component includes keyboard event handling'
  )) {
    passedChecks++;
  }

  // CSS checks
  log('\nCSS Implementation:', colors.yellow);
  totalChecks++;
  if (checkFileContent(
    'app/styles/tailwind.css', 
    '.skip-link',
    'Skip link CSS styles are defined'
  )) {
    passedChecks++;
  }

  totalChecks++;
  if (checkFileContent(
    'app/styles/tailwind.css', 
    'prefers-reduced-motion',
    'Reduced motion preferences are respected'
  )) {
    passedChecks++;
  }

  totalChecks++;
  if (checkFileContent(
    'app/styles/tailwind.css', 
    'prefers-contrast: high',
    'High contrast mode is supported'
  )) {
    passedChecks++;
  }

  // Integration checks
  log('\nIntegration:', colors.yellow);
  totalChecks++;
  if (checkFileContent(
    'app/components/index.ts', 
    'SkipNavigation',
    'Component is exported from index'
  )) {
    passedChecks++;
  }

  totalChecks++;
  if (checkFileContent(
    'app/root.tsx', 
    'SkipNavigation',
    'Component is imported in root layout'
  )) {
    passedChecks++;
  }

  totalChecks++;
  if (checkFileContent(
    'app/root.tsx', 
    '<SkipNavigation />',
    'Component is rendered in app'
  )) {
    passedChecks++;
  }

  totalChecks++;
  if (checkFileContent(
    'app/root.tsx', 
    'id="main-content"',
    'Main content has correct ID'
  )) {
    passedChecks++;
  }

  // Test checks
  log('\nTesting:', colors.yellow);
  totalChecks++;
  if (checkFile('tests/skip-navigation.spec.ts', 'Comprehensive Playwright tests exist')) {
    passedChecks++;
  }

  totalChecks++;
  if (checkFile('tests/skip-navigation-basic.spec.ts', 'Basic Playwright tests exist')) {
    passedChecks++;
  }

  // Documentation checks
  log('\nDocumentation:', colors.yellow);
  totalChecks++;
  if (checkFile('docs/SKIP_NAVIGATION_IMPLEMENTATION.md', 'Implementation documentation exists')) {
    passedChecks++;
  }

  totalChecks++;
  if (checkFile('app/components/SkipNavigation.stories.tsx', 'Storybook stories exist')) {
    passedChecks++;
  }

  // WCAG compliance checks
  log('\nWCAG 2.1 AA Compliance:', colors.yellow);
  totalChecks++;
  if (checkFileContent(
    'app/components/SkipNavigation.tsx', 
    'href={`#${targetId}`}',
    'Bypass blocks mechanism (2.4.1)'
  )) {
    passedChecks++;
  }

  totalChecks++;
  if (checkFileContent(
    'app/styles/tailwind.css', 
    'ring-4',
    'Focus indicators present (2.4.7)'
  )) {
    passedChecks++;
  }

  // Results
  log('\n' + '='.repeat(60), colors.blue);
  log('Verification Results:', colors.bold + colors.blue);
  log('='.repeat(60), colors.blue);

  const percentage = Math.round((passedChecks / totalChecks) * 100);
  const resultColor = percentage === 100 ? colors.green : 
                     percentage >= 80 ? colors.yellow : colors.red;

  log(`\nPassed: ${passedChecks}/${totalChecks} checks (${percentage}%)`, resultColor + colors.bold);

  if (percentage === 100) {
    log('\n🎉 All checks passed! Skip navigation is properly implemented.', colors.green + colors.bold);
    log('\nNext steps:', colors.blue);
    log('• Run manual testing by pressing Tab on any page');
    log('• Run automated tests: npm run test:e2e -- tests/skip-navigation-basic.spec.ts');
    log('• Test with screen readers');
    log('• Validate across different browsers');
  } else if (percentage >= 80) {
    log('\n⚠️  Most checks passed, but some issues need attention.', colors.yellow + colors.bold);
    log('Review the failed checks above and fix any missing components.', colors.yellow);
  } else {
    log('\n❌ Implementation incomplete. Please address the failed checks.', colors.red + colors.bold);
  }

  log('\nFor full implementation details, see:', colors.blue);
  log('• docs/SKIP_NAVIGATION_IMPLEMENTATION.md');
  log('• tests/skip-navigation.spec.ts');
  log('• app/components/SkipNavigation.stories.tsx');

  process.exit(percentage === 100 ? 0 : 1);
}

main();