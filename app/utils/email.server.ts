interface EmailData {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

// This is a placeholder for a real email sending service like Resend, SendGrid, etc.
// In a real application, you would use their SDK to send emails.
async function sendEmail(data: EmailData) {
  console.log('--- Sending Email ---');
  console.log('To:', data.to);
  console.log('From:', data.from);
  console.log('Subject:', data.subject);
  console.log('Body:', data.text);
  console.log('---------------------');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real app, you would handle potential errors from the email service
  // For now, we'll just assume it's always successful.
  return { success: true };
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(formData: ContactFormData) {
  const emailData: EmailData = {
    to: 'support@focuslab.app',
    from: 'noreply@focuslab.app', // Or a verified sending email address
    subject: `Contact Form: ${formData.subject}`,
    text: `New message from ${formData.name} <${formData.email}>:\n\n${formData.message}`,
    html: `<p>New message from <strong>${formData.name}</strong> &lt;${formData.email}&gt;:</p><p>${formData.message}</p>`,
  };

  return await sendEmail(emailData);
}

interface NewsletterFormData {
  email: string;
}

export async function sendNewsletterConfirmationEmail(formData: NewsletterFormData) {
    const emailData: EmailData = {
        to: formData.email,
        from: 'noreply@focuslab.app',
        subject: 'Welcome to the Focus Lab Newsletter!',
        text: 'Thank you for subscribing to our newsletter. We\'re excited to have you on board! You\'ll receive updates on new features, productivity tips, and more.',
        html: `<p>Thank you for subscribing to our newsletter. We're excited to have you on board! You'll receive updates on new features, productivity tips, and more.</p>`,
    };

    return await sendEmail(emailData);
} 