module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],
  collectCoverageFrom: [
    'src/components/2_chords/*.js',
    '!src/components/2_chords/*.test.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
