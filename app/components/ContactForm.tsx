import React from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { z } from 'zod';
import { Input } from './Input';
import { Button } from './Button';
// Temporarily removed ErrorBoundary to fix RefreshRuntime conflicts
// import { ErrorBoundary } from './ErrorBoundary';
import { useFormValidation } from '~/hooks/useFormValidation';
import { contactSchema } from '~/utils/validation';

type ContactFormValues = z.infer<typeof contactSchema>;

interface ValidationErrors {
  [key: string]: string | undefined;
}

interface ActionData {
  success: boolean;
  errors?: ValidationErrors;
  message?: string;
}

export interface ContactFormProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  className = '',
  onSuccess,
  onError,
}) => {
  const navigation = useNavigation();
  const actionData = useActionData<ActionData>();
  const isSubmitting = navigation.state === 'submitting';
  const [formStartTime] = React.useState(Date.now());

  const initialValues: ContactFormValues = {
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '', // Honeypot
  };

  const {
    values,
    errors: clientErrors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setErrors,
    resetForm,
  } = useFormValidation(initialValues, contactSchema);

  // Combine client and server errors
  const errors = {
    ...clientErrors,
    ...(actionData?.errors || {}),
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      event.preventDefault();
      setErrors(validationErrors);
    }
  };

  // Handle success/error effects
  React.useEffect(() => {
    if (actionData?.success) {
      resetForm();
      onSuccess?.();
    } else if (actionData?.errors) {
      const errorMessage =
        Object.values(actionData.errors).find((msg) => msg) ||
        'Form submission failed';
      onError?.(new Error(errorMessage));
    }
  }, [actionData, onSuccess, onError, resetForm]);

  return (
    <div>
        <Form
        method="post"
        onSubmit={handleSubmit}
        className={`space-y-6 ${className}`}
        noValidate // Disable browser validation to use our custom validation
        aria-label="Contact form"
      >
        {actionData?.success && (
          <div
            className="rounded-md bg-green-50 p-4 text-green-700"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            {actionData.message ||
              'Message sent successfully! We will get back to you soon.'}
          </div>
        )}

        {actionData?.message && !actionData.success && (
          <div
            className="rounded-md bg-red-50 p-4 text-red-700"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <p>{actionData.message}</p>
          </div>
        )}

        <fieldset className="space-y-6">
          <legend className="sr-only">Contact Information</legend>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              type="text"
              name="name"
              label="Name"
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              error={touched.name && errors.name ? errors.name : undefined}
              required
              aria-label="Your name"
              placeholder="Enter your name"
              disabled={isSubmitting}
            />

            <Input
              type="email"
              name="email"
              label="Email"
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              error={touched.email && errors.email ? errors.email : undefined}
              required
              aria-label="Your email address"
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
          </div>

          <Input
            type="text"
            name="subject"
            label="Subject"
            value={values.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            onBlur={() => handleBlur('subject')}
            error={
              touched.subject && errors.subject ? errors.subject : undefined
            }
            required
            aria-label="Message subject"
            placeholder="Enter message subject"
            disabled={isSubmitting}
          />

          {/* Honeypot field for spam protection - hidden from users */}
          <input
            type="text"
            name="website"
            value={values.website}
            onChange={(e) => handleChange('website', e.target.value)}
            style={{
              position: 'absolute',
              left: '-9999px',
              top: '-9999px',
              opacity: 0,
              pointerEvents: 'none',
            }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {/* Hidden timestamp field for spam protection */}
          <input
            type="hidden"
            name="submissionTime"
            value={formStartTime.toString()}
          />

          <div className="relative">
            <label
              htmlFor="message"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              value={values.message}
              onChange={(e) => handleChange('message', e.target.value)}
              onBlur={() => handleBlur('message')}
              className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 ${
                touched.message && errors.message
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="Enter your message"
              required
              disabled={isSubmitting}
              aria-label="Your message"
              aria-describedby={
                touched.message && errors.message
                  ? 'message-error'
                  : 'message-counter'
              }
              aria-invalid={
                touched.message && errors.message ? 'true' : 'false'
              }
            />
            {touched.message && errors.message && (
              <p
                id="message-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {errors.message}
              </p>
            )}
            <div
              id="message-counter"
              className="mt-1 text-right text-sm text-gray-500"
              aria-live="polite"
            >
              {values.message.length}/1000 characters
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || Object.keys(clientErrors).length > 0}
            className="w-full"
          >
            {isSubmitting ? 'Sending...' : 'Send message'}
          </Button>
        </fieldset>
        </Form>
    </div>
  );
}; 