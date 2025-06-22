import type { MetaFunction } from "@remix-run/node";
import { Layout } from "~/components/Layout";

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy - FocusLab" },
    { name: "description", content: "FocusLab's Privacy Policy - How we collect, use, and protect your personal information in compliance with GDPR." },
    { name: "robots", content: "index, follow" },
  ];
};

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="min-h-screen bg-white dark:bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Privacy Policy
            </h1>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Version:</strong> 1.0
              </p>
            </div>

            <h2>1. Introduction</h2>
            <p>
              FocusLab ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p>
              This policy is designed to comply with the General Data Protection Regulation (GDPR) and other applicable privacy laws. By using our services, you consent to the practices described in this policy.
            </p>

            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Personal Information</h3>
            <p>We may collect the following types of personal information:</p>
            <ul>
              <li><strong>Contact Information:</strong> Name, email address, phone number</li>
              <li><strong>Newsletter Subscription:</strong> Email address for newsletter communications</li>
              <li><strong>Communication Data:</strong> Messages sent through our contact forms</li>
              <li><strong>Technical Information:</strong> IP address, browser type, operating system, device information</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <p>We automatically collect certain information when you visit our website:</p>
            <ul>
              <li>Log data (IP address, browser type, pages visited, time stamps)</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Usage patterns and preferences</li>
              <li>Device and connection information</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use your personal information for the following purposes:</p>
            <ul>
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our services</li>
              <li><strong>Communication:</strong> To respond to inquiries and provide customer support</li>
              <li><strong>Newsletter:</strong> To send newsletters and updates (with your explicit consent)</li>
              <li><strong>Analytics:</strong> To understand website usage and improve user experience</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues and security threats</li>
            </ul>

            <h2>4. Legal Basis for Processing (GDPR)</h2>
            <p>Under GDPR, we process your personal data based on the following legal grounds:</p>
            <ul>
              <li><strong>Consent:</strong> For newsletter subscriptions and optional cookies</li>
              <li><strong>Legitimate Interest:</strong> For website analytics and security</li>
              <li><strong>Contractual Necessity:</strong> To provide requested services</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
            </ul>

            <h2>5. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar technologies to enhance your browsing experience. Our cookie policy includes:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
              <li><strong>Analytics Cookies:</strong> To understand website usage patterns</li>
              <li><strong>Marketing Cookies:</strong> For personalized advertising (with consent)</li>
              <li><strong>Functional Cookies:</strong> To remember your preferences</li>
            </ul>
            <p>
              You can manage your cookie preferences through our cookie consent banner or your browser settings.
            </p>

            <h2>6. Data Sharing and Disclosure</h2>
            <p>We do not sell, trade, or rent your personal information. We may share information in the following circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operations</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              <li><strong>Consent:</strong> When you explicitly consent to sharing</li>
            </ul>

            <h2>7. Data Retention</h2>
            <p>We retain your personal information for as long as necessary to:</p>
            <ul>
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Fulfill the purposes outlined in this policy</li>
            </ul>
            <p>
              Specific retention periods:
            </p>
            <ul>
              <li><strong>Contact Form Data:</strong> 2 years from submission</li>
              <li><strong>Newsletter Subscriptions:</strong> Until unsubscribed</li>
              <li><strong>Analytics Data:</strong> 26 months (anonymized)</li>
              <li><strong>Cookie Data:</strong> As specified in cookie settings</li>
            </ul>

            <h2>8. Your Rights Under GDPR</h2>
            <p>As a data subject, you have the following rights:</p>
            <ul>
              <li><strong>Right of Access:</strong> Request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
              <li><strong>Right to Data Portability:</strong> Request transfer of your data</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Rights Related to Automated Processing:</strong> Protection against automated decision-making</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided below.
            </p>

            <h2>9. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication measures</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>

            <h2>10. International Data Transfers</h2>
            <p>
              If we transfer your personal data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place, including:
            </p>
            <ul>
              <li>Adequacy decisions by the European Commission</li>
              <li>Standard Contractual Clauses (SCCs)</li>
              <li>Binding Corporate Rules (BCRs)</li>
              <li>Certification schemes and codes of conduct</li>
            </ul>

            <h2>11. Children's Privacy</h2>
            <p>
              Our services are not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe your child has provided us with personal information, please contact us to have it removed.
            </p>

            <h2>12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by:
            </p>
            <ul>
              <li>Posting the updated policy on our website</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending email notifications for material changes</li>
              <li>Displaying prominent notices on our website</li>
            </ul>

            <h2>13. Contact Information</h2>
            <p>
              For questions about this Privacy Policy or to exercise your rights, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-4">
              <p><strong>Email:</strong> privacy@focuslab.com</p>
              <p><strong>Data Protection Officer:</strong> dpo@focuslab.com</p>
              <p><strong>Address:</strong> [Your Business Address]</p>
              <p><strong>Phone:</strong> [Your Contact Number]</p>
            </div>

            <h2>14. Supervisory Authority</h2>
            <p>
              If you believe we have not adequately addressed your privacy concerns, you have the right to lodge a complaint with your local data protection supervisory authority.
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-8">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This privacy policy template should be reviewed by legal counsel to ensure compliance with your specific jurisdiction and business practices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 