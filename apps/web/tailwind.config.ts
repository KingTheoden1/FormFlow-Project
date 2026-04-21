import type { Config } from 'tailwindcss'

const config: Config = {
  // Only generate CSS for classes actually used — keeps bundle tiny
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './.storybook/**/*.{ts,tsx}',
  ],
  darkMode: 'class', // Toggle dark mode by adding 'dark' class to <html>
  theme: {
    extend: {
      colors: {
        // FormFlow brand tokens — swap these to retheme the whole app
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      // Ensures focus rings are always visible — WCAG 2.4.7
      ringWidth: {
        DEFAULT: '2px',
      },
      ringOffsetWidth: {
        DEFAULT: '2px',
      },
    },
  },
  plugins: [],
}

export default config
