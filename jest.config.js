module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/backend/**/*.js',
    '!src/backend/server.js',
    '!**/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70
    }
  },
  
  // Test timeouts (especially for integration tests)
  testTimeout: 15000,
  
  // Custom test setup
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  // Transform configuration
  transform: {},
  
  // Different test environments
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/tests/unit/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['**/tests/integration/**/*.test.js'],
      testEnvironment: 'node'
    }
  ]
};