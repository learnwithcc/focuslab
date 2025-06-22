import { type ValidationErrors } from '../validation';

// Maximum length for local part and domain part of email (RFC 5321)
const MAX_EMAIL_LOCAL_LENGTH = 64;
const MAX_EMAIL_DOMAIN_LENGTH = 255;

// Common disposable email domains
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'throwawaymail.com',
  'mailinator.com',
  'guerrillamail.com',
  'sharklasers.com',
  'temp-mail.org',
  // Add more as needed
];

/**
 * Validates email length according to RFC 5321
 * @param email - The email to validate
 * @returns true if email length is valid, false otherwise
 */
const isValidEmailLength = (email: string): boolean => {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return false;
  
  return (
    localPart.length <= MAX_EMAIL_LOCAL_LENGTH &&
    domain.length <= MAX_EMAIL_DOMAIN_LENGTH
  );
};

/**
 * Checks if an email domain is from a known disposable email service
 * @param email - The email to check
 * @returns true if the email is from a disposable service, false otherwise
 */
const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.includes(domain) : false;
};

/**
 * Sanitizes form data for newsletter subscription
 * @param formData - The form data to sanitize
 * @returns Sanitized form data object
 */
export const sanitizeNewsletterFormData = (formData: FormData) => {
  return {
    email: formData.get('email')?.toString().trim().toLowerCase() || '',
    gdprConsent: formData.get('gdprConsent') === 'true'
  };
};

/**
 * Enhanced server-side validation for newsletter form
 * @param data - The sanitized form data to validate
 * @returns Validation errors object
 */
export const validateNewsletterFormServer = async (data: {
  email: string;
  gdprConsent: boolean;
}): Promise<ValidationErrors> => {
  const errors: ValidationErrors = {};

  // Email validation
  if (!data.email) {
    errors.email = 'Email is required';
  } else {
    // Import isValidEmail from client validation
    const { isValidEmail } = await import('../validation');
    
    if (!isValidEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (!isValidEmailLength(data.email)) {
      errors.email = 'Email address is too long';
    } else if (isDisposableEmail(data.email)) {
      errors.email = 'Disposable email addresses are not allowed';
    }
  }

  // GDPR consent validation
  if (!data.gdprConsent) {
    errors.gdprConsent = 'You must accept the privacy policy to subscribe';
  }

  return errors;
}; 