import React from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { z } from 'zod';
import { Input } from './Input';
import { Button } from './Button';
// Temporarily removed ErrorBoundary to fix RefreshRuntime conflicts
// import { ErrorBoundary } from './ErrorBoundary';
import { useFormValidation } from '~/hooks/useFormValidation';
import { newsletterSchema } from '~/utils/validation';

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
        className={`space-y-4 ${className}`}
        noValidate // Disable browser validation to use our custom validation
      >
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
          aria-label="Subscribe to newsletter"
          placeholder="Enter your email"
          className="w-full"
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          disabled={isSubmitting || Object.keys(clientErrors).length > 0}
          className="w-full"
        >
          {isSubmitting ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </Form>
    </div>
  );
}; 