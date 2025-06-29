import type { Meta, StoryObj } from '@storybook/react';
import { 
  GitHubIcon, 
  LinkedInIcon, 
  TwitterIcon, 
  EmailIcon, 
  ExternalLinkIcon, 
  SunIcon, 
  MoonIcon 
} from '~/components';

const meta: Meta = {
  title: 'Components/Icons/Icon Library',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A comprehensive icon library with social media, theme, and utility icons. All icons support theming through currentColor and follow accessibility best practices.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// Icon showcase grid
export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="flex flex-col items-center space-y-2">
        <GitHubIcon className="w-8 h-8" />
        <span className="text-sm text-gray-600">GitHubIcon</span>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <LinkedInIcon size={32} />
        <span className="text-sm text-gray-600">LinkedInIcon</span>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <TwitterIcon size={32} />
        <span className="text-sm text-gray-600">TwitterIcon</span>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <EmailIcon size={32} />
        <span className="text-sm text-gray-600">EmailIcon</span>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <ExternalLinkIcon className="w-8 h-8" />
        <span className="text-sm text-gray-600">ExternalLinkIcon</span>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <SunIcon className="w-8 h-8" />
        <span className="text-sm text-gray-600">SunIcon</span>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <MoonIcon className="w-8 h-8" />
        <span className="text-sm text-gray-600">MoonIcon</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete overview of all available icons in the library.',
      },
    },
  },
};

// Category-based organization
export const SocialMediaIcons: Story = {
  render: () => (
    <div className="flex space-x-8 items-center">
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
        <span className="text-sm text-gray-600">Twitter/X</span>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <EmailIcon size={32} />
        <span className="text-sm text-gray-600">Email</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Social media and contact icons for external links and communication.',
      },
    },
  },
};

export const ThemeIcons: Story = {
  render: () => (
    <div className="flex space-x-8 items-center">
      <div className="flex flex-col items-center space-y-2">
        <SunIcon className="w-8 h-8 text-yellow-500" />
        <span className="text-sm text-gray-600">Light Mode</span>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <MoonIcon className="w-8 h-8 text-blue-500" />
        <span className="text-sm text-gray-600">Dark Mode</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Theme toggle icons for light and dark mode switching.',
      },
    },
  },
};

export const UtilityIcons: Story = {
  render: () => (
    <div className="flex space-x-8 items-center">
      <div className="flex flex-col items-center space-y-2">
        <ExternalLinkIcon className="w-8 h-8" />
        <span className="text-sm text-gray-600">External Link</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Utility icons for interface elements and navigation.',
      },
    },
  },
};

// Size variations
export const IconSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Standard Icons (React.SVGProps pattern)</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <GitHubIcon className="w-4 h-4" />
            <GitHubIcon className="w-6 h-6" />
            <GitHubIcon className="w-8 h-8" />
            <GitHubIcon className="w-12 h-12" />
            <GitHubIcon className="w-16 h-16" />
            <span className="text-sm text-gray-600">16px, 24px, 32px, 48px, 64px</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Size Icons (size prop pattern)</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <LinkedInIcon size={16} />
            <LinkedInIcon size={24} />
            <LinkedInIcon size={32} />
            <LinkedInIcon size={48} />
            <LinkedInIcon size={64} />
            <span className="text-sm text-gray-600">16px, 24px, 32px, 48px, 64px</span>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons can be sized using either Tailwind classes or the size prop, depending on the implementation pattern.',
      },
    },
  },
};

// Color variations
export const IconColors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Theme Colors</h3>
        <div className="flex space-x-4 items-center">
          <GitHubIcon className="w-8 h-8 text-gray-900" />
          <TwitterIcon size={32} className="text-blue-500" />
          <LinkedInIcon size={32} className="text-blue-600" />
          <EmailIcon size={32} className="text-green-600" />
          <SunIcon className="w-8 h-8 text-yellow-500" />
          <MoonIcon className="w-8 h-8 text-purple-500" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Brand Colors</h3>
        <div className="flex space-x-4 items-center">
          <GitHubIcon className="w-8 h-8 text-gray-800" />
          <TwitterIcon size={32} className="text-black" />
          <LinkedInIcon size={32} className="text-blue-700" />
          <EmailIcon size={32} className="text-red-600" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">State Colors</h3>
        <div className="flex space-x-4 items-center">
          <GitHubIcon className="w-8 h-8 text-green-600" />
          <TwitterIcon size={32} className="text-yellow-500" />
          <LinkedInIcon size={32} className="text-red-500" />
          <EmailIcon size={32} className="text-gray-400" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All icons support color customization through currentColor and can be styled with any color class.',
      },
    },
  },
};

