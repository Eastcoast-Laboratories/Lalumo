/**
 * Unit tests for 2_1 chord color matching module
 * Tests edge cases and error conditions to catch runtime errors
 */

import { 
  checkColorMatch, 
  generate2_1Chord, 
  start2_1ColorMatching,
  start2_1GameMode 
} from '../../src/components/2_chords/2_1_chord_color_matching.js';

// Mock audio engine
const mockAudioEngine = {
  playChord: jest.fn(),
  playNote: jest.fn()
};

// Mock feedback functions
const mockFeedback = {
  showRainbowSuccess: jest.fn(),
  showShakeError: jest.fn(),
  highlightCorrectButton: jest.fn()
};

// Mock global functions
global.showRainbowSuccess = mockFeedback.showRainbowSuccess;
global.showShakeError = mockFeedback.showShakeError;
global.highlightCorrectButton = mockFeedback.highlightCorrectButton;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock DOM methods
global.document = {
  querySelector: jest.fn(() => ({
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  }))
};

describe('2_1 Chord Color Matching', () => {
  let mockComponent;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('{}');
    
    // Create mock component with minimal required properties
    mockComponent = {
      is2_1FreePlayMode: true,
      currentChordType: 'major',
      currentTransposeRootNote: 'C4',
      progress: {},
      chords: {
        major: { intervals: [0, 4, 7], name: 'Major', color: '#FFD700' },
        minor: { intervals: [0, 3, 7], name: 'Minor', color: '#4682B4' },
        diminished: { intervals: [0, 3, 6], name: 'Diminished', color: '#800080' }
      },
      playChordByType: jest.fn()
    };
  });

  describe('checkColorMatch', () => {
    test('should handle component with undefined progress', () => {
      const componentWithoutProgress = { ...mockComponent };
      delete componentWithoutProgress.progress;
      
      expect(() => {
        checkColorMatch('fruit', componentWithoutProgress);
      }).not.toThrow();
      
      expect(componentWithoutProgress.progress).toBeDefined();
    });

    test('should handle component with undefined chords', () => {
      const componentWithoutChords = { ...mockComponent };
      delete componentWithoutChords.chords;
      delete componentWithoutChords.playChordByType;
      
      expect(() => {
        checkColorMatch('fruit', componentWithoutChords);
      }).not.toThrow();
    });

    test('should handle component with missing playChordByType method', () => {
      const componentWithoutPlayMethod = { ...mockComponent };
      delete componentWithoutPlayMethod.playChordByType;
      
      expect(() => {
        checkColorMatch('fruit', componentWithoutPlayMethod);
      }).not.toThrow();
    });

    test('should work in free play mode with valid component', () => {
      mockComponent.is2_1FreePlayMode = true;
      
      checkColorMatch('fruit', mockComponent);
      
      expect(mockComponent.playChordByType).toHaveBeenCalledWith('major', 'C4');
    });

    test('should work in game mode with correct answer', () => {
      mockComponent.is2_1FreePlayMode = false;
      mockComponent.currentChordType = 'major';
      
      checkColorMatch('fruit', mockComponent); // fruit maps to major
      
      expect(mockComponent.progress['2_1']).toBe(1);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should handle game mode with wrong answer', () => {
      mockComponent.is2_1FreePlayMode = false;
      mockComponent.currentChordType = 'major';
      
      checkColorMatch('mushroom', mockComponent); // mushroom maps to minor, not major
      
      expect(mockFeedback.showShakeError).toHaveBeenCalled();
    });

    test('should handle completely empty component', () => {
      const emptyComponent = {};
      
      expect(() => {
        checkColorMatch('fruit', emptyComponent);
      }).not.toThrow();
    });

    test('should handle null component', () => {
      expect(() => {
        checkColorMatch('fruit', null);
      }).toThrow(); // This should throw, which is expected
    });

    test('should handle undefined component', () => {
      expect(() => {
        checkColorMatch('fruit', undefined);
      }).toThrow(); // This should throw, which is expected
    });
  });

  describe('start2_1ColorMatching', () => {
    test('should handle component without required properties', () => {
      const minimalComponent = {};
      
      expect(() => {
        start2_1ColorMatching(minimalComponent);
      }).not.toThrow();
      
      expect(minimalComponent.is2_1FreePlayMode).toBe(true);
    });
  });

  describe('start2_1GameMode', () => {
    test('should handle component without required properties', () => {
      const minimalComponent = {};
      
      expect(() => {
        start2_1GameMode(minimalComponent);
      }).not.toThrow();
      
      expect(minimalComponent.is2_1FreePlayMode).toBe(false);
    });
  });

  describe('generate2_1Chord', () => {
    test('should handle component without playChordByType method', () => {
      const componentWithoutPlayMethod = { ...mockComponent };
      delete componentWithoutPlayMethod.playChordByType;
      componentWithoutPlayMethod.is2_1FreePlayMode = false; // game mode
      
      expect(() => {
        generate2_1Chord(componentWithoutPlayMethod);
      }).not.toThrow();
    });

    test('should handle component without chords definition', () => {
      const componentWithoutChords = { ...mockComponent };
      delete componentWithoutChords.chords;
      
      expect(() => {
        generate2_1Chord(componentWithoutChords);
      }).not.toThrow();
    });
  });

  describe('Edge cases that caused runtime errors', () => {
    test('should handle component.progress undefined access', () => {
      const component = { is2_1FreePlayMode: false, currentChordType: 'major' };
      
      expect(() => {
        checkColorMatch('fruit', component);
      }).not.toThrow();
      
      expect(component.progress).toBeDefined();
      expect(component.progress['2_1']).toBe(1);
    });

    test('should handle component.chords undefined access', () => {
      const component = { 
        is2_1FreePlayMode: true,
        progress: {}
      };
      
      expect(() => {
        checkColorMatch('fruit', component);
      }).not.toThrow();
    });

    test('should handle component.playChordByType undefined access', () => {
      const component = { 
        is2_1FreePlayMode: true,
        progress: {},
        chords: { major: { intervals: [0, 4, 7] } }
      };
      
      expect(() => {
        checkColorMatch('fruit', component);
      }).not.toThrow();
    });
  });
});
