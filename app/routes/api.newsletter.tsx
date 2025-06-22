import { json, type ActionFunctionArgs } from '@remix-run/node';
import { validateNewsletterFormServer, sanitizeNewsletterFormData } from '~/utils/server/validation';
import { rateLimiter, subscribeToNewsletter } from '~/utils/server';
import { validateCSRFToken } from '~/utils/csrf';
import type { ValidationErrors } from '~/utils/validation';

interface ActionResponse {
  success: boolean;
  message?: string;
  errors?: ValidationErrors;
  remaining?: number;
  reset?: number;
}

export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return json<ActionResponse>(
      { success: false, message: 'Method not allowed' },
      { status: 405 }
    );
  }

  // Validate CSRF token first
  try {
    await validateCSRFToken(request);
  } catch (error) {
    console.error('CSRF validation failed for newsletter subscription:', error);
    return json<ActionResponse>(
      {
        success: false,
        message: 'Security validation failed. Please refresh the page and try again.'
      },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const data = sanitizeNewsletterFormData(formData);

  // Server-side validation
  const validationErrors = await validateNewsletterFormServer(data);
  if (Object.keys(validationErrors).length > 0) {
    return json<ActionResponse>(
      { success: false, errors: validationErrors },
      { status: 400 }
    );
  }

  // Get client IP for rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  '127.0.0.1';

  // Check rate limit
  const rateLimitResult = await rateLimiter.limit(clientIp);
  if (!rateLimitResult.success) {
    return json<ActionResponse>(
      {
        success: false,
        message: 'Too many subscription attempts. Please try again later.',
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit || 3),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining || 0),
          'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
          'Retry-After': rateLimitResult.reset ? 
            Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : 
            '3600'
        }
      }
    );
  }

  try {
    // Subscribe to newsletter
    const result = await subscribeToNewsletter(data);
    
    if (!result.success) {
      return json<ActionResponse>(
        {
          success: false,
          message: result.error || 'Failed to subscribe to newsletter'
        },
        { status: result.error?.includes('already subscribed') ? 409 : 500 }
      );
    }

    return json<ActionResponse>(
      {
        success: true,
        message: 'Successfully subscribed to newsletter!'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return json<ActionResponse>(
      {
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
} 