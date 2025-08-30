/**
 * 2_1_chord_color_matching.js - Studio Ghibli Style Chord Color Matching Activity
 * Based on 2_5 structure with 8 chord types and magical forest elements
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Import audio engine
import audioEngine from '../audio-engine.js';

// Import shared feedback functions
import {
  showShakeError,
  showRainbowSuccess,
  highlightCorrectButton
} from '../shared/feedback.js';

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function testChordColorMatchingModuleImport() {
  debugLog('CHORDS', 'Chord Color Matching module successfully imported');
  return true;
}

/**
 * Start 2_1 Color Matching activity - similar to 2_5 start function
 * @param {Object} component - Alpine.js component
 */
export function start2_1ColorMatching(component) {
  debugLog('CHORDS', 'Starting 2_1 Color Matching activity');
  
  // Initialize free play mode
  component.is2_1FreePlayMode = true;
  
  // Generate first chord for free play
  generate2_1Chord(component);
}

/**
 * Start game mode for 2_1 activity
 * @param {Object} component - Alpine.js component
 */
export function start2_1GameMode(component) {
  debugLog('CHORDS', 'Starting 2_1 game mode');
  
  component.is2_1FreePlayMode = false;
  
  // Generate first game chord
  generate2_1Chord(component);
}

/**
 * Generate a new chord for 2_1 activity
 * @param {Object} component - Alpine.js component
 */
export function generate2_1Chord(component) {
  const chordTypes = ['major', 'minor', 'diminished', 'augmented', 'dominant7', 'major7', 'sus2', 'sus4'];
  const rootNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
  
  const chordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
  const rootNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];
  
  component.currentChordType = chordType;
  component.currentTransposeRootNote = rootNote;
  
  debugLog('CHORDS', `Generated 2_1 chord: ${chordType} with root ${rootNote}`);
  
  // Auto-play in game mode
  if (!component.is2_1FreePlayMode) {
    component.playChordByType(chordType, rootNote);
  }
}

/**
 * Play current 2_1 chord
 * @param {Object} component - Alpine.js component
 */
export function playCurrent2_1Chord(component) {
  if (component.currentChordType && component.currentTransposeRootNote) {
    component.playChordByType(component.currentChordType, component.currentTransposeRootNote);
  }
}

/**
 * Check color match for 2_1 activity
 * @param {string} selectedElement - Selected magical element
 * @param {Object} component - Alpine.js component
 */
export function checkColorMatch(selectedElement, component) {
  debugLog('CHORDS', `Checking color match: ${selectedElement} vs ${component.currentChordType}`);
  
  if (component.is2_1FreePlayMode) {
    // In free play mode, just play the corresponding chord
    const chordMapping = {
      'fruit': 'major',
      'mushroom': 'minor', 
      'crystal': 'diminished',
      'flower': 'augmented',
      'rune': 'dominant7',
      'feather': 'major7',
      'acorn': 'sus2',
      'lantern': 'sus4'
    };
    
    const chordType = chordMapping[selectedElement];
    if (chordType) {
      component.playChordByType(chordType, 'C4');
    }
    return;
  }
  
  // Game mode logic
  const correctElement = getElementForChordType(component.currentChordType);
  const isCorrect = selectedElement === correctElement;
  
  if (isCorrect) {
    // Correct answer
    component.progress['2_1'] = (component.progress['2_1'] || 0) + 1;
    
    // Save progress
    const chordsProgressData = JSON.parse(localStorage.getItem('lalumo_chords_progress') || '{}');
    chordsProgressData['2_1'] = component.progress['2_1'];
    localStorage.setItem('lalumo_chords_progress', JSON.stringify(chordsProgressData));
    
    // Show success feedback
    showRainbowSuccess();
    audioEngine.playNote('success');
    
    // Generate next chord after delay
    setTimeout(() => {
      generate2_1Chord(component);
    }, 2000);
    
  } else {
    // Wrong answer
    const selectedButton = document.querySelector(`#button_2_1_${selectedElement}`);
    if (selectedButton) {
      selectedButton.classList.add('shake-animation');
      setTimeout(() => {
        selectedButton.classList.remove('shake-animation');
      }, 500);
    }
    
    // Highlight correct button
    const correctButtonSelector = `#button_2_1_${correctElement}`;
    setTimeout(() => {
      highlightCorrectButton(correctButtonSelector);
    }, 800);
    
    // Show error feedback
    showShakeError();
    audioEngine.playNote('try_again');
    
    // Replay chord after delay
    setTimeout(() => {
      component.playChordByType(component.currentChordType, component.currentTransposeRootNote);
    }, 1500);
  }
}

/**
 * Get magical element for chord type
 * @param {string} chordType - The chord type
 * @returns {string} The corresponding magical element
 */
function getElementForChordType(chordType) {
  const mapping = {
    'major': 'fruit',
    'minor': 'mushroom',
    'diminished': 'crystal', 
    'augmented': 'flower',
    'dominant7': 'rune',
    'major7': 'feather',
    'sus2': 'acorn',
    'sus4': 'lantern'
  };
  return mapping[chordType] || 'fruit';
}

/**
 * Reset progress to current level for 2_1
 * @param {Object} component - Alpine.js component
 */
export function reset2_1ProgressToCurrentLevel(component) {
  // Simple reset - no levels in 2_1
  const chordsProgressData = JSON.parse(localStorage.getItem('lalumo_chords_progress') || '{}');
  chordsProgressData['2_1'] = Math.max(0, (chordsProgressData['2_1'] || 0) - 1);
  localStorage.setItem('lalumo_chords_progress', JSON.stringify(chordsProgressData));
  
  component.progress['2_1'] = chordsProgressData['2_1'];
  debugLog('CHORDS', `Reset 2_1 progress to ${component.progress['2_1']}`);
}

/* Global exports for console access */
window.start2_1ColorMatching = start2_1ColorMatching;
window.start2_1GameMode = start2_1GameMode;
window.checkColorMatch = checkColorMatch;
window.playCurrent2_1Chord = playCurrent2_1Chord;
