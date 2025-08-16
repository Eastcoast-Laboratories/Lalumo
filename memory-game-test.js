// Automated Memory Game Bug Reproduction Script
// Run this in browser console after navigating to 1_5 memory game

console.log('🧪 Starting automated memory game bug reproduction...');

let testResults = {
  attempts: 0,
  successful: 0,
  failed: 0,
  logs: []
};

// Function to capture relevant logs
function captureLog(message) {
  testResults.logs.push(`${Date.now()}: ${message}`);
  console.log(`📋 ${message}`);
}

// Function to test memory game playback
async function testMemoryGamePlayback() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let pianoDirectFound = false;
    
    // Listen for console logs
    const originalLog = console.log;
    console.log = function(...args) {
      const message = args.join(' ');
      if (message.includes('PIANO_DIRECT') && message.includes('Starting memory sequence playback')) {
        pianoDirectFound = true;
        captureLog(`✅ PIANO_DIRECT found: ${message}`);
      } else if (message.includes('BUG_DEBUG')) {
        captureLog(`🔧 ${message}`);
      }
      originalLog.apply(console, args);
    };
    
    // Trigger playback
    try {
      const pitchesStore = window.Alpine.store('pitches');
      if (pitchesStore) {
        captureLog(`State before: gameMode=${pitchesStore.gameMode}, isPlaying=${pitchesStore.isPlaying}`);
        pitchesStore.playCurrentMelody();
        
        // Check result after 4 seconds
        setTimeout(() => {
          console.log = originalLog; // Restore original console.log
          captureLog(`State after: gameMode=${pitchesStore.gameMode}, isPlaying=${pitchesStore.isPlaying}`);
          resolve(pianoDirectFound);
        }, 4000);
      } else {
        console.log = originalLog;
        resolve(false);
      }
    } catch (error) {
      console.log = originalLog;
      captureLog(`❌ Error: ${error.message}`);
      resolve(false);
    }
  });
}

// Main test function
async function runBugReproductionTest() {
  captureLog('Starting bug reproduction test...');
  
  for (let i = 1; i <= 5; i++) {
    captureLog(`\n🎵 Test attempt ${i}/5`);
    testResults.attempts++;
    
    const success = await testMemoryGamePlayback();
    
    if (success) {
      testResults.successful++;
      captureLog(`✅ Attempt ${i}: SUCCESS - PIANO_DIRECT logs found`);
    } else {
      testResults.failed++;
      captureLog(`❌ Attempt ${i}: FAILED - No PIANO_DIRECT logs`);
    }
    
    // Wait between attempts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Report results
  captureLog('\n📊 TEST RESULTS:');
  captureLog(`Total attempts: ${testResults.attempts}`);
  captureLog(`Successful: ${testResults.successful}`);
  captureLog(`Failed: ${testResults.failed}`);
  captureLog(`Success rate: ${(testResults.successful / testResults.attempts * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    captureLog('\n🚨 BUG REPRODUCED! Some attempts failed to produce PIANO_DIRECT logs');
    captureLog('📋 Full log history:');
    testResults.logs.forEach(log => console.log(log));
    return false;
  } else {
    captureLog('\n✅ All attempts successful - bug not reproduced in this run');
    return true;
  }
}

// Export for manual use
window.runMemoryGameBugTest = runBugReproductionTest;
window.testMemoryGamePlayback = testMemoryGamePlayback;

console.log('🎯 Memory game bug test script loaded!');
console.log('📋 Usage:');
console.log('  1. Navigate to 1_5 memory game');
console.log('  2. Run: runMemoryGameBugTest()');
console.log('  3. Watch for bug reproduction results');

