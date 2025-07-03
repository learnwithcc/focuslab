# Manual Cross-Browser Testing Guide for Cookie Consent

This guide covers manual testing scenarios that complement the automated cross-browser tests, focusing on edge cases and browser-specific behaviors that require human verification.

## Browser Testing Matrix

### Primary Browsers
- **Chrome** (latest stable)
- **Firefox** (latest stable)  
- **Safari** (latest stable)
- **Edge** (latest stable)

### Mobile Browsers (Additional Testing)
- **Mobile Safari** (iOS)
- **Chrome Mobile** (Android)
- **Samsung Internet** (Android)
- **Firefox Mobile** (Android/iOS)

## Manual Testing Scenarios

### 1. First-Time User Experience

**Test Procedure:**
1. Clear all browser data (cookies, localStorage, sessionStorage)
2. Navigate to homepage in incognito/private mode
3. Observe banner appearance timing
4. Test banner interactions

**Chrome-Specific Checks:**
- [ ] Banner appears within 500ms
- [ ] Smooth CSS transitions
- [ ] No console errors
- [ ] PostHog initializes correctly after consent

**Firefox-Specific Checks:**
- [ ] Enhanced tracking protection doesn't block banner
- [ ] localStorage access works correctly
- [ ] No mixed content warnings
- [ ] Performance comparable to Chrome

**Safari-Specific Checks:**
- [ ] Banner works with Intelligent Tracking Prevention (ITP)
- [ ] Storage access doesn't trigger permission prompt
- [ ] Works in Safari's strict privacy mode
- [ ] No WebKit-specific rendering issues

**Edge-Specific Checks:**
- [ ] Consistent behavior with Chrome (Chromium base)
- [ ] Microsoft privacy features don't interfere
- [ ] Edge-specific security policies respected

### 2. Storage Restrictions Testing

**Private/Incognito Mode Testing:**

**Chrome Incognito:**
1. Open incognito window
2. Navigate to site
3. Verify banner appears
4. Accept cookies
5. Check that essential functions work
6. Verify PostHog is properly configured for limited storage

**Firefox Private Browsing:**
1. Open private window
2. Enable Enhanced Tracking Protection (strict mode)
3. Test banner functionality
4. Verify graceful degradation if storage is blocked

**Safari Private Browsing:**
1. Open private window
2. Test with Safari's strict storage limitations
3. Verify system handles storage quota exceeded errors
4. Check that consent system doesn't break

### 3. Content Blocker Testing

**Safari with Content Blockers:**
1. Enable Safari content blockers (like 1Blocker, AdGuard)
2. Test banner appearance
3. Verify fallback behavior when analytics is blocked
4. Check that consent system remains functional

**Firefox with uBlock Origin:**
1. Install uBlock Origin extension
2. Test with default filter lists
3. Verify banner isn't blocked by ad blockers
4. Test consent flow when PostHog is blocked

### 4. Accessibility Testing

**Screen Reader Testing:**
1. Test with VoiceOver (Safari/macOS)
2. Test with NVDA (Firefox/Windows)
3. Test with JAWS (Chrome/Windows)
4. Verify proper ARIA labels and focus management

**Keyboard Navigation:**
1. Tab through consent banner
2. Test Enter/Space activation
3. Test Escape key to close modals
4. Verify focus trap in modal dialogs

**High Contrast Mode:**
1. Enable Windows High Contrast mode (Edge)
2. Enable macOS Increase Contrast (Safari)
3. Verify banner remains visible and usable
4. Check color contrast ratios

### 5. Network Conditions

**Slow Network Testing:**
1. Use browser dev tools to throttle network (Slow 3G)
2. Test banner appearance timing
3. Verify graceful loading states
4. Check timeout handling

**Offline Testing:**
1. Load page while online
2. Go offline
3. Test banner interactions
4. Verify localStorage operations still work
5. Test recovery when back online

**Failed Network Requests:**
1. Block PostHog script loading
2. Block analytics endpoints
3. Verify consent system continues to function
4. Check error handling and fallbacks

### 6. Browser-Specific Edge Cases

**Chrome-Specific:**
- [ ] Test with Chrome's "Heavy Ad Intervention"
- [ ] Verify Site Isolation doesn't affect consent
- [ ] Test with Chrome's "Privacy Sandbox" features
- [ ] Check SameSite cookie handling

