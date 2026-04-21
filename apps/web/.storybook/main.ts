import type { StorybookConfig } from '@storybook/react-vite'
import path from 'path'

const config: StorybookConfig = {
  // Discover stories co-located with components AND in the src tree
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',   // controls, actions, docs, viewport, backgrounds
    '@storybook/addon-interactions', // play functions for interaction testing
    '@storybook/addon-a11y',         // axe-core accessibility audit in every story
    '@storybook/addon-themes',       // dark mode toggle
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: (config) => {
    // Mirror the @/ alias from vite.config.ts
    config.resolve ??= {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
    }
    return config
  },
}

export default config
