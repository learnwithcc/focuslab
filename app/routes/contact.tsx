import { MetaFunction } from '@remix-run/node';
import { useLocation } from '@remix-run/react';
import { Section, Container } from "~/components/Layout";
import { ContactForm, Breadcrumb } from '~/components';
import { generateMeta, generatePageUrl, generateBreadcrumbKeywords, DEFAULT_SEO } from '~/utils/seo';
import { getBreadcrumbItems } from '~/utils/structured-data';
import { usePageTracking } from '~/hooks/usePageTracking';

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
  
  // Track page visit with engagement timing
  usePageTracking({
    pageName: 'contact',
    trackEngagement: true,
    properties: {
      page_type: 'contact',
      has_form: true,
    },
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="w-full">
        {/* Hero Section */}
        <div className="w-full bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
          <Section spacing="lg">
            <Container maxWidth="7xl">
              <Breadcrumb items={breadcrumbItems} className="mb-8" />
              <div className="text-center">
                <h1 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                  Contact Us
                </h1>
                <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
                  We&apos;d love to hear from you! Please fill out the form below to get in touch.
                </p>
              </div>
            </Container>
          </Section>
        </div>

        {/* Contact Form Section */}
        <div className="w-full bg-white dark:bg-gray-900">
          <Section spacing="lg">
            <Container maxWidth="7xl">
              <div className="mx-auto max-w-2xl">
                <ContactForm />
              </div>
            </Container>
          </Section>
        </div>
      </main>
    </div>
  );
} 