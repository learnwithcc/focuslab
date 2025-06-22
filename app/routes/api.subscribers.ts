import { json, type ActionFunctionArgs } from '@remix-run/node';
import { mailerLiteService, type MailerLiteSubscriber } from '~/services/mailerlite';
import { rateLimiter } from '~/utils/server';

interface ActionResponse {
  success: boolean;
  message?: string;
  data?: any;
  errors?: Record<string, string>;
  remaining?: number;
  reset?: number;
}

export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST, PUT, DELETE methods
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return json<ActionResponse>(
      { success: false, message: 'Method not allowed' },
      { status: 405 }
    );
  }

  // Get client IP for rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  '127.0.0.1';

  // Check rate limit (3 requests per hour)
  const rateLimitResult = await rateLimiter.limit(clientIp);
  if (!rateLimitResult.success) {
    return json<ActionResponse>(
      {
        success: false,
        message: 'Too many requests. Please try again later.',
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
    const formData = await request.formData();
    const email = formData.get('email')?.toString().trim().toLowerCase();

    if (!email) {
      return json<ActionResponse>(
        { success: false, errors: { email: 'Email is required' } },
        { status: 400 }
      );
    }

    // Handle different operations based on method and action
    switch (request.method) {
      case 'POST': {
        // List subscribers with pagination
        const limit = Number(formData.get('limit')) || 25;
        const cursor = formData.get('cursor')?.toString() || undefined;
        const rawStatus = formData.get('status')?.toString();
        
        // Validate status is one of the allowed values
        const status = rawStatus as MailerLiteSubscriber['status'] | undefined;
        const isValidStatus = !status || ['active', 'unsubscribed', 'bounced', 'junk', 'unconfirmed'].includes(status);
        
        if (rawStatus && !isValidStatus) {
          return json<ActionResponse>(
            { 
              success: false, 
              errors: { status: 'Invalid status value' }
            },
            { status: 400 }
          );
        }

        const result = await mailerLiteService.listSubscribers({
          limit,
          ...(cursor && { cursor }),
          ...(status && { filterBy: { status } })
        });

        return json<ActionResponse>(
          {
            success: true,
            data: result
          },
          { status: 200 }
        );
      }

      case 'PUT': {
        // Update subscriber data or status
        const action = formData.get('action')?.toString();
        
        if (action === 'unsubscribe') {
          const result = await mailerLiteService.updateSubscriberStatus(email, 'unsubscribed');
          return json<ActionResponse>(
            {
              success: true,
              message: 'Successfully unsubscribed from newsletter',
              data: result
            },
            { status: 200 }
          );
        }

        if (action === 'update') {
          const gdprConsent = formData.get('gdprConsent') === 'true';
          const result = await mailerLiteService.updateSubscriberData(email, {
            gdprConsent,
            fields: {
              // Add any additional fields here
            }
          });
          return json<ActionResponse>(
            {
              success: true,
              message: 'Successfully updated subscriber data',
              data: result
            },
            { status: 200 }
          );
        }

        return json<ActionResponse>(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
      }

      case 'DELETE': {
        // Delete subscriber (GDPR right to be forgotten)
        await mailerLiteService.deleteSubscriber(email);
        return json<ActionResponse>(
          {
            success: true,
            message: 'Successfully deleted subscriber data'
          },
          { status: 200 }
        );
      }

      default:
        return json<ActionResponse>(
          { success: false, message: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Subscriber management error:', error);
    return json<ActionResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 