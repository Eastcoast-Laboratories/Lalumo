// STATUS: PARTIALLY WORKING - Basic navigation works but selectors may be outdated
// Test navigates to 1_1 activity correctly but some selectors like .play-btn, .high-btn may not match current HTML

// Test environment debug logging utility
const debugLog = (module, message, ...args) => {
  // For test files, always log since it's test/development time
  if (args.length > 0) {
    debugLog('HIGH_LOW_SPEC', `[${module}] ${message}`, ...args);
  } else {
    debugLog('HIGH_LOW_SPEC', `[${module}] ${message}`);
  }
};

const { test, expect } = require('@playwright/test');
const { setupTest, navigateToActivity, returnToMain, checkElementVisibility } = require('../helpers/test-utils');

/**
 * Test suite for High or Low (1_1) activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo High or Low Activity Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to High or Low activity and perform basic interaction', async ({ page }) => {
    // Navigate to High or Low activity using the index.html button
    await page.click('#nav_1_1');
    await page.waitForTimeout(1000);
    
    // Verify we're on the right activity
    const activityContainer = page.locator('[id="1_1_pitches"]');
    await expect(activityContainer).toBeVisible({ timeout: 5000 });
    
    // Wait for tones to be generated
    await page.waitForTimeout(1000);
    
    // Play the tones
    const playButton = page.locator('[id="1_1_pitches"] .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 2000 });
    await playButton.click();
    debugLog('HIGH_LOW_SPEC', 'Clicked play button, tones should now play');
    
    // Wait for tones to finish playing
    await page.waitForTimeout(2000);
    
    // Answer the question - click higher
    const higherButton = page.locator('#1_1_pitches .high-btn');
    await expect(higherButton).toBeVisible({ timeout: 2000 });
    await higherButton.click();
    debugLog('HIGH_LOW_SPEC', 'Clicked higher button as answer');
    
    // Wait for feedback
    await page.waitForTimeout(1000);
    
    // Check feedback is visible using helper function
    await checkElementVisibility(page, '#1_1_pitches .feedback-container', 'Feedback message');
    
    // Return to main using helper function
    await returnToMain(page);
  });
});
