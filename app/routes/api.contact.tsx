import { ActionFunctionArgs, json } from '@remix-run/node';
import { z } from 'zod';
import { formLimiter } from '~/utils/rate-limiter';
import { contactSchema, validateForm } from '~/utils/validation';
import { sendContactEmail } from '~/utils/email.server';

type ContactFormData = z.infer<typeof contactSchema>;

export async function action({ request }: ActionFunctionArgs) {
  try {
    await formLimiter(request);
    const formData = await request.formData();

    return await validateForm(
      formData,
      contactSchema,
      async (data: ContactFormData) => {
        // Honeypot check
        if (formData.get('website')) {
          // This is likely a bot, silently succeed
          return json({ success: true });
        }
        
        await sendContactEmail(data);
        return json({ success: true });
      }
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Contact form error:', error);
    return json(
      { errors: { form: 'An unexpected error occurred. Please try again.' } },
      { status: 500 }
    );
  }
} 