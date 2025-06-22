import { ActionFunctionArgs, json } from '@remix-run/node';
import { z } from 'zod';
import { formLimiter } from '~/utils/rate-limiter';
import { newsletterSchema, validateForm } from '~/utils/validation';
import { sendNewsletterConfirmationEmail } from '~/utils/email.server';

type NewsletterFormData = z.infer<typeof newsletterSchema>;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ message: 'Method not allowed' }, { status: 405 });
  }

  try {
    await formLimiter(request);
    const formData = await request.formData();

    return await validateForm(
      formData,
      newsletterSchema,
      async (data: NewsletterFormData) => {
        // Honeypot check
        if (formData.get('name')) {
          // This is likely a bot, silently succeed
          return json({ success: true });
        }

        // In a real app, you would add the email to your newsletter list here.
        // For now, we just simulate sending a confirmation email.
        await sendNewsletterConfirmationEmail(data);
        return json({ success: true });
      }
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Newsletter form error:', error);
    return json(
      { errors: { form: 'An unexpected error occurred. Please try again.' } },
      { status: 500 }
    );
  }
} 