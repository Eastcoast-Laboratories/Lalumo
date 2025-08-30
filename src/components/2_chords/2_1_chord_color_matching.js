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
 * Initializes free play mode and generates first chord
 * @param {Object} component - Alpine.js component
 * @activity 2_1_chords_color-matching
 * @used_by chords.js initialization
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
 * Switches from free play to game mode and generates first challenge chord
 * @param {Object} component - Alpine.js component
 * @activity 2_1_chords_color-matching
 * @used_by HTML button click, chords.js
 */
export function start2_1GameMode(component) {
  debugLog('CHORDS', 'Starting 2_1 game mode');
  
  component.is2_1FreePlayMode = false;
  
  // Generate first game chord
  generate2_1Chord(component);
}

/**
 * Generate a new chord for 2_1 activity with level-based logic
 * Level 1 (0-10): No transposition, avoid same chord type
 * Level 2 (>10): Random transposition, avoid exact same chord
 * @param {Object} component - Alpine.js component
 * @activity 2_1_chords_color-matching
 * @used_by start2_1ColorMatching, start2_1GameMode, checkColorMatch
 */
export function generate2_1Chord(component) {
  const chordTypes = ['major', 'minor', 'diminished', 'augmented', 'dominant7', 'major7', 'sus2', 'sus4'];
  const progress = component.progress?.['2_1'] || 0;
  
  let chordType, rootNote;
  
  if (progress <= 10) {
    // Level 1: No transposition, avoid same chord type
    rootNote = 'C4'; // Fixed root note
    
    // Avoid repeating the same chord type
    let availableChords = chordTypes.filter(type => type !== component.previous2_1ChordType);
    if (availableChords.length === 0) availableChords = chordTypes; // Fallback
    
    chordType = availableChords[Math.floor(Math.random() * availableChords.length)];
    
    debugLog('CHORDS_2_1_DEBUG', `Level 1: Generated ${chordType} with fixed root ${rootNote}, avoided: ${component.previous2_1ChordType}`);
  } else {
    // Level 2: Random transposition, avoid exact same chord
    const rootNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
    
    // Generate new chord, avoiding exact same combination
    let attempts = 0;
    do {
      chordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
      rootNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];
      attempts++;
    } while (
      attempts < 20 && 
      chordType === component.previous2_1ChordType && 
      rootNote === component.previous2_1RootNote
    );
    
    debugLog('CHORDS_2_1_DEBUG', `Level 2: Generated ${chordType} with root ${rootNote}, avoided: ${component.previous2_1ChordType}/${component.previous2_1RootNote}`);
  }
  
  // Store current chord for replay functionality
  component.currentChordType = chordType;
  component.currentTransposeRootNote = rootNote;
  
  debugLog('CHORDS', `Generated 2_1 chord: ${chordType} with root ${rootNote} (Progress: ${progress})`);
  
  // Auto-play in game mode
  if (!component.is2_1FreePlayMode && typeof component.playChordByType === 'function') {
    component.playChordByType(chordType, rootNote);
  }
}

/**
 * Play current 2_1 chord - replays stored chord without changing it
 * Maintains current chord type and transposition for consistent replay
 * @param {Object} component - Alpine.js component
 * @activity 2_1_chords_color-matching
 * @used_by HTML play button click
 */
export function playCurrent2_1Chord(component) {
  // Get component from window if not passed directly (for HTML button calls)
  const activeComponent = component || window.chordsComponent;
  
  if (activeComponent && activeComponent.currentChordType && activeComponent.currentTransposeRootNote && typeof activeComponent.playChordByType === 'function') {
    debugLog('CHORDS_2_1_DEBUG', `Replaying current chord: ${activeComponent.currentChordType} with root ${activeComponent.currentTransposeRootNote}`);
    activeComponent.playChordByType(activeComponent.currentChordType, activeComponent.currentTransposeRootNote);
  } else {
    debugLog('CHORDS_2_1_DEBUG', 'Cannot replay chord - missing chord data or playChordByType function', {
      component: !!activeComponent,
      currentChordType: activeComponent?.currentChordType,
      currentTransposeRootNote: activeComponent?.currentTransposeRootNote,
      playChordByType: typeof activeComponent?.playChordByType
    });
  }
}

/**
 * Check color match for 2_1 activity
 * @param {string} selectedElement - Selected magical element
 * @param {Object} component - Alpine.js component
 */
export function checkColorMatch(selectedElement, component) {
  debugLog('CHORDS', `Checking color match: ${selectedElement} vs ${component.currentChordType}`);
  
  // Ensure progress object exists
  if (!component.progress) {
    component.progress = {};
  }
  
  if (component.is2_1FreePlayMode) {
    // In free play mode, play the corresponding chord with new random pitch each time
    const chordMapping = {
      'fruit': 'major',
      'mushroom': 'minor', 
      'crystal': 'diminished',
      'flower': 'augmented',
      'flame': 'dominant7',
      'feather': 'major7',
      'acorn': 'sus2',
      'lantern': 'sus4'
    };
    
    const chordType = chordMapping[selectedElement];
    if (chordType) {
      // Generate new random root note for free play mode
      const rootNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      const randomRoot = rootNotes[Math.floor(Math.random() * rootNotes.length)];
      
      debugLog('CHORDS_2_1_DEBUG', `Free play mode: playing ${chordType} chord on ${randomRoot}`);
      
      if (typeof component.playChordByType === 'function') {
        component.playChordByType(chordType, randomRoot);
      }
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
    
    // Store previous chord for avoidance logic
    component.previous2_1ChordType = component.currentChordType;
    component.previous2_1RootNote = component.currentTransposeRootNote;
    
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
    
    // Replay chord after delay - store current chord to ensure consistency
    const chordToReplay = component.currentChordType;
    const rootToReplay = component.currentTransposeRootNote;
    
    setTimeout(() => {
      if (chordToReplay && rootToReplay && typeof component.playChordByType === 'function') {
        debugLog('CHORDS_2_1_DEBUG', `Replaying chord after error: ${chordToReplay} on ${rootToReplay}`);
        component.playChordByType(chordToReplay, rootToReplay);
      }
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
    'dominant7': 'flame',
    'major7': 'feather',
    'sus2': 'acorn',
    'sus4': 'lantern'
  };
  return mapping[chordType] || 'fruit';
}

/**
 * Reset progress to current level for 2_1 activity
 * Resets progress within current difficulty level
 * @param {Object} component - Alpine.js component
 * @activity 2_1_chords_color-matching
 * @used_by reset functionality
 */
export function reset_2_1_Progress(component) {
  // Simple reset - no levels in 2_1
  const chordsProgressData = JSON.parse(localStorage.getItem('lalumo_chords_progress') || '{}');
  chordsProgressData['2_1'] = 0;
  localStorage.setItem('lalumo_chords_progress', JSON.stringify(chordsProgressData));
  
  component.progress['2_1'] = chordsProgressData['2_1'];
  debugLog('CHORDS', `Reset 2_1 progress to ${component.progress['2_1']}`);
}

/* Global exports for console access and direct HTML usage */
window.start2_1ColorMatching = start2_1ColorMatching;
window.start2_1GameMode = start2_1GameMode;
window.checkColorMatch = (selectedElement, component) => {
  if (component) {
    return checkColorMatch(selectedElement, component);
  } else {
    debugLog('CHORDS_2_1_DEBUG', 'No Alpine component provided, cannot check color match');
  }
};
window.playCurrent2_1Chord = playCurrent2_1Chord;
window.generate2_1Chord = generate2_1Chord;
window.reset_2_1_Progress = reset_2_1_Progress;
