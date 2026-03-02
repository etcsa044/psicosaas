import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    clearMocks: true,
    transformIgnorePatterns: [
        'node_modules/(?!uuid)',
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/server.ts',
        '!src/app.ts',
        '!src/**/index.ts',
    ],
};

export default config;
