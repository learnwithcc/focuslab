/**
 * Cookie Consent Timing Analysis Script
 * 
 * Run this in the browser console after loading the page to analyze timing logs
 * and identify race conditions in the cookie consent initialization sequence.
 */

function analyzeCookieConsentTiming() {
  console.log('🔍 Starting Cookie Consent Timing Analysis...');
  
  // Override console.log temporarily to capture timing logs
  const originalLog = console.log;
  const timingLogs = [];
  const marks = [];
  
  console.log = function(...args) {
    const message = args.join(' ');
    
    // Capture timing logs
    if (message.includes('[TIMING:') || message.includes('[MARK:')) {
      const timestamp = message.match(/\[(?:TIMING|MARK):(\d+\.?\d*)ms/);
      const component = message.match(/\] (\w+) -/);
      const event = message.match(/- (.+?)(?:\s|$)/);
      
      if (timestamp) {
        const logEntry = {
          timestamp: parseFloat(timestamp[1]),
          component: component ? component[1] : 'Unknown',
          event: event ? event[1] : 'Unknown',
          fullMessage: message,
          data: args.length > 1 ? args.slice(1) : null
        };
        
        if (message.includes('[MARK:')) {
          marks.push(logEntry);
        } else {
          timingLogs.push(logEntry);
        }
      }
    }
    
    // Call original console.log
    originalLog.apply(console, args);
  };
  
  // Restore console.log after analysis
  setTimeout(() => {
    console.log = originalLog;
    performAnalysis(timingLogs, marks);
  }, 5000); // Give 5 seconds to capture initialization
  
  function performAnalysis(logs, marks) {
    console.log('\n📊 TIMING ANALYSIS RESULTS\n');
    
    // Sort by timestamp
    logs.sort((a, b) => a.timestamp - b.timestamp);
    marks.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log('🎯 Key Milestones:');
    marks.forEach(mark => {
      console.log(`  ${mark.timestamp.toFixed(2)}ms: ${mark.event}`);
    });
    
    console.log('\n⏱️  Component Initialization Sequence:');
    logs.forEach((log, index) => {
      const delta = index > 0 ? (log.timestamp - logs[index - 1].timestamp).toFixed(2) : '0.00';
      console.log(`  ${log.timestamp.toFixed(2)}ms (+${delta}ms): ${log.component} - ${log.event}`);
    });
    
    // Identify race conditions
    console.log('\n⚠️  Potential Race Conditions:');
    
    const mountedTime = marks.find(m => m.event.includes('MOUNTED_STATE_SET_TO_TRUE'))?.timestamp;
    const consentInitStart = marks.find(m => m.event.includes('COOKIE_CONSENT_INITIALIZATION_START'))?.timestamp;
    const consentInitComplete = marks.find(m => m.event.includes('COOKIE_CONSENT_INITIALIZATION_COMPLETE'))?.timestamp;
    const bannerVisible = marks.find(m => m.event.includes('COOKIE_BANNER_VISIBLE'))?.timestamp;
    
    if (mountedTime && consentInitStart) {
      const gap1 = consentInitStart - mountedTime;
      console.log(`  Gap 1 (Mounted → Consent Init): ${gap1.toFixed(2)}ms`);
      if (gap1 > 1) {
        console.log('    ⚠️  Significant delay between hydration and consent initialization');
      }
    }
    
    if (consentInitStart && consentInitComplete) {
      const gap2 = consentInitComplete - consentInitStart;
      console.log(`  Gap 2 (Consent Init Duration): ${gap2.toFixed(2)}ms`);
      if (gap2 > 5) {
        console.log('    ⚠️  Slow consent initialization (localStorage access)');
      }
    }
    
    if (consentInitComplete && bannerVisible) {
      const gap3 = bannerVisible - consentInitComplete;
      console.log(`  Gap 3 (Consent Complete → Banner Visible): ${gap3.toFixed(2)}ms`);
      console.log('    📝 This includes the 100ms CookieBanner visibility delay');
    }
    
    // Analyze component render frequency
    console.log('\n🔄 Component Render Frequency:');
    const componentCounts = {};
    logs.forEach(log => {
      if (log.event.includes('render') || log.event.includes('Component function called')) {
        componentCounts[log.component] = (componentCounts[log.component] || 0) + 1;
      }
    });
    
    Object.entries(componentCounts).forEach(([component, count]) => {
      console.log(`  ${component}: ${count} renders`);
      if (count > 2) {
        console.log(`    ⚠️  Potential excessive re-rendering`);
      }
    });
    
    // Banner flash analysis
    console.log('\n👁️  Banner Flash Analysis:');
    const showBannerLogs = logs.filter(log => 
      log.event.includes('showBanner') || 
      log.event.includes('banner visibility') ||
      log.event.includes('Banner visibility')
    );
    
    if (showBannerLogs.length > 0) {
      console.log('  Banner visibility decisions:');
      showBannerLogs.forEach(log => {
        console.log(`    ${log.timestamp.toFixed(2)}ms: ${log.event}`);
      });
    }
    
    // localStorage access timing
    console.log('\n💾 LocalStorage Access Timing:');
    const localStorageLogs = logs.filter(log => 
      log.component === 'safeLocalStorage' || 
      log.component === 'cookies'
    );
    
    localStorageLogs.slice(0, 10).forEach(log => {
      console.log(`  ${log.timestamp.toFixed(2)}ms: ${log.component} - ${log.event}`);
    });
    
    // Summary and recommendations
    console.log('\n📋 SUMMARY & RECOMMENDATIONS:');
    
    if (bannerVisible && consentInitComplete && bannerVisible < consentInitComplete + 150) {
      console.log('  ✅ Banner timing appears normal (shows after consent check + 100ms delay)');
    } else {
      console.log('  ❌ Banner may be showing before consent is properly checked');
      console.log('  💡 Recommendation: Ensure banner only shows after isInitialized is true');
    }
    
    const totalInitTime = bannerVisible || consentInitComplete || 0;
    if (totalInitTime > 200) {
      console.log(`  ⚠️  Slow initialization (${totalInitTime.toFixed(2)}ms total)`);
      console.log('  💡 Recommendation: Consider optimizing localStorage access or reducing delays');
    } else {
      console.log(`  ✅ Fast initialization (${totalInitTime.toFixed(2)}ms total)`);
    }
    
    console.log('\n🔬 To further debug, check the full logs above for:');
    console.log('   - Multiple rapid renders of the same component');
    console.log('   - Banner visibility decisions before consent loading');
    console.log('   - Long gaps between hydration and localStorage access');
    console.log('   - Race conditions in useEffect dependencies');
  }
  
  console.log('📝 Analysis script loaded. Reload the page to capture timing data.');
  console.log('   The analysis will automatically run after 5 seconds of page load.');
}

// Auto-run if this script is loaded
if (typeof window !== 'undefined') {
  analyzeCookieConsentTiming();
} else {
  console.log('Run analyzeCookieConsentTiming() in the browser console after loading the page.');
}