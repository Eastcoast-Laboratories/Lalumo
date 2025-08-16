// STATUS: PARTIALLY WORKING - Navigation works but canvas interaction may need updates
// Test navigates to 1_3 draw melody activity and finds canvas, but drawing simulation may not match current implementation

// Test environment debug logging utility
const debugLog = (module, message, ...args) => {
  // For test files, always log since it's test/development time
  if (args.length > 0) {
    console.log('DRAW_MELODY_SPEC', `[${module}] ${message}`, ...args);
  } else {
    console.log('DRAW_MELODY_SPEC', `[${module}] ${message}`);
  }
};

const { test, expect } = require('@playwright/test');
const { setupTest, navigateToActivity, returnToMain, checkElementVisibility } = require('../helpers/test-utils');

/**
 * Test suite for Draw a Melody (1_3) activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo Draw a Melody Activity Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to Draw a Melody activity and perform basic interaction', async ({ page }) => {
    // Increase test timeout to 30 seconds
    test.setTimeout(30000);
    // Navigate to Draw a Melody activity using the debug button (always visible)
    await page.click('#nav_1_3_debug');
    await page.waitForTimeout(1000);
    
    // Verify activity container is visible
    const activityContainer = page.locator('[id="1_3_pitches"]');
    await expect(activityContainer).toBeVisible({ timeout: 5000 });
    
    // Verify drawing canvas is visible
    const drawingCanvas = page.locator('[id="1_3_pitches"] .drawing-canvas');
    await expect(drawingCanvas).toBeVisible({ timeout: 2000 });
    debugLog('DRAW_MELODY_SPEC', 'Drawing canvas is visible');
    
    // Click play button to hear reference melody
    const playButton = page.locator('[id="1_3_pitches"] .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 2000 });
    await playButton.click();
    debugLog('DRAW_MELODY_SPEC', 'Clicked play button, melody should now play');
    
    // Wait for melody to finish playing
    await page.waitForTimeout(2000);
    
    // Try to draw on the canvas (simulate a simple drawing)
    const canvasBounds = await drawingCanvas.boundingBox();
    if (canvasBounds) {
      // Define starting position (top center of the canvas)
      const startX = canvasBounds.x + canvasBounds.width / 2;
      const startY = canvasBounds.y + canvasBounds.height * 0.25;
      
      // Draw a simple line down
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY + canvasBounds.height * 0.5, { steps: 10 });
      await page.mouse.up();
      debugLog('DRAW_MELODY_SPEC', 'Drew a simple line on the canvas');
    } else {
      debugLog('DRAW_MELODY_SPEC', 'Could not get canvas bounds for drawing');
    }
    
    // Wait for drawing to register and melody to play automatically
    await page.waitForTimeout(3000);
    
    // Drawing is automatically processed on mouseup/touchend - no check button needed
    debugLog('DRAW_MELODY_SPEC', 'Drawing completed, melody should play automatically');
    
    // Check if feedback is visible using helper function
    await checkElementVisibility(page, '.feedback-container', 'Feedback message');
    
    debugLog('DRAW_MELODY_SPEC', 'Draw melody test completed successfully');
  });
});
