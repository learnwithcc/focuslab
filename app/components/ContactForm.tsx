import React from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { z } from 'zod';
import { Input } from './Input';
import { Button } from './Button';
// FormErrorBoundary is now used at the route level
import { useFormValidation } from '~/hooks/useFormValidation';
import { contactSchema } from '~/utils/validation';
import { trackEvent } from '~/utils/posthog';

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
  const [hasInteracted, setHasInteracted] = React.useState(false);

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

  // Track form interaction on first input
  React.useEffect(() => {
    if (!hasInteracted && (values.name || values.email || values.subject || values.message)) {
      setHasInteracted(true);
      trackEvent('contact_form_started', {
        timestamp: Date.now(),
      });
    }
  }, [values, hasInteracted]);

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
      
      // Track form validation errors
      trackEvent('contact_form_validation_error', {
        errors: Object.keys(validationErrors),
        error_count: Object.keys(validationErrors).length,
        form_completion_time: Date.now() - formStartTime,
      });
    } else {
      // Track form submission attempt
      trackEvent('contact_form_submitted', {
        has_subject: !!values.subject,
        message_length: values.message.length,
        form_completion_time: Date.now() - formStartTime,
        has_name: !!values.name,
        has_email: !!values.email,
      });
    }
  };

  // Handle success/error effects
  React.useEffect(() => {
    if (actionData?.success) {
      resetForm();
      onSuccess?.();
      
      // Track successful form submission
      trackEvent('contact_form_success', {
        response_time: Date.now() - formStartTime,
        message_length: values.message.length,
      });
    } else if (actionData?.errors) {
      const errorMessage =
        Object.values(actionData.errors).find((msg) => msg) ||
        'Form submission failed';
      onError?.(new Error(errorMessage));
      
      // Track form submission error
      trackEvent('contact_form_error', {
        error_message: errorMessage,
        errors: Object.keys(actionData.errors || {}),
        response_time: Date.now() - formStartTime,
      });
    }
  }, [actionData, onSuccess, onError, resetForm, formStartTime, values.message.length]);

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
          <legend className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contact Information
            <span className="block text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
              Required fields are marked with an asterisk (*)
            </span>
          </legend>
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
              aria-label="Your full name (required)"
              placeholder="Enter your full name"
              disabled={isSubmitting}
              autoComplete="name"
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
              aria-label="Your email address (required)"
              placeholder="Enter your email address"
              disabled={isSubmitting}
              autoComplete="email"
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
            aria-label="Message subject (required)"
            placeholder="Enter the subject of your message"
            disabled={isSubmitting}
            autoComplete="off"
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
              htmlFor="contact-message"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Message
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            </label>
            <textarea
              id="contact-message"
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
              placeholder="Please describe your inquiry, project, or how we can help you..."
              required
              disabled={isSubmitting}
              aria-label="Your message (required)"
              aria-describedby={
                [touched.message && errors.message ? 'contact-message-error' : null,
                 'contact-message-counter',
                 'contact-message-help'].filter(Boolean).join(' ')
              }
              aria-invalid={
                touched.message && errors.message ? 'true' : 'false'
              }
              maxLength={1000}
            />
            <div
              id="contact-message-help"
              className="sr-only"
            >
              Describe your inquiry or project. Maximum 1000 characters.
            </div>
            {touched.message && errors.message && (
              <p
                id="contact-message-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
                aria-live="assertive"
              >
                <span className="sr-only">Error: </span>
                {errors.message}
              </p>
            )}
            <div
              id="contact-message-counter"
              className="mt-1 text-right text-sm text-gray-500"
              aria-live="polite"
              role="status"
            >
              <span className="sr-only">Character count: </span>
              {values.message.length} of 1000 characters used
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || Object.keys(clientErrors).length > 0}
            className="w-full"
            aria-describedby="submit-help"
          >
            {isSubmitting ? (
              <>
                <span className="sr-only">Sending your message, please wait</span>
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </Button>
          <div id="submit-help" className="sr-only">
            Submit the contact form to send your message. All required fields must be completed.
          </div>
        </fieldset>
        </Form>
    </div>
  );
}; 