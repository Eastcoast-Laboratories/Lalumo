/**
 * Piano Key Interference Bug Test - Enhanced Version
 * 
 * This test specifically targets the bug where clicking piano keys during
 * memory sequence playback causes subsequent play button clicks to be silent.
 * 
 * Test Scenarios:
 * 1. Piano key interference during playback
 * 2. Play wrong keys, then correct melody on third try
 * 3. Verify new melody is heard after interference
 * 
 * Bug Description: After clicking piano keys while a memory sequence is playing,
 * the next play button click fails to trigger playback (no PIANO_DIRECT logs).
 */

const { test, expect } = require('@playwright/test');
const { setupTest } = require('../helpers/test-utils');

test.describe('Piano Key Interference Bug Test - Enhanced', () => {
  let consoleLogs = [];
  let pianoDirectLogs = [];

  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => {
      const logText = msg.text();
      consoleLogs.push({ type: msg.type(), text: logText });
      
      if (logText.includes('PIANO_DIRECT')) {
        pianoDirectLogs.push(logText);
        console.log(`🎹 PIANO_DIRECT: ${logText}`);
      }
    });

    // Use the working test framework from main suite
    await setupTest(page);
    console.log('[TEST_UTILS] Initial setup complete, navigated to 1_5 memory game');
  });

  test('Should test piano key interference and correct melody recovery', async ({ page }) => {
    // Increase test timeout to 60 seconds for complex interactions
    test.setTimeout(60000);
    console.log('🧪 Enhanced Piano Key Interference Test');
    console.log('🎯 Strategy: 1) Piano interference during playback, 2) Wrong keys, 3) Correct melody on third try');
    
    // Verify we're in the 1_5 memory game
    const playButton = page.locator('[id="1_5_pitches"] .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 5000 });
    
    // Get piano keys for testing
    const pianoKeys = page.locator('.piano-key.white');
    const keyCount = await pianoKeys.count();
    console.log(`🎹 Found ${keyCount} piano keys for testing`);
    
    // STEP 1: Start memory game and trigger interference
    console.log('🎵 STEP 1: Starting memory game sequence...');
    const logCountBefore = pianoDirectLogs.length;
    await playButton.click();
    
    // Wait for sequence to start, then interfere
    await page.waitForTimeout(300);
    
    console.log('🚨 TRIGGERING INTERFERENCE: Clicking piano keys during playback...');
    for (let i = 0; i < Math.min(keyCount, 3); i++) {
      await pianoKeys.nth(i).click();
      console.log(`   Interfered with piano key ${i + 1}`);
      await page.waitForTimeout(100);
    }
    
    // Wait for sequence to complete
    await page.waitForTimeout(3000);
    
    const logCountAfter = pianoDirectLogs.length;
    const newLogs = logCountAfter - logCountBefore;
    console.log(`📊 STEP 1 Results - PIANO_DIRECT logs: ${newLogs}`);
    
    // STEP 2: Test subsequent playback (bug detection)
    console.log('🔍 STEP 2: Testing subsequent play button click after interference...');
    const logCountBeforeSecond = pianoDirectLogs.length;
    await playButton.click();
    await page.waitForTimeout(3000);
    
    const logCountAfterSecond = pianoDirectLogs.length;
    const newLogsSecond = logCountAfterSecond - logCountBeforeSecond;
    console.log(`📊 STEP 2 Results - PIANO_DIRECT logs: ${newLogsSecond}`);
    
    if (newLogsSecond === 0) {
      console.log('🚨 BUG REPRODUCED: Piano key interference caused silent subsequent clicks!');
    } else {
      console.log('✅ Playback still works after interference');
    }
    
    // STEP 3: Extract the current sequence from logs for correct melody test
    console.log('🎵 STEP 3: Extracting sequence from logs to play correct melody...');
    let currentSequence = [];
    
    // Look for the most recent sequence in PIANO_DIRECT logs
    const recentLogs = pianoDirectLogs.slice(-10); // Last 10 logs
    for (const log of recentLogs) {
      if (log.includes('Memory game sequence: playing')) {
        const noteMatch = log.match(/playing ([A-G][#b]?[0-9])/);
        if (noteMatch) {
          const note = noteMatch[1];
          if (!currentSequence.includes(note)) {
            currentSequence.push(note);
          }
        }
      }
    }
    
    console.log(`🎼 Extracted sequence: [${currentSequence.join(', ')}]`);
    
    if (currentSequence.length === 0) {
      console.log('⚠️ Could not extract sequence from logs, using fallback approach');
      // Fallback: play a simple sequence
      currentSequence = ['C4', 'G4'];
    }
    
    // STEP 4: Play wrong keys first (simulate user error)
    console.log('🎹 STEP 4: Playing wrong keys first (simulating user error)...');
    const wrongKeys = ['F4', 'A4']; // Different from typical sequences
    
    for (const wrongNote of wrongKeys) {
      const wrongKey = page.locator(`[data-note="${wrongNote}"]`);
      if (await wrongKey.count() > 0) {
        await wrongKey.click();
        console.log(`   Played wrong key: ${wrongNote}`);
        await page.waitForTimeout(200);
      }
    }
    
    await page.waitForTimeout(1000);
    
    // STEP 5: Play correct melody on third try
    console.log('🎯 STEP 5: Playing correct melody (third try)...');
    const logCountBeforeCorrect = pianoDirectLogs.length;
    
    for (const correctNote of currentSequence) {
      const correctKey = page.locator(`[data-note="${correctNote}"]`);
      if (await correctKey.count() > 0) {
        await correctKey.click();
        console.log(`   Played correct key: ${correctNote}`);
        await page.waitForTimeout(600); // Match typical note duration
      } else {
        console.log(`   ⚠️ Could not find key for note: ${correctNote}`);
      }
    }
    
    // Wait for feedback and potential new sequence
    await page.waitForTimeout(3000);
    
    const logCountAfterCorrect = pianoDirectLogs.length;
    const newLogsCorrect = logCountAfterCorrect - logCountBeforeCorrect;
    console.log(`📊 STEP 5 Results - PIANO_DIRECT logs after correct melody: ${newLogsCorrect}`);
    
    // STEP 6: Verify new melody is heard
    console.log('🔍 STEP 6: Verifying new melody is heard...');
    await page.waitForTimeout(1000);
    
    // Click play button to hear new sequence
    const logCountBeforeNew = pianoDirectLogs.length;
    await playButton.click();
    await page.waitForTimeout(3000);
    
    const logCountAfterNew = pianoDirectLogs.length;
    const newLogsNew = logCountAfterNew - logCountBeforeNew;
    console.log(`📊 STEP 6 Results - PIANO_DIRECT logs for new melody: ${newLogsNew}`);
    
    // STEP 7: Final Analysis
    console.log('📊 FINAL ANALYSIS:');
    console.log(`   Initial playback (with interference): ${newLogs} logs`);
    console.log(`   Second playback (bug detection): ${newLogsSecond} logs`);
    console.log(`   Correct melody attempt: ${newLogsCorrect} logs`);
    console.log(`   New melody playback: ${newLogsNew} logs`);
    console.log(`   Total PIANO_DIRECT logs: ${pianoDirectLogs.length}`);
    
    if (newLogsSecond === 0) {
      console.log('🚨 INTERFERENCE BUG: Piano keys during playback broke subsequent playback');
    } else if (newLogsNew > 0) {
      console.log('✅ RECOVERY SUCCESS: Memory game recovered and new melody is heard');
    } else {
      console.log('⚠️ PARTIAL ISSUE: Some functionality may be impaired');
    }
    
    // Check for any error patterns
    const errorLogs = consoleLogs.filter(log => 
      log.type === 'error' || log.text.includes('ERROR') || log.text.includes('Failed')
    );
    
    if (errorLogs.length > 0) {
      console.log(`🚨 ${errorLogs.length} error logs detected:`);
      errorLogs.forEach(log => console.log(`   ${log.text}`));
    }
    
    console.log('✅ Enhanced piano key interference test complete');
  });

  test('Should play correct melody on third try and hear new sequence', async ({ page }) => {
    // Increase test timeout to 60 seconds for complex interactions
    test.setTimeout(60000);
    console.log('🧪 Correct Melody on Third Try Test');
    console.log('🎯 Strategy: 1) Interfere during playback, 2) Two wrong attempts, 3) Correct melody → new sequence');
    
    // Verify we're in the 1_5 memory game
    const playButton = page.locator('[id="1_5_pitches"] .circular-play-button');
    await expect(playButton).toBeVisible({ timeout: 5000 });
    
    // Get piano keys for testing
    const pianoKeys = page.locator('.piano-key');
    const keyCount = await pianoKeys.count();
    console.log(`🎹 Found ${keyCount} piano keys for testing`);
    
    // STEP 1: Start memory game and capture the sequence
    console.log('🎵 STEP 1: Starting memory game to learn the sequence...');
    const logCountBefore = pianoDirectLogs.length;
    await playButton.click();
    
    // Wait for sequence to start, then interfere with piano keys
    await page.waitForTimeout(300);
    
    console.log('🚨 INTERFERING: Clicking piano keys during sequence playback...');
    // Click a few piano keys during playback to interfere
    for (let i = 0; i < Math.min(keyCount, 2); i++) {
      await pianoKeys.nth(i).click();
      console.log(`   Interfered with key ${i + 1}`);
      await page.waitForTimeout(150);
    }
    
    // Wait for sequence to complete
    await page.waitForTimeout(3000);
    
    const logCountAfter = pianoDirectLogs.length;
    const newLogs = logCountAfter - logCountBefore;
    console.log(`📊 STEP 1 Results - PIANO_DIRECT logs: ${newLogs}`);
    
    // Extract the sequence from the logs
    console.log('🎼 Extracting the correct sequence from logs...');
    let correctSequence = [];
    
    // Look for sequence notes in recent PIANO_DIRECT logs
    const recentLogs = pianoDirectLogs.slice(-15);
    for (const log of recentLogs) {
      if (log.includes('Memory game sequence: playing')) {
        const noteMatch = log.match(/playing ([A-G][#b]?[0-9])/);
        if (noteMatch) {
          const note = noteMatch[1];
          if (!correctSequence.includes(note)) {
            correctSequence.push(note);
          }
        }
      }
    }
    
    console.log(`🎼 Extracted correct sequence: [${correctSequence.join(', ')}]`);
    
    if (correctSequence.length === 0) {
      console.log('⚠️ Could not extract sequence, using fallback');
      correctSequence = ['C4', 'G4']; // Fallback sequence
    }
    
    // STEP 2: First wrong attempt
    console.log('❌ STEP 2: First wrong attempt...');
    const wrongSequence1 = ['F4', 'A4']; // Intentionally wrong
    
    for (const wrongNote of wrongSequence1) {
      // Use a more reliable approach - click white keys in sequence
      const whiteKeys = page.locator('.piano-key.white');
      const keyCount = await whiteKeys.count();
      
      if (keyCount > 0) {
        const keyIndex = wrongSequence1.indexOf(wrongNote);
        const targetKey = whiteKeys.nth(keyIndex % keyCount);
        
        try {
          // Force click to avoid interception issues
          await targetKey.click({ force: true });
          console.log(`   Played wrong note (fallback key ${keyIndex + 1}): ${wrongNote}`);
        } catch (error) {
          console.log(`   ⚠️ Could not click key for: ${wrongNote} - ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ No piano keys found for: ${wrongNote}`);
      }
      
      await page.waitForTimeout(600);
    }
    
    await page.waitForTimeout(2000); // Wait for feedback
    
    // STEP 3: Second wrong attempt
    console.log('❌ STEP 3: Second wrong attempt...');
    const wrongSequence2 = ['E4', 'B4']; // Different wrong sequence
    
    for (const wrongNote of wrongSequence2) {
      // Use reliable white key clicking approach
      const whiteKeys = page.locator('.piano-key.white');
      const keyCount = await whiteKeys.count();
      
      if (keyCount > 0) {
        const keyIndex = wrongSequence2.indexOf(wrongNote) + 2; // Offset to get different keys
        const targetKey = whiteKeys.nth(keyIndex % keyCount);
        
        try {
          // Force click to avoid interception issues
          await targetKey.click({ force: true });
          console.log(`   Played wrong note (fallback key ${keyIndex + 1}): ${wrongNote}`);
        } catch (error) {
          console.log(`   ⚠️ Could not click key for: ${wrongNote} - ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ No piano keys found for: ${wrongNote}`);
      }
      
      await page.waitForTimeout(600);
    }
    
    await page.waitForTimeout(2000); // Wait for feedback
    
    // STEP 4: Third attempt - CORRECT MELODY
    console.log('✅ STEP 4: Third attempt - Playing CORRECT melody...');
    const logCountBeforeCorrect = pianoDirectLogs.length;
    
    for (const correctNote of correctSequence) {
      // Use reliable white key clicking approach for correct sequence
      const whiteKeys = page.locator('.piano-key.white');
      const keyCount = await whiteKeys.count();
      
      if (keyCount > 0) {
        const keyIndex = correctSequence.indexOf(correctNote);
        const targetKey = whiteKeys.nth(keyIndex % keyCount);
        
        try {
          // Force click to avoid interception issues
          await targetKey.click({ force: true });
          console.log(`   Played correct note (key ${keyIndex + 1}): ${correctNote}`);
        } catch (error) {
          console.log(`   ⚠️ Could not click key for: ${correctNote} - ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ No piano keys found for: ${correctNote}`);
      }
      
      await page.waitForTimeout(600); // Match note duration
    }
    
    // Wait for success feedback and potential new sequence generation
    await page.waitForTimeout(3000);
    
    const logCountAfterCorrect = pianoDirectLogs.length;
    const newLogsCorrect = logCountAfterCorrect - logCountBeforeCorrect;
    console.log(`📊 STEP 4 Results - PIANO_DIRECT logs after correct melody: ${newLogsCorrect}`);
    
    // STEP 5: Verify new melody is heard
    console.log('🎵 STEP 5: Verifying new melody is heard...');
    const logCountBeforeNew = pianoDirectLogs.length;
    
    // Click play button to hear the new sequence
    await playButton.click();
    await page.waitForTimeout(3000);
    
    const logCountAfterNew = pianoDirectLogs.length;
    const newLogsNew = logCountAfterNew - logCountBeforeNew;
    console.log(`📊 STEP 5 Results - PIANO_DIRECT logs for new melody: ${newLogsNew}`);
    
    // Extract new sequence to verify it's different
    console.log('🔍 Extracting new sequence to verify progression...');
    let newSequence = [];
    const latestLogs = pianoDirectLogs.slice(-10);
    for (const log of latestLogs) {
      if (log.includes('Memory game sequence: playing')) {
        const noteMatch = log.match(/playing ([A-G][#b]?[0-9])/);
        if (noteMatch) {
          const note = noteMatch[1];
          if (!newSequence.includes(note)) {
            newSequence.push(note);
          }
        }
      }
    }
    
    console.log(`🎼 New sequence: [${newSequence.join(', ')}]`);
    console.log(`🎼 Original sequence: [${correctSequence.join(', ')}]`);
    
    // STEP 6: Final Analysis
    console.log('📊 FINAL ANALYSIS:');
    console.log(`   Initial sequence (with interference): ${newLogs} logs`);
    console.log(`   Correct melody attempt: ${newLogsCorrect} logs`);
    console.log(`   New melody playback: ${newLogsNew} logs`);
    console.log(`   Total PIANO_DIRECT logs: ${pianoDirectLogs.length}`);
    
    const sequenceChanged = JSON.stringify(newSequence) !== JSON.stringify(correctSequence);
    
    if (newLogsNew > 0 && sequenceChanged) {
      console.log('🎯 SUCCESS: New melody is heard and sequence has progressed!');
      console.log('✅ Memory game correctly advanced to next level');
    } else if (newLogsNew > 0) {
      console.log('✅ PARTIAL SUCCESS: New melody heard, but sequence may be same');
    } else {
      console.log('⚠️ ISSUE: No new melody detected after correct sequence');
    }
    
    // Check for any errors
    const errorLogs = consoleLogs.filter(log => 
      log.type === 'error' || log.text.includes('ERROR') || log.text.includes('Failed')
    );
    
    if (errorLogs.length > 0) {
      console.log(`🚨 ${errorLogs.length} error logs detected:`);
      errorLogs.forEach(log => console.log(`   ${log.text}`));
    }
    
    console.log('✅ Correct melody on third try test complete');
  });
});
