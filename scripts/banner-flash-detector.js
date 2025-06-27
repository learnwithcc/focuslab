/**
 * Cookie Banner Flash Detection Script
 * 
 * This script uses MutationObserver to detect exactly when the cookie banner
 * appears and disappears in the DOM, providing precise timing for flash detection.
 */

function detectBannerFlash() {
  console.log('🔍 Starting Cookie Banner Flash Detection...');
  
  const bannerEvents = [];
  const startTime = performance.now();
  
  function logBannerEvent(event, element, details = {}) {
    const timestamp = performance.now() - startTime;
    const eventData = {
      timestamp: timestamp.toFixed(2),
      event,
      element: element?.tagName || 'Unknown',
      className: element?.className || '',
      details
    };
    
    bannerEvents.push(eventData);
    console.log(`🍪 [BANNER:${timestamp.toFixed(2)}ms] ${event}`, details);
  }
  
  // Create mutation observer to watch for banner DOM changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Check for added nodes (banner appearing)
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for cookie banner elements
          if (node.className && (
            node.className.includes('fixed') && node.className.includes('bottom-0') ||
            node.textContent?.includes('cookie') ||
            node.textContent?.includes('consent')
          )) {
            logBannerEvent('BANNER_ADDED_TO_DOM', node, {
              textContent: node.textContent?.substring(0, 100) + '...',
              visible: isElementVisible(node)
            });
          }
          
          // Check children for cookie banners
          const bannerChildren = node.querySelectorAll?.('[class*="cookie"], [class*="consent"], .fixed.bottom-0');
          bannerChildren?.forEach(child => {
            logBannerEvent('BANNER_CHILD_ADDED', child, {
              visible: isElementVisible(child)
            });
          });
        }
      });
      
      // Check for removed nodes (banner disappearing)
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && 
            node.className && 
            (node.className.includes('fixed') && node.className.includes('bottom-0'))) {
          logBannerEvent('BANNER_REMOVED_FROM_DOM', node);
        }
      });
      
      // Check for attribute changes (visibility changes)
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
        const element = mutation.target;
        if (element.className && (
          element.className.includes('fixed') && element.className.includes('bottom-0') ||
          element.textContent?.includes('cookie')
        )) {
          logBannerEvent('BANNER_ATTRIBUTES_CHANGED', element, {
            attribute: mutation.attributeName,
            oldValue: mutation.oldValue,
            newValue: element.getAttribute(mutation.attributeName),
            visible: isElementVisible(element)
          });
        }
      }
    });
  });
  
  // Helper function to check if element is visible
  function isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['class', 'style']
  });
  
  // Check for existing banners
  setTimeout(() => {
    const existingBanners = document.querySelectorAll('.fixed.bottom-0, [class*="cookie"], [class*="consent"]');
    existingBanners.forEach(banner => {
      if (banner.textContent?.includes('cookie') || banner.textContent?.includes('consent')) {
        logBannerEvent('EXISTING_BANNER_FOUND', banner, {
          visible: isElementVisible(banner),
          textContent: banner.textContent?.substring(0, 100) + '...'
        });
      }
    });
  }, 100);
  
  // Periodic visibility check for flash detection
  let lastVisibilityCheck = null;
  const visibilityCheckInterval = setInterval(() => {
    const banners = document.querySelectorAll('.fixed.bottom-0');
    banners.forEach(banner => {
      if (banner.textContent?.includes('cookie') || banner.textContent?.includes('consent')) {
        const isVisible = isElementVisible(banner);
        const currentCheck = { element: banner, visible: isVisible, timestamp: performance.now() - startTime };
        
        if (lastVisibilityCheck && 
            lastVisibilityCheck.element === banner && 
            lastVisibilityCheck.visible !== isVisible) {
          const timeDiff = currentCheck.timestamp - lastVisibilityCheck.timestamp;
          logBannerEvent('BANNER_VISIBILITY_CHANGED', banner, {
            from: lastVisibilityCheck.visible ? 'visible' : 'hidden',
            to: isVisible ? 'visible' : 'hidden',
            duration: timeDiff.toFixed(2) + 'ms'
          });
          
          // Detect flash (quick show/hide)
          if (timeDiff < 200 && lastVisibilityCheck.visible && !isVisible) {
            console.log('⚡ FLASH DETECTED! Banner was visible for only ' + timeDiff.toFixed(2) + 'ms');
          }
        }
        
        lastVisibilityCheck = currentCheck;
      }
    });
  }, 10); // Check every 10ms for high precision
  
  // Stop monitoring after 10 seconds
  setTimeout(() => {
    observer.disconnect();
    clearInterval(visibilityCheckInterval);
    
    console.log('\n📊 BANNER FLASH ANALYSIS COMPLETE\n');
    console.log('🎯 Banner Events Timeline:');
    bannerEvents.forEach(event => {
      console.log(`  ${event.timestamp}ms: ${event.event}`, event.details);
    });
    
    // Analyze for flash patterns
    console.log('\n⚡ Flash Pattern Analysis:');
    const visibilityChanges = bannerEvents.filter(e => e.event === 'BANNER_VISIBILITY_CHANGED');
    
    if (visibilityChanges.length === 0) {
      console.log('  ✅ No visibility changes detected - no flash');
    } else {
      visibilityChanges.forEach(change => {
        console.log(`  ${change.timestamp}ms: ${change.details.from} → ${change.details.to} (${change.details.duration})`);
      });
      
      // Look for quick show/hide patterns
      const quickFlashes = visibilityChanges.filter(change => {
        const duration = parseFloat(change.details.duration);
        return duration < 200 && change.details.from === 'visible' && change.details.to === 'hidden';
      });
      
      if (quickFlashes.length > 0) {
        console.log('  ⚠️  Quick flashes detected:');
        quickFlashes.forEach(flash => {
          console.log(`    ${flash.timestamp}ms: Flash lasted ${flash.details.duration}`);
        });
      }
    }
    
    console.log('\n💡 Recommendations:');
    if (bannerEvents.some(e => e.event === 'BANNER_ADDED_TO_DOM' && !e.details.visible)) {
      console.log('  - Banner was added to DOM but not immediately visible (good)');
    }
    if (bannerEvents.some(e => e.event === 'BANNER_ADDED_TO_DOM' && e.details.visible)) {
      console.log('  - Banner was immediately visible when added to DOM (potential issue)');
    }
    
  }, 10000);
  
  console.log('👁️  Flash detector active for 10 seconds. Reload the page to test.');
}

// Auto-run detection
if (typeof window !== 'undefined') {
  // Wait a bit for page to start loading
  setTimeout(detectBannerFlash, 100);
} else {
  console.log('Run detectBannerFlash() in the browser console.');
}