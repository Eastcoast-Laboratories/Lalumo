/**
 * Playwright test for 2_3 Chord Building activity in Lalumo app
 * Based on chord-color-matching.spec.js structure
 */

const { test, expect } = require('@playwright/test');
const { setupTest, debugLog, checkElementVisibility, showTestOverlay, updateTestOverlay, removeTestOverlay } = require('../helpers/test-utils');

/**
 * Test suite for 2_3 Chord Building activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo 2_3 Chord Building Activity Tests', () => {
  // Set global timeout
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to 2_3 Chord Building activity and test chord building functionality', async ({ page }) => {
    // Increase test timeout to 30 seconds for audio interactions
    test.setTimeout(30000);
    
    // First navigate to chords section by clicking the main chords tab
    await page.click('button:has-text("Chords")');
    await page.waitForTimeout(1000);
    
    // Then navigate to 2_3 Chord Building activity
    await page.click('#nav_2_3');
    await page.waitForTimeout(1000);
    
    // Show test overlay using DRY implementation
    await showTestOverlay(page, 'Starting 2_3 Chord Building test...');
    
    // Verify we're in the correct activity
    const activityContainer = page.locator('[id="2_3_chords_chord-building"]');
    await expect(activityContainer).toBeVisible();
    debugLog('CHORD_BUILDING_SPEC', 'Successfully navigated to 2_3 chord building activity');
    
    // Update test overlay
    await updateTestOverlay(page, 'Checking for help message...');
    
    // Wait for help message to appear (should show automatically)
    await page.waitForTimeout(2000);
    
    // Check if help message is visible
    const helpMessage = page.locator('.feedback-message');
    if (await helpMessage.isVisible()) {
      debugLog('CHORD_BUILDING_SPEC', 'Help message is visible');
      
      // Check help message content
      const helpText = await helpMessage.textContent();
      expect(helpText).toContain('Stapele Blöcke');
      debugLog('CHORD_BUILDING_SPEC', 'Help message contains expected German text');
      
      // Close help message by clicking close button
      const closeButton = page.locator('.feedback-close-button');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        debugLog('CHORD_BUILDING_SPEC', 'Closed help message');
        await page.waitForTimeout(500);
      }
    }
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing note button functionality...');
    
    // Check that chord blocks container exists
    const chordBlocks = page.locator('.chord-blocks');
    await expect(chordBlocks).toBeVisible();
    debugLog('CHORD_BUILDING_SPEC', 'Chord blocks container is visible');
    
    // Check that note selector exists
    const noteSelector = page.locator('.note-selector');
    await expect(noteSelector).toBeVisible();
    debugLog('CHORD_BUILDING_SPEC', 'Note selector is visible');
    
    // Test clicking Root note button (use more specific selector)
    const rootButton = page.locator('[id="2_3_chords_chord-building"] button:has-text("Root")');
    await expect(rootButton).toBeVisible();
    await rootButton.click();
    await page.waitForTimeout(1000);
    debugLog('CHORD_BUILDING_SPEC', 'Clicked Root note button');
    
    // Check if root button becomes active
    const rootButtonActive = await rootButton.getAttribute('class');
    expect(rootButtonActive).toContain('active');
    debugLog('CHORD_BUILDING_SPEC', 'Root button shows active state');
    
    // Test clicking Major 3rd note button (use more specific selector)
    const majorThirdButton = page.locator('[id="2_3_chords_chord-building"] button:has-text("Major 3rd")');
    await expect(majorThirdButton).toBeVisible();
    await majorThirdButton.click();
    await page.waitForTimeout(1000);
    debugLog('CHORD_BUILDING_SPEC', 'Clicked Major 3rd note button');
    
    // Test clicking Perfect 5th note button (use more specific selector)
    const perfectFifthButton = page.locator('[id="2_3_chords_chord-building"] button:has-text("Perfect 5th")');
    await expect(perfectFifthButton).toBeVisible();
    await perfectFifthButton.click();
    await page.waitForTimeout(1000);
    debugLog('CHORD_BUILDING_SPEC', 'Clicked Perfect 5th note button');
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing play chord functionality...');
    
    // Listen for audio-related console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('CHORDS_AUDIO') || text.includes('INSTRUMENT') || text.includes('AUDIO_ENGINE') || text.includes('CHORDS_2_3')) {
        console.log(`[AUDIO_LOG] ${text}`);
      }
    });

    // Test play button functionality
    const playButton = page.locator('#play-chord-2_3');
    await expect(playButton).toBeVisible();
    
    // Check component state before playing
    const componentState = await page.evaluate(() => {
      const component = window.Alpine ? window.Alpine.$data(document.querySelector('[x-data*="chords"]')) : null;
      return {
        componentExists: !!component,
        builtNotes: component ? component.builtNotes : null,
        playChordFromIntervals: component ? typeof component.playChordFromIntervals : 'N/A',
        audioEngineExists: !!window.audioEngine,
        audioEnginePlayChord: window.audioEngine ? typeof window.audioEngine.playChord : 'N/A'
      };
    });
    
    console.log('[COMPONENT_STATE]', JSON.stringify(componentState, null, 2));
    
    await playButton.click();
    await page.waitForTimeout(3000);
    debugLog('CHORD_BUILDING_SPEC', 'Clicked play chord button - checking audio logs');
    
    // Check audio engine status
    const audioEngineStatus = await page.evaluate(() => {
      return {
        audioEngineExists: !!window.audioEngine,
        audioEngineInitialized: window.audioEngine ? window.audioEngine._isInitialized : false,
        toneContextState: window.Tone ? window.Tone.context.state : 'not available'
      };
    });
    
    console.log('[AUDIO_STATUS]', JSON.stringify(audioEngineStatus, null, 2));
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing note toggle functionality...');
    
    // Test toggling off a note (click Root again)
    await rootButton.click();
    await page.waitForTimeout(1000);
    debugLog('CHORD_BUILDING_SPEC', 'Toggled Root note off');
    
    // Check if root button is no longer active
    const rootButtonInactive = await rootButton.getAttribute('class');
    expect(rootButtonInactive).not.toContain('active');
    debugLog('CHORD_BUILDING_SPEC', 'Root button no longer shows active state');
    
    // Test playing chord with remaining notes
    await playButton.click();
    await page.waitForTimeout(2000);
    debugLog('CHORD_BUILDING_SPEC', 'Played chord with remaining notes');
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing complete chord building cycle...');
    
    // Build a complete major chord (Root, Major 3rd, Perfect 5th)
    await rootButton.click(); // Add root back
    await page.waitForTimeout(500);
    
    // Verify all three buttons are active
    const allActiveButtons = await page.locator('.note-button.active').count();
    expect(allActiveButtons).toBe(3);
    debugLog('CHORD_BUILDING_SPEC', 'Built complete major chord with 3 notes');
    
    // Final play test
    await playButton.click();
    await page.waitForTimeout(2000);
    debugLog('CHORD_BUILDING_SPEC', 'Final chord play test completed');
    
    // Update test overlay
    await updateTestOverlay(page, 'All tests completed successfully!');
    
    debugLog('CHORD_BUILDING_SPEC', 'Comprehensive chord building test completed');
    
    // Remove test overlay
    await removeTestOverlay(page);
  });
});
