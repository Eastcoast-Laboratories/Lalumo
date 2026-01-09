/**
 * Shared Visual & Audio Feedback Utilities
 * 
 * Centralized feedback functions used across all chapters
 * Ensures consistent user experience and reduces code duplication
 */

import { debugLog } from "../../utils/debug";

// Audio announcement system state
let currentActivityMode = null;
let shortcutScreenClosed = false;
let lastIntroMessage = null;
let userHasInteracted = false;
let pendingAudioMessage = null;

/**
 * Get the current activity mode from the URL hash
 * @returns {string|null} The activity mode string or null if no valid hash
 */
export function getActivityModeFromHash() {
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) {
    return null;
  }
  
  const activityId = hash.substring(1);
  const activityPattern = /^(\d+_\d+)$/;
  const match = activityId.match(activityPattern);
  
  if (!match) {
    return null;
  }
  
  // Map activity ID to full activity mode string
  const activityModeMap = {
    '1_1': '1_1_pitches_high_or_low',
    '1_2': '1_2_pitches_match-sounds',
    '1_3': '1_3_pitches_draw-melody',
    '1_4': '1_4_pitches_does-it-sound-right',
    '1_5': '1_5_pitches_memory-game',
    '2_1': '2_1_chords_color-matching',
    '2_2': '2_2_chords_stable_unstable',
    '2_3': '2_3_chords_chord-building',
    '2_4': '2_4_chords_missing-note',
    '2_5': '2_5_chords_characters',
    '2_6': '2_6_chords_one_or_many'
  };
  
  return activityModeMap[activityId] || null;
}

/**
 * Unified feedback message system for both help messages and game feedback
 * @param {string} message - The message to display
 * @param {Object} options - Options for controlling feedback behavior
 * @param {string} options.activityId - Activity identifier for logging
 * @param {boolean} options.isIntroMessage - Whether this is an intro/help message (respects settings) or game feedback (always shown)
 * @param {boolean} options.isCorrect - For game feedback: correct (true), incorrect (false), or neutral (null)
 * @param {number} options.delaySeconds - Delay in seconds before hiding the message
 * @param {Object} options.component - The Alpine.js component instance
 * @activity common
 * @used_by 2_1_chords_color-matching, 2_5_chords_characters, 2_2_chords_stable_unstable, all_pitch_activities
 */
export function showFeedbackMessage(message, options = {}) {
  // Default options
  const {
    activityId = '', 
    isIntroMessage = false,
    isCorrect = null, 
    delaySeconds = isIntroMessage ? 10 : 3,
    component = null
  } = options;
  debugLog('showFeedbackMessage', 'isIntroMessage: ' + isIntroMessage + ', activityId: ' + activityId + ', isCorrect: ' + isCorrect + ', delaySeconds: ' + delaySeconds);
  
  // Check for empty message
  if (!message || message.trim() === '' || message === 'undefined' || message === 'null') {
    debugLog('ERROR', 'showFeedbackMessage called with empty message' + new Error().stack);
    return;
  }
  
  // Get the Alpine stores - correct usage is window.Alpine.store('storeName')
  // store() is a function, not a property
  const feedbackStore = window.Alpine?.store ? window.Alpine.store('feedback') : null;
  const helpSettingsStore = window.Alpine?.store ? window.Alpine.store('helpSettings') : null;
  
  // Debug: Check if stores are available
  if (!window.Alpine?.store) {
    debugLog('FEEDBACK_MESSAGE', 'Alpine store function is not available');
  } else if (!feedbackStore) {
    debugLog('FEEDBACK_MESSAGE', 'Feedback store is not available');
  } else {
    debugLog('FEEDBACK_MESSAGE', 'Feedback store available:' + feedbackStore);
  }
  
  // For intro messages, check if help messages are enabled in user settings
  if (isIntroMessage && helpSettingsStore?.showHelpMessages === false) {
    debugLog('HELP_MESSAGE', 'Skipping help message - user has disabled help messages');
    return;
  }
  
  // Show the message using the global feedback store
  if (feedbackStore) {
    debugLog('FEEDBACK_MESSAGE', 'Before update, feedbackStore state:' + 
      JSON.stringify({
        showFeedback: feedbackStore.showFeedback,
        feedbackMessage: feedbackStore.feedbackMessage,
        isCorrect: feedbackStore.isCorrect
      }));
      
    feedbackStore.feedbackMessage = message;
    feedbackStore.showFeedback = true;
    
    // Set correctness indicator for game feedback (affects CSS styling)
    if (!isIntroMessage) {
      feedbackStore.isCorrect = isCorrect;
    } else {
      // Help/intro messages are neutral by default
      feedbackStore.isCorrect = null;
    }
    
    debugLog('FEEDBACK_MESSAGE', 'After update, feedbackStore state:' + 
      JSON.stringify({
        showFeedback: feedbackStore.showFeedback,
        feedbackMessage: feedbackStore.feedbackMessage,
        isCorrect: feedbackStore.isCorrect
      }));
      
    // Auto-hide after delay if specified
    if (delaySeconds > 0) {
      let delay = delaySeconds;
      // Only enforce 10-second minimum for intro/help messages
      if (isIntroMessage === true && delaySeconds < 10) {
        debugLog('showFeedbackMessage', 'Enforcing 10s minimum for intro message, original: ' + delaySeconds + 's, message: ' + message);
        delay = 10;
      }
      
      // Clear any existing timer before setting a new one
      clearFeedbackTimer();
      
      // Set new timer and store the reference
      currentFeedbackTimer = setTimeout(() => {
        const currentFeedbackStore = window.Alpine?.store ? window.Alpine.store('feedback') : null;
        if (currentFeedbackStore) {
          currentFeedbackStore.showFeedback = false;
          debugLog('showFeedbackMessage', 'Auto-hiding feedback message after ' + delay + ' seconds');
        }
        // Clear the reference once the timer completes
        currentFeedbackTimer = null;
      }, delay * 1000);
    }
  }
  
  // Log the message with appropriate tag
  const logPrefix = isIntroMessage ? 'HELP_MESSAGE' : 'GAME_FEEDBACK_MESSAGE';
  if (isIntroMessage) {
    debugLog(logPrefix, `${message}`);
  } else {
    debugLog(logPrefix, `[${activityId}] ${message} (isCorrect: ${isCorrect})`);
  }
  
}

