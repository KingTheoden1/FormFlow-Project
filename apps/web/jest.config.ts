import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Runs after Jest itself is set up — this is where we import jest-dom
  // matchers like toBeInTheDocument(), toHaveTextContent(), etc.
  // NOTE: the correct key is setupFilesAfterEnv (not setupFilesAfterFramework)
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    // Resolve the @/ path alias the same way Vite does
    '^@/(.*)$': '<rootDir>/src/$1',
    // Silence CSS imports — Jest doesn't need to process them
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.ts',
    // Silence image/file imports
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/tests/__mocks__/fileMock.ts',
    // nanoid v5 is ESM-only and can't be imported by Jest's CommonJS runner.
    // We swap it for a simple counter-based mock that behaves the same way.
    '^nanoid$': '<rootDir>/tests/__mocks__/nanoidMock.ts',
  },
  testMatch: ['<rootDir>/tests/unit/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/main.tsx',
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
  },
}

export default config
