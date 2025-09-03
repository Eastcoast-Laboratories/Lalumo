/**
 * 2_6_one_or_many.js - Module for the "One or Many" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// 2_6 One or Many Activity// Global variables
let current2_6Challenge = null;
let previous2_6Challenge = null;
let consecutive2_6TypeCount = 0;
let last2_6Type = null;
let is2_6GameMode = false;
let isFreeModeActive = true;
window.freeModeActive2_6 = isFreeModeActive;
let isInitialized = false;
let freePlay2_6Chords = [];        // Store the pre-generated chords for free play mode

/**
 * Resets the activity to free play mode when entered from navigation
 * Should be called when the activity is entered
 */
export function reset2_6ToFreePlayMode() {
  debugLog(['CHORDS_2_6', 'RESET'], 'Resetting to free play mode');
  
  // Reset to free play mode
  isFreeModeActive = true;
  is2_6GameMode = false;
  window.freeModeActive2_6 = isFreeModeActive;
  
  // Re-initialize free play mode
  initializeFreePlayMode();
  
  debugLog(['CHORDS_2_6', 'RESET'], 'Reset complete, free play mode activated');
}

/**
 * Test function to verify module import and initialize free play mode
 */
export function test2_6ModuleImport() {
  debugLog('CHORDS', '2_6 One or Many module successfully imported');
  
  // Initialize free play mode immediately when the module is imported
  if (!isInitialized) {
    initializeFreePlayMode();
    isInitialized = true;
    debugLog(['CHORDS_2_6', 'INIT'], 'Activity initialized with free play mode ready');
  }
  
  return true;
}

/**
 * Initializes free play mode by setting up UI and state
 */
function initializeFreePlayMode() {
  // Reset to free play mode
  isFreeModeActive = true;
  window.freeModeActive2_6 = isFreeModeActive;
  
  // Show start button, hide replay button
  const startButton = document.getElementById('start-game-2_6');
  const replayButton = document.getElementById('replay-button-2_6');
  
  if (startButton) startButton.style.display = 'block';
  if (replayButton) replayButton.style.display = 'none';
  
  // Generate chords for free play mode - one for each button
  freePlay2_6Chords = [];
  
  // Generate one chord for "one" button and one for "many" button using existing function
  const oneChord = generateSingle2_6Challenge(true, 0); // Level 1 for free play - single note
  const manyChord = generateSingle2_6Challenge(false, 0); // Level 1 for free play - chord
  
  // Add both chords to free play array
  freePlay2_6Chords.push({ type: 'one', chord: oneChord });
  freePlay2_6Chords.push({ type: 'many', chord: manyChord });
  
  debugLog(['CHORDS_2_6', 'FREE_PLAY'], 'Initialized free play mode with chords:', freePlay2_6Chords);
}

/**
 * Start the 2_6 One or Many game mode
 */
function start2_6GameMode() {
  debugLog(['CHORDS_2_6', 'MODE'], 'Starting game mode from free play');
  
  // Exit free play mode
  isFreeModeActive = false;
  is2_6GameMode = true;
  window.freeModeActive2_6 = isFreeModeActive;
  
  // Hide start button, show replay button
  const startButton = document.getElementById('start-game-2_6');
  const replayButton = document.getElementById('replay-button-2_6');
  
  if (startButton) startButton.style.display = 'none';
  if (replayButton) replayButton.style.display = 'block';
  
  // Generate first challenge
  generate2_6Challenge();
}

/**
 * Generate a new 2_6 challenge based on current progress - following 2_2 pattern exactly
 */