// Track which intro messages have been shown in this session
const shownIntroMessages = new Set();

// Track the current feedback auto-hide timer
let currentFeedbackTimer = null;

/**
 * Clear any pending feedback timer
 * Called when switching activities or showing a new message
 */
export function clearFeedbackTimer() {
  if (currentFeedbackTimer) {
    debugLog('FEEDBACK_TIMER', 'Clearing previous feedback timer');
    clearTimeout(currentFeedbackTimer);
    currentFeedbackTimer = null;
  }
}

/**
 * Show activity-specific introduction message
 * Centralized function to handle all intro messages across activities
 * Only shows each intro message once per session unless forced
 * @param {string} activityMode - The activity mode identifier (e.g., '1_1_pitches_high_or_low')
 * @param {Object} component - The Alpine.js component instance (optional)
 * @param {number} delaySeconds - Delay before hiding message (default: 10)
 * @param {boolean} force - Force showing message even if already shown (default: false)
 * @activity common
 * @used_by 2_1_chords_color-matching, 2_5_chords_characters, 2_2_chords_stable_unstable, 1_1_pitches_high_or_low, 1_2_pitches_match-sounds, 1_3_pitches_draw, 1_4_pitches_does-it-sound-right, 1_5_pitches_memory
 */
export function showActivityIntroMessage(activityMode, component = null, delaySeconds = 10, force = true /* TODO: should be false before release */) {
  // TODO: in 1_1 wird stattdessen noch showContextMessage aufgerufen
  debugLog('AUDIO_SYSTEM', 'showActivityIntroMessage called:', { activityMode, delaySeconds, force, shortcutScreenClosed });
  
  // CRITICAL: Re-verify activity from hash before playing intro message
  // This prevents playing wrong intro messages when hash changes during initialization
  const correctActivityMode = getActivityModeFromHash();
  if (correctActivityMode && correctActivityMode !== activityMode) {
    debugLog('AUDIO_SYSTEM', 'HASH_MISMATCH: Requested intro for', activityMode, 'but hash shows', correctActivityMode, '-> correcting');
    activityMode = correctActivityMode;
  }
  
  // Store current activity mode and intro message details
  currentActivityMode = activityMode;
  lastIntroMessage = { activityMode, component, delaySeconds };
  
  // Don't play if shortcut screen is still open (unless forced)
  if (!shortcutScreenClosed && !force) {
    debugLog('AUDIO_SYSTEM', 'Delaying intro message until shortcut screen is closed');
    return;
  }
  
  // Check if this intro message has already been shown in this session
  if (!force && shownIntroMessages.has(activityMode)) {
    debugLog('LOG_INTRO_MESSAGE', 'Skipping - already shown in this session: ' + activityMode);
    return;
  }
  
  // Get the current language
  const language = localStorage.getItem('lalumo_language') === 'german' ? 'de' : 'en';
  let message = '';
  
  // Try to get message from Alpine store first
  const store = window.Alpine?.store;
  if (store && store.strings) {
    // Special handling for 1_1: use stage-specific intro messages
    if (activityMode === '1_1_pitches_high_or_low') {
      // Get progress from localStorage to determine current stage
      let progress = 0;
      try {
        const progressData = localStorage.getItem('lalumo_progress');
        if (progressData) {
          const parsed = JSON.parse(progressData);
          progress = parsed['1_1'] || 0;
        }
      } catch (e) {
        debugLog(['LOG_INTRO_MESSAGE', 'ERROR'], 'Error reading progress for 1_1:', e);
      }
      
      // Determine stage based on progress (same logic as get_1_1_level)
      let stage = 1;
      if (progress >= 40) stage = 5;
      else if (progress >= 30) stage = 4;
      else if (progress >= 20) stage = 3;
      else if (progress >= 10) stage = 2;
      
      const stageStringKey = `high_or_low_intro_stage${stage}`;
      if (store.strings[stageStringKey]) {
        message = store.strings[stageStringKey];
        debugLog('LOG_INTRO_MESSAGE', `Loaded stage-specific intro for 1_1 (stage ${stage}, progress ${progress}):`, message);
      }
    }
    
    // Standard string key mapping for other activities
    if (!message) {
      const stringKeyMap = {
        '1_1_pitches_high_or_low': 'intro_1_1_pitches_high_or_low',
        '1_2_pitches_match-sounds': 'intro_1_2_pitches_match_sounds',
        '1_3_pitches_draw': 'intro_1_3_pitches_draw',
        '1_3_pitches_draw-melody': 'intro_1_3_pitches_draw',
        '1_4_pitches_does-it-sound-right': 'intro_1_4_pitches_does_it_sound_right',
        '1_5_pitches_memory': 'intro_1_5_pitches_memory',
        '2_1_chords_color-matching': 'intro_2_1_chords_color_matching',
        '2_2_chords_stable_unstable': 'intro_2_2_chords_stable_unstable',
        '2_4_chords_missing-note': 'intro_2_4_missing_note',
        '2_5_chords_characters': 'intro_2_5_chords_characters'
      };
      
      const stringKey = stringKeyMap[activityMode];
      if (stringKey && store.strings[stringKey]) {
        message = store.strings[stringKey];
        debugLog('LOG_INTRO_MESSAGE', 'Loaded from Alpine store:' + stringKey + '=', message);
      }
    }
  }else{
    debugLog(['LOG_INTRO_MESSAGE', 'ERROR'], 'No Alpine store available');
  }

  // Try to load from global strings object if Alpine store not available
  if (!message && window.strings) {
    // Special handling for 1_1: use stage-specific intro messages
    if (activityMode === '1_1_pitches_high_or_low') {
      let progress = 0;
      try {
        const progressData = localStorage.getItem('lalumo_progress');
        if (progressData) {
          const parsed = JSON.parse(progressData);
          progress = parsed['1_1'] || 0;
        }
      } catch (e) {
        debugLog(['LOG_INTRO_MESSAGE', 'ERROR'], 'Error reading progress for 1_1:', e);
      }
      
      let stage = 1;
      if (progress >= 40) stage = 5;
      else if (progress >= 30) stage = 4;
      else if (progress >= 20) stage = 3;
      else if (progress >= 10) stage = 2;
      
      const stageStringKey = `high_or_low_intro_stage${stage}`;
      if (window.strings[stageStringKey]) {
        message = window.strings[stageStringKey];
        debugLog('LOG_INTRO_MESSAGE', `Loaded stage-specific intro from global strings for 1_1 (stage ${stage}):`, message);
      }
    }
    
    if (!message) {
      const stringKeyMap = {
        '1_1_pitches_high_or_low': 'intro_1_1_pitches_high_or_low',
        '1_2_pitches_match-sounds': 'intro_1_2_pitches_match_sounds',
        '1_3_pitches_draw': 'intro_1_3_pitches_draw',
        '1_3_pitches_draw-melody': 'intro_1_3_pitches_draw',
        '1_4_pitches_does-it-sound-right': 'intro_1_4_pitches_does_it_sound_right',
        '1_5_pitches_memory': 'intro_1_5_pitches_memory',
        '2_1_chords_color-matching': 'intro_2_1_chords_color_matching',
        '2_2_chords_stable_unstable': 'intro_2_2_chords_stable_unstable',
        '2_4_chords_missing-note': 'intro_2_4_missing_note',
        '2_5_chords_characters': 'intro_2_5_chords_characters'
      };
      
      const stringKey = stringKeyMap[activityMode];
      if (stringKey && window.strings[stringKey]) {
        message = window.strings[stringKey];
        debugLog('LOG_INTRO_MESSAGE', 'Loaded from global strings:' + stringKey + '=', message);
      }
    }
  }
  
  if (!message) {
    debugLog('LOG_INTRO_MESSAGE', 'Using direct strings.xml messages for:', activityMode);
    
    // Special handling for 1_1: use stage-specific fallback messages
    if (activityMode === '1_1_pitches_high_or_low') {
      let progress = 0;
      try {
        const progressData = localStorage.getItem('lalumo_progress');
        if (progressData) {
          const parsed = JSON.parse(progressData);
          progress = parsed['1_1'] || 0;
        }
      } catch (e) { /* ignore */ }
      
      let stage = 1;
      if (progress >= 40) stage = 5;
      else if (progress >= 30) stage = 4;
      else if (progress >= 20) stage = 3;
      else if (progress >= 10) stage = 2;
      
      // Stage 1-2: single tone, Stage 3-5: two tones
      if (stage >= 3) {
        message = language === 'de' 
          ? 'Höre beide Töne! Ist der zweite höher oder tiefer?'
          : 'Listen to both tones! Is the second one higher or lower?';
      } else {
        message = language === 'de'
          ? 'Höre den Ton! Ist er hoch oder tief?'
          : 'Listen to the tone! Is it high or low?';
      }
      debugLog('LOG_INTRO_MESSAGE', `Using fallback stage-specific message for 1_1 (stage ${stage}):`, message);
    }
    
    if (!message) {
      const messages = {
        '1_1_pitches_high_or_low': {
          'de': 'Höre den Ton! Ist er hoch oder tief?',
          'en': 'Listen to the tone! Is it high or low?'
        },
        // 1_2, 1_5: call playIntroAudio(message) directly
        '1_3_pitches_draw-melody': {
          'de': 'Male und höre zu! Deine Linie wird zur Musik!',
          'en': 'Draw and listen! Your line becomes music!'
        },
        '1_4_pitches_does-it-sound-right': {
          'de': 'Hoer dir die Melodie an! Klingt sie richtig, oder ist da ein falscher Ton?',
          'en': 'Listen to the melody! Does it sound right? Or is there a wrong note?'
        }
      };
      
      const activityMessages = messages[activityMode] || 'no such mode ' + activityMode;
      message = activityMessages[language] || activityMessages['en'];
    }
  }
  
  // Show the message using the existing showFeedbackMessage function
  // This automatically respects the $store.helpSettings.showHelpMessages setting
  if (message) {
    // Mark this intro message as shown
    shownIntroMessages.add(activityMode);
    debugLog('LOG_INTRO_MESSAGE', 'Marked as shown:' + activityMode);
    
    // Play audio if enabled and available for this activity
    const helpSettingsStore = window.Alpine?.store ? window.Alpine.store('helpSettings') : null;
    if (helpSettingsStore?.playHelpAudio) {
      debugLog('INTRO_AUDIO_CALL', 'showActivityIntroMessage calling playIntroAudio for:', activityMode);
      playIntroAudio(message);
    }
    
    showFeedbackMessage(message, {
      activityId: activityMode,
      isIntroMessage: true,  // This is an intro message
      delaySeconds,
      component
    });
  } else {
    debugLog(['FEEDBACK', 'LOG_INTRO_MESSAGE', 'ERROR'], 'LOG_INTRO_MESSAGE: No intro message found for activity:', activityMode);
  }
}

