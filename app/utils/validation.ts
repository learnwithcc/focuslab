import { json } from '@remix-run/node';
import { ZodSchema } from 'zod';
// Re-export client-safe schemas and types
export { newsletterSchema, contactSchema, validateFormData } from './validation.client';

type FormErrors<T> = { [K in keyof T]?: string };

// Server-only validation function that returns json responses
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