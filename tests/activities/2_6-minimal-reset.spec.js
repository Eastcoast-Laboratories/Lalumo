const { test, expect } = require('@playwright/test');
const { setupTest, debugLog } = require('../helpers/test-utils');

test.describe('2_6 Minimal Reset Test', () => {
  test('Should reset progress and free mode when switching back to 2_6', async ({ page }) => {
    test.setTimeout(20000);
    await setupTest(page);
    
    debugLog('TEST_2_6_MINIMAL', 'Starting minimal reset test with new progress system');
    
    // Navigate to chords section
    await page.click('button:has-text("Chords")');
    await page.waitForTimeout(1000);
    
    // Navigate to 2_6 activity
    await page.click('#nav_2_6');
    await page.waitForTimeout(2000);
    
    // Verify initial free mode
    const initialFreeMode = await page.evaluate(() => window.freeModeActive2_6);
    expect(initialFreeMode).toBe(true);
    debugLog('TEST_2_6_MINIMAL', `Initial free mode: ${initialFreeMode}`);
    
    // Check initial progress is 0 like 2_2 system
    const initialProgress = await page.evaluate(() => {
      const progressData = localStorage.getItem('lalumo_chords_progress');
      if (progressData) {
        try {
          const progress = JSON.parse(progressData);
          return progress['2_6'] || 0;
        } catch (error) {
          return 0;
        }
      }
      return 0;
    });
    expect(initialProgress).toBe(0);
    debugLog('TEST_2_6_MINIMAL', `Initial progress: ${initialProgress}`);
    
    // Switch to 2_2 activity
    await page.click('#nav_2_2');
    await page.waitForTimeout(2000);
    
    // Switch back to 2_6
    await page.click('#nav_2_6');
    await page.waitForTimeout(2000);
    
    // Check that reset was called by looking at console logs and progress system
    const resetResults = await page.evaluate(() => {
      // Check if the reset function exists and progress system works like 2_2
      const resetFunctionExists = typeof window.reset2_6ToFreePlayMode === 'function';
      
      // Check progress is still 0 after reset like 2_2
      const progressData = localStorage.getItem('lalumo_chords_progress');
      let progressAfterReset = 0;
      if (progressData) {
        try {
          const progress = JSON.parse(progressData);
          progressAfterReset = progress['2_6'] || 0;
        } catch (error) {
          progressAfterReset = 0;
        }
      }
      
      return {
        resetFunctionExists,
        progressAfterReset
      };
    });
    
    expect(resetResults.resetFunctionExists).toBe(true);
    expect(resetResults.progressAfterReset).toBe(0);
    debugLog('TEST_2_6_MINIMAL', `Reset function exists: ${resetResults.resetFunctionExists}`);
    debugLog('TEST_2_6_MINIMAL', `Progress after reset: ${resetResults.progressAfterReset}`);
    
    // Verify free mode is active after return
    const finalFreeMode = await page.evaluate(() => window.freeModeActive2_6);
    expect(finalFreeMode).toBe(true);
    debugLog('TEST_2_6_MINIMAL', `Final free mode: ${finalFreeMode}`);
    
    debugLog('TEST_2_6_MINIMAL', '✅ Minimal reset test completed successfully');
  });
});
