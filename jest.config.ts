import type { Config } from 'jest';

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testTimeout: 30000, // 30 seconds for integration tests
  moduleNameMapper: {
    "^@types/(.*)$": "<rootDir>/src/types/$1",
    "^@auth/(.*)$": "<rootDir>/src/auth/$1",
    "^@http/(.*)$": "<rootDir>/src/http/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
  },
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "<rootDir>/coverage",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default config;

