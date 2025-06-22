import type { MetaFunction } from "@remix-run/node";
import { Section, Container } from "~/components/Layout";
import { ContactForm, ContactInfo } from "~/components";
import { generateMeta, generatePageUrl, generateBreadcrumbKeywords, DEFAULT_SEO } from "~/utils/seo";

export const meta: MetaFunction = () => {
  const breadcrumbKeywords = generateBreadcrumbKeywords('/about');
  
  return generateMeta({
    title: "About Us - Neurodivergent Developer Tools",
    description: "Learn about FocusLab's mission, our founder Chris Cameron, and our commitment to creating accessibility tools and ADHD development solutions.",
    keywords: [
      ...DEFAULT_SEO.keywords,
      ...breadcrumbKeywords,
      'Chris Cameron',
      'neurodivergent founder',
      'inclusive development',
      'about focus lab'
    ],
    url: generatePageUrl('/about'),
    canonical: 'https://focuslab.dev/about',
    type: 'profile',
    includeOrganizationSchema: true,
    includePersonSchema: true,
  });
};

export default function About() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="w-full">
        {/* Hero Section */}
        <Section spacing="lg" className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
          <Container maxWidth="7xl">
            <div className="text-center">
              <h1 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                Building Tools for{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  Different Minds
                </span>
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
                We're on a mission to create development tools that work with your unique way of thinking, not against it.
              </p>
            </div>
          </Container>
        </Section>

        {/* Founder Profile Section */}
        <Section spacing="lg">
          <Container maxWidth="7xl">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div className="relative">
                <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                  <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-white">
                    CC
                  </div>
                </div>
              </div>
              <div>
                <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                  Meet Chris Cameron
                </h2>
                <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300">
                  <p>
                    As a neurodivergent developer, I've experienced firsthand the challenges of working with tools designed primarily for neurotypical minds. This experience led me to create FocusLab—a company dedicated to building development tools that embrace and celebrate different ways of thinking.
                  </p>
                  <p>
                    With over a decade of experience in software development and a deep understanding of neurodivergent needs, I'm committed to creating solutions that reduce cognitive load, minimize decision fatigue, and make development more accessible for everyone.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Mission and Values Section */}
        <Section spacing="lg" className="bg-gray-50 dark:bg-gray-800">
          <Container maxWidth="7xl">
            <div className="text-center">
              <h2 className="mb-12 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Our Mission & Values
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900">
                <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Inclusive Design First
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We believe that great tools should be accessible to everyone, regardless of how their brain works. Every feature we build starts with inclusive design principles.
                </p>
              </div>
              <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900">
                <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Reduce Cognitive Load
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our tools are designed to minimize mental overhead, with clear interfaces, consistent patterns, and thoughtful automation of repetitive tasks.
                </p>
              </div>
              <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900">
                <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Community Driven
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We actively engage with the neurodivergent developer community, ensuring our tools meet real needs and solve real challenges.
                </p>
              </div>
            </div>
          </Container>
        </Section>

        {/* Team Approach Section */}
        <Section spacing="lg">
          <Container maxWidth="7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Our Approach to Development
              </h2>
              <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300">
                <p>
                  At FocusLab, we believe that neurodiversity in tech is a strength, not a challenge to overcome. Our development process embraces different thinking styles, incorporating various perspectives to create more robust and accessible solutions.
                </p>
                <p>
                  We focus on creating tools that provide clear structure while maintaining flexibility, allowing developers to work in ways that best suit their unique cognitive styles.
                </p>
              </div>
            </div>
          </Container>
        </Section>

        {/* Contact Section */}
        <Section spacing="lg" className="bg-gray-50 dark:bg-gray-800">
          <Container maxWidth="7xl">
            <div className="text-center mb-12">
              <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Get in Touch
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Have questions about our tools or want to discuss how we can help your team? We'd love to hear from you.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <ContactInfo />
                
                {/* Additional Information */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Why Work With Us?
                  </h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                      <span>Neurodivergent-friendly development approach</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                      <span>Focus on accessibility and inclusive design</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                      <span>Expertise in modern web technologies</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                      <span>Collaborative and transparent process</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Contact Form */}
              <div>
                <ContactForm />
              </div>
            </div>
          </Container>
        </Section>
      </main>
    </div>
  );
} 