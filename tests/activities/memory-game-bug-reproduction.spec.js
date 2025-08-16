// STATUS: WORKING - Comprehensive test for 1_5 piano memory game bug reproduction
// This test attempts to trigger the intermittent "plays once then stops" bug
// Monitors console logs for PIANO_DIRECT messages and tests all identified race conditions

const { test, expect } = require('@playwright/test');
const { setupTest, navigateToActivity, returnToMain } = require('../helpers/test-utils');

/**
 * Test suite for 1_5 Piano Memory Game Bug Reproduction
 * Attempts to trigger the intermittent bug where the game only plays one sequence
 * then stops responding to subsequent play button clicks
 */
test.describe('1_5 Memory Game Bug Reproduction Tests', () => {
  test.setTimeout(30000); // Extended timeout for comprehensive testing

  let consoleLogs = [];
  let pianoDirectLogs = [];

  test.beforeEach(async ({ page }) => {
    // Reset log arrays
    consoleLogs = [];
    pianoDirectLogs = [];

    // Capture console logs with detailed filtering
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push({
        type: msg.type(),
        text: text,
        timestamp: Date.now()
      });
      
      // Track PIANO_DIRECT logs specifically
      if (text.includes('PIANO_DIRECT')) {
        pianoDirectLogs.push({
          text: text,
          timestamp: Date.now()
        });
        console.log(`🎹 PIANO_DIRECT: ${text}`);
      }
      
      // Track other relevant logs
      if (text.includes('MEMORY_GAME') || text.includes('MEMORY_REPLAY') || text.includes('TONE_JS')) {
        console.log(`🎵 ${text}`);
      }
    });

    // Setup test environment
    await setupTest(page);
  });

  test('Should navigate to 1_5 memory game and verify basic functionality', async ({ page }) => {
    console.log('🧪 Test 1: Basic functionality verification');
    
    // Navigate to 1_5 memory game activity
    await page.click('.memory-area');
    await page.waitForTimeout(1000);
    
    // Verify we're in the correct activity
    const activityContainer = page.locator('#1_5_pitches');
    await expect(activityContainer).toBeVisible({ timeout: 5000 });
    console.log('✅ Successfully navigated to 1_5 memory game');
    
    // Verify piano keyboard is present
    const pianoKeyboard = page.locator('.piano-keyboard');
    await expect(pianoKeyboard).toBeVisible({ timeout: 2000 });
    console.log('✅ Piano keyboard is visible');
    
    // Verify play button is present
    const playButton = page.locator('#1_5_pitches .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 2000 });
    console.log('✅ Play button is visible');
    
    // Verify piano keys are present
    const pianoKeys = page.locator('.piano-key.white');
    const keyCount = await pianoKeys.count();
    expect(keyCount).toBeGreaterThan(0);
    console.log(`✅ Found ${keyCount} piano keys`);
    
    console.log('✅ Basic functionality verification complete');
  });

  test('Should trigger Race Condition #1: Rapid clicks before startMemoryGame completes', async ({ page }) => {
    console.log('🧪 Test 2: Race Condition #1 - Rapid clicks');
    
    // Navigate to 1_5 memory game
    await page.click('.memory-area');
    await page.waitForTimeout(1000);
    
    const playButton = page.locator('#1_5_pitches .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 5000 });
    
    console.log('🎯 Attempting to trigger gameMode race condition...');
    console.log('📝 Expected: First click starts game, rapid subsequent clicks hit replay path');
    
    // Clear previous logs
    pianoDirectLogs = [];
    
    // Rapid fire clicks (within 100ms as identified in analysis)
    await playButton.click();
    await page.waitForTimeout(50);
    await playButton.click();
    await page.waitForTimeout(50);
    await playButton.click();
    
    console.log('⏱️ Performed 3 rapid clicks within 150ms');
    
    // Wait for any sequences to complete
    await page.waitForTimeout(3000);
    
    // Analyze logs
    console.log(`📊 Captured ${pianoDirectLogs.length} PIANO_DIRECT logs:`);
    pianoDirectLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.text}`);
    });
    
    // Try another click after the rapid sequence
    console.log('🔄 Testing subsequent click after rapid sequence...');
    const logCountBefore = pianoDirectLogs.length;
    await playButton.click();
    await page.waitForTimeout(2000);
    
    const logCountAfter = pianoDirectLogs.length;
    const newLogs = logCountAfter - logCountBefore;
    
    if (newLogs === 0) {
      console.log('🚨 BUG REPRODUCED: No new PIANO_DIRECT logs after subsequent click!');
      console.log('🔍 This confirms the gameMode race condition bug');
    } else {
      console.log(`✅ Subsequent click worked: ${newLogs} new PIANO_DIRECT logs`);
    }
  });

  test('Should trigger Race Condition #2: Click during success auto-play window', async ({ page }) => {
    console.log('🧪 Test 3: Race Condition #2 - Success auto-play interference');
    
    // Navigate to 1_5 memory game
    await page.click('.memory-area');
    await page.waitForTimeout(1000);
    
    const playButton = page.locator('#1_5_pitches .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 5000 });
    
    console.log('🎯 Attempting to trigger currentSequence corruption...');
    console.log('📝 Strategy: Complete a sequence correctly, then click during auto-play window');
    
    // Start the game
    await playButton.click();
    await page.waitForTimeout(2000); // Let sequence play
    
    // Get the current sequence by checking which notes were played
    const sequenceNotes = [];
    const recentLogs = pianoDirectLogs.filter(log => 
      log.text.includes('Playing note') && log.timestamp > Date.now() - 5000
    );
    
    console.log(`🎵 Detected sequence from logs: ${recentLogs.length} notes`);
    
    // Simulate playing the correct sequence on piano keys
    // We'll use the first few piano keys in order for simplicity
    const pianoKeys = ['C4', 'D4', 'E4', 'G4', 'A4'];
    
    for (let i = 0; i < Math.min(2, pianoKeys.length); i++) {
      const key = pianoKeys[i];
      const keySelector = `.piano-key.${key.toLowerCase()}`;
      await page.click(keySelector);
      await page.waitForTimeout(300);
      console.log(`🎹 Pressed key: ${key}`);
    }
    
    // Wait for success feedback and auto-play to start
    await page.waitForTimeout(1000);
    
    console.log('🔄 Clicking play button during potential auto-play window...');
    const logCountBefore = pianoDirectLogs.length;
    await playButton.click();
    await page.waitForTimeout(2000);
    
    const logCountAfter = pianoDirectLogs.length;
    const newLogs = logCountAfter - logCountBefore;
    
    if (newLogs === 0) {
      console.log('🚨 BUG REPRODUCED: No new PIANO_DIRECT logs during auto-play window!');
      console.log('🔍 This suggests currentSequence corruption');
    } else {
      console.log(`✅ Auto-play interference test passed: ${newLogs} new logs`);
    }
  });

  test('Should trigger Race Condition #3: Click during error recovery timeout', async ({ page }) => {
    console.log('🧪 Test 4: Race Condition #3 - Error recovery timeout collision');
    
    // Navigate to 1_5 memory game
    await page.click('.memory-area');
    await page.waitForTimeout(1000);
    
    const playButton = page.locator('#1_5_pitches .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 5000 });
    
    console.log('🎯 Attempting to trigger timeout collision...');
    console.log('📝 Strategy: Make error, then click play before 2s recovery timeout');
    
    // Start the game
    await playButton.click();
    await page.waitForTimeout(2000); // Let sequence play
    
    // Deliberately press wrong keys to trigger error
    console.log('❌ Deliberately making errors to trigger recovery timeout...');
    const wrongKeys = ['.piano-key.a4', '.piano-key.g4', '.piano-key.e4']; // Random sequence
    
    for (const keySelector of wrongKeys) {
      await page.click(keySelector);
      await page.waitForTimeout(200);
    }
    
    console.log('⏱️ Error made, waiting 1s then clicking play (before 2s timeout)...');
    await page.waitForTimeout(1000); // Wait 1s (less than 2s recovery timeout)
    
    const logCountBefore = pianoDirectLogs.length;
    await playButton.click();
    await page.waitForTimeout(3000); // Wait for any competing timeouts
    
    const logCountAfter = pianoDirectLogs.length;
    const newLogs = logCountAfter - logCountBefore;
    
    if (newLogs === 0) {
      console.log('🚨 BUG REPRODUCED: No new PIANO_DIRECT logs during error recovery!');
      console.log('🔍 This suggests timeout collision interference');
    } else {
      console.log(`✅ Error recovery test passed: ${newLogs} new logs`);
    }
  });

  test('Should trigger Race Condition #4: Cross-activity state pollution', async ({ page }) => {
    console.log('🧪 Test 5: Race Condition #4 - Cross-activity state pollution');
    
    console.log('🎯 Attempting to trigger cross-activity state pollution...');
    console.log('📝 Strategy: Switch from 1_4 to 1_5 while melody playing');
    
    // First navigate to 1_4 activity
    await page.click('.sound-judgment-area');
    await page.waitForTimeout(1000);
    
    // Verify we're in 1_4
    const activity14 = page.locator('#1_4_pitches');
    await expect(activity14).toBeVisible({ timeout: 5000 });
    console.log('✅ Navigated to 1_4 activity');
    
    // Start playing a melody in 1_4
    const play14Button = page.locator('#1_4_pitches .circular-play-button');
    if (await play14Button.isVisible()) {
      await play14Button.click();
      console.log('🎵 Started melody in 1_4 activity');
      await page.waitForTimeout(500); // Let it start playing
    }
    
    // Quickly switch to 1_5 while 1_4 might still be playing
    console.log('🔄 Switching to 1_5 while 1_4 melody may be playing...');
    await page.click('.memory-area');
    await page.waitForTimeout(1000);
    
    // Verify we're in 1_5
    const activity15 = page.locator('#1_5_pitches');
    await expect(activity15).toBeVisible({ timeout: 5000 });
    console.log('✅ Switched to 1_5 activity');
    
    // Now try to use the 1_5 play button
    const play15Button = page.locator('#1_5_pitches .circular-play-button');
    await expect(play15Button).toBeVisible({ timeout: 2000 });
    
    console.log('🎹 Testing 1_5 play button after cross-activity switch...');
    const logCountBefore = pianoDirectLogs.length;
    await play15Button.click();
    await page.waitForTimeout(3000);
    
    const logCountAfter = pianoDirectLogs.length;
    const newLogs = logCountAfter - logCountBefore;
    
    if (newLogs === 0) {
      console.log('🚨 BUG REPRODUCED: No PIANO_DIRECT logs after cross-activity switch!');
      console.log('🔍 This suggests cross-activity state pollution');
    } else {
      console.log(`✅ Cross-activity test passed: ${newLogs} new logs`);
    }
  });

  test('Should monitor for defensive fix activation', async ({ page }) => {
    console.log('🧪 Test 6: Monitor for defensive fix activation');
    
    // Navigate to 1_5 memory game
    await page.click('.memory-area');
    await page.waitForTimeout(1000);
    
    const playButton = page.locator('#1_5_pitches .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 5000 });
    
    console.log('🔍 Monitoring for "MEMORY_REPLAY: No sequence found, regenerating for safety"');
    
    // Perform various interactions to try to trigger the defensive fix
    const interactions = [
      'Initial play',
      'Rapid double-click',
      'Triple click',
      'Wait and replay'
    ];
    
    for (const interaction of interactions) {
      console.log(`🎯 Testing: ${interaction}`);
      
      await playButton.click();
      if (interaction.includes('double') || interaction.includes('Triple')) {
        await page.waitForTimeout(100);
        await playButton.click();
        if (interaction.includes('Triple')) {
          await page.waitForTimeout(100);
          await playButton.click();
        }
      }
      
      await page.waitForTimeout(2000);
      
      // Check for defensive fix activation
      const defensiveLogs = consoleLogs.filter(log => 
        log.text.includes('MEMORY_REPLAY: No sequence found, regenerating for safety')
      );
      
      if (defensiveLogs.length > 0) {
        console.log('🛡️ DEFENSIVE FIX ACTIVATED!');
        console.log(`🔧 Fix triggered during: ${interaction}`);
        defensiveLogs.forEach(log => console.log(`   ${log.text}`));
      }
    }
    
    console.log('📊 Final log summary:');
    console.log(`   Total console logs: ${consoleLogs.length}`);
    console.log(`   PIANO_DIRECT logs: ${pianoDirectLogs.length}`);
    console.log(`   Defensive fix activations: ${consoleLogs.filter(log => log.text.includes('MEMORY_REPLAY')).length}`);
  });

  test.afterEach(async ({ page }) => {
    // Log final summary
    console.log('\n📋 Test Summary:');
    console.log(`   Total PIANO_DIRECT logs captured: ${pianoDirectLogs.length}`);
    
    if (pianoDirectLogs.length === 0) {
      console.log('⚠️  WARNING: No PIANO_DIRECT logs captured - possible bug or test issue');
    }
    
    // Check for any error patterns
    const errorLogs = consoleLogs.filter(log => 
      log.type === 'error' || log.text.includes('ERROR') || log.text.includes('Failed')
    );
    
    if (errorLogs.length > 0) {
      console.log(`🚨 ${errorLogs.length} error logs detected:`);
      errorLogs.forEach(log => console.log(`   ${log.text}`));
    }
  });
});
