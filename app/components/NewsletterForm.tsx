import React from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { z } from 'zod';
import { Input } from './Input';
import { Button } from './Button';
import { FormErrorBoundary } from './FormErrorBoundary';
import { useFormValidation } from '~/hooks/useFormValidation';
import { newsletterSchema } from '~/utils/validation';
import { trackEvent } from '~/utils/posthog';

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

interface ActionData {
  success: boolean;
  errors?: { [K in keyof NewsletterFormValues]?: string };
  message?: string;
  remaining?: number;
  reset?: number;
}

export interface NewsletterFormProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const NewsletterForm: React.FC<NewsletterFormProps> = ({
  className = '',
  onSuccess,
  onError,
}) => {
  const navigation = useNavigation();
  const actionData = useActionData<ActionData>();
  const isSubmitting = navigation.state === 'submitting';
  const [formStartTime] = React.useState(Date.now());
  const [hasInteracted, setHasInteracted] = React.useState(false);

  const initialValues: NewsletterFormValues = {
    email: '',
    name: '', // Honeypot
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
  } = useFormValidation(initialValues, newsletterSchema);

  // Track form interaction on first input
  React.useEffect(() => {
    if (!hasInteracted && values.email) {
      setHasInteracted(true);
      trackEvent('newsletter_form_started', {
        timestamp: Date.now(),
      });
    }
  }, [values.email, hasInteracted]);

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
      trackEvent('newsletter_form_validation_error', {
        errors: Object.keys(validationErrors),
        error_count: Object.keys(validationErrors).length,
        form_completion_time: Date.now() - formStartTime,
      });
    } else {
      // Track form submission attempt
      trackEvent('newsletter_form_submitted', {
        has_email: !!values.email,
        form_completion_time: Date.now() - formStartTime,
      });
    }
  };

  // Handle success/error effects
  React.useEffect(() => {
    if (actionData?.success) {
      resetForm();
      onSuccess?.();
      
      // Track successful newsletter subscription
      trackEvent('newsletter_subscription_success', {
        response_time: Date.now() - formStartTime,
      });
    } else if (actionData?.errors) {
      const errorMessage =
        Object.values(actionData.errors).find((msg) => msg) ||
        'Form submission failed';
      onError?.(new Error(errorMessage));
      
      // Track newsletter subscription error
      trackEvent('newsletter_subscription_error', {
        error_message: errorMessage,
        errors: Object.keys(actionData.errors || {}),
        response_time: Date.now() - formStartTime,
      });
    }
  }, [actionData, onSuccess, onError, resetForm, formStartTime]);

  return (
    <div>
      <Form
        method="post"
        onSubmit={handleSubmit}
        className={`space-y-4 ${className}`}
        noValidate // Disable browser validation to use our custom validation
        aria-label="Newsletter subscription form"
      >
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Subscribe to Our Newsletter
            <span className="block text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
              Get updates on new projects and insights delivered to your inbox
            </span>
          </legend>
        {/* Honeypot field */}
        <input type="hidden" name="name" value={values.name} />
        
        {actionData?.success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-md" role="alert">
            {actionData.message}
          </div>
        )}

        {actionData?.message && !actionData.success && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md" role="alert">
            <p>{actionData.message}</p>
            {actionData.remaining !== undefined && (
              <p className="mt-2 text-sm">
                {actionData.remaining > 0
                  ? `You have ${actionData.remaining} attempts remaining.`
                  : actionData.reset
                  ? `Please try again ${new Date(
                      actionData.reset
                    ).toLocaleTimeString()}.`
                  : 'Please try again later.'}
              </p>
            )}
          </div>
        )}

          <Input
            type="email"
            name="email"
            label="Email address"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={touched.email && errors.email ? errors.email : undefined}
            required
            aria-label="Your email address for newsletter subscription (required)"
            placeholder="Enter your email address"
            className="w-full"
            disabled={isSubmitting}
            autoComplete="email"
            helperText="We respect your privacy and will never share your email address"
          />

          <Button
            type="submit"
            disabled={isSubmitting || Object.keys(clientErrors).length > 0}
            className="w-full"
            aria-describedby="newsletter-submit-help"
          >
            {isSubmitting ? (
              <>
                <span className="sr-only">Subscribing to newsletter, please wait</span>
                Subscribing...
              </>
            ) : (
              'Subscribe to Newsletter'
            )}
          </Button>
          <div id="newsletter-submit-help" className="sr-only">
            Subscribe to receive our newsletter with project updates and insights. Your email will be kept private.
          </div>
        </fieldset>
      </Form>
    </div>
  );
}; 