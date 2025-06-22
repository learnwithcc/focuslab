import React, { useState } from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { Input } from './Input';
import { Button } from './Button';
import { ComponentErrorBoundary } from './ErrorBoundary';
import { useFormValidation, validateNewsletterForm, type NewsletterFormValues, type ValidationErrors, isValidEmail } from '../utils/validation';

interface ActionData {
  success: boolean;
  errors?: ValidationErrors;
  message?: string;
  remaining?: number;
  reset?: number;
}

export interface NewsletterFormProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Define validation rules
const newsletterValidationRules = {
  email: (value: string) => {
    if (!value) return 'Email is required';
    if (!isValidEmail(value)) return 'Please enter a valid email address';
    return undefined;
  },
  gdprConsent: (value: boolean) => {
    if (!value) return 'You must accept the privacy policy to subscribe';
    return undefined;
  }
};

export const NewsletterForm: React.FC<NewsletterFormProps> = ({
  className = '',
  onSuccess,
  onError
}) => {
  const navigation = useNavigation();
  const actionData = useActionData<ActionData>();
  const isSubmitting = navigation.state === 'submitting';
  
  const initialValues: NewsletterFormValues = {
    email: '',
    gdprConsent: false
  };

  const {
    values,
    errors: clientErrors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setErrors,
    setValues
  } = useFormValidation(initialValues, newsletterValidationRules);

  // Combine client and server errors
  const errors = {
    ...clientErrors,
    ...(actionData?.errors || {})
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // Let Remix handle the form submission
    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      event.preventDefault();
      setErrors(validationErrors);
      return;
    }
  };

  // Handle success/error effects
  React.useEffect(() => {
    if (actionData?.success) {
      setValues(initialValues);
      onSuccess?.();
    } else if (actionData?.errors) {
      const errorMessage = Object.values(actionData.errors).find(msg => msg) || 'Form submission failed';
      onError?.(new Error(errorMessage));
    }
  }, [actionData, onSuccess, onError, setValues]);

  return (
    <ComponentErrorBoundary>
      <Form
        method="post"
        action="/api/newsletter"
        onSubmit={handleSubmit}
        className={`space-y-4 ${className}`}
        noValidate // Disable browser validation to use our custom validation
      >
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
                    ? `Please try again ${new Date(actionData.reset).toLocaleTimeString()}.`
                    : 'Please try again later.'
                }
              </p>
            )}
          </div>
        )}

        <Input
          type="email"
          name="email"
          label="Email address"
          value={values['email']}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          error={touched['email'] && errors['email'] ? errors['email'] : false}
          required
          aria-label="Subscribe to newsletter"
          placeholder="Enter your email"
          className="w-full"
          disabled={isSubmitting}
        />

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="gdprConsent"
              name="gdprConsent"
              type="checkbox"
              checked={values['gdprConsent']}
              onChange={(e) => handleChange('gdprConsent', e.target.checked)}
              onBlur={() => handleBlur('gdprConsent')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
          </div>
          <div className="ml-3">
            <label
              htmlFor="gdprConsent"
              className={`text-sm ${touched['gdprConsent'] && errors['gdprConsent'] ? 'text-red-600' : 'text-gray-600'}`}
            >
              I agree to receive newsletter emails and accept the{' '}
              <a
                href="/privacy-policy"
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                privacy policy
              </a>
            </label>
            {touched['gdprConsent'] && errors['gdprConsent'] && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors['gdprConsent']}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className="w-full"
        >
          {isSubmitting ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </Form>
    </ComponentErrorBoundary>
  );
}; 