import { useCallback, useState } from 'react';
import { debounce } from './index';

// Email validation regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates if a string is a valid email address
 * @param email - The email string to validate
 * @returns true if the email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
};

export interface ValidationErrors {
  email?: string;
  gdprConsent?: string;
  [key: string]: string | undefined;
}

interface ValidationRules {
  [key: string]: (value: any) => string | undefined;
}

/**
 * Custom hook for form validation with debouncing
 * @param initialValues - Initial form values
 * @param validationRules - Object containing validation rules for each field
 * @param debounceMs - Debounce delay in milliseconds
 * @returns Object containing validation state and handlers
 */
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules,
  debounceMs = 300
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate a single field
  const validateField = (name: keyof T, value: any): string | undefined => {
    const validateRule = validationRules[name as string];
    return validateRule ? validateRule(value) : undefined;
  };

  // Validate all fields
  const validateForm = useCallback((formValues: T): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName as keyof T, formValues[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    return newErrors;
  }, [validationRules]);

  // Debounced validation to prevent excessive re-renders
  const debouncedValidation = useCallback(
    debounce((name: keyof T, value: any) => {
      const error = validateField(name, value);
      if (error) {
        setErrors((prev) => ({
          ...prev,
          [name]: error
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });
      }
    }, debounceMs),
    [validationRules]
  );

  // Handle field change
  const handleChange = (name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name as string]) {
      debouncedValidation(name, value);
    }
  };

  // Handle field blur
  const handleBlur = (name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    if (error) {
      setErrors((prev) => ({
        ...prev,
        [name]: error
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as string];
        return newErrors;
      });
    }
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setValues,
    setErrors,
    setTouched,
  };
};

export interface NewsletterFormValues {
  email: string;
  gdprConsent: boolean;
}

/**
 * Validates the newsletter form data
 * @param data - The form data to validate
 * @returns Object containing validation errors, if any
 */
export const validateNewsletterForm = (data: NewsletterFormValues): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate email
  if (!data['email']) {
    errors['email'] = 'Email is required';
  } else if (!isValidEmail(data['email'])) {
    errors['email'] = 'Please enter a valid email address';
  }

  // Validate GDPR consent
  if (!data['gdprConsent']) {
    errors['gdprConsent'] = 'You must accept the privacy policy to subscribe';
  }

  return errors;
}; 