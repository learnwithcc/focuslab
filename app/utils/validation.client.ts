import { z } from 'zod';

// Client-safe validation schemas - no server dependencies
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

// Client-side validation helper
export function validateFormData<T>(
  formData: FormData,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const data = Object.fromEntries(formData);
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      errors[path] = issue.message;
    });
    return { success: false, errors };
  }

  return { success: true, data: result.data };
} 