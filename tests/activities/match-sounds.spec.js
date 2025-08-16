// STATUS: PARTIALLY WORKING - Basic navigation works but selectors may be outdated
// Test navigates to 1_2 activity but selectors like .match-sound-card may not match current HTML structure

const { test, expect } = require('@playwright/test');
const { setupTest, navigateToActivity, returnToMain, checkElementVisibility } = require('../helpers/test-utils');

/**
 * Test suite for Up or Down (1_2) activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo Up or Down Activity Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to Up or Down activity and perform basic interaction', async ({ page }) => {
    // Navigate to Up or Down activity using the index.html button
    await page.click('#nav_1_2');
    await page.waitForTimeout(1000);
    
    // Verify we're on the right activity
    const activityContainer = page.locator('[id="1_2_pitches"]');
    await expect(activityContainer).toBeVisible({ timeout: 5000 });
    
    // Wait for cards to be generated
    await page.waitForTimeout(1000);
    
    // Verify cards are visible
    const cards = page.locator('.match-sound-card');
    expect(await cards.count()).toBeGreaterThan(0);
    console.log(`Found ${await cards.count()} sound matching cards`);
    
    // Click on the first card
    await cards.first().click();
    console.log('Clicked on first Up or Down card');
    await page.waitForTimeout(1000);
    
    // Click on another card (doesn't matter if it matches or not, just testing interaction)
    if (await cards.count() > 1) {
      await cards.nth(1).click();
      console.log('Clicked on second Up or Down card');
      await page.waitForTimeout(1000);
    }
    
    // Check if feedback is displayed using helper function
    await checkElementVisibility(page, '#1_2_pitches .feedback-container', 'Feedback message');
    
    // Return to main using helper function
    await returnToMain(page);
  });
});