function generate2_6Challenge() {
  debugLog('CHORDS_2_6', 'Generating new one or many challenge');
  
  // Get current progress from localStorage like 2_2
  const progressData = localStorage.getItem('lalumo_chords_progress');
  let progress = {};
  if (progressData) {
    try {
      progress = JSON.parse(progressData);
    } catch (error) {
      debugLog(['CHORDS_2_6', 'ERROR'], `Error parsing progress data: ${error.message}`);
    }
  }
  
  const currentProgress = progress['2_6'] || 0;
  
  // Calculate difficulty level (1-4) based on progress like 2_2
  let difficulty = Math.floor(currentProgress / 10) + 1;
  difficulty = Math.min(difficulty, 4); // Cap at level 4
  
  debugLog('CHORDS_2_6', `Progress: ${currentProgress}, Difficulty: ${difficulty}`);
  
  let newChallenge;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    attempts++;
    
    // Determine if this should be a single note or chord
    let isOneNote;
    
    // Prevent more than 3 consecutive of the same type
    if (consecutive2_6TypeCount >= 3) {
      isOneNote = last2_6Type !== 'one';
      debugLog(['CHORDS_2_6', 'BALANCE_DEBUG'], 
        `Forcing ${isOneNote ? 'one' : 'many'} to break streak of ${consecutive2_6TypeCount} ${last2_6Type}`);
    } else {
      // Random choice
      isOneNote = Math.random() < 0.5;
    }
    
    newChallenge = generateSingle2_6Challenge(isOneNote, difficulty);
    
    // Check if it's different from previous challenge
    if (!previous2_6Challenge || !isSameChallenge(newChallenge, previous2_6Challenge)) {
      break; // Found a different challenge
    }
    
    debugLog(['CHORDS_2_6', 'DUPLICATE_DEBUG'], 
      `Attempt ${attempts}: Generated duplicate challenge, trying again...`);
      
  } while (attempts < maxAttempts);
  
  // Update consecutive type tracking
  const currentType = newChallenge.type;
  if (currentType === last2_6Type) {
    consecutive2_6TypeCount++;
  } else {
    consecutive2_6TypeCount = 1;
    last2_6Type = currentType;
  }
  
  // Store previous challenge for next comparison
  previous2_6Challenge = current2_6Challenge ? { ...current2_6Challenge } : null;
  current2_6Challenge = newChallenge;
  
  debugLog(['CHORDS_2_6', 'DUPLICATE_DEBUG'], 
    `Challenge generated after ${attempts} attempts. Type: ${currentType}, Consecutive: ${consecutive2_6TypeCount}, Previous: ${previous2_6Challenge ? JSON.stringify(previous2_6Challenge.notes) : 'none'}, Current: ${JSON.stringify(current2_6Challenge.notes)}`);
  
  console.log('ONE_OR_MANY_2_6: Generated challenge:', current2_6Challenge);
  
  // Auto-play the challenge
  playCurrent2_6Challenge();
}

/**
 * Generate a single challenge of specified type
 */
