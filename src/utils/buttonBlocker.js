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
 * Global Button Blocker Utility
 * Automatically blocks activity buttons for 2 seconds after click
 * 
 * Usage: Add the class 'activity-button-blocker' to any button in index.html
 * The script will automatically handle the 2-second blocking behavior
 */

class ButtonBlocker {
  constructor() {
    this.blockedButtons = new Set();
    this.init();
  }

  init() {
    // Multiple approaches to ensure DOM is ready
    const setup = () => this.setupEventListeners();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else if (document.readyState === 'interactive') {
      // DOM is ready but resources may still be loading
      setTimeout(setup, 100);
    } else {
      // DOM and resources are fully loaded
      setup();
    }
    
    // Fallback: try again after a short delay
    setTimeout(setup, 500);
  }

  setupEventListeners() {
    // Prevent multiple initialization
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    
    // Use event delegation to handle all buttons with the blocker class
    document.addEventListener('click', (event) => {
      const button = event.target.closest('.activity-button-blocker');
      if (button) {
        if (this.isBlocked(button)) {
          // Prevent the click if button is blocked
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        } else {
          // Block the button after successful click
          this.blockButton(button);
        }
      }
    }, true); // Use capture phase to catch events early
  }

  isBlocked(button) {
    return this.blockedButtons.has(button) || button.disabled || button.classList.contains('blocking');
  }

  blockButton(button) {
    // Prevent multiple blocks on the same button
    if (this.isBlocked(button)) {
      return;
    }

    // Add to blocked set
    this.blockedButtons.add(button);
    
    // Add visual blocking class
    button.classList.add('blocking');
    
    // Store original disabled state but don't set disabled (to keep cursor working)
    const wasDisabled = button.disabled;
    
    // Unblock after 2 seconds
    setTimeout(() => {
      this.unblockButton(button, wasDisabled);
    }, 2000);
  }

  unblockButton(button, wasDisabled) {
    // Remove from blocked set
    this.blockedButtons.delete(button);
    
    // Remove visual blocking class
    button.classList.remove('blocking');
    
    // Restore original disabled state
    button.disabled = wasDisabled;
  }

  // Public method to manually block a button (for programmatic use)
  manualBlock(buttonSelector, duration = 2000) {
    const button = document.querySelector(buttonSelector);
    if (button) {
      this.blockButton(button);
      
      // Override timeout for custom duration
      if (duration !== 2000) {
        setTimeout(() => {
          this.unblockButton(button, button.disabled);
        }, duration);
      }
    }
  }

  // Public method to check if any buttons are currently blocked
  hasBlockedButtons() {
    return this.blockedButtons.size > 0;
  }

  // Public method to get count of blocked buttons
  getBlockedCount() {
    return this.blockedButtons.size;
  }
}

// Create global instance
window.buttonBlocker = new ButtonBlocker();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ButtonBlocker;
}
