/**
 * Touch event handler utilities for improved mobile touch handling
 * Specifically addresses multi-touch issues on touch-enabled browsers
 */

import { debugLog } from './debug.js';

// Flag to track if handler has been initialized already
let isMultiTouchHandlerInitialized = false;

/**
 * Initializes multi-touch handling for all touch-enabled browsers
 * When multi-touch is detected, only the last touch is processed
 * This prevents issues with ghost touches or multiple buttons being pressed
 */
export function initMultiTouchHandler() {
  // Only initialize once
  if (isMultiTouchHandlerInitialized) {
    return;
  }
  
  isMultiTouchHandlerInitialized = true;
  debugLog('TOUCH', 'Initializing multi-touch handler for touch devices');
  
  // Track touch count to detect multi-touch
  let touchCount = 0;
  let lastTouchTarget = null;
  
  // Capture touchstart at the document level to handle multi-touch
  document.addEventListener('touchstart', (event) => {
    touchCount = event.touches.length;
    
    // Store the target of the last touch
    if (event.touches.length > 0) {
      const lastTouch = event.touches[event.touches.length - 1];
      lastTouchTarget = document.elementFromPoint(
        lastTouch.clientX, 
        lastTouch.clientY
      );
    }
    
    // If multi-touch detected, prevent default on this event
    if (touchCount > 1) {
      debugLog('TOUCH', `Multi-touch detected (${touchCount} touches)`);
      
      // Prevent default behavior for this touch event
      event.preventDefault();
      
      // If we have a valid last touch target that's a button or interactive element
      if (lastTouchTarget && isInteractiveElement(lastTouchTarget)) {
        const elementInfo = lastTouchTarget.tagName + 
          (lastTouchTarget.id ? ' #' + lastTouchTarget.id : '') + 
          (lastTouchTarget.className ? ' .' + lastTouchTarget.className.replace(/ /g, '.') : '');
        
        debugLog('TOUCH', `Processing last touch on: ${elementInfo}`);
        
        // Store the target in a variable to ensure it doesn't become null
        const targetElement = lastTouchTarget;
        
        // Simulate a click on the last touch target after a short delay
        // This gives time for other touch events to be canceled
        setTimeout(() => {
          // Check if target still exists before clicking
          if (targetElement && targetElement.click && typeof targetElement.click === 'function') {
            targetElement.click();
          }
        }, 10);
      }
      
      return false;
    }
  }, { passive: false }); // Important: non-passive to allow preventDefault
  
  // Reset touch count on touchend
  document.addEventListener('touchend', () => {
    if (touchCount > 1) {
      debugLog('MULTITOUCH', 'Multi-touch ended');
    }
    touchCount = 0;
    lastTouchTarget = null;
  });
}

/**
 * Checks if the element is an interactive element that should receive click events
 * @param {Element} element - DOM element to check
 * @returns {boolean} - True if the element is interactive (button, link, etc)
 */
function isInteractiveElement(element) {
  // Check tag name for common interactive elements
  const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
  if (interactiveTags.includes(element.tagName)) {
    return true;
  }
  
  // Check for elements with role="button"
  if (element.getAttribute('role') === 'button') {
    return true;
  }
  
  // Check for elements with click handlers (Alpine.js)
  if (element.hasAttribute('x-on:click') || 
      element.hasAttribute('@click') ||
      element.hasAttribute('onclick')) {
    return true;
  }
  
  // Check for special classes that indicate interactive elements
  const interactiveClasses = [
    'instrument-button',
    'choice-button', 
    'note-button',
    'clickable'
  ];
  
  for (const className of interactiveClasses) {
    if (element.classList.contains(className)) {
      return true;
    }
  }
  
  // If this element isn't interactive, check parent (for nested elements)
  if (element.parentElement && element !== document.body) {
    return isInteractiveElement(element.parentElement);
  }
  
  return false;
}
