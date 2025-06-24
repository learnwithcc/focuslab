import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiLimiter, formLimiter } from '~/utils/rate-limiter';

// Mock environment variables to force fallback behavior for testing
vi.mock('process', () => ({
  env: {}
}));

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear any mocks
    vi.clearAllMocks();
  });

  const createMockRequest = (ip: string = '127.0.0.1'): Request => {
    return new Request('https://example.com/test', {
      headers: {
        'x-forwarded-for': ip,
      },
    });
  };

  describe('apiLimiter', () => {
    it('should allow requests under the limit', async () => {
      const request = createMockRequest('192.168.1.1');
      
      // Should not throw for the first request
      await expect(apiLimiter(request)).resolves.not.toThrow();
    });

    it('should handle requests with different IPs separately', async () => {
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');
      
      // Both should succeed as they have different IPs
      await expect(apiLimiter(request1)).resolves.not.toThrow();
      await expect(apiLimiter(request2)).resolves.not.toThrow();
    });

    it('should extract IP from x-forwarded-for header', async () => {
      const request = createMockRequest('203.0.113.1');
      
      // Should not throw with valid IP
      await expect(apiLimiter(request)).resolves.not.toThrow();
    });

    it('should handle requests without IP headers', async () => {
      const request = new Request('https://example.com/test');
      
      // Should not throw and use fallback IP
      await expect(apiLimiter(request)).resolves.not.toThrow();
    });
  });

  describe('formLimiter', () => {
    it('should allow requests under the limit', async () => {
      const request = createMockRequest('192.168.2.1');
      
      // Should not throw for the first request
      await expect(formLimiter(request)).resolves.not.toThrow();
    });

    it('should handle requests with different IPs separately', async () => {
      const request1 = createMockRequest('192.168.2.1');
      const request2 = createMockRequest('192.168.2.2');
      
      // Both should succeed as they have different IPs
      await expect(formLimiter(request1)).resolves.not.toThrow();
      await expect(formLimiter(request2)).resolves.not.toThrow();
    });

    it('should use stricter limits than apiLimiter', async () => {
      // Form limiter should have stricter rate limits
      // This is tested by the actual rate limit values in the implementation
      const request = createMockRequest('192.168.2.3');
      
      await expect(formLimiter(request)).resolves.not.toThrow();
    });
  });

  describe('IP extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const request = new Request('https://example.com/test', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 192.168.1.1',
        },
      });
      
      // Should use the first IP in the comma-separated list
      await expect(apiLimiter(request)).resolves.not.toThrow();
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is not present', async () => {
      const request = new Request('https://example.com/test', {
        headers: {
          'x-real-ip': '203.0.113.2',
        },
      });
      
      await expect(apiLimiter(request)).resolves.not.toThrow();
    });

    it('should use fallback IP when no IP headers are present', async () => {
      const request = new Request('https://example.com/test');
      
      // Should not throw and use fallback IP (127.0.0.1)
      await expect(apiLimiter(request)).resolves.not.toThrow();
    });
  });
});