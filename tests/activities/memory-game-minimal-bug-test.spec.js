// MINIMAL BUG REPRODUCTION TEST for 1_5 Memory Game
// Focus on reproducing the "plays once then stops" bug without UI overlay issues

const { test, expect } = require('@playwright/test');
const { setupTest } = require('../helpers/test-utils');

test.describe('1_5 Memory Game Minimal Bug Test', () => {
  test.setTimeout(60000); // Extended timeout

  let consoleLogs = [];
  let pianoDirectLogs = [];

  test.beforeEach(async ({ page }) => {
    // Reset log arrays
    consoleLogs = [];
    pianoDirectLogs = [];

    // Capture console logs
    page.on('console', msg => {
      const logText = msg.text();
      consoleLogs.push({ type: msg.type(), text: logText });
      
      if (logText.includes('PIANO_DIRECT')) {
        pianoDirectLogs.push({ type: msg.type(), text: logText });
        console.log(`🎹 PIANO_DIRECT: ${logText}`);
      }
      
      // Track other relevant logs
      if (logText.includes('MEMORY_GAME') || logText.includes('MEMORY_REPLAY') || logText.includes('TONE_JS')) {
        console.log(`🎵 ${logText}`);
      }
    });

    // Use the working test framework from main suite
    await setupTest(page);
    console.log('🚀 Test setup complete');
  });

  test('Reproduce bug: Multiple play attempts should work', async ({ page }) => {
    console.log('🧪 Starting minimal bug reproduction test...');
    
    try {
      // Navigate to 1_5 memory game by directly manipulating Alpine store
      await page.evaluate(() => {
        const pitchesStore = window.Alpine.store('pitches');
        if (pitchesStore) {
          pitchesStore.mode = '1_5_pitches_memory-game';
          pitchesStore.gameMode = false;
          console.log('TEST: Set mode to 1_5_pitches_memory-game');
        }
      });
      
      await page.waitForTimeout(1000);
      
      // Verify we're in memory game mode
      const currentMode = await page.evaluate(() => {
        return window.Alpine.store('pitches')?.mode;
      });
      console.log(`🎯 Current mode: ${currentMode}`);
      
      // Find and click the play button multiple times to reproduce the bug
      const playButton = page.locator('[id="1_5_pitches"] .circular-play-button');
      
      console.log('🎵 Attempt 1: First play (should work)');
      await playButton.click();
      await page.waitForTimeout(3000); // Wait for sequence to play
      
      // Check if we got PIANO_DIRECT logs for first attempt
      const firstAttemptLogs = pianoDirectLogs.filter(log => 
        log.text.includes('Starting memory sequence playback')
      );
      console.log(`📊 First attempt PIANO_DIRECT logs: ${firstAttemptLogs.length}`);
      
      console.log('🎵 Attempt 2: Second play (bug: might not work)');
      await playButton.click();
      await page.waitForTimeout(3000); // Wait for sequence to play
      
      // Check if we got PIANO_DIRECT logs for second attempt
      const secondAttemptLogs = pianoDirectLogs.filter(log => 
        log.text.includes('Starting memory sequence playback')
      );
      console.log(`📊 Total PIANO_DIRECT logs after 2 attempts: ${secondAttemptLogs.length}`);
      
      console.log('🎵 Attempt 3: Third play (further verification)');
      await playButton.click();
      await page.waitForTimeout(3000);
      
      const thirdAttemptLogs = pianoDirectLogs.filter(log => 
        log.text.includes('Starting memory sequence playback')
      );
      console.log(`📊 Total PIANO_DIRECT logs after 3 attempts: ${thirdAttemptLogs.length}`);
      
      // Analyze the results
      console.log('🔍 ANALYSIS:');
      console.log(`- Total PIANO_DIRECT logs: ${pianoDirectLogs.length}`);
      console.log(`- Playback start logs: ${thirdAttemptLogs.length}`);
      
      if (thirdAttemptLogs.length < 3) {
        console.log('🚨 BUG REPRODUCED: Not all play attempts generated PIANO_DIRECT logs!');
        console.log('📋 All PIANO_DIRECT logs:');
        pianoDirectLogs.forEach((log, i) => {
          console.log(`  ${i + 1}. ${log.text}`);
        });
        
        // Get current game state for debugging
        const gameState = await page.evaluate(() => {
          const store = window.Alpine.store('pitches');
          return {
            mode: store?.mode,
            gameMode: store?.gameMode,
            isPlaying: store?.isPlaying,
            currentSequence: store?.currentSequence?.length || 0,
            userSequence: store?.userSequence?.length || 0
          };
        });
        console.log('🔧 Current game state:', JSON.stringify(gameState, null, 2));
        
        throw new Error(`BUG REPRODUCED: Expected 3 playback logs, got ${thirdAttemptLogs.length}`);
      } else {
        console.log('✅ All play attempts worked correctly');
      }
      
    } catch (error) {
      console.log('❌ Test error:', error.message);
      
      // Dump all console logs for analysis
      console.log('📋 All console logs:');
      consoleLogs.forEach((log, i) => {
        console.log(`  ${i + 1}. [${log.type}] ${log.text}`);
      });
      
      throw error;
    }
  });
});
