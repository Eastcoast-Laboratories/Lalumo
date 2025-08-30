// Jest setup file for unit tests

// Mock global functions that are used in the components
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;

// Mock debug logging
global.debugLog = jest.fn();

// Mock audio engine
jest.mock('../../src/components/audio-engine.js', () => ({
  playChord: jest.fn(),
  playNote: jest.fn(),
  stopAll: jest.fn()
}));

// Mock feedback functions
jest.mock('../../src/components/shared/feedback.js', () => ({
  showRainbowSuccess: jest.fn(),
  showShakeError: jest.fn(),
  highlightCorrectButton: jest.fn(),
  showFeedbackMessage: jest.fn()
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
