/**
 * Long-press tooltip functionality for mobile and desktop devices
 */

let longPressTimer = null;
let tooltipElement = null;
let isLongPressActive = false;
let mouseDownStartTime = null;

/**
 * Start long press detection for touch events
 * @param {Event} event - Touch start event
 * @param {string} text - Text to display in tooltip
 */
export function startLongPress(event, text) {
  // Clear any existing timer
  if (longPressTimer) {
    clearTimeout(longPressTimer);
  }
  
  isLongPressActive = false;
  
  // Start timer for long press (500ms)
  longPressTimer = setTimeout(() => {
    showTooltip(event, text);
    isLongPressActive = true;
  }, 500);
}

/**
 * Start mouse long press detection
 * @param {Event} event - Mouse down event
 * @param {string} text - Text to display in tooltip
 */
export function startMouseLongPress(event, text) {
  // Clear any existing timer
  if (longPressTimer) {
    clearTimeout(longPressTimer);
  }
  
  isLongPressActive = false;
  mouseDownStartTime = Date.now();
  
  // Start timer for long press (500ms)
  longPressTimer = setTimeout(() => {
    showTooltip(event, text);
    isLongPressActive = true;
  }, 500);
}

/**
 * End long press and handle click if not a long press
 * @param {Event} event - Touch end event
 */
export function endLongPress(event) {
  // Clear timer
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  
  // Hide tooltip if shown
  hideTooltip();
  
  // If it was a long press, prevent the click
  if (isLongPressActive) {
    event.preventDefault();
    event.stopPropagation();
    isLongPressActive = false;
    return false;
  }
  
  // If not a long press, trigger the click
  if (!isLongPressActive) {
    // Small delay to ensure touch events are processed
    setTimeout(() => {
      event.target.click();
    }, 10);
  }
}

/**
 * End mouse long press and handle click if not a long press
 * @param {Event} event - Mouse up event
 */
export function endMouseLongPress(event) {
  // Clear timer
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  
  // Hide tooltip if shown
  hideTooltip();
  
  // If it was a long press, prevent the click
  if (isLongPressActive) {
    event.preventDefault();
    event.stopPropagation();
    isLongPressActive = false;
    return false;
  }
  
  // Reset mouse tracking
  mouseDownStartTime = null;
}

/**
 * Cancel long press (e.g., when finger moves)
 * @param {Event} event - Touch move event
 */
export function cancelLongPress(event) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  hideTooltip();
  isLongPressActive = false;
}

/**
 * Cancel mouse long press (e.g., when mouse moves away)
 * @param {Event} event - Mouse leave event
 */
export function cancelMouseLongPress(event) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  hideTooltip();
  isLongPressActive = false;
  mouseDownStartTime = null;
}

/**
 * Show tooltip at touch or mouse position
 * @param {Event} event - Touch or mouse event
 * @param {string} text - Text to display
 */
function showTooltip(event, text) {
  // Remove existing tooltip
  hideTooltip();
  
  // Create tooltip element
  tooltipElement = document.createElement('div');
  tooltipElement.className = 'longpress-tooltip';
  tooltipElement.textContent = text;
  
  // Style the tooltip
  Object.assign(tooltipElement.style, {
    position: 'fixed',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'sans-serif',
    zIndex: '10000',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    opacity: '0',
    transition: 'opacity 0.2s ease-in-out'
  });
  
  // Add to body
  document.body.appendChild(tooltipElement);
  
  // Position tooltip - handle both touch and mouse events
  let clientX, clientY;
  
  if (event.touches && event.touches.length > 0) {
    // Touch event
    const touch = event.touches[0] || event.changedTouches[0];
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else {
    // Mouse event
    clientX = event.clientX;
    clientY = event.clientY;
  }
  
  const rect = tooltipElement.getBoundingClientRect();
  
  let x = clientX - rect.width / 2;
  let y = clientY - rect.height - 10; // 10px above cursor/finger
  
  // Keep tooltip on screen
  if (x < 10) x = 10;
  if (x + rect.width > window.innerWidth - 10) x = window.innerWidth - rect.width - 10;
  if (y < 10) y = clientY + 10; // Show below cursor/finger if no space above
  
  tooltipElement.style.left = x + 'px';
  tooltipElement.style.top = y + 'px';
  
  // Fade in
  setTimeout(() => {
    if (tooltipElement) {
      tooltipElement.style.opacity = '1';
    }
  }, 10);
}

/**
 * Hide and remove tooltip
 */
function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }
}

// Functions are now exported and made available globally via the HTML import
