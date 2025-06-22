import React, { useState } from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { Input } from './Input';
import { Button } from './Button';
import { ComponentErrorBoundary } from './ErrorBoundary';
import { useFormValidation, isValidEmail } from '../utils/validation';

interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

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

// Define validation rules
const contactValidationRules = {
  name: (value: string) => {
    if (!value) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters long';
    return undefined;
  },
  email: (value: string) => {
    if (!value) return 'Email is required';
    if (!isValidEmail(value)) return 'Please enter a valid email address';
    return undefined;
  },
  subject: (value: string) => {
    if (!value) return 'Subject is required';
    if (value.length < 5) return 'Subject must be at least 5 characters long';
    return undefined;
  },
  message: (value: string) => {
    if (!value) return 'Message is required';
    if (value.length < 20) return 'Message must be at least 20 characters long';
    if (value.length > 1000) return 'Message must not exceed 1000 characters';
    return undefined;
  }
};

export const ContactForm: React.FC<ContactFormProps> = ({
  className = '',
  onSuccess,
  onError
}) => {
  const navigation = useNavigation();
  const actionData = useActionData<ActionData>();
  const isSubmitting = navigation.state === 'submitting';
  
  const initialValues: ContactFormValues = {
    name: '',
    email: '',
    subject: '',
    message: ''
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
  } = useFormValidation(initialValues, contactValidationRules);

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
        action="/api/contact"
        onSubmit={handleSubmit}
        className={`space-y-6 ${className}`}
        noValidate // Disable browser validation to use our custom validation
      >
        {actionData?.success && (
          <div className="rounded-md bg-green-50 p-4 text-green-700" role="alert">
            {actionData.message || 'Message sent successfully! We will get back to you soon.'}
          </div>
        )}

        {actionData?.message && !actionData.success && (
          <div className="rounded-md bg-red-50 p-4 text-red-700" role="alert">
            <p>{actionData.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input
            type="text"
            name="name"
            label="Name"
            value={values['name']}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={touched['name'] && errors['name'] ? errors['name'] : false}
            required
            aria-label="Your name"
            placeholder="Enter your name"
            disabled={isSubmitting}
          />

          <Input
            type="email"
            name="email"
            label="Email"
            value={values['email']}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={touched['email'] && errors['email'] ? errors['email'] : false}
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
          value={values['subject']}
          onChange={(e) => handleChange('subject', e.target.value)}
          onBlur={() => handleBlur('subject')}
          error={touched['subject'] && errors['subject'] ? errors['subject'] : false}
          required
          aria-label="Message subject"
          placeholder="Enter message subject"
          disabled={isSubmitting}
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
            value={values['message']}
            onChange={(e) => handleChange('message', e.target.value)}
            onBlur={() => handleBlur('message')}
            className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 ${
              touched['message'] && errors['message']
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300'
            }`}
            placeholder="Enter your message"
            required
            disabled={isSubmitting}
            aria-label="Your message"
          />
          {touched['message'] && errors['message'] && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors['message']}
            </p>
          )}
          <div className="mt-1 text-right text-sm text-gray-500">
            {values['message'].length}/1000 characters
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </Form>
    </ComponentErrorBoundary>
  );
}; 