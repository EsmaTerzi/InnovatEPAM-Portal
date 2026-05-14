import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/lib/**/*.test.ts', '<rootDir>/app/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
        '^.+\\.js$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', allowJs: true } }],
      },
      transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/components/**/*.test.tsx'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
        '^.+\\.js$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', allowJs: true } }],
      },
      transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
  ],
};

export default config;