// Debouncing mechanism to prevent duplicate audio playback
let lastAudioMessage = null;
let lastAudioTime = 0;
const AUDIO_DEBOUNCE_MS = 2000;

// Track current playing intro audio
let currentIntroAudio = null;

/**
 * Play intro audio for specific activities
 * @param {string} activityMode - The activity mode identifier
 */
export function playIntroAudio(message) {  
  const now = Date.now();
  debugLog(['INTRO_AUDIO', 'FUNCTION_CALL'], 'playIntroAudio() called with message ' + message);
  
  // CRITICAL: Re-verify activity from hash before playing audio
  // This prevents playing wrong audio when hash changes during initialization
  const correctActivityMode = getActivityModeFromHash();
  if (correctActivityMode && currentActivityMode && correctActivityMode !== currentActivityMode) {
    debugLog('INTRO_AUDIO', 'HASH_MISMATCH: Skipping audio - currentActivityMode is', currentActivityMode, 'but hash shows', correctActivityMode);
    return; // Don't play audio if activity has changed
  }
  
  // Check if user has interacted with the page (required for autoplay policy)
  if (!userHasInteracted) {
    debugLog('INTRO_AUDIO', 'Skipping audio - no user interaction yet (autoplay policy), storing for later');
    pendingAudioMessage = message;
    return;
  }
  
  // Store reference to previous audio to stop it later
  const previousAudio = currentIntroAudio;
  
  // Check if this is a duplicate call within the debounce window
  if (lastAudioMessage === message && (now - lastAudioTime) < AUDIO_DEBOUNCE_MS) {
    debugLog('INTRO_AUDIO', 'Skipping duplicate audio call for:', message, 'within', AUDIO_DEBOUNCE_MS, 'ms');
    return;
  }
  
  // Immediately set debounce to prevent rapid duplicate calls
  lastAudioMessage = message;
  lastAudioTime = now;
  
  let filename = message.replace(/ö/g, 'oe')         // Replace ö,ä,ü with ae, ue, ...
  .replace(/ä/g, 'ae')         // Replace ö,ä,ü with ae, ue, ...
  .replace(/ü/g, 'ue')         // Replace ö,ä,ü with ae, ue, ...
  .replace(/ß/g, 'ss')         // Replace ö,ä,ü with ae, ue, ...
  .replace(/Ä/g, 'Ae')         // Replace ÄÖÜ
  .replace(/Ö/g, 'Oe')         // Replace ÄÖÜ
  .replace(/Ü/g, 'Ue')         // Replace ÄÖÜ
  .replace(/\b\w/g, c => c.toUpperCase()) // Make first letter of each word uppercase
  .replace(/[^a-zA-Z0-9]/g, '')         // Remove all other characters

  const audioFile = filename + '.mp3';
  if (!audioFile) {
    debugLog('INTRO_AUDIO', 'No audio file for message:', message);
    return;
  }
  
  const audioPath = `/sounds/info-messages/${audioFile}`;
  debugLog('INTRO_AUDIO', 'Attempting to play audio via Tone.js:', message, 'file:', audioPath);
  
  // USE TONE.JS INSTEAD OF HTML5 AUDIO!
  // This allows audioEngine.stopAll() to stop intro messages too
  if (window.audioEngine && typeof window.audioEngine.playIntroMessage === 'function') {
    window.audioEngine.playIntroMessage(audioPath, 0.9);
  } else {
    debugLog(['INTRO_AUDIO', 'ERROR'], 'audioEngine not available yet - will retry on next call');
    // DON'T set debounce if audioEngine not ready - allow retry!
    lastAudioMessage = null;
    lastAudioTime = 0;
  }
}