function generateSingle2_6Challenge(isOneNote, difficulty) {
  
  if (isOneNote) {
    // Single note challenge
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
    const note = notes[Math.floor(Math.random() * notes.length)];
    
    return {
      type: 'one',
      notes: [note],
      correctAnswer: 'one'
    };
  } else {
    // Chord challenge
    let chordNotes;
    
    // All chord types across all difficulties for maximum variety
    const allChords = [
      // Major triads
      ['C4', 'E4', 'G4'], ['D4', 'F#4', 'A4'], ['E4', 'G#4', 'B4'], ['F4', 'A4', 'C5'], 
      ['G4', 'B4', 'D5'], ['A4', 'C#5', 'E5'], ['B4', 'D#5', 'F#5'],
      
      // Minor triads
      ['C4', 'Eb4', 'G4'], ['D4', 'F4', 'A4'], ['E4', 'G4', 'B4'], ['F4', 'Ab4', 'C5'],
      ['G4', 'Bb4', 'D5'], ['A4', 'C5', 'E5'], ['B4', 'D5', 'F#5'],
      
      // Diminished triads
      ['C4', 'Eb4', 'Gb4'], ['D4', 'F4', 'Ab4'], ['E4', 'G4', 'Bb4'], ['F4', 'Ab4', 'B4'],
      ['G4', 'Bb4', 'Db5'], ['A4', 'C5', 'Eb5'], ['B4', 'D5', 'F5'],
      
      // Augmented triads
      ['C4', 'E4', 'G#4'], ['D4', 'F#4', 'A#4'], ['E4', 'G#4', 'C5'], ['F4', 'A4', 'C#5'],
      ['G4', 'B4', 'D#5'], ['A4', 'C#5', 'F5'], ['B4', 'D#5', 'G5'],
      
      // Major 7th chords
      ['C4', 'E4', 'G4', 'B4'], ['D4', 'F#4', 'A4', 'C#5'], ['E4', 'G#4', 'B4', 'D#5'],
      ['F4', 'A4', 'C5', 'E5'], ['G4', 'B4', 'D5', 'F#5'], ['A4', 'C#5', 'E5', 'G#5'],
      
      // Minor 7th chords
      ['C4', 'Eb4', 'G4', 'Bb4'], ['D4', 'F4', 'A4', 'C5'], ['E4', 'G4', 'B4', 'D5'],
      ['F4', 'Ab4', 'C5', 'Eb5'], ['G4', 'Bb4', 'D5', 'F5'], ['A4', 'C5', 'E5', 'G5'],
      
      // Dominant 7th chords
      ['C4', 'E4', 'G4', 'Bb4'], ['D4', 'F#4', 'A4', 'C5'], ['E4', 'G#4', 'B4', 'D5'],
      ['F4', 'A4', 'C5', 'Eb5'], ['G4', 'B4', 'D5', 'F5'], ['A4', 'C#5', 'E5', 'G5'],
      
      // Half-diminished 7th chords
      ['C4', 'Eb4', 'Gb4', 'Bb4'], ['D4', 'F4', 'Ab4', 'C5'], ['E4', 'G4', 'Bb4', 'D5'],
      ['F4', 'Ab4', 'B4', 'Eb5'], ['G4', 'Bb4', 'Db5', 'F5'], ['A4', 'C5', 'Eb5', 'G5'],
      
      // Sus2 chords
      ['C4', 'D4', 'G4'], ['D4', 'E4', 'A4'], ['E4', 'F#4', 'B4'], ['F4', 'G4', 'C5'],
      ['G4', 'A4', 'D5'], ['A4', 'B4', 'E5'], ['B4', 'C#5', 'F#5'],
      
      // Sus4 chords
      ['C4', 'F4', 'G4'], ['D4', 'G4', 'A4'], ['E4', 'A4', 'B4'], ['F4', 'Bb4', 'C5'],
      ['G4', 'C5', 'D5'], ['A4', 'D5', 'E5'], ['B4', 'E5', 'F#5'],
      
      // 6th chords
      ['C4', 'E4', 'G4', 'A4'], ['D4', 'F#4', 'A4', 'B4'], ['E4', 'G#4', 'B4', 'C#5'],
      ['F4', 'A4', 'C5', 'D5'], ['G4', 'B4', 'D5', 'E5'], ['A4', 'C#5', 'E5', 'F#5']
    ];
    
    // Filter chords based on difficulty
    let availableChords;
    if (difficulty === 1) {
      // Basic triads only
      availableChords = allChords.filter(chord => chord.length === 3);
    } else if (difficulty === 2) {
      // Triads and 4-note chords
      availableChords = allChords.filter(chord => chord.length <= 4);
    } else {
      // All chords
      availableChords = allChords;
    }
    
    chordNotes = availableChords[Math.floor(Math.random() * availableChords.length)];
    
    return {
      type: 'many',
      notes: chordNotes,
      correctAnswer: 'many'
    };
  }
}

/**
 * Check if two challenges are the same
 */
function isSameChallenge(challenge1, challenge2) {
  if (!challenge1 || !challenge2) return false;
  if (challenge1.type !== challenge2.type) return false;
  
  // Compare notes arrays
  if (challenge1.notes.length !== challenge2.notes.length) return false;
  
  // Sort both arrays to compare regardless of order
  const notes1 = [...challenge1.notes].sort();
  const notes2 = [...challenge2.notes].sort();
  
  return notes1.every((note, index) => note === notes2[index]);
}

