import { json } from '@remix-run/node';
import { ZodSchema, z } from 'zod';

type FormErrors<T> = { [K in keyof T]?: string };

export async function validateForm<T>(
  formData: FormData,
  schema: ZodSchema<T>,
  callback: (data: T) => Promise<Response>
): Promise<Response> {
  const data = Object.fromEntries(formData);
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors: FormErrors<T> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as keyof T;
      errors[path] = issue.message;
    });
    return json({ errors }, { status: 400 });
  }

  return callback(result.data);
}

export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(), // Honeypot
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
  website: z.string().optional(), // Honeypot
}); 