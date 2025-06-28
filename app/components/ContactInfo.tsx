import React from 'react';
import { GitHubIcon, LinkedInIcon, TwitterIcon } from './icons';

export interface ContactInfoProps {
  className?: string;
  showTitle?: boolean;
}

interface SocialLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  external?: boolean;
}

const socialLinks: SocialLink[] = [
  {
    href: 'https://github.com/focuslab-io',
    label: 'Follow us on GitHub',
    icon: GitHubIcon,
    external: true,
  },
  {
    href: 'https://linkedin.com/company/focuslab-io',
    label: 'Connect with us on LinkedIn',
    icon: LinkedInIcon,
    external: true,
  },
  {
    href: 'https://twitter.com/focuslab_io',
    label: 'Follow us on Twitter',
    icon: TwitterIcon,
    external: true,
  },
];

export const ContactInfo: React.FC<ContactInfoProps> = ({
  className = '',
  showTitle = true,
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {showTitle && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Connect With Us
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Get in touch through your preferred channel
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Contact Form Message */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Have a question or project in mind?</span> Use our contact form below to get in touch. We respond to all inquiries within 24 hours.
          </p>
        </div>

        {/* Social Media Links */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Follow Our Work
          </h4>
          <div className="flex space-x-4">
            {socialLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="group flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                  aria-label={link.label}
                >
                  <IconComponent 
                    className="h-5 w-5 text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white transition-colors" 
                    size={20} 
                  />
                </a>
              );
            })}
          </div>
        </div>

        {/* Additional Contact Methods */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Other Ways to Reach Us
          </h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>
              <span className="font-medium">Response Time:</span> We typically respond within 24 hours
            </p>
            <p>
              <span className="font-medium">Business Hours:</span> Monday - Friday, 9 AM - 5 PM PST
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 