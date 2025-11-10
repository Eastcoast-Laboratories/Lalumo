const { test, expect } = require('@playwright/test');

/**
 * Test: Verify that intro messages play correctly when navigating via shortcuts
 * 
 * This test simulates clicking on Android shortcuts and verifies that:
 * 1. The correct activity is opened
 * 2. The correct intro message is played (not always 1_1)
 */

test.describe('Shortcut Intro Messages', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:9091/app/');
    
    // Wait for Alpine.js to be ready
    await page.waitForFunction(() => window.Alpine !== undefined);
    
    // Wait for the loading overlay to be visible
    await page.waitForSelector('#loading-overlay', { state: 'visible', timeout: 5000 });
  });

  test('Activity 1_4 shortcut plays correct intro message', async ({ page }) => {
    // Set hash to 1_4 (simulating shortcut click)
    await page.evaluate(() => {
      window.location.hash = '1_4';
    });
    
    // Wait a moment for hash to be set
    await page.waitForTimeout(100);
    
    // Listen for console logs to capture intro message
    const introMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AUDIO_SYSTEM') || text.includes('LOG_INTRO_MESSAGE') || text.includes('showActivityIntroMessage')) {
        introMessages.push(text);
      }
    });
    
    // Click on the loading overlay to close it (simulating shortcut screen close)
    await page.click('#loading-overlay');
    
    // Wait for the activity to load
    await page.waitForTimeout(2000);
    
    // Check that we navigated to activity 1_4
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#1_4');
    
    // Check console logs for correct activity mode
    const relevantLogs = introMessages.join('\n');
    console.log('Captured intro message logs:', relevantLogs);
    
    // Verify that 1_4 intro message was called, not 1_1
    expect(relevantLogs).toContain('1_4_pitches_does-it-sound-right');
    expect(relevantLogs).not.toContain('playing intro for: 1_1_pitches_high_or_low');
  });

  test('Activity 2_1 shortcut plays correct intro message', async ({ page }) => {
    // Set hash to 2_1 (simulating shortcut click)
    await page.evaluate(() => {
      window.location.hash = '2_1';
    });
    
    // Wait a moment for hash to be set
    await page.waitForTimeout(100);
    
    // Listen for console logs to capture intro message
    const introMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AUDIO_SYSTEM') || text.includes('LOG_INTRO_MESSAGE') || text.includes('showActivityIntroMessage')) {
        introMessages.push(text);
      }
    });
    
    // Click on the loading overlay to close it (simulating shortcut screen close)
    await page.click('#loading-overlay');
    
    // Wait for the activity to load
    await page.waitForTimeout(2000);
    
    // Check that we navigated to activity 2_1
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#2_1');
    
    // Check console logs for correct activity mode
    const relevantLogs = introMessages.join('\n');
    console.log('Captured intro message logs:', relevantLogs);
    
    // Verify that 2_1 intro message was called, not 1_1
    expect(relevantLogs).toContain('2_1_chords_color-matching');
    expect(relevantLogs).not.toContain('playing intro for: 1_1_pitches_high_or_low');
  });

  test('Activity 1_5 shortcut plays correct intro message', async ({ page }) => {
    // Set hash to 1_5 (simulating shortcut click)
    await page.evaluate(() => {
      window.location.hash = '1_5';
    });
    
    // Wait a moment for hash to be set
    await page.waitForTimeout(100);
    
    // Listen for console logs to capture intro message
    const introMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AUDIO_SYSTEM') || text.includes('LOG_INTRO_MESSAGE') || text.includes('showActivityIntroMessage')) {
        introMessages.push(text);
      }
    });
    
    // Click on the loading overlay to close it (simulating shortcut screen close)
    await page.click('#loading-overlay');
    
    // Wait for the activity to load
    await page.waitForTimeout(2000);
    
    // Check that we navigated to activity 1_5
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#1_5');
    
    // Check console logs for correct activity mode
    const relevantLogs = introMessages.join('\n');
    console.log('Captured intro message logs:', relevantLogs);
    
    // Verify that 1_5 intro message was called, not 1_1
    expect(relevantLogs).toContain('1_5_pitches_memory');
    expect(relevantLogs).not.toContain('playing intro for: 1_1_pitches_high_or_low');
  });
});