/**
 * Play the current 2_6 challenge
 */
function playCurrent2_6Challenge(component) {
  if (!current2_6Challenge) {
    console.log('ONE_OR_MANY_2_6: No challenge to play');
    return;
  }
  
  console.log('ONE_OR_MANY_2_6: Playing challenge:', current2_6Challenge);
  
  if (current2_6Challenge.type === 'one') {
    // Play single note with same duration as chord (2.5 seconds like 2_2)
    audioEngine.playNote(current2_6Challenge.notes[0], 2.5);
  } else {
    // Play chord (all notes simultaneously) with 2.5 second duration
    audioEngine.playChord(current2_6Challenge.notes, 2.5);
  }
}

/**
 * Handles the user's selection in free play mode
 * @param {string} selectedType - The type selected ('one' or 'many')
 * @param {Object} component - The Alpine component instance
 */
function handleFreePlay2_6Selection(selectedType, component) {
  debugLog(['CHORDS_2_6', 'FREE_PLAY'], 
    `Free play selection: ${selectedType} - generating new random chord`);
  
  // Generate a new random chord each time for the selected type
  const isOneNote = selectedType === 'one';
  const newChord = generateSingle2_6Challenge(isOneNote, 1); // Level 1 for free play
  
  // Set the current challenge to the newly generated chord for playback
  current2_6Challenge = newChord;
  
  // Play the chord
  playCurrent2_6Challenge();
  
  debugLog(['CHORDS_2_6', 'FREE_PLAY'], 
    `Playing new ${selectedType} chord in free play mode: ${JSON.stringify(newChord.notes)}`);
}

/**
 * Check the user's answer for 2_6 activity - following unified pattern like pitches.js
 */
function checkOneOrManyMatch(answer, component) {
  debugLog('CHORDS_2_6', `User selected ${answer}, checking answer`);
  
  // Handle free play mode
  if (isFreeModeActive) {
    debugLog(['CHORDS_2_6', 'FREE_PLAY'], `Button clicked in free play mode: ${answer}`);
    handleFreePlay2_6Selection(answer, component);
    return true; // In free play mode, any selection is "correct"
  }
  
  if (!current2_6Challenge) {
    debugLog('CHORDS_2_6', 'No challenge active');
    return;
  }
  
  const isCorrect = answer === current2_6Challenge.correctAnswer;
  
  try {
    // Update progress and get feedback message - following unified pattern like pitches.js
    const feedback = update2_6Progress(isCorrect, component);
    
    if (isCorrect) {
      debugLog(['CHORDS_2_6', 'FEEDBACK'], 'Correct answer! Showing success feedback');
      
      // Show complete success feedback like 2_2 (visual + audio)
      showCompleteSuccess();
      
      // Highlight correct button like 2_2
      const correctButtonId = answer === 'one' ? '#button_2_6_one' : '#button_2_6_many';
      highlightCorrectButton(correctButtonId);
      
      // Component progress is already updated by update2_6Progress function
      debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], 
        `Progress already updated in component: ${component.progress['2_6']}`);
      
      // Trigger Alpine.js update
      if (component.$nextTick) {
        component.$nextTick();
      }
      
      // Show feedback using global system like 2_2
      if (window.showFeedbackMessage) {
        const store = window.Alpine?.store;
        if (store && store.feedback) {
          store.feedback.isCorrect = true;
        }
        window.showFeedbackMessage(feedback, {
          activityId: '2_6_chords_one_or_many',
          isIntroMessage: false,
          delaySeconds: 3,
          component: component
        });
      }
      
      // Generate next challenge after delay
      setTimeout(() => {
        generate2_6Challenge();
      }, 2000);
      
    } else {
      debugLog('CHORDS_2_6', 'Incorrect answer! Showing error feedback');
      
      // Show complete error feedback like 2_2 (visual + audio)
      const incorrectButtonId = answer === 'one' ? '#button_2_6_one' : '#button_2_6_many';
      const incorrectButton = document.querySelector(incorrectButtonId);
      if (incorrectButton) {
        showCompleteError(incorrectButton);
      }
      
      // Highlight correct button after delay like 2_2
      const correctButtonId = current2_6Challenge.correctAnswer === 'one' ? '#button_2_6_one' : '#button_2_6_many';
      setTimeout(() => {
        highlightCorrectButton(correctButtonId);
      }, 800);
      
      // Component progress is already updated by update2_6Progress function
      debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], 
        `Progress already updated in component: ${component.progress['2_6']}`);
      
      // Trigger Alpine.js update
      if (component.$nextTick) {
        component.$nextTick();
      }
      
      // Show feedback using global system like 2_2
      if (window.showFeedbackMessage) {
        const store = window.Alpine?.store;
        if (store && store.feedback) {
          store.feedback.isCorrect = false;
        }
        window.showFeedbackMessage(feedback, {
          activityId: '2_6_chords_one_or_many',
          isIntroMessage: false,
          delaySeconds: 3,
          component: this
        });
      }
      
      // Replay the challenge after delay like 2_2
      setTimeout(() => {
        playCurrent2_6Challenge();
      }, 1500);
    }
    
  } catch (error) {
    debugLog(['CHORDS', 'ERROR'], `Error checking one or many answer: ${error.message || error}`);
  }
}