/**
 * Replay the last intro audio message
 */
export function replayCurrentIntroAudio() {
  if (lastAudioMessage) {
    debugLog('INTRO_AUDIO_REPLAY', 'Replaying last intro message:', lastAudioMessage);
    playIntroAudio(lastAudioMessage);
  } else {
    debugLog('INTRO_AUDIO_REPLAY', 'No previous intro message to replay');
  }
}

// Initialize the feedback functionality when Alpine is ready
document.addEventListener('alpine:init', () => {
  // Initialize the feedback store if it doesn't exist
  if (!window.Alpine.store('feedback')) {
    window.Alpine.store('feedback', {
      showFeedback: false,
      feedbackMessage: '',
      isCorrect: null
    });
  }
  
  // Make feedback functions available globally
  window.showFeedbackMessage = showFeedbackMessage;
  window.showActivityIntroMessage = showActivityIntroMessage;
  window.playIntroAudio = playIntroAudio;
});

/**
 * Reset the tracking of shown intro messages
 * Useful for testing or when user wants to see intro messages again
 */
export function resetShownIntroMessages() {
  shownIntroMessages.clear();
  debugLog('FEEDBACK', 'LOG_INTRO_MESSAGE: Reset all shown intro messages');
}

// Make functions globally available
if (typeof window !== 'undefined') {
  window.showFeedbackMessage = showFeedbackMessage;
  window.showActivityIntroMessage = showActivityIntroMessage;
  window.getActivityModeFromHash = getActivityModeFromHash;
  window.resetShownIntroMessages = resetShownIntroMessages;
  window.clearFeedbackTimer = clearFeedbackTimer;
  window.highlightCorrectButton = highlightCorrectButton;
  window.showErrorWithCorrectHint = showErrorWithCorrectHint;
  window.replayCurrentIntroAudio = replayCurrentIntroAudio;
}

