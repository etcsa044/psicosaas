import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
            jsx: 'react-jsx',
        }],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    roots: ['<rootDir>/tests'],
    testRegex: '.*\\.test\\.tsx?$',
    clearMocks: true,
};

export default config;
