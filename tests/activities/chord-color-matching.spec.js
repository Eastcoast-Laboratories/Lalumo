/**
 * Playwright test for 2_1 Chord Color Matching activity in Lalumo app
 * Based on the working match-sounds.spec.js structure
 */

const { test, expect } = require('@playwright/test');
const { setupTest, debugLog, checkElementVisibility, showTestOverlay, updateTestOverlay, removeTestOverlay } = require('../helpers/test-utils');

/**
 * Test suite for 2_1 Chord Color Matching activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo 2_1 Chord Color Matching Activity Tests', () => {
  // Set global timeout
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to 2_1 Chord Color Matching activity and perform basic interaction', async ({ page }) => {
    // Increase test timeout to 30 seconds for audio interactions
    test.setTimeout(30000);
    
    // First navigate to chords section by clicking the main chords tab
    await page.click('button:has-text("Chords")');
    await page.waitForTimeout(1000);
    
    // Then navigate to 2_1 Chord Color Matching activity
    await page.click('#nav_2_1');
    await page.waitForTimeout(1000);
    
    // Show test overlay using DRY implementation
    await showTestOverlay(page, 'Starting 2_1 Chord Color Matching test...');
    
    // Verify we're in the correct activity
    const activityContainer = page.locator('[id="2_1_chords_color-matching"]');
    await expect(activityContainer).toBeVisible();
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Successfully navigated to 2_1 chord color matching activity');
    
    // Update test overlay
    await updateTestOverlay(page, 'Checking for start button in free play mode...');
    
    // Check if we're in free play mode (start button should be visible)
    const startButton = page.locator('#start-game-mode-2_1');
    if (await startButton.isVisible()) {
      debugLog('CHORD_COLOR_MATCHING_SPEC', 'In free play mode, clicking start button to enter game mode');
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Update test overlay
    await updateTestOverlay(page, 'Checking for play button in game mode...');
    
    // Verify play button is visible in game mode
    const playButton = page.locator('#play-chord-2_1');
    await expect(playButton).toBeVisible();
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Play button is visible in game mode');
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing chord playback...');
    
    // Click play button to hear the chord
    await playButton.click();
    await page.waitForTimeout(2000); // Wait for chord to play
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Clicked play button');
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing magical element interaction...');
    
    // Test clicking on one of the magical elements (fruit = major)
    const fruitElement = page.locator('#button_2_1_fruit');
    await expect(fruitElement).toBeVisible();
    await fruitElement.click();
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Clicked on fruit magical element');
    
    // Wait for feedback and next chord generation
    await page.waitForTimeout(3000);
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing another magical element...');
    
    // Test clicking on another element (mushroom = minor)
    const mushroomElement = page.locator('#button_2_1_mushroom');
    await expect(mushroomElement).toBeVisible();
    await mushroomElement.click();
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Clicked on mushroom magical element');
    
    // Wait for feedback
    await page.waitForTimeout(2000);
    
    // Update test overlay
    await updateTestOverlay(page, 'Checking progress display...');
    
    // Check if progress is being displayed
    const progressDisplay = page.locator('.progress_2_1');
    await expect(progressDisplay).toBeVisible();
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Progress display is visible');
    
    // Check if feedback message appears (it might not be visible at this moment)
    const feedbackMessage = page.locator('.feedback-message');
    const feedbackVisible = await feedbackMessage.isVisible().catch(() => false);
    if (feedbackVisible) {
      debugLog('CHORD_COLOR_MATCHING_SPEC', 'Feedback message is visible');
    } else {
      debugLog('CHORD_COLOR_MATCHING_SPEC', 'Feedback message is not visible');
    }
    
    // Update test overlay
    await updateTestOverlay(page, '2_1 Chord Color Matching test completed successfully!');
    
    debugLog('CHORD_COLOR_MATCHING_SPEC', '2_1 Chord Color Matching test completed successfully');
    
    // Remove test overlay
    await removeTestOverlay(page);
  });
});