/**
 * Show rainbow success animation
 * Creates a full-screen rainbow arc animation for successful completion
 */
export function showRainbowSuccess() {
  // Create and show rainbow success animation
  const rainbow = document.createElement('div');
  rainbow.className = 'rainbow-success';
  document.body.appendChild(rainbow);

  // Remove rainbow element after animation completes (3 seconds)
  setTimeout(() => {
    if (rainbow && rainbow.parentNode) {
      rainbow.parentNode.removeChild(rainbow);
    }
  }, 3000);
}

/**
 * Show big rainbow success animation for major achievements
 * Enhanced version for level completions and major milestones
 */
export function showBigRainbowSuccess() {
  const bigRainbow = document.createElement('div');
  bigRainbow.className = 'rainbow-success';
  bigRainbow.style.transform = 'scale(1.5)';
  bigRainbow.style.zIndex = '10000';
  document.body.appendChild(bigRainbow);

  // Remove big rainbow element after animation completes
  setTimeout(() => {
    if (bigRainbow && bigRainbow.parentNode) {
      bigRainbow.parentNode.removeChild(bigRainbow);
    }
  }, 3500);
}

/**
 * Show shake error animation on specific element
 * @param {HTMLElement} element - The element to shake
 */
export function showShakeError(element) {
  if (!element) return;
  
  element.classList.add('shake-error');
  
  // Remove shake class after animation completes (0.5 seconds)
  setTimeout(() => {
    element.classList.remove('shake-error');
  }, 500);
}

/**
 * Play success sound (ascending arpeggio)
 * Frequencies: C4, E4, G4, C5
 */
export function playSuccessSound() {
  debugLog(['FEEDBACK', 'SOUND'], 'FEEDBACK_UTILITIES: Attempting to play success sound');
  // Use the global app instance to play the sound
  if (window.app && typeof window.app.playSuccessSound === 'function') {
    debugLog(['FEEDBACK', 'SOUND'], 'FEEDBACK_UTILITIES: Using window.app.playSuccessSound');
    window.app.playSuccessSound();
  } else {
    debugLog(['FEEDBACK', 'WARNING'], 'FEEDBACK_UTILITIES: App instance not available for success sound');
    // Fallback to direct audio engine if available
    if (window.audioEngine && typeof window.audioEngine.playNote === 'function') {
      debugLog(['FEEDBACK', 'SOUND'], 'FEEDBACK_UTILITIES: Using fallback audioEngine for success sound');
      window.audioEngine.playNote('success', 1, undefined, 0.4);
    }else{
      debugLog(['FEEDBACK', 'ERROR'], 'FEEDBACK_UTILITIES: AudioEngine not available for success sound');
    }
  }
}

/**
 * Play error sound (descending minor third)
 * Frequencies: E4, C4
 */
