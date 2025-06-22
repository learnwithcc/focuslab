import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { mailerLiteService, type MailerLiteSubscriber } from '~/services/mailerlite';

// Redis service with lazy initialization and graceful degradation
class RedisService {
  private client: Redis | null = null;
  private rateLimiter: Ratelimit | null = null;
  private static instance: RedisService | null = null;
  private initializationError: string | null = null;

  private constructor() {
    // Don't initialize immediately - wait for first method call
  }

  private initializeClient(): void {
    if (this.client || this.initializationError) {
      return; // Already initialized or failed
    }

    const url = process.env['UPSTASH_REDIS_REST_URL'];
    const token = process.env['UPSTASH_REDIS_REST_TOKEN'];

    if (!url || !token) {
      this.initializationError = 'Redis configuration missing. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.';
      return;
    }

    try {
      this.client = new Redis({ url, token });
      this.rateLimiter = new Ratelimit({
        redis: this.client,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        analytics: true,
      });
    } catch (error) {
      this.initializationError = `Failed to initialize Redis client: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private ensureInitialized(): Ratelimit {
    this.initializeClient();
    if (this.initializationError) {
      throw new Error(this.initializationError);
    }
    if (!this.rateLimiter) {
      throw new Error('Redis rate limiter not properly initialized');
    }
    return this.rateLimiter;
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public isConfigured(): boolean {
    this.initializeClient();
    return this.client !== null && this.rateLimiter !== null && this.initializationError === null;
  }

  public async limit(ip: string) {
    try {
      const rateLimiter = this.ensureInitialized();
      return await rateLimiter.limit(ip);
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Return a permissive result when Redis is not configured
      return {
        success: true,
        remaining: 3,
        reset: Date.now() + 3600000, // 1 hour from now
        limit: 3,
      };
    }
  }
}

// Safe wrapper that handles configuration gracefully
export const rateLimiter = {
  // Lazy getter for the actual service
  get service() {
    return RedisService.getInstance();
  },

  // Check if the service is properly configured
  isConfigured(): boolean {
    try {
      return this.service.isConfigured();
    } catch {
      return false;
    }
  },

  // Safe wrapper method that provides helpful behavior when not configured
  async limit(ip: string) {
    if (!this.isConfigured()) {
      console.warn('Redis is not configured. Rate limiting is disabled.');
      // Return a permissive result when not configured
      return {
        success: true,
        remaining: 3,
        reset: Date.now() + 3600000, // 1 hour from now
        limit: 3,
      };
    }
    return this.service.limit(ip);
  }
};

interface SubscribeToNewsletterParams {
  email: string;
  gdprConsent?: boolean;
}

interface SubscribeToNewsletterResult {
  success: boolean;
  data?: MailerLiteSubscriber;
  error?: string;
}

/**
 * Subscribe an email to the newsletter using MailerLite
 * @param params - Subscription parameters
 * @returns The subscription result
 */
export async function subscribeToNewsletter({ 
  email, 
  gdprConsent = true 
}: SubscribeToNewsletterParams): Promise<SubscribeToNewsletterResult> {
  try {
    // Check if subscriber already exists
    const exists = await mailerLiteService.checkSubscriberExists(email);
    if (exists) {
      return {
        success: false,
        error: 'Email is already subscribed to the newsletter',
      };
    }

    // Add new subscriber
    const subscriber = await mailerLiteService.addSubscriber(email, gdprConsent);
    return {
      success: true,
      data: subscriber,
    };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to subscribe to newsletter',
    };
  }
}

/**
 * Check rate limit for a given IP address
 * @param ip - The IP address to check
 * @returns Whether the request is allowed and remaining limit info
 */
export async function checkRateLimit(ip: string) {
  try {
    const result = await rateLimiter.limit(ip);
    return {
      success: true,
      remaining: result.remaining,
      reset: result.reset,
      limit: result.limit,
      isAllowed: result.success,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return {
      success: false,
      error: 'Failed to check rate limit',
      isAllowed: false,
    };
  }
} 