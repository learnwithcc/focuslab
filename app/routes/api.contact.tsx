import { json, type ActionFunctionArgs } from "@remix-run/node";
import { rateLimiter } from "~/utils/server";
import { validateCSRFToken } from "~/utils/csrf";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string; // Honeypot field
}

export const action = async ({ request }: ActionFunctionArgs) => {
  // Validate CSRF token first
  try {
    await validateCSRFToken(request);
  } catch (error) {
    console.error('CSRF validation failed for contact form:', error);
    return json(
      {
        success: false,
        message: 'Security validation failed. Please refresh the page and try again.'
      },
      { status: 403 }
    );
  }

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
      website: formData.get('website') as string,
    };

    // Check for too-fast submission (less than 3 seconds)
    const submissionTime = formData.get('submissionTime') as string;
    if (submissionTime) {
      const timeDiff = Date.now() - parseInt(submissionTime, 10);
      if (timeDiff < 3000) {
        console.log('Spam attempt detected: too fast submission');
        return json({
          success: true,
          message: 'Thank you for your message! We will get back to you soon.'
        });
      }
    }

    // Spam protection: Check honeypot field
    if (data.website && data.website.trim() !== '') {
      // Bot filled in the honeypot field - reject silently
      console.log('Spam attempt detected: honeypot field filled');
      return json({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      });
    }

    // Additional spam checks
    const spamIndicators = [
      // Check for excessive links
      (data.message.match(/https?:\/\//g) || []).length > 2,
      // Check for suspicious patterns
      /\b(viagra|cialis|casino|lottery|winner|congratulations|urgent|click here|free money)\b/i.test(data.message),
      // Check for excessive caps
      data.message.length > 0 && (data.message.match(/[A-Z]/g) || []).length / data.message.length > 0.5,
      // Check for repeated characters
      /(.)\1{10,}/.test(data.message),
    ];

    if (spamIndicators.some(indicator => indicator)) {
      console.log('Spam attempt detected: content analysis');
      return json({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      });
    }

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

    // Log the legitimate submission for manual review
    console.log('Contact form submission received:', {
      timestamp: new Date().toISOString(),
      name: data.name,
      email: data.email,
      subject: data.subject,
      messageLength: data.message.length,
      ip: clientIp
    });

    // TODO: Integrate with a form handling service like Formspree or Netlify Forms
    // Example integration options:
    // 1. Formspree: https://formspree.io/
    // 2. Netlify Forms: https://www.netlify.com/products/forms/
    // 3. EmailJS: https://www.emailjs.com/
    // 4. Custom SMTP with nodemailer
    
    // For production, you would send the email here:
    // await sendEmail({
    //   to: 'chris@focuslab.dev',
    //   from: data.email,
    //   subject: `Contact Form: ${data.subject}`,
    //   text: `From: ${data.name} (${data.email})\n\nMessage:\n${data.message}`
    // });

    return json({
      success: true,
      message: 'Thank you for your message! We will get back to you within 24 hours.'
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