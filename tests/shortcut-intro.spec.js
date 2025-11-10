const { test, expect } = require('@playwright/test');

/**
 * Test: Verify that intro messages play correctly when navigating via shortcuts
 */

test.describe('Shortcut Intro Messages', () => {
  test('Activity 1_4 shortcut plays correct intro message', async ({ page }) => {
    // Navigate to the app with hash
    await page.goto('http://localhost:9091/app/#1_4');
    
    // Wait for Alpine.js to be ready
    await page.waitForFunction(() => window.Alpine !== undefined, { timeout: 5000 });
    
    // Collect console logs
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AUDIO_SYSTEM') || text.includes('Hash navigation detected')) {
        logs.push(text);
      }
    });
    
    // Wait for loading overlay
    await page.waitForSelector('#loading-overlay', { state: 'visible', timeout: 5000 });
    
    // Click to close loading overlay
    await page.click('#loading-overlay');
    
    // Wait for activity to load
    await page.waitForTimeout(1500);
    
    // Check hash
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#1_4');
    
    // Check logs
    const allLogs = logs.join('\n');
    console.log('Logs:', allLogs);
    
    // Should detect hash navigation for 1_4
    expect(allLogs).toContain('1_4');
    expect(allLogs).toContain('1_4_pitches_does-it-sound-right');
  });
});
