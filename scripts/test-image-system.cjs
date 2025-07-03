#!/usr/bin/env node

/**
 * Image System Validation Script
 * Tests the image optimization and loading pipeline
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_IMAGES = [
  '/images/blog/introducing-focuslab-blog.jpg',
  '/images/blog/accessibility-first-design.jpg', 
  '/images/blog/mdx-powered-blogging.jpg',
  '/images/blog/placeholder-default.jpg',
  '/images/blog/placeholder-featured.jpg'
];

const FORMATS = ['jpeg', 'webp', 'avif'];
const DIMENSIONS = [
  { w: 400, h: 300 },
  { w: 800, h: 400 },
  { w: 1200, h: 600 }
];

let devServer = null;
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m'  // Yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}[${type.toUpperCase()}]${reset} ${message}`);
}

function addTestResult(name, passed, message) {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    log(`✓ ${name}`, 'success');
  } else {
    testResults.failed++;
    log(`✗ ${name}: ${message}`, 'error');
  }
}

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? require('https') : require('http');
    const request = protocol.get(url, (response) => {
      let data = Buffer.alloc(0);
      
      response.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          data,
          size: data.length
        });
      });
    });
    
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testImageExists(imagePath) {
  const fullPath = path.join(__dirname, '..', 'public', imagePath);
  return fs.existsSync(fullPath);
}

async function testDirectImageAccess() {
  log('Testing direct image access...');
  
  for (const imagePath of TEST_IMAGES) {
    try {
      const exists = await testImageExists(imagePath);
      if (!exists) {
        addTestResult(`Direct access: ${imagePath}`, false, 'Image file does not exist');
        continue;
      }

      const response = await makeRequest(`${BASE_URL}${imagePath}`);
      const passed = response.statusCode === 200 && response.size > 0;
      addTestResult(
        `Direct access: ${imagePath}`, 
        passed,
        passed ? `${response.size} bytes` : `HTTP ${response.statusCode}, ${response.size} bytes`
      );
    } catch (error) {
      addTestResult(`Direct access: ${imagePath}`, false, error.message);
    }
  }
}

async function testImageOptimizationAPI() {
  log('Testing image optimization API...');
  
  for (const imagePath of TEST_IMAGES.slice(0, 2)) { // Test first 2 images
    for (const format of FORMATS) {
      for (const { w, h } of DIMENSIONS.slice(0, 2)) { // Test first 2 dimensions
        try {
          const apiUrl = `${BASE_URL}/api/images?src=${encodeURIComponent(imagePath)}&w=${w}&h=${h}&f=${format}&q=80`;
          const response = await makeRequest(apiUrl);
          
          const passed = response.statusCode === 200 && response.size > 0;
          const expectedMimeType = `image/${format === 'jpeg' ? 'jpeg' : format}`;
          const correctMimeType = response.headers['content-type'] === expectedMimeType;
          
          addTestResult(
            `API optimization: ${path.basename(imagePath)} ${w}x${h} ${format}`,
            passed && correctMimeType,
            passed ? `${response.size} bytes, ${response.headers['content-type']}` : 
                    `HTTP ${response.statusCode}, wrong mime type: ${response.headers['content-type']}`
          );
        } catch (error) {
          addTestResult(`API optimization: ${path.basename(imagePath)} ${w}x${h} ${format}`, false, error.message);
        }
      }
    }
  }
}

async function testMissingImageFallback() {
  log('Testing missing image fallback...');
  
  try {
    const apiUrl = `${BASE_URL}/api/images?src=/images/blog/nonexistent-image.jpg&w=400&h=300`;
    const response = await makeRequest(apiUrl);
    
    // Updated expectation: API now returns 200 with SVG to prevent hydration errors
    const passed = response.statusCode === 200 && 
                  response.headers['content-type'] === 'image/svg+xml' &&
                  response.size > 0;
    
    addTestResult(
      'Missing image fallback',
      passed,
      passed ? `SVG placeholder returned (${response.size} bytes)` :
               `HTTP ${response.statusCode}, ${response.headers['content-type']}, ${response.size} bytes`
    );
  } catch (error) {
    addTestResult('Missing image fallback', false, error.message);
  }
}

async function testResponsiveSizes() {
  log('Testing responsive image sizes...');
  
  const testImage = TEST_IMAGES[0];
  const sizes = [
    { w: 320, desc: 'mobile' },
    { w: 768, desc: 'tablet' },
    { w: 1024, desc: 'desktop' },
    { w: 1440, desc: 'large' }
  ];
  
  for (const { w, desc } of sizes) {
    try {
      const apiUrl = `${BASE_URL}/api/images?src=${encodeURIComponent(testImage)}&w=${w}&f=webp&q=80`;
      const response = await makeRequest(apiUrl);
      
      const passed = response.statusCode === 200 && response.size > 0;
      addTestResult(
        `Responsive size: ${desc} (${w}px)`,
        passed,
        passed ? `${response.size} bytes` : `HTTP ${response.statusCode}`
      );
    } catch (error) {
      addTestResult(`Responsive size: ${desc} (${w}px)`, false, error.message);
    }
  }
}

async function testCacheHeaders() {
  log('Testing cache headers...');
  
  try {
    const apiUrl = `${BASE_URL}/api/images?src=${encodeURIComponent(TEST_IMAGES[0])}&w=400&h=300&f=webp&q=80`;
    const response = await makeRequest(apiUrl);
    
    const hasCacheControl = response.headers['cache-control'];
    const hasETag = response.headers['etag'];
    const passed = response.statusCode === 200 && hasCacheControl && hasETag;
    
    addTestResult(
      'Cache headers',
      passed,
      passed ? `Cache-Control: ${hasCacheControl}, ETag: ${hasETag}` :
               `Missing cache headers`
    );
  } catch (error) {
    addTestResult('Cache headers', false, error.message);
  }
}

async function startDevServer() {
  log('Starting development server...');
  
  return new Promise((resolve, reject) => {
    devServer = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    devServer.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Local:   http://localhost:3000/')) {
        setTimeout(resolve, 2000); // Wait 2 seconds for full startup
      }
    });
    
    devServer.stderr.on('data', (data) => {
      const message = data.toString();
      if (message.includes('EADDRINUSE')) {
        log('Port 3000 already in use, assuming server is running', 'warning');
        resolve();
      }
    });
    
    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 30000);
  });
}

function stopDevServer() {
  if (devServer) {
    log('Stopping development server...');
    devServer.kill();
  }
}

async function runTests() {
  log('🧪 Starting Image System Validation Tests', 'info');
  
  try {
    await startDevServer();
    
    // Run all test suites
    await testDirectImageAccess();
    await testImageOptimizationAPI();
    await testMissingImageFallback();
    await testResponsiveSizes();
    await testCacheHeaders();
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
  } finally {
    stopDevServer();
  }
  
  // Print summary
  log('\n📊 Test Results Summary', 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Total: ${testResults.tests.length}`, 'info');
  
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'error');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => log(`  • ${test.name}: ${test.message}`, 'error'));
  }
  
  const success = testResults.failed === 0;
  log(`\n${success ? '✅ All tests passed!' : '❌ Some tests failed'}`, success ? 'success' : 'error');
  
  process.exit(success ? 0 : 1);
}

// Handle cleanup
process.on('SIGINT', () => {
  stopDevServer();
  process.exit(1);
});

process.on('SIGTERM', () => {
  stopDevServer();
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  log(`Unexpected error: ${error.message}`, 'error');
  stopDevServer();
  process.exit(1);
});