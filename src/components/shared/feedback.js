/*
 * Lalumo - Music Practice Tool
 * Copyright (C) 2024 Ruben Barkow-Kuder
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Shared Visual & Audio Feedback Utilities
 * 
 * Centralized feedback functions used across all chapters
 * Ensures consistent user experience and reduces code duplication
 */

/**
 * Unified feedback message system for both help messages and game feedback
 * @param {string} message - The message to display and speak
 * @param {Object} options - Options for controlling feedback behavior
 * @param {string} [options.activityId] - Activity identifier for logging
 * @param {boolean} [options.isIntroMessage=true] - Whether this is an intro/help message (respects settings) or game feedback (always shown)
 * @param {boolean} [options.isCorrect=null] - For game feedback: correct (true), incorrect (false), or neutral (null)
 * @param {number} [options.delaySeconds=10] - Delay in seconds before hiding the message
 * @param {Object} [options.component=null] - The Alpine.js component instance for speaking
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
  
  // Only speak intro/help messages, not game feedback
  if (isIntroMessage) {
    // If a component is provided and it has a speak method, use it
    if (component && typeof component.speak === 'function') {
      component.speak(message);
    } 
    // Otherwise use the global speech synthesis if available
    else if (window.speechSynthesis && helpSettingsStore && helpSettingsStore.enableSpeech) {
      const utterance = new SpeechSynthesisUtterance(message);
      // Get language store
      const languageStore = window.Alpine?.store ? window.Alpine.store('language') : null;
      utterance.lang = languageStore?.current || 'en';
      window.speechSynthesis.speak(utterance);
    }
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
 */
export function showActivityIntroMessage(activityMode, component = null, delaySeconds = 10, force = true /* TODO: should be false before release */) {
  debugLog('LOG_INTRO_MESSAGE', 'activity: \'' + activityMode + '\', delaySeconds: ' + delaySeconds + ', force: ' + force);
  
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
    const stringKeyMap = {
      '1_1_pitches_high_or_low': 'intro_1_1_pitches_high_or_low',
      '1_2_pitches_match-sounds': 'intro_1_2_pitches_match_sounds',
      '1_3_pitches_draw': 'intro_1_3_pitches_draw',
      '1_4_pitches_does-it-sound-right': 'intro_1_4_pitches_does_it_sound_right',
      '1_5_pitches_memory': 'intro_1_5_pitches_memory',
      '2_2_chords_stable_unstable': 'intro_2_2_chords_stable_unstable',
      '2_5_chords_characters': 'intro_2_5_chords_characters'
    };
    
    const stringKey = stringKeyMap[activityMode];
    if (stringKey && store.strings[stringKey]) {
      message = store.strings[stringKey];
      debugLog('LOG_INTRO_MESSAGE', 'Loaded from Alpine store:' + stringKey + '=', message);
    }
  }
  
  // Try to load from global strings object if Alpine store not available
  if (!message && window.strings) {
    const stringKeyMap = {
      '1_1_pitches_high_or_low': 'intro_1_1_pitches_high_or_low',
      '1_2_pitches_match-sounds': 'intro_1_2_pitches_match_sounds',
      '1_3_pitches_draw': 'intro_1_3_pitches_draw',
      '1_4_pitches_does-it-sound-right': 'intro_1_4_pitches_does_it_sound_right',
      '1_5_pitches_memory': 'intro_1_5_pitches_memory',
      '2_2_chords_stable_unstable': 'intro_2_2_chords_stable_unstable',
      '2_5_chords_characters': 'intro_2_5_chords_characters'
    };
    
    const stringKey = stringKeyMap[activityMode];
    if (stringKey && window.strings[stringKey]) {
      message = window.strings[stringKey];
      debugLog('LOG_INTRO_MESSAGE', 'Loaded from global strings:' + stringKey + '=', message);
    }
  }
  
  // Use the messages from strings.xml that we added
  if (!message) {
    debugLog('LOG_INTRO_MESSAGE', 'Using direct strings.xml messages for:', activityMode);
    const messages = {
      '1_1_pitches_high_or_low': {
        'en': 'Listen to the Note and choose if it is of a high or low pitch!',
        'de': 'Höre dir die Note an und wähle, ob sie hoch oder tief ist!'
      },
      '1_2_pitches_match-sounds': {
        'en': 'Listen to the Melody and choose if it is ascending or descending!',
        'de': 'Höre dir die Melodie an und wähle, ob sie auf- oder absteigend ist!'
      },
      'draw': {
        'en': 'Draw and listen – your line becomes music!',
        'de': 'Male und hör zu – deine Linie wird zu Musik!'
      },
      '1_4_pitches_does-it-sound-right': {
        'en': 'Listen to the melody! Does it sound right? Or is there a wrong note?',
        'de': 'Hör dir die Melodie an! Klingt sie richtig? Oder ist da ein falscher Ton?'
      },
      '1_5_pitches_memory-game': {
        'en': 'Listen carefully and remember the melody! Can you play it back?',
        'de': 'Höre genau hin und merke dir die Melodie! Kannst du sie nachspielen?'
      },
      '2_2_chords_stable_unstable': {
        'en': 'Listen to the chord, does it sound stable or unstable? Click on the matching part of the forest',
        'de': 'Höre dir den Akkord an, klingt er stabil oder instabil? Klicke auf die passende Seite im Wald'
      },
      '2_5_chords_characters': {
        'en': 'Listen to the chord and match it to the right character!',
        'de': 'Höre dir die Akkord-Art an und wähle das passende Tier!'
      }
    };
    
    const activityMessages = messages[activityMode] || 'no such mode ' + activityMode;
    message = activityMessages[language] || activityMessages['en'];
  }
  
  // Show the message using the existing showFeedbackMessage function
  // This automatically respects the $store.helpSettings.showHelpMessages setting
  if (message) {
    // Mark this intro message as shown
    shownIntroMessages.add(activityMode);
    debugLog('LOG_INTRO_MESSAGE', 'Marked as shown:' + activityMode);
    
    showFeedbackMessage(message, {
      activityId: activityMode,
      isIntroMessage: true,  // This is an intro message
      delaySeconds,
      component
    });
  } else {
    debugLog(['FEEDBACK', 'WARN'], 'LOG_INTRO_MESSAGE: No intro message found for activity:', activityMode);
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
  window.resetShownIntroMessages = resetShownIntroMessages;
  window.clearFeedbackTimer = clearFeedbackTimer;
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
  // Use the global app instance to play the sound
  if (window.app && typeof window.app.playSuccessSound === 'function') {
    window.app.playSuccessSound();
  } else {
    debugLog(['FEEDBACK', 'WARN'], 'FEEDBACK_UTILITIES: App instance not available for success sound');
  }
}

/**
 * Play error sound (descending minor third)
 * Frequencies: E4, C4
 */
export function playErrorSound() {
  // Use the global app instance to play the sound
  if (window.app && typeof window.app.playErrorSound === 'function') {
    window.app.playErrorSound();
  } else {
    debugLog(['FEEDBACK', 'WARN'], 'FEEDBACK_UTILITIES: App instance not available for error sound');
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
