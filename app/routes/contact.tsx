import { MetaFunction } from '@remix-run/node';
import { ContactForm } from '~/components/ContactForm';

export const meta: MetaFunction = () => {
  return [
    { title: 'Contact Us | Focus Lab' },
    {
      name: 'description',
      content: 'Get in touch with Focus Lab for any inquiries or collaborations.',
    },
  ];
};

export default function ContactPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-4xl font-bold">Contact Us</h1>
      <p className="mb-8 text-lg">
        We&apos;d love to hear from you! Please fill out the form below to get in touch.
      </p>
      <ContactForm />
    </main>
  );
} 