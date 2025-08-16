// STATUS: PARTIALLY WORKING - Basic navigation works but selectors may be outdated
// Test navigates to 1_2 activity but selectors like .match-sound-card may not match current HTML structure

const { test, expect } = require('@playwright/test');
const { setupTest, debugLog, checkElementVisibility, showTestOverlay, updateTestOverlay, removeTestOverlay } = require('../helpers/test-utils');

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
    // Increase test timeout to 30 seconds for audio interactions
    test.setTimeout(30000);
    
    // Navigate to Up or Down activity using the index.html button
    await page.click('#nav_1_2');
    await page.waitForTimeout(1000);
    
    // Show test overlay using DRY implementation
    await showTestOverlay(page, 'Match Sounds Test', 'running');
    
    // Verify we're on the right activity
    const activityContainer = page.locator('[id="1_2_pitches"]');
    await expect(activityContainer).toBeVisible({ timeout: 5000 });
    
    // Wait for activity to fully load and cards to be generated
    await page.waitForTimeout(2000);
    
    // Verify pitch cards are visible (up and down cards)
    const upCard = page.locator('[id="1_2_pitches"] .up-card');
    const downCard = page.locator('[id="1_2_pitches"] .down-card');
    await expect(upCard).toBeVisible({ timeout: 5000 });
    await expect(downCard).toBeVisible({ timeout: 5000 });
    debugLog('MATCH_SOUNDS_SPEC', 'Found up and down pitch cards');
    
    // Update overlay status
    await updateTestOverlay(page, 'running', 'Teste Pitch Cards...');
    
    // Click on the up card to test interaction
    await upCard.click();
    debugLog('MATCH_SOUNDS_SPEC', 'Clicked on up pitch card');
    await page.waitForTimeout(1000);
    
    // Click on the down card to test second interaction
    await downCard.click();
    debugLog('MATCH_SOUNDS_SPEC', 'Clicked on down pitch card');
    await page.waitForTimeout(1000);
    
    // Update overlay status
    await updateTestOverlay(page, 'running', 'Prüfe Feedback...');
    
    // Check if feedback is visible using helper function
    await checkElementVisibility(page, '.feedback-container', 'Feedback message');
    
    // Test completed successfully - update overlay
    await updateTestOverlay(page, 'passed');
    debugLog('MATCH_SOUNDS_SPEC', 'Match sounds test completed successfully');
    
    // Show success status briefly, then remove overlay
    await page.waitForTimeout(2000);
    await removeTestOverlay(page);
  });
});
