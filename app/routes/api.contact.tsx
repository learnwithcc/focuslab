import { json, type ActionFunctionArgs } from "@remix-run/node";
import { rateLimiter } from "~/utils/server";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  // Get client IP for rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  '127.0.0.1';

  // Check rate limit
  const rateLimitResult = await rateLimiter.limit(clientIp);
  if (!rateLimitResult.success) {
    return json(
      {
        success: false,
        message: 'Too many attempts. Please try again later.',
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
    const data: ContactFormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    // Basic validation
    const errors: { [key: string]: string } = {};
    if (!data['name'] || data['name'].length < 2) {
      errors['name'] = 'Name is required and must be at least 2 characters long';
    }
    if (!data['email'] || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data['email'])) {
      errors['email'] = 'Please enter a valid email address';
    }
    if (!data['subject'] || data['subject'].length < 5) {
      errors['subject'] = 'Subject is required and must be at least 5 characters long';
    }
    if (!data['message'] || data['message'].length < 20 || data['message'].length > 1000) {
      errors['message'] = 'Message must be between 20 and 1000 characters';
    }

    if (Object.keys(errors).length > 0) {
      return json({ success: false, errors }, { status: 400 });
    }

    // TODO: Integrate with a form handling service like Formspree or Netlify Forms
    // For now, we'll just simulate a successful submission
    return json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.'
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    return json(
      {
        success: false,
        message: 'An error occurred while processing your request. Please try again later.'
      },
      { status: 500 }
    );
  }
}; 