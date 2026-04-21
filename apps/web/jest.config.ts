import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Runs after the test framework is installed — imports jest-dom matchers
  setupFilesAfterFramework: ['<rootDir>/tests/setup.ts'],
  // NOTE: The correct Jest key is setupFilesAfterFramework (alias kept for clarity)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.ts',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/tests/__mocks__/fileMock.ts',
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
