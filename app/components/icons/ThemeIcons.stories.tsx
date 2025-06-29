import type { Meta, StoryObj } from '@storybook/react';
import { SunIcon, MoonIcon, ExternalLinkIcon } from '~/components';
import { useState } from 'react';

const meta: Meta = {
  title: 'Components/Icons/Theme & Utility Icons',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Theme toggle and utility icons for interface elements. Includes sun/moon for theme switching and external link indicators.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// Sun Icon Stories
export const Sun: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">SunIcon (Light Mode)</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <SunIcon className="w-4 h-4" />
            <SunIcon className="w-6 h-6" />
            <SunIcon className="w-8 h-8" />
            <SunIcon className="w-12 h-12" />
            <span className="text-sm text-gray-600">16px, 24px, 32px, 48px</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <SunIcon className="w-8 h-8 text-gray-400" />
            <SunIcon className="w-8 h-8 text-yellow-400" />
            <SunIcon className="w-8 h-8 text-yellow-500" />
            <SunIcon className="w-8 h-8 text-orange-500" />
            <span className="text-sm text-gray-600">Sun color variations</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              <SunIcon className="w-4 h-4" />
              <span>Light Mode</span>
            </button>
            <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              <SunIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sun icon for light mode theme toggle. Stroke-based design with rays extending from center circle.',
      },
    },
  },
};

// Moon Icon Stories
export const Moon: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">MoonIcon (Dark Mode)</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <MoonIcon className="w-4 h-4" />
            <MoonIcon className="w-6 h-6" />
            <MoonIcon className="w-8 h-8" />
            <MoonIcon className="w-12 h-12" />
            <span className="text-sm text-gray-600">16px, 24px, 32px, 48px</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <MoonIcon className="w-8 h-8 text-gray-400" />
            <MoonIcon className="w-8 h-8 text-blue-400" />
            <MoonIcon className="w-8 h-8 text-purple-500" />
            <MoonIcon className="w-8 h-8 text-indigo-600" />
            <span className="text-sm text-gray-600">Moon color variations</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              <MoonIcon className="w-4 h-4" />
              <span>Dark Mode</span>
            </button>
            <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              <MoonIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Moon icon for dark mode theme toggle. Crescent moon design that pairs with sun icon.',
      },
    },
  },
};

// External Link Icon Stories
export const ExternalLink: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">ExternalLinkIcon</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <ExternalLinkIcon className="w-4 h-4" />
            <ExternalLinkIcon />
            <ExternalLinkIcon className="w-6 h-6" />
            <ExternalLinkIcon className="w-8 h-8" />
            <span className="text-sm text-gray-600">16px, 20px (default), 24px, 32px</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <ExternalLinkIcon className="w-5 h-5 text-gray-400" />
            <ExternalLinkIcon className="w-5 h-5 text-blue-500" />
            <ExternalLinkIcon className="w-5 h-5 text-green-600" />
            <ExternalLinkIcon className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Color variations</span>
          </div>
          
          <div className="space-y-2">
            <a 
              href="#" 
              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>Visit our website</span>
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
            <div className="flex space-x-2">
              <a 
                href="#" 
                className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <span>Open Documentation</span>
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'External link icon for indicating links that open in new windows or external sites. Has Tailwind default classes.',
      },
    },
  },
};

// Theme Toggle Interactive Example
export const ThemeToggleExample: Story = {
  render: () => {
    const [isDark, setIsDark] = useState(false);
    
    return (
      <div className={`space-y-6 p-6 rounded-lg transition-colors ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div>
          <h3 className="text-lg font-semibold mb-4">Interactive Theme Toggle</h3>
          <div className="space-y-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
              }`}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <>
                  <SunIcon className="w-5 h-5" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <MoonIcon className="w-5 h-5" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setIsDark(false)}
                className={`p-2 rounded transition-colors ${
                  !isDark 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : isDark ? 'bg-gray-800 text-gray-400 hover:text-yellow-400' : 'bg-gray-100 text-gray-400 hover:text-yellow-600'
                }`}
                aria-label="Switch to light mode"
              >
                <SunIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsDark(true)}
                className={`p-2 rounded transition-colors ${
                  isDark 
                    ? 'bg-blue-900 text-blue-300' 
                    : 'bg-gray-100 text-gray-400 hover:text-blue-600'
                }`}
                aria-label="Switch to dark mode"
              >
                <MoonIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Current Theme</h4>
          <p className="text-sm opacity-75">
            {isDark ? 'Dark mode is active' : 'Light mode is active'}
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example showing theme toggle functionality with sun and moon icons.',
      },
    },
  },
};

// All utility icons together
export const UtilityIconsCollection: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Theme Icons</h3>
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
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Utility Icons</h3>
        <div className="flex space-x-8 items-center">
          <div className="flex flex-col items-center space-y-2">
            <ExternalLinkIcon className="w-8 h-8" />
            <span className="text-sm text-gray-600">External Link</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Common Usage Patterns</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <span>Theme Settings</span>
            <div className="flex space-x-1">
              <button className="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
                <SunIcon className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                <MoonIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <a href="#" className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800">
              <span>Learn more about accessibility</span>
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
            <a href="#" className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800">
              <span>View GitHub repository</span>
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Collection of utility icons showing common usage patterns for theme switching and external links.',
      },
    },
  },
};