// Interactive examples
export const InteractiveIcons: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Hover Effects</h3>
        <div className="flex space-x-4">
          <GitHubIcon className="w-8 h-8 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" />
          <TwitterIcon size={32} className="text-gray-600 hover:text-blue-500 transition-colors cursor-pointer" />
          <LinkedInIcon size={32} className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer" />
          <EmailIcon size={32} className="text-gray-600 hover:text-green-600 transition-colors cursor-pointer" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Button Integration</h3>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 px-3 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors">
            <GitHubIcon className="w-4 h-4" />
            <span>GitHub</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            <TwitterIcon size={16} />
            <span>Twitter</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            <LinkedInIcon size={16} />
            <span>LinkedIn</span>
          </button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons work well in interactive contexts with hover effects and button integration.',
      },
    },
  },
};


// Accessibility examples
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Icons with Accessible Labels</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <GitHubIcon className="w-6 h-6" aria-label="GitHub Profile" />
            <span>GitHub profile link with aria-label</span>
          </div>
          <div className="flex items-center space-x-3">
            <TwitterIcon size={24} aria-label="Twitter Profile" />
            <span>Twitter profile link with aria-label</span>
          </div>
          <div className="flex items-center space-x-3">
            <EmailIcon size={24} aria-label="Send Email" />
            <span>Email contact link with aria-label</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Decorative Icons (aria-hidden)</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <LinkedInIcon size={24} aria-hidden="true" />
            <span>Visit our LinkedIn page</span>
          </div>
          <div className="flex items-center space-x-3">
            <ExternalLinkIcon aria-hidden="true" />
            <span>Open in new window</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Theme Toggle Accessibility</h3>
        <div className="space-y-3">
          <button 
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
            aria-label="Switch to dark mode"
          >
            <SunIcon className="w-4 h-4" aria-hidden="true" />
            <span>Light Mode</span>
          </button>
          <button 
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
            aria-label="Switch to light mode"
          >
            <MoonIcon className="w-4 h-4" aria-hidden="true" />
            <span>Dark Mode</span>
          </button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples showing proper accessibility implementation with icons, including aria-label and aria-hidden usage.',
      },
    },
  },
};

// Implementation patterns
export const ImplementationPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Pattern A: React.SVGProps (Stroke-based)</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <GitHubIcon className="w-6 h-6" />
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{'<GitHubIcon className="w-6 h-6" />'}</code>
          </div>
          <div className="flex items-center space-x-3">
            <SunIcon className="w-6 h-6" />
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{'<SunIcon className="w-6 h-6" />'}</code>
          </div>
          <div className="flex items-center space-x-3">
            <MoonIcon className="w-6 h-6" />
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{'<MoonIcon className="w-6 h-6" />'}</code>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Pattern B: Custom Props (Fill-based)</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <LinkedInIcon size={24} />
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{'<LinkedInIcon size={24} />'}</code>
          </div>
          <div className="flex items-center space-x-3">
            <TwitterIcon size={24} />
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{'<TwitterIcon size={24} />'}</code>
          </div>
          <div className="flex items-center space-x-3">
            <EmailIcon size={24} />
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{'<EmailIcon size={24} />'}</code>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Pattern C: Hybrid (Tailwind defaults)</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <ExternalLinkIcon />
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{'<ExternalLinkIcon />'}</code>
          </div>
          <div className="flex items-center space-x-3">
            <ExternalLinkIcon className="w-8 h-8" />
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{'<ExternalLinkIcon className="w-8 h-8" />'}</code>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different implementation patterns used across the icon library, showing the two main approaches to sizing and props.',
      },
    },
  },
};