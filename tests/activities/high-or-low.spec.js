// STATUS: PARTIALLY WORKING - Basic navigation works but selectors may be outdated
// Test navigates to 1_1 activity correctly but some selectors like .play-btn, .high-btn may not match current HTML

// Test environment debug logging utility
const debugLog = (module, message, ...args) => {
  // For test files, always log since it's test/development time
  if (args.length > 0) {
    console.log('HIGH_LOW_SPEC', `[${module}] ${message}`, ...args);
  } else {
    console.log('HIGH_LOW_SPEC', `[${module}] ${message}`);
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
    // Increase test timeout to 30 seconds
    test.setTimeout(30000);
    // Navigate to High or Low activity using the index.html button
    await page.click('#nav_1_1');
    await page.waitForTimeout(1000);
    
    // Verify activity container is visible
    const activityContainer = page.locator('[id="1_1_pitches"]');
    await expect(activityContainer).toBeVisible({ timeout: 5000 });
    
    // Click play button to start the activity
    const playButton = page.locator('[id="1_1_pitches"] .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 2000 });
    await playButton.click();
    debugLog('HIGH_LOW_SPEC', 'Clicked play button, tones should now play');
    
    // Wait for the high/low choice buttons to appear
    await page.waitForTimeout(2000);
    
    // Click on high choice button to test interaction
    const highButton = page.locator('[id="1_1_pitches"] .high-choice');
    await expect(highButton).toBeVisible({ timeout: 5000 });
    await highButton.click();
    debugLog('HIGH_OR_LOW_SPEC', 'Clicked high choice button as answer');
    
    // Wait for feedback
    await page.waitForTimeout(1000);
    
    // Check feedback is visible using helper function
    await checkElementVisibility(page, '[id="1_1_pitches"] .feedback-container', 'Feedback message');
    
    debugLog('HIGH_LOW_SPEC', 'High or Low test completed successfully');
  });
});
