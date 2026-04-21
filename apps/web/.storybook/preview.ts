import type { Preview } from '@storybook/react'
import '../src/index.css' // Tailwind styles available in all stories

const preview: Preview = {
  parameters: {
    // Default viewport set — matches our mobile-first breakpoints
    viewport: {
      defaultViewport: 'responsive',
    },
    // Background options — mirrors Tailwind light/dark tokens
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#030712' },
        { name: 'gray', value: '#f9fafb' },
      ],
    },
    // a11y addon — run axe on every story automatically
    a11y: {
      config: {
        rules: [
          // We enforce WCAG 2.1 AA — bump any rule to 'violation' to make it block
        ],
      },
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  // Global decorators — wrap every story with the Redux Provider when needed
  // Individual stories that need state should use the decorators array in their meta
  decorators: [],
}

export default preview
