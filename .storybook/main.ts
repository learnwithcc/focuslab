import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import storybookViteConfig from './vite.config';

const config: StorybookConfig = {
  stories: [
    '../app/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    // Disable template stories and MDX to focus on project components
    // '../stories/**/*.mdx',
    // '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-themes',
    '@storybook/addon-a11y',
    'storybook-addon-test-codegen',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, storybookViteConfig);
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};

export default config;