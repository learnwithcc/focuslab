import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { mailerLiteService, type MailerLiteSubscriber } from '~/services/mailerlite';

// Initialize Redis client for rate limiting
const redis = new Redis({
  url: process.env['UPSTASH_REDIS_REST_URL'] || '',
  token: process.env['UPSTASH_REDIS_REST_TOKEN'] || '',
});

// Initialize rate limiter (3 requests per hour)
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
});

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