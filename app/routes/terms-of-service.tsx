import { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { ArrowLeft } from 'lucide-react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Terms of Service | Focus Lab' },
    {
      name: 'description',
      content: 'Read our Terms of Service to understand the rules and guidelines for using Focus Lab.',
    },
  ];
};

export default function TermsOfService() {
  const lastUpdated = 'June 22, 2025';

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="py-4 px-4 sm:px-6 lg:px-8 border-b border-border">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-primary-purple dark:text-gray-400 dark:hover:text-primary-purple motion-safe:transition-colors motion-reduce:transition-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </header>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary">Terms of Service</h1>
            <p className="mt-2 text-muted-foreground">Last Updated: {lastUpdated}</p>
          </div>

          <section id="introduction">
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Focus Lab. These Terms of Service ("Terms") govern your use of our website and services. By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you do not have permission to access the service.
            </p>
          </section>

          <section id="use-of-service">
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-4">2. Use of Our Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Focus Lab provides a Pomodoro timer and task management application. You agree to use our service in compliance with all applicable local, state, national, and international laws, rules, and regulations. You are responsible for any content you create and your activity on the service.
            </p>
          </section>

          <section id="accounts">
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-4">3. Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account with us, you guarantee that you are above the age of 13 and that the information you provide us is accurate, complete, and current at all times. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
            </p>
          </section>

          <section id="intellectual-property">
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-4">4. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Focus Lab and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Focus Lab.
            </p>
          </section>

          <section id="termination">
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-4">5. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>
          </section>

          <section id="limitation-of-liability">
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall Focus Lab, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
            </p>
          </section>

          <section id="governing-law">
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-4">7. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which our company is established, without regard to its conflict of law provisions.
            </p>
          </section>

          <section id="changes">
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-4">8. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <section id="contact-us">
            <h2 className="text-2xl font-semibold text-secondary-foreground mb-4">9. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at <a href="mailto:support@focuslab.app" className="text-primary hover:underline">support@focuslab.app</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 