export function playErrorSound() {
  debugLog(['FEEDBACK', 'SOUND'], 'FEEDBACK_UTILITIES: Attempting to play error sound');
  // Use the global app instance to play the sound
  if (window.app && typeof window.app.playErrorSound === 'function') {
    debugLog(['FEEDBACK', 'SOUND'], 'FEEDBACK_UTILITIES: Using window.app.playErrorSound');
    window.app.playErrorSound();
  } else {
    debugLog(['FEEDBACK', 'WARNING'], 'FEEDBACK_UTILITIES: App instance not available for error sound');
    // Fallback to direct audio engine if available
    if (window.audioEngine && typeof window.audioEngine.playNote === 'function') {
      debugLog(['FEEDBACK', 'SOUND'], 'FEEDBACK_UTILITIES: Using fallback audioEngine for error sound');
      window.audioEngine.playNote('try_again', 1, undefined, 0.4);
    }else{
      debugLog(['FEEDBACK', 'ERROR'], 'FEEDBACK_UTILITIES: AudioEngine not available for error sound');
    }
  }
}

/**
 * Complete success feedback (visual + audio)
 * Combines rainbow animation and success sound
 */
export function showCompleteSuccess() {
  showRainbowSuccess();
  playSuccessSound();
}

/**
 * Complete big success feedback for major achievements
 * Combines big rainbow animation and success sound
 */
export function showCompleteBigSuccess() {
  showBigRainbowSuccess();
  playSuccessSound();
}

/**
 * Complete error feedback (visual + audio)
 * Combines shake animation and error sound
 * @param {HTMLElement} element - The element to shake
 */
export function showCompleteError(element) {
  showShakeError(element);
  playErrorSound();
}

/**
 * Utility function to get the last pressed element for error feedback
 * Searches for elements with common interaction classes
 * @returns {HTMLElement|null} The last interacted element or null
 */
