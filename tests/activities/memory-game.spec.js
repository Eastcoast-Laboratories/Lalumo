// STATUS: NOT WORKING - Test is for wrong activity (memory card game instead of 1_5 piano memory game)
// This test navigates to memory cards activity, not the 1_5 piano sequence memory game
// The selectors (.memory-container, .memory-card) don't exist in the actual 1_5 activity

// Test environment debug logging utility
const debugLog = (module, message, ...args) => {
  // For test files, always log since it's test/development time
  if (args.length > 0) {
    console.log('MEMORY_GAME_SPEC', `[${module}] ${message}`, ...args);
  } else {
    console.log('MEMORY_GAME_SPEC', `[${module}] ${message}`);
  }
};

const { test, expect } = require('@playwright/test');
const { setupTest, navigateToActivity, returnToMain, checkElementVisibility } = require('../helpers/test-utils');

/**
 * Test suite for Memory Game (1_5) activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo Memory Game Activity Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to Memory Game activity and perform basic interaction', async ({ page }) => {
  // Increase test timeout to 30 seconds
  test.setTimeout(30000);
    // Navigate to Memory Game activity using the index.html button
    await page.click('#nav_1_5');
    await page.waitForTimeout(1000);
    
    // Verify we're on the right activity
    const activityContainer = page.locator('[id="1_5_pitches"]');
    await expect(activityContainer).toBeVisible({ timeout: 5000 });
    
    // Verify piano keys are visible (memory game uses piano interface)
    const pianoKeys = page.locator('[id="1_5_pitches"] .piano-key.white');
    await expect(pianoKeys.first()).toBeVisible({ timeout: 5000 });
    debugLog('MEMORY_GAME_SPEC', 'Piano keys are visible');
    
    // Check if play button is rendered
    const playButton = page.locator('[id="1_5_pitches"] .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 2000 });
    debugLog('MEMORY_GAME_SPEC', 'Play button is visible');
    
    // Click the play button to start the memory game
    await playButton.click();
    debugLog('MEMORY_GAME_SPEC', 'Clicked play button to start memory game');
    await page.waitForTimeout(3000); // Wait for sequence to play
    
    // Click a specific piano key (C4) to interact with the memory game
    const c4Key = page.locator('[id="1_5_pitches"] .piano-key.c4');
    await expect(c4Key).toBeVisible({ timeout: 2000 });
    await c4Key.click();
    debugLog('MEMORY_GAME_SPEC', 'Clicked C4 piano key');
    await page.waitForTimeout(1000);
    
    // Check if any feedback is displayed using helper function
    await checkElementVisibility(page, '#1_5_pitches .feedback-container', 'Feedback message');
    
    // Wait for any card animations to complete
    await page.waitForTimeout(2000);
    
    debugLog('MEMORY_GAME_SPEC', 'Memory game test completed successfully');
  });
});
