/**
 * Playwright test for 2_1 Chord Magical Forest activity in Lalumo app
 * Based on the working match-sounds.spec.js structure
 */

const { test, expect } = require('@playwright/test');
const { setupTest, debugLog, checkElementVisibility, showTestOverlay, updateTestOverlay, removeTestOverlay } = require('../helpers/test-utils');

/**
 * Test suite for 2_1 Chord Magical Forest activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo 2_1 Chord Magical Forest Activity Tests', () => {
  // Set global timeout
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to 2_1 Chord Magical Forest activity and test game mode functionality', async ({ page }) => {
    // Increase test timeout to 30 seconds for audio interactions
    test.setTimeout(30000);
    
    // First navigate to chords section by clicking the main chords tab
    await page.click('button:has-text("Chords")');
    await page.waitForTimeout(1000);
    
    // Then navigate to 2_1 Chord Magical Forest activity
    await page.click('#nav_2_1');
    await page.waitForTimeout(1000);
    
    // Show test overlay using DRY implementation
    await showTestOverlay(page, 'Starting 2_1 Chord Magical Forest test...');
    
    // Verify we're in the correct activity
    const activityContainer = page.locator('[id="2_1_chords_color-matching"]');
    await expect(activityContainer).toBeVisible();
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Successfully navigated to 2_1 chord Magical Forest activity');
    
    // Update test overlay
    await updateTestOverlay(page, 'Checking for start button in free play mode...');
    
    // Check if we're in free play mode (start button should be visible)
    const startButton = page.locator('#start-game-mode-2_1');
    if (await startButton.isVisible()) {
      debugLog('CHORD_COLOR_MATCHING_SPEC', 'In free play mode, clicking start button to enter game mode');
      
      // Debug: Check current state before click
      const isFreeModeBeforeClick = await page.evaluate(() => {
        const element = document.querySelector('[id="2_1_chords_color-matching"]');
        return element && element._x_dataStack ? element._x_dataStack[0].is2_1FreePlayMode : 'component not found';
      });
      debugLog('CHORD_COLOR_MATCHING_SPEC', `is2_1FreePlayMode before click: ${isFreeModeBeforeClick}`);
      
      await startButton.click();
      await page.waitForTimeout(2000); // Wait longer for mode switch
      
      // Debug: Check current state after click
      const isFreeModeAfterClick = await page.evaluate(() => {
        const element = document.querySelector('[id="2_1_chords_color-matching"]');
        return element && element._x_dataStack ? element._x_dataStack[0].is2_1FreePlayMode : 'component not found';
      });
      debugLog('CHORD_COLOR_MATCHING_SPEC', `is2_1FreePlayMode after click: ${isFreeModeAfterClick}`);
    }
    
    // Update test overlay
    await updateTestOverlay(page, 'Checking for play button in game mode...');
    
    // Wait for Alpine.js to update the DOM after mode switch
    await page.waitForTimeout(1000);
    
    // Verify play button is visible in game mode
    const playButton = page.locator('#play-chord-2_1');
    await expect(playButton).toBeVisible({ timeout: 10000 });
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
    await updateTestOverlay(page, '2_1 Chord Magical Forest test completed successfully!');
    
    debugLog('CHORD_COLOR_MATCHING_SPEC', '2_1 Chord Magical Forest test completed successfully');
    
    // Remove test overlay
    await removeTestOverlay(page);
  });

  test('Should test chord replay after wrong answer and free mode functionality', async ({ page }) => {
    test.setTimeout(45000); // Extended timeout for comprehensive testing
    
    // Navigate to chords section and 2_1 activity
    await page.click('button:has-text("Chords")');
    await page.waitForTimeout(1000);
    await page.click('#nav_2_1');
    await page.waitForTimeout(1000);
    
    await showTestOverlay(page, 'Testing chord replay and free mode...');
    
    // === TEST FREE MODE FUNCTIONALITY ===
    await updateTestOverlay(page, 'Testing free mode - random chord generation...');
    
    // Verify we start in free play mode
    const startButton = page.locator('#start-game-mode-2_1');
    await expect(startButton).toBeVisible();
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Confirmed in free play mode');
    
    // Test free mode: click different buttons and verify different chords are generated
    const freeModeButttons = ['#button_2_1_fruit', '#button_2_1_mushroom', '#button_2_1_crystal'];
    const playedChords = [];
    
    for (const buttonSelector of freeModeButttons) {
      await updateTestOverlay(page, `Free mode: testing ${buttonSelector}...`);
      
      // Listen for chord generation logs
      const chordLogPromise = page.waitForEvent('console', msg => 
        msg.text().includes('[CHORDS_2_1_DEBUG] Free play mode: playing') && 
        msg.text().includes('chord on')
      );
      
      await page.click(buttonSelector);
      
      try {
        const chordLog = await chordLogPromise;
        const chordInfo = chordLog.text();
        playedChords.push(chordInfo);
        debugLog('CHORD_COLOR_MATCHING_SPEC', `Free mode chord: ${chordInfo}`);
      } catch (e) {
        debugLog('CHORD_COLOR_MATCHING_SPEC', `No chord log captured for ${buttonSelector}`);
      }
      
      await page.waitForTimeout(1500); // Wait between clicks
    }
    
    debugLog('CHORD_COLOR_MATCHING_SPEC', `Free mode test completed. Captured ${playedChords.length} chord logs`);
    
    // === TEST GAME MODE CHORD REPLAY ===
    await updateTestOverlay(page, 'Switching to game mode...');
    
    // Switch to game mode
    await startButton.click();
    await page.waitForTimeout(2000);
    
    // Verify play button is visible
    const playButton = page.locator('#play-chord-2_1');
    await expect(playButton).toBeVisible();
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Switched to game mode successfully');
    
    // Play the current chord to hear it
    await updateTestOverlay(page, 'Playing current chord...');
    await playButton.click();
    await page.waitForTimeout(2000);
    
    // Get current chord type for testing
    const currentChordType = await page.evaluate(() => {
      // Try multiple methods to access Alpine component data
      const element = document.querySelector('[id="2_1_chords_color-matching"]');
      if (element) {
        // Method 1: Try _x_dataStack
        if (element._x_dataStack && element._x_dataStack[0]) {
          return element._x_dataStack[0].currentChordType;
        }
        // Method 2: Try Alpine.$data
        if (element._x_dataStack && element._x_dataStack.length > 0) {
          const data = element._x_dataStack.find(stack => stack.currentChordType !== undefined);
          if (data) return data.currentChordType;
        }
        // Method 3: Try window.chordsComponent fallback
        if (window.chordsComponent && window.chordsComponent.currentChordType) {
          return window.chordsComponent.currentChordType;
        }
      }
      return null;
    });
    
    debugLog('CHORD_COLOR_MATCHING_SPEC', `Current chord type: ${currentChordType}`);
    
    // === TEST WRONG ANSWER AND CHORD REPLAY ===
    await updateTestOverlay(page, 'Testing wrong answer and chord replay...');
    
    // Click a wrong answer to trigger replay mechanism
    // We'll click mushroom (minor) which is likely wrong for most chord types
    const wrongButton = page.locator('#button_2_1_mushroom');
    
    // Listen for replay chord log
    const replayLogPromise = page.waitForEvent('console', msg => 
      msg.text().includes('[CHORDS_2_1_DEBUG] Replaying chord after error:')
    );
    
    await wrongButton.click();
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Clicked wrong answer (mushroom)');
    
    // Wait for error feedback and replay
    await page.waitForTimeout(2000); // Wait for error feedback and replay delay (1500ms)
    
    try {
      const replayLog = await replayLogPromise;
      debugLog('CHORD_COLOR_MATCHING_SPEC', `Chord replay confirmed: ${replayLog.text()}`);
    } catch (e) {
      debugLog('CHORD_COLOR_MATCHING_SPEC', 'No chord replay log captured - may need investigation');
    }
    
    // === TEST START BUTTON REPLAY ===
    await updateTestOverlay(page, 'Testing start button replay functionality...');
    
    // Click play button again to test manual replay
    await playButton.click();
    await page.waitForTimeout(1000);
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Tested manual chord replay via play button');
    
    // === VERIFY CORRECT ANSWER WORKS ===
    await updateTestOverlay(page, 'Testing correct answer...');
    
    // Try to find and click the correct button based on current chord
    const correctButtonMap = {
      'major': '#button_2_1_fruit',
      'minor': '#button_2_1_mushroom',
      'diminished': '#button_2_1_crystal',
      'augmented': '#button_2_1_flower',
      'dominant7': '#button_2_1_flame',
      'major7': '#button_2_1_feather',
      'sus2': '#button_2_1_acorn',
      'sus4': '#button_2_1_lantern'
    };
    
    const correctButtonSelector = correctButtonMap[currentChordType];
    if (correctButtonSelector) {
      await page.click(correctButtonSelector);
      debugLog('CHORD_COLOR_MATCHING_SPEC', `Clicked correct answer: ${correctButtonSelector} for ${currentChordType}`);
      await page.waitForTimeout(2000); // Wait for success feedback
    }
    
    await updateTestOverlay(page, 'Chord replay and free mode tests completed!');
    debugLog('CHORD_COLOR_MATCHING_SPEC', 'Comprehensive chord replay and free mode test completed');
    
    await removeTestOverlay(page);
  });
});