/**
 * Update progress for 2_6 activity - following 2_2 pattern exactly
 */
function update2_6Progress(isCorrect, component) {
  debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], `Updating progress: isCorrect=${isCorrect}`);
  
  // Get current progress from localStorage like 2_2
  const progressData = localStorage.getItem('lalumo_chords_progress');
  const progress = progressData ? JSON.parse(progressData) : {};
  
  // Initialize progress if not exists
  if (!progress['2_6']) {
    progress['2_6'] = 0;
  }
  
  debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], 
    `Current progress before check: ${progress['2_6']}`);
  
  if (isCorrect) {
    // Increment progress
    progress['2_6'] += 1;
    
    // Save updated progress
    localStorage.setItem('lalumo_chords_progress', JSON.stringify(progress));
    
    // Update component's progress state like 2_2
    if (component && component.progress) {
      component.progress['2_6'] = progress['2_6'];
      debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], 
        `Progress updated after correct answer: ${progress['2_6']}`);
    } else {
      debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG', 'ERROR'], 
        `Component debug: component=${!!component}, component.progress=${!!component?.progress}, typeof component=${typeof component}, component keys=${component ? Object.keys(component).join(',') : 'null'}`);
      
      // Initialize component.progress if missing like 2_2
      if (component && !component.progress) {
        component.progress = {};
        component.progress['2_6'] = progress['2_6'];
        debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], 'Initialized component.progress and updated 2_6 progress');
        
        // Trigger Alpine.js update after initialization
        if (component.$nextTick) {
          component.$nextTick();
        }
      }
    }
    
    debugLog(['CHORDS_2_6', 'MATCH'], `Correct! Progress: ${progress['2_6']}`);
    
    // Return success feedback like 2_2
    const feedbackMessages = {
      'one': window.Alpine?.store('strings')?.correct_one_note || 'Correct! It was one note!',
      'many': window.Alpine?.store('strings')?.correct_many_notes || 'Correct! It were many notes!'
    };
    
    const correctAnswer = current2_6Challenge?.correctAnswer || 'one';
    return feedbackMessages[correctAnswer] || 'Correct!';
  } else {
    // Reset progress to the beginning of the current level like 2_2
    const currentLevel = Math.floor(progress['2_6'] / 10);
    const newProgress = currentLevel * 10;
    
    // Only reset if we're past the start of a level
    if (progress['2_6'] > newProgress) {
      progress['2_6'] = newProgress;
      
      // Save updated progress to localStorage like 2_2
      localStorage.setItem('lalumo_chords_progress', JSON.stringify(progress));
      
      // Update component's progress state like 2_2
      if (component && component.progress) {
        component.progress['2_6'] = progress['2_6'];
        // Trigger Alpine.js update
        component.$nextTick();
        debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], 
          `Progress updated after incorrect answer: ${progress['2_6']}`);
      } else {
        debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG', 'ERROR'], 
          `Component debug: component=${!!component}, component.progress=${!!component?.progress}, typeof component=${typeof component}, component keys=${component ? Object.keys(component).join(',') : 'null'}`);
        
        // Initialize component.progress if missing like 2_2
        if (component && !component.progress) {
          component.progress = {};
          component.progress['2_6'] = progress['2_6'];
          debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], 'Initialized component.progress and updated 2_6 progress');
          
          // Trigger Alpine.js update after initialization
          if (component.$nextTick) {
            component.$nextTick();
          }
        }
      }
      
      debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], `Progress reset from ${progress['2_6'] + (progress['2_6'] - newProgress)} to ${newProgress} (level ${currentLevel})`);
    } else {
      debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], `Progress remains at ${progress['2_6']} (already at level start)`);
    }
    
    // Return error feedback like 2_2
    const feedbackMessages = {
      'one': window.Alpine?.store('strings')?.incorrect_was_one || 'No, it was one note!',
      'many': window.Alpine?.store('strings')?.incorrect_was_many || 'No, it were many notes!'
    };
    
    // Handle case when no challenge is active (for testing)
    const correctAnswer = current2_6Challenge?.correctAnswer || 'one';
    debugLog(['CHORDS_2_6', 'PROGRESS_DEBUG'], `Returning error feedback for answer: ${correctAnswer}`);
    return feedbackMessages[correctAnswer] || 'Try again!';
  }
}