**Firefox-Specific:**
- [ ] Test with Total Cookie Protection
- [ ] Verify Strict Enhanced Tracking Protection compatibility
- [ ] Test with Firefox's State Partitioning
- [ ] Check DNS over HTTPS compatibility

**Safari-Specific:**
- [ ] Test with Safari's App-Bound Domains
- [ ] Verify CNAME cloaking detection doesn't affect consent
- [ ] Test with Safari's Link Tracking Protection
- [ ] Check Mail Privacy Protection compatibility

**Edge-Specific:**
- [ ] Test with Microsoft Defender SmartScreen
- [ ] Verify Windows Security integration
- [ ] Test with Edge's Tracking Prevention (strict)
- [ ] Check Internet Explorer mode compatibility (if needed)

### 7. Performance Testing

**Memory Usage:**
1. Monitor memory consumption during consent flow
2. Check for memory leaks after banner dismissal
3. Test on low-memory devices (mobile)

**CPU Usage:**
1. Monitor CPU during banner animations
2. Test on lower-powered devices
3. Verify no excessive JavaScript execution

**Battery Impact (Mobile):**
1. Test on mobile devices
2. Monitor battery usage during consent process
3. Verify efficient code execution

### 8. Error Recovery Testing

**JavaScript Errors:**
1. Inject JavaScript errors into consent system
2. Verify error boundaries work correctly
3. Test fallback banner appearance
4. Check graceful degradation

**Storage Failures:**
1. Fill localStorage to quota limit
2. Test consent storage in limited space
3. Verify error handling for storage failures
4. Check recovery mechanisms

**Network Failures:**
1. Simulate DNS failures
2. Test timeout scenarios
3. Verify retry mechanisms
4. Check offline functionality

## Testing Checklist

### Pre-Testing Setup
- [ ] Latest browser versions installed
- [ ] Development server running on localhost:3600
- [ ] Browser dev tools available
- [ ] Screen readers installed (if testing accessibility)
- [ ] Network throttling tools available

### For Each Browser Test
- [ ] Clear all browser data before testing
- [ ] Document any issues with screenshots
- [ ] Note performance differences
- [ ] Record any browser-specific behaviors
- [ ] Test both desktop and mobile viewports

### Post-Testing Documentation
- [ ] Record browser versions tested
- [ ] Document any compatibility issues found
- [ ] Note performance characteristics
- [ ] Identify browser-specific optimizations needed
- [ ] Update automated tests based on findings

## Common Issues to Watch For

### Cross-Browser Compatibility Issues
1. **CSS inconsistencies** - Different rendering of banner styles
2. **JavaScript differences** - Browser-specific API behaviors
3. **Performance variations** - Different execution speeds
4. **Storage limitations** - Browser-specific quota restrictions
5. **Privacy features** - Browser security blocking functionality

### Mobile-Specific Issues
1. **Touch interactions** - Different touch event handling
2. **Viewport issues** - Banner display on small screens
3. **Performance** - Slower JavaScript execution
4. **Network** - Intermittent connectivity handling
5. **Battery** - Power-efficient implementation

### Accessibility Issues
1. **Screen reader compatibility** - Different announcement behaviors
2. **Keyboard navigation** - Browser-specific focus management
3. **High contrast** - Display visibility issues
4. **Reduced motion** - Animation preference handling

## Reporting Issues

When documenting issues found during manual testing:

1. **Browser Information**
   - Browser name and version
   - Operating system
   - Device type (desktop/mobile)

2. **Issue Description**
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/videos if applicable

3. **Impact Assessment**
   - Severity (Critical/High/Medium/Low)
   - User impact
   - Frequency of occurrence

4. **Suggested Solutions**
   - Proposed fixes
   - Alternative approaches
   - Browser-specific workarounds

## Integration with Automated Tests

Manual testing findings should inform updates to:
- Automated test scenarios
- Browser-specific test configurations
- Performance benchmarks
- Error handling test cases

This manual testing guide ensures comprehensive coverage of edge cases that automated tests cannot catch, providing confidence in the cross-browser compatibility of the cookie consent system.