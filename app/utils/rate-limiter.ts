import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Simple function to get client IP from request
function getClientIP(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a default IP if none found
  return '127.0.0.1';
}

// Create Redis client for rate limiting
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!redis) {
    const url = process.env['UPSTASH_REDIS_REST_URL'];
    const token = process.env['UPSTASH_REDIS_REST_TOKEN'];
    
    if (!url || !token) {
      console.warn('Upstash Redis configuration missing. Rate limiting will use fallback behavior.');
      return null;
    }
    
    try {
      redis = new Redis({
        url,
        token,
      });
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      return null;
    }
  }
  
  return redis;
}

// Create rate limiters
let apiRateLimiter: Ratelimit | null = null;
let formRateLimiter: Ratelimit | null = null;

function getAPIRateLimiter(): Ratelimit | null {
  if (!apiRateLimiter) {
    const redisClient = getRedisClient();
    if (!redisClient) return null;
    
    try {
      apiRateLimiter = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(100, '15 m'), // 100 requests per 15 minutes
        analytics: true,
      });
    } catch (error) {
      console.error('Failed to initialize API rate limiter:', error);
      return null;
    }
  }
  
  return apiRateLimiter;
}

function getFormRateLimiter(): Ratelimit | null {
  if (!formRateLimiter) {
    const redisClient = getRedisClient();
    if (!redisClient) return null;
    
    try {
      formRateLimiter = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per 1 minute
        analytics: true,
      });
    } catch (error) {
      console.error('Failed to initialize form rate limiter:', error);
      return null;
    }
  }
  
  return formRateLimiter;
}

// In-memory fallback for rate limiting when Redis is unavailable
const fallbackStore = new Map<string, { count: number; resetTime: number }>();

function fallbackRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const key = `${ip}:${windowMs}`;
  const record = fallbackStore.get(key);
  
  // Clean up expired entries
  if (record && now > record.resetTime) {
    fallbackStore.delete(key);
  }
  
  const currentRecord = fallbackStore.get(key);
  
  if (!currentRecord) {
    // First request in this window
    fallbackStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (currentRecord.count >= maxRequests) {
    // Rate limit exceeded
    return false;
  }
  
  // Increment count
  currentRecord.count++;
  fallbackStore.set(key, currentRecord);
  return true;
}

/**
 * A rate limiter that can be used as a loader in a Remix route.
 * Limits each IP to 100 requests per 15 minutes.
 *
 * @example
 * export const loader: LoaderFunction = async ({ request }) => {
 *   await apiLimiter(request);
 *   //...
 * };
 */
export const apiLimiter = async (request: Request) => {
  const ip = getClientIP(request);
  const limiter = getAPIRateLimiter();
  
  if (limiter) {
    try {
      const { success, limit, remaining, reset } = await limiter.limit(ip);
      
      if (!success) {
        throw new Response('Too many requests', { 
          status: 429,
          headers: {
            'RateLimit-Limit': limit.toString(),
            'RateLimit-Remaining': remaining.toString(),
            'RateLimit-Reset': new Date(reset).toISOString(),
          }
        });
      }
    } catch (error) {
      // If Redis operation fails, fall back to in-memory rate limiting
      console.warn('Redis rate limiting failed, using fallback:', error);
      
      const allowed = fallbackRateLimit(ip, 100, 15 * 60 * 1000); // 100 requests per 15 minutes
      if (!allowed) {
        throw new Response('Too many requests', { status: 429 });
      }
    }
  } else {
    // Use fallback when Redis is not available
    const allowed = fallbackRateLimit(ip, 100, 15 * 60 * 1000); // 100 requests per 15 minutes
    if (!allowed) {
      throw new Response('Too many requests', { status: 429 });
    }
  }
};

/**
 * A stricter rate limiter for form submissions.
 * Limits each IP to 10 requests per minute.
 *
 * @example
 * export const action: ActionFunction = async ({ request }) => {
 *   await formLimiter(request);
 *   //...
 * };
 */
export const formLimiter = async (request: Request) => {
  const ip = getClientIP(request);
  const limiter = getFormRateLimiter();
  
  if (limiter) {
    try {
      const { success, limit, remaining, reset } = await limiter.limit(ip);
      
      if (!success) {
        throw new Response('Too many form submissions from this IP, please try again after a minute.', { 
          status: 429,
          headers: {
            'RateLimit-Limit': limit.toString(),
            'RateLimit-Remaining': remaining.toString(),
            'RateLimit-Reset': new Date(reset).toISOString(),
          }
        });
      }
    } catch (error) {
      // If Redis operation fails, fall back to in-memory rate limiting
      console.warn('Redis rate limiting failed, using fallback:', error);
      
      const allowed = fallbackRateLimit(ip, 10, 1 * 60 * 1000); // 10 requests per 1 minute
      if (!allowed) {
        throw new Response('Too many form submissions from this IP, please try again after a minute.', { status: 429 });
      }
    }
  } else {
    // Use fallback when Redis is not available
    const allowed = fallbackRateLimit(ip, 10, 1 * 60 * 1000); // 10 requests per 1 minute
    if (!allowed) {
      throw new Response('Too many form submissions from this IP, please try again after a minute.', { status: 429 });
    }
  }
};

// Clean up fallback store periodically (runs every 5 minutes)
if (typeof global !== 'undefined' && !(global as any).__rateLimitCleanupInterval) {
  (global as any).__rateLimitCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of fallbackStore.entries()) {
      if (now > record.resetTime) {
        fallbackStore.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Clean up every 5 minutes
}