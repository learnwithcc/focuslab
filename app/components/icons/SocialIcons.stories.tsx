import type { Meta, StoryObj } from '@storybook/react';
import { GitHubIcon, LinkedInIcon, TwitterIcon, EmailIcon } from '~/components';

const meta: Meta = {
  title: 'Components/Icons/Social Media Icons',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Social media and communication icons for external links, profiles, and contact methods. All icons support theming and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// GitHub Icon Stories
export const GitHub: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">GitHubIcon</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <GitHubIcon className="w-4 h-4" />
            <GitHubIcon className="w-6 h-6" />
            <GitHubIcon className="w-8 h-8" />
            <GitHubIcon className="w-12 h-12" />
            <span className="text-sm text-gray-600">16px, 24px, 32px, 48px</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <GitHubIcon className="w-8 h-8 text-gray-400" />
            <GitHubIcon className="w-8 h-8 text-gray-600" />
            <GitHubIcon className="w-8 h-8 text-gray-900" />
            <GitHubIcon className="w-8 h-8 text-black" />
            <span className="text-sm text-gray-600">Color variations</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <a 
              href="#" 
              className="flex items-center space-x-2 px-3 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
              aria-label="View GitHub profile"
            >
              <GitHubIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <GitHubIcon className="w-5 h-5" aria-label="GitHub repository" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'GitHub icon with stroke-based design. Uses React.SVGProps pattern for maximum flexibility.',
      },
    },
  },
};

// LinkedIn Icon Stories
export const LinkedIn: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">LinkedInIcon</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <LinkedInIcon size={16} />
            <LinkedInIcon size={24} />
            <LinkedInIcon size={32} />
            <LinkedInIcon size={48} />
            <span className="text-sm text-gray-600">16px, 24px, 32px, 48px</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <LinkedInIcon size={32} className="text-gray-400" />
            <LinkedInIcon size={32} className="text-blue-500" />
            <LinkedInIcon size={32} className="text-blue-600" />
            <LinkedInIcon size={32} className="text-blue-700" />
            <span className="text-sm text-gray-600">LinkedIn brand colors</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <a 
              href="#" 
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              aria-label="View LinkedIn profile"
            >
              <LinkedInIcon size={16} />
              <span>LinkedIn</span>
            </a>
            <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors">
              <LinkedInIcon size={20} aria-label="Connect on LinkedIn" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'LinkedIn icon with official branding. Uses custom size prop for consistent sizing.',
      },
    },
  },
};

// Twitter Icon Stories
export const Twitter: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">TwitterIcon (X)</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <TwitterIcon size={16} />
            <TwitterIcon size={24} />
            <TwitterIcon size={32} />
            <TwitterIcon size={48} />
            <span className="text-sm text-gray-600">16px, 24px, 32px, 48px</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <TwitterIcon size={32} className="text-gray-400" />
            <TwitterIcon size={32} className="text-blue-400" />
            <TwitterIcon size={32} className="text-blue-500" />
            <TwitterIcon size={32} className="text-black" />
            <span className="text-sm text-gray-600">Brand and theme colors</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <a 
              href="#" 
              className="flex items-center space-x-2 px-3 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              aria-label="Follow on Twitter"
            >
              <TwitterIcon size={16} />
              <span>Follow</span>
            </a>
            <a 
              href="#" 
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              aria-label="Share on Twitter"
            >
              <TwitterIcon size={16} />
              <span>Tweet</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Twitter/X icon with modern X logo design. Supports both classic Twitter blue and new black branding.',
      },
    },
  },
};

// Email Icon Stories
export const Email: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">EmailIcon</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <EmailIcon size={16} />
            <EmailIcon size={24} />
            <EmailIcon size={32} />
            <EmailIcon size={48} />
            <span className="text-sm text-gray-600">16px, 24px, 32px, 48px</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <EmailIcon size={32} className="text-gray-400" />
            <EmailIcon size={32} className="text-green-500" />
            <EmailIcon size={32} className="text-blue-500" />
            <EmailIcon size={32} className="text-red-500" />
            <span className="text-sm text-gray-600">Service provider colors</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <a 
              href="mailto:contact@example.com" 
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              aria-label="Send email"
            >
              <EmailIcon size={16} />
              <span>Contact</span>
            </a>
            <button className="p-2 text-gray-600 hover:text-green-600 transition-colors">
              <EmailIcon size={20} aria-label="Email us" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Email envelope icon for contact and communication. Works well with mailto links and contact forms.',
      },
    },
  },
};

// All social icons together
export const SocialMediaCollection: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Standard Sizes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center space-y-2">
            <GitHubIcon className="w-8 h-8" />
            <span className="text-sm text-gray-600">GitHub</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <LinkedInIcon size={32} />
            <span className="text-sm text-gray-600">LinkedIn</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <TwitterIcon size={32} />
            <span className="text-sm text-gray-600">Twitter</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <EmailIcon size={32} />
            <span className="text-sm text-gray-600">Email</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Brand Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center space-y-2">
            <GitHubIcon className="w-8 h-8 text-gray-900" />
            <span className="text-sm text-gray-600">GitHub</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <LinkedInIcon size={32} className="text-blue-600" />
            <span className="text-sm text-gray-600">LinkedIn</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <TwitterIcon size={32} className="text-black" />
            <span className="text-sm text-gray-600">Twitter</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <EmailIcon size={32} className="text-red-600" />
            <span className="text-sm text-gray-600">Email</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Social Media Bar</h3>
        <div className="flex space-x-3">
          <a href="#" className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
            <GitHubIcon className="w-5 h-5" />
            <span className="sr-only">GitHub</span>
          </a>
          <a href="#" className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
            <LinkedInIcon size={20} />
            <span className="sr-only">LinkedIn</span>
          </a>
          <a href="#" className="p-2 text-gray-600 hover:text-black transition-colors">
            <TwitterIcon size={20} />
            <span className="sr-only">Twitter</span>
          </a>
          <a href="#" className="p-2 text-gray-600 hover:text-green-600 transition-colors">
            <EmailIcon size={20} />
            <span className="sr-only">Email</span>
          </a>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete social media icon collection showing standard implementations and common usage patterns.',
      },
    },
  },
};