export function getLastInteractedElement() {
  // Look for recently pressed/clicked elements with common classes
  const commonSelectors = [
    '.key.pressed',
    '.note-button.active', 
    '.sound-option.selected',
    '.choice-button.clicked'
  ];
  
  for (const selector of commonSelectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  
  return null;
}

/**
 * Highlight the correct button/element with a brief visual effect (green border)
 * @param {HTMLElement|string} correctElement - The correct element to highlight, or CSS selector
 * @param {Object} options - Configuration options
 * @param {number} [options.duration=1000] - Duration of highlight effect in milliseconds
 * @param {string} [options.highlightClass='correct-button-highlight'] - CSS class for highlighting
 */
export function highlightCorrectButton(correctElement, options = {}) {
  const {
      delay = 0,
      duration = 1000,
      highlightClass = 'correct-button-highlight',
    } = options;
  
  // Get the element (either passed directly or by selector)
  let element = correctElement;
  if (typeof correctElement === 'string') {
    element = document.querySelector(correctElement);
  }
  
  if (!element) {
    debugLog(['FEEDBACK', 'WARN'], 'CORRECT_HIGHLIGHT: Element not found for highlighting');
    return;
  }
  
  const executeHighlight = () => {
    debugLog('FEEDBACK', `CORRECT_HIGHLIGHT: Highlighting correct element for ${duration}ms`);
    debugLog('FEEDBACK', `CORRECT_HIGHLIGHT: Element found: ${element.tagName}#${element.id}, classes: ${element.className}`);
    
    // Add highlight class
    element.classList.add(highlightClass);
    debugLog('FEEDBACK', `CORRECT_HIGHLIGHT: Added class '${highlightClass}', new classes: ${element.className}`);
    
    // Remove highlight class after duration
    setTimeout(() => {
      element.classList.remove(highlightClass);
      debugLog('FEEDBACK', 'CORRECT_HIGHLIGHT: Highlight effect removed');
    }, duration);
  };
  
  // Execute highlight with delay
  if (delay > 0) {
    debugLog('FEEDBACK', `CORRECT_HIGHLIGHT: Delaying highlight by ${delay}ms`);
    setTimeout(executeHighlight, delay);
  } else {
    executeHighlight();
  }
}

/**
 * Enhanced error feedback that shows the correct button after an error
 * @param {HTMLElement} [errorElement] - Element that was incorrectly pressed (optional)
 * @param {HTMLElement|string} [correctElement] - The correct element to highlight (optional)
 * @param {Object} [options] - Configuration options
 * @param {number} [options.highlightDelay=800] - Delay before showing correct button highlight
 */
export function showErrorWithCorrectHint(errorElement = null, correctElement = null, options = {}) {
  const { highlightDelay = 800 } = options;
  
  // Show the standard error feedback first
  showSmartError(errorElement);
  
  // If a correct element is provided, highlight it after a delay
  if (correctElement) {
    setTimeout(() => {
      highlightCorrectButton(correctElement);
    }, highlightDelay);
  }
}

/**
 * Smart error feedback that tries to find the relevant element
 * Falls back to body shake if no specific element found
 * @param {HTMLElement} [targetElement] - Specific element to shake (optional)
 */
export function showSmartError(targetElement = null) {
  const element = targetElement || getLastInteractedElement() || document.body;
  showShakeError(element);
  playErrorSound();
}

/**
 * Create and display a progress bar for activities
 * @param {Object} options - Configuration options for the progress bar
 * @param {string} options.appendToContainer - CSS selector for the container to append the progress bar to
 * @param {string} options.progressClass - CSS class name for the progress container
 * @param {number} options.currentCount - Current progress count (e.g., successful completions)
 * @param {number} options.totalCount - Total count needed for completion
 * @param {number} options.currentLevel - Current level number
 * @param {number} options.notesCount - Number of notes in current level (optional)
 * @param {boolean} options.barOnly - Whether to show only the progress bar (optional)
 * @param {string} options.activityName - Name of the activity for display text
 * @param {Object} options.positioning - Custom positioning styles
 * @returns {HTMLElement|null} The created progress container or null if container not found
 */
export function showActivityProgressBar(options) {
  const {
    appendToContainer,
    progressClass = 'activity-progress',
    currentCount = 0,
    totalCount = 10,
    currentLevel = 1,
    notesCount = null,
    barOnly = false,
    activityName = 'Activity',
    positioning = {
      position: 'absolute',
      bottom: '10px',
      left: '0',
      width: '100%'
    }
  } = options;

  // Remove existing progress display
  let existingProgress = document.querySelector(`.${progressClass}`);
  if (existingProgress) {
    existingProgress.remove();
  }

  // Find target container
  const targetContainer = document.querySelector(appendToContainer);
  if (!targetContainer) {
    debugLog(['FEEDBACK', 'WARN'], `PROGRESS_BAR: Container not found: ${appendToContainer}`);
    return null;
  }

  // Create progress container
  const progressContainer = document.createElement('div');
  progressContainer.className = progressClass;
  
  // Apply positioning styles
  Object.assign(progressContainer.style, {
    textAlign: 'center',
    padding: '10px 0',
    ...positioning
  });

  // Create progress text only if not barOnly mode
  if (!barOnly) {
    const isGerman = document.documentElement.lang === 'de';
    const progressText = document.createElement('div');
    progressText.style.fontSize = '14px';
    progressText.style.marginBottom = '5px';
    
    // Build text content
    let textContent = '';
    if (notesCount) {
      textContent = isGerman 
        ? `Level ${currentLevel}: ${currentCount}/${totalCount} ${activityName} (${notesCount} Töne)`
        : `Level ${currentLevel}: ${currentCount}/${totalCount} ${activityName} (${notesCount} notes)`;
    } else {
      textContent = isGerman 
        ? `Level ${currentLevel}: ${currentCount}/${totalCount} ${activityName}`
        : `Level ${currentLevel}: ${currentCount}/${totalCount} ${activityName}`;
    }
    progressText.textContent = textContent;

    // Assemble components
    progressContainer.appendChild(progressText);
  }

  // Create progress bar
  const progressBar = document.createElement('div');
  progressBar.style.width = '80%';
  progressBar.style.margin = '0 auto';
  progressBar.style.height = '8px';
  progressBar.style.backgroundColor = '#e0e0e0';
  progressBar.style.borderRadius = '4px';
  progressBar.style.overflow = 'hidden';

  // Create progress fill
  const progressFill = document.createElement('div');
  progressFill.style.height = '100%';
  progressFill.style.width = `${(currentCount / totalCount) * 100}%`;
  progressFill.style.backgroundColor = '#4CAF50';
  progressFill.style.transition = 'width 0.3s ease-in-out';

  // Assemble components
  progressBar.appendChild(progressFill);
  progressContainer.appendChild(progressBar);

  // Add to target container
  if (targetContainer.parentNode) {
    targetContainer.parentNode.appendChild(progressContainer);
  } else {
    targetContainer.appendChild(progressContainer);
  }

  debugLog('FEEDBACK', `PROGRESS_BAR: Created for ${activityName} - ${currentCount}/${totalCount}`);
  return progressContainer;
}

/**
 * Remove activity progress bar
 * @param {string} progressClass - CSS class name of the progress container to remove
 */
export function hideActivityProgressBar(progressClass = 'activity-progress') {
  const progressContainer = document.querySelector(`.${progressClass}`);
  if (progressContainer) {
    progressContainer.remove();
    debugLog('FEEDBACK', `PROGRESS_BAR: Removed progress bar with class: ${progressClass}`);
  }
}

/**
 * Repeat the last intro message for the current activity
 */
export function repeatLastIntroMessage() {
  debugLog('AUDIO_SYSTEM', 'Repeat requested for current activity');
  
  // Stop ALL sounds (intro messages, notes, chords) via audioEngine
  // This is the elegant solution - Tone.js controls everything!
  if (window.audioEngine && typeof window.audioEngine.stopAll === 'function') {
    window.audioEngine.stopAll();
    debugLog('AUDIO_SYSTEM', 'Stopped all sounds via audioEngine.stopAll()');
  }
  
  // Get current activity mode from Alpine store (like reset button does)
  let activeMode = currentActivityMode; // fallback
  let targetComponent = null;
  
  try {
    const alpineStore = window.Alpine?.store ? window.Alpine.store('currentActivityMode') : null;
    if (alpineStore && alpineStore.mode) {
      activeMode = alpineStore.mode;
      debugLog('AUDIO_SYSTEM', 'Got activity mode from Alpine store:', activeMode);
      
      if (alpineStore.component === 'pitches') {
        targetComponent = window.pitchesComponent;
      } else if (alpineStore.component === 'chords') {
        targetComponent = window.chordsComponent;
      }
    } else {
      // Fallback: determine from currentActivityMode string
      if (currentActivityMode) {
        if (currentActivityMode.includes('_pitches_')) {
          targetComponent = window.pitchesComponent;
          activeMode = currentActivityMode;
        } else if (currentActivityMode.includes('_chords_')) {
          targetComponent = window.chordsComponent;
          activeMode = currentActivityMode;
        }
      }
    }
  } catch (error) {
    debugLog('AUDIO_SYSTEM', 'Error accessing Alpine store:', error);
  }
  
  // Call the appropriate component's showContextMessage function
  if (targetComponent && targetComponent.showContextMessage) {
    debugLog('AUDIO_SYSTEM', 'Calling showContextMessage for:', activeMode);
    targetComponent.showContextMessage();
  } else {
    debugLog('AUDIO_SYSTEM', 'No active component found for repeat, activeMode:', activeMode, 'currentActivityMode:', currentActivityMode);
  }
}

/**
 * Get the current activity icon based on the current activity mode
 * @returns {string} The Unicode icon for the current activity
 */
export function getCurrentActivityIcon() {
  if (!currentActivityMode) {
    return window.ACTIVITY_ICONS?.['audio'] || '🔊';
  }
  
  // Extract activity ID from mode (e.g. '1_4_pitches_does-it-sound-right' -> '1_4')
  const activityId = currentActivityMode.split('_').slice(0, 2).join('_');
  debugLog('AUDIO_SYSTEM', 'Current activity icon:', { currentActivityMode, activityId, icon: window.ACTIVITY_ICONS?.[activityId] });
  
  return window.ACTIVITY_ICONS?.[activityId] || window.ACTIVITY_ICONS?.['audio'] || '🔊';
}

/**
 * Called when shortcut screen is closed - triggers delayed intro messages
 */
export function onShortcutScreenClosed() {
  debugLog('AUDIO_SYSTEM', 'Shortcut screen closed, checking for delayed intro message');
  shortcutScreenClosed = true;
  
  // Check if we have a hash navigation (e.g., #1_4) that should determine the activity
  const activityMode = getActivityModeFromHash();
  if (activityMode) {
    debugLog('AUDIO_SYSTEM', 'Hash navigation detected -> playing intro for:', activityMode);
    // Update the current activity mode and play its intro message
    currentActivityMode = activityMode;
    lastIntroMessage = { activityMode, component: null, delaySeconds: 10 };
    
    // Play the intro message for this activity
    showActivityIntroMessage(activityMode, null, 10, true);
    return;
  }
  
  // Fallback: Play delayed intro message if there is one
  if (lastIntroMessage) {
    showActivityIntroMessage(
      lastIntroMessage.activityMode,
      lastIntroMessage.component,
      lastIntroMessage.delaySeconds,
      true // force play now
    );
  }
}

/**
 * Called when first musical tone is played - interrupts current announcement
 */
export function onFirstTonePlayed() {
  debugLog('AUDIO_SYSTEM', 'First tone played, stopping current announcement');
  
  if (currentIntroAudio) {
    currentIntroAudio.pause();
    currentIntroAudio.currentTime = 0;
    currentIntroAudio = null;
  }
}

// Listen for activity mode changes to update current activity mode
if (typeof window !== 'undefined') {
  window.addEventListener('set-activity-mode', (event) => {
    const { component, mode } = event.detail;
    debugLog('AUDIO_SYSTEM', 'Activity mode changed:', { component, mode });
    
    if (mode && typeof mode === 'string') {
      currentActivityMode = mode;
      // Activities handle their own intro messages via showContextMessage()
    }
  });
  
  // Listen for user interactions to enable audio playback
  const enableAudio = () => {
    if (!userHasInteracted) {
      userHasInteracted = true;
      debugLog('AUDIO_SYSTEM', 'User interaction detected - audio playback enabled');
      
      // Play pending audio message if there is one
      if (pendingAudioMessage) {
        debugLog('AUDIO_SYSTEM', 'Playing pending audio message:', pendingAudioMessage);
        const messageToPlay = pendingAudioMessage;
        pendingAudioMessage = null;
        // Delay slightly to ensure the interaction event is fully processed
        setTimeout(() => {
          playIntroAudio(messageToPlay);
        }, 100);
      }
    }
  };
  
  // Add event listeners for various user interactions
  ['click', 'touchstart', 'keydown', 'mousedown'].forEach(eventType => {
    window.addEventListener(eventType, enableAudio, { once: false, passive: true });
  });
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.showFeedbackMessage = showFeedbackMessage;
  window.showActivityIntroMessage = showActivityIntroMessage;
  window.showRainbowSuccess = showRainbowSuccess;
  window.showBigRainbowSuccess = showBigRainbowSuccess;
  window.showShakeError = showShakeError;
  window.showCompleteSuccess = showCompleteSuccess;
  window.showCompleteBigSuccess = showCompleteBigSuccess;
  window.showCompleteError = showCompleteError;
  window.highlightCorrectButton = highlightCorrectButton;
  window.showActivityProgressBar = showActivityProgressBar;
  window.hideActivityProgressBar = hideActivityProgressBar;
  window.repeatLastIntroMessage = repeatLastIntroMessage;
  window.getCurrentActivityIcon = getCurrentActivityIcon;
  window.onShortcutScreenClosed = onShortcutScreenClosed;
  window.onFirstTonePlayed = onFirstTonePlayed;
}
