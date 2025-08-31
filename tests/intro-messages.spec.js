/**
 * Playwright test for intro messages across all activities in Lalumo app
 * Tests that intro messages are properly displayed when entering activities
 */

const { test, expect } = require('@playwright/test');
const { setupTest, debugLog, showTestOverlay, updateTestOverlay, removeTestOverlay } = require('./helpers/test-utils');

/**
 * Test suite for intro messages across all activities
 */
test.describe('Lalumo Intro Messages Tests', () => {
  // Set global timeout
  test.setTimeout(20000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should display intro messages for pitches activities (1_1 to 1_5)', async ({ page }) => {
    const pitchesActivities = [
      { id: '1_1', mode: '1_1_pitches_high_or_low', expectedLog: '1_1_pitches_high_or_low' },
      { id: '1_2', mode: '1_2_pitches_match-sounds', expectedLog: '1_2_pitches_match-sounds' }
      // Note: 1_3, 1_4, 1_5 are locked by default and require progress to unlock
    ];

    await showTestOverlay(page, 'Testing Pitches Intro Messages');

    for (const activity of pitchesActivities) {
      console.log(`Testing intro message for pitches activity: ${activity.mode}`);
      await updateTestOverlay(page, `Testing ${activity.mode} intro message`);
      
      // Clear debug logs before navigating
      await page.evaluate(() => {
        if (window.debugLogs) window.debugLogs.length = 0;
      });
      
      // Navigate to pitches section first
      await page.click('button:has-text("Pitches")');
      await page.waitForTimeout(500);
      
      // Collect console logs during navigation
      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.type() === 'log') {
          consoleLogs.push(msg.text());
        }
      });
      
      // Navigate to specific activity
      await page.click(`a[href="#${activity.id}"]`);
      await page.waitForTimeout(2000); // Wait for intro message to be triggered
      
      // Look for showFeedbackMessage with isIntroMessage: true in console logs
      const introMessageLog = consoleLogs.find(log => 
        log.includes('showFeedbackMessage') && 
        log.includes('isIntroMessage: true') &&
        (log.includes(activity.expectedLog) || log.includes(activity.expectedLog + '_stage') || log.includes(activity.expectedLog + '_practice'))
      );
      
      expect(introMessageLog, `Intro message should be logged for ${activity.mode}`).toBeTruthy();
      console.log(`✓ Found intro message log for ${activity.mode}: ${introMessageLog}`);
    }

    await removeTestOverlay(page);
  });

  test('Should display intro messages for chords activities (2_1 to 2_6)', async ({ page }) => {
    const chordsActivities = [
      { id: '2_1', mode: '2_1_chords_color-matching', expectedLog: '2_1_chords_color-matching' },
      { id: '2_2', mode: '2_2_chords_stable_unstable', expectedLog: '2_2_chords_stable_unstable' },
      { id: '2_3', mode: '2_3_chords_chord-building', expectedLog: '2_3_chords_chord-building' },
      { id: '2_4', mode: '2_4_chords_missing-note', expectedLog: '2_4_chords_missing-note' },
      { id: '2_6', mode: '2_6_chords_harmony-gardens', expectedLog: '2_6_chords_harmony-gardens' }
      // Note: 2_5 is locked by default and requires progress to unlock
    ];

    await showTestOverlay(page, 'Testing Chords Intro Messages');

    for (const activity of chordsActivities) {
      console.log(`Testing intro message for chords activity: ${activity.mode}`);
      await updateTestOverlay(page, `Testing ${activity.mode} intro message`);
      
      // Clear debug logs before navigating
      await page.evaluate(() => {
        if (window.debugLogs) window.debugLogs.length = 0;
      });
      
      // Navigate to chords section first
      await page.click('button:has-text("Chords")');
      await page.waitForTimeout(500);
      
      // Collect console logs during navigation
      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.type() === 'log') {
          consoleLogs.push(msg.text());
        }
      });
      
      // Navigate to specific activity
      await page.click(`a[href="#${activity.id}"]`);
      await page.waitForTimeout(2000); // Wait for intro message to be triggered
      
      // Look for showFeedbackMessage with isIntroMessage: true in console logs
      const introMessageLog = consoleLogs.find(log => 
        log.includes('showFeedbackMessage') && 
        log.includes('isIntroMessage: true') &&
        log.includes(activity.expectedLog)
      );
      
      if (introMessageLog) {
        console.log(`✓ Found intro message log for ${activity.mode}: ${introMessageLog}`);
      } else {
        console.log(`✗ No intro message found for ${activity.mode}`);
        console.log('Available logs:', consoleLogs.filter(log => log.includes('showFeedbackMessage')));
      }
      
      expect(introMessageLog, `Intro message should be logged for ${activity.mode}`).toBeTruthy();
    }

    await removeTestOverlay(page);
  });

  test('Should verify intro message content and timing', async ({ page }) => {
    await showTestOverlay(page, 'Testing Intro Message Content');
    
    // Test one activity in detail to verify message content and timing
    const testActivity = { id: '1_1', mode: '1_1_pitches_high_or_low' };
    
    // Clear debug logs
    await page.evaluate(() => {
      if (window.debugLogs) window.debugLogs.length = 0;
    });
    
    // Navigate to activity
    await page.click('button:has-text("Pitches")');
    await page.waitForTimeout(500);
    await page.click(`a[href="#${testActivity.id}"]`);
    await page.waitForTimeout(1000);
    
    // Check that feedback message is visible
    const feedbackVisible = await page.isVisible('.feedback-message');
    expect(feedbackVisible, 'Feedback message should be visible').toBeTruthy();
    
    // Check message content
    const messageText = await page.textContent('.feedback-message');
    expect(messageText, 'Message should contain activity-specific text').toBeTruthy();
    expect(messageText.length, 'Message should not be empty').toBeGreaterThan(0);
    
    console.log(`✓ Intro message content verified: "${messageText}"`);
    
    // Verify auto-hide timing (should hide after 10 seconds)
    await page.waitForTimeout(11000); // Wait slightly longer than 10 seconds
    const feedbackHidden = await page.isVisible('.feedback-message');
    expect(feedbackHidden, 'Feedback message should auto-hide after 10 seconds').toBeFalsy();
    
    console.log('✓ Auto-hide timing verified');
    
    await removeTestOverlay(page);
  });
});
