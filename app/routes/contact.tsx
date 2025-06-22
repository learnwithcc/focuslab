import { MetaFunction } from '@remix-run/node';
import { useLocation } from '@remix-run/react';
import { ContactForm, Breadcrumb } from '~/components';
import { generateMeta, generatePageUrl, generateBreadcrumbKeywords, DEFAULT_SEO } from '~/utils/seo';
import { getBreadcrumbItems } from '~/utils/structured-data';

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
    includeBreadcrumbSchema: true,
    pathname: '/contact',
  });
};

export default function ContactPage() {
  const location = useLocation();
  const breadcrumbItems = getBreadcrumbItems(location.pathname);

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} className="mb-6" />
      <h1 className="mb-4 text-4xl font-bold">Contact Us</h1>
      <p className="mb-8 text-lg">
        We&apos;d love to hear from you! Please fill out the form below to get in touch.
      </p>
      <ContactForm />
    </main>
  );
} 