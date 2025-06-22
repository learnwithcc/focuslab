import { MetaFunction } from '@remix-run/node';
import { ContactForm } from '~/components/ContactForm';
import { generateMeta, generatePageUrl, generateBreadcrumbKeywords, DEFAULT_SEO } from '~/utils/seo';

export const meta: MetaFunction = () => {
  const breadcrumbKeywords = generateBreadcrumbKeywords('/contact');
  
  return generateMeta({
    title: 'Contact Us - Get In Touch',
    description: 'Get in touch with Focus Lab for neurodivergent developer tools, ADHD development solutions, and accessibility consultations.',
    keywords: [
      ...DEFAULT_SEO.keywords,
      ...breadcrumbKeywords,
      'collaboration',
      'consultation',
      'neurodivergent team',
      'development services'
    ],
    url: generatePageUrl('/contact'),
    canonical: 'https://focuslab.dev/contact',
    includeOrganizationSchema: true,
  });
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