/**
 * Show activity intro message for 2_6 - following 2_2 pattern exactly
 */
function show2_6ActivityIntroMessage(component) {
  debugLog('CHORDS', 'LOG_CONTEXT_MESSAGE: Showing intro message for activity: 2_6_chords_one_or_many');
  
  if (window.showFeedbackMessage) {
    window.showFeedbackMessage(
      window.Alpine?.store('strings')?.intro_2_6_one_or_many || 'Can you hear if it is one note or many notes?',
      {
        activityId: '2_6_chords_one_or_many',
        isIntroMessage: true,
        delaySeconds: 10
      }
    );
  }
}

/**
 * Reset progress for One or Many activity (2_6)
 * Used by the resetCurrentActivity function - following 2_2 pattern exactly
 */
export function reset_2_6_Progress(component) {
  debugLog(['CHORDS_2_6', 'RESET'], 'Resetting 2_6 progress...', {
    currentProgress: component.progress['2_6'] || 0
  });
  
  // Reset progress to 0 (level will be calculated automatically)
  if (!component.progress) component.progress = {};
  component.progress['2_6'] = 0;
  
  // Also reset in localStorage to persist the reset like 2_2
  const progressData = localStorage.getItem('lalumo_chords_progress');
  let progress = {};
  if (progressData) {
    try {
      progress = JSON.parse(progressData);
    } catch (error) {
      debugLog(['CHORDS_2_6', 'ERROR'], `Error parsing progress data: ${error.message}`);
    }
  }
  progress['2_6'] = 0;
  localStorage.setItem('lalumo_chords_progress', JSON.stringify(progress));
  
  // Reset activity state
  current2_6Challenge = null;
  previous2_6Challenge = null;
  consecutive2_6TypeCount = 0;
  last2_6Type = null;
  
  // Reset game mode
  is2_6GameMode = false;
  
  debugLog(['CHORDS_2_6', 'RESET'], '2_6 progress reset complete and persisted');
}

// Export functions for use in other modules
export {
  start2_6GameMode,
  generate2_6Challenge,
  playCurrent2_6Challenge,
  checkOneOrManyMatch,
  update2_6Progress,
  show2_6ActivityIntroMessage
};
