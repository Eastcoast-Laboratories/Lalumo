package com.lalumo.app;

import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.util.Log;
import android.webkit.ValueCallback;
import android.media.AudioManager;
import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "LalumoBridge";
    private OnBackPressedCallback backCallback;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.d(TAG, "BuildConfig.IS_DEBUG_BUILD=" + BuildConfig.IS_DEBUG_BUILD);
        if (BuildConfig.IS_DEBUG_BUILD) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        
        // Enable fullscreen mode - hide both status bar and navigation bar
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // For Android 11 (API 30) and above, use WindowInsetsController
            View decorView = getWindow().getDecorView();
            WindowInsetsController controller = decorView.getWindowInsetsController();
            if (controller != null) {
                // Hide system bars
                controller.hide(WindowInsets.Type.systemBars());
                // Set immersive mode
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                Log.d(TAG, "Applied immersive mode using WindowInsetsController");
            }
        } else {
            // For older Android versions, use the legacy approach
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
            
            View decorView = getWindow().getDecorView();
            int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            decorView.setSystemUiVisibility(uiOptions);
            Log.d(TAG, "Applied immersive mode using legacy API");
        }
        
        // Register back button handler using the newer OnBackPressedCallback approach
        // This works on all Android versions through the compatibility library
        backCallback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleBackButton();
            }
        };
        getOnBackPressedDispatcher().addCallback(this, backCallback);
        
        // JavaScript-Schnittstellen hinzufügen
        this.bridge.getWebView().addJavascriptInterface(new WebAppInterface(), "AndroidApp");
        this.bridge.getWebView().addJavascriptInterface(new MenuLockInterface(), "AndroidMenuLock");
        
       
    }
    
    /**
     * JavaScript-Schnittstelle für native Android-Funktionen
     */
    public class WebAppInterface {
        @JavascriptInterface
        public boolean isDebugBuild() {
            return BuildConfig.IS_DEBUG_BUILD;
        }
        
        @JavascriptInterface
        public boolean isDeviceMuted() {
            try {
                AudioManager audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
                if (audioManager == null) {
                    Log.w(TAG, "AudioManager not available");
                    return false;
                }
                
                // Check if device is in silent/vibrate mode
                int ringerMode = audioManager.getRingerMode();
                boolean isRingerMuted = (ringerMode == AudioManager.RINGER_MODE_SILENT || 
                                         ringerMode == AudioManager.RINGER_MODE_VIBRATE);
                
                // Also check if music/media volume is at 0
                int musicVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
                int maxMusicVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                boolean isVolumeZero = (musicVolume == 0);
                
                boolean isMuted = isRingerMuted || isVolumeZero;
                
                Log.d(TAG, "Device mute status: " + (isMuted ? "MUTED" : "NOT_MUTED") + 
                      " (ringerMode=" + ringerMode + ", musicVolume=" + musicVolume + 
                      "/" + maxMusicVolume + ")");
                
                return isMuted;
            } catch (Exception e) {
                Log.e(TAG, "Error checking device mute status", e);
                return false;
            }
        }
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
    }
    
    /**
     * Handles back button press with custom navigation logic
     * This method is called by the OnBackPressedCallback registered in onCreate
     */
    private void handleBackButton() {
        Log.d(TAG, "Back button pressed, checking menu lock state and current activity");
        
        // Get the app state using JavaScript
        // We need to check if we're in an activity and if the menu is locked
        bridge.getWebView().evaluateJavascript(
            "(function() { " +
            "  try { " +
            "    if (window.Alpine && typeof window.Alpine.store === 'function') { " +
            "      var app = window.Alpine.store('app'); " +
            "      if (app && typeof app === 'object') { " +
            "        return JSON.stringify({ " +
            "          menuLocked: app.menuLocked === true, " +
            "          active: app.active || 'main', " +
            "          menuOpen: app.menuOpen === true, " +
            "          source: 'alpine' " +
            "        }); " +
            "      } " +
            "    } " +
            "  } catch (e) { " +
            "    console.error('Error getting Alpine state:', e); " +
            "  } " +
            "  " +
            "  var activeFromHash = window.location.hash ? window.location.hash.substring(1) : 'main'; " +
            "  return JSON.stringify({ " +
            "    menuLocked: localStorage.getItem('lalumo_menu_locked') === 'true', " +
            "    active: activeFromHash, " +
            "    menuOpen: false, " +
            "    source: 'fallback' " +
            "  }); " +
            "})()",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String stateJson) {
                    Log.d(TAG, "App state JSON: " + stateJson);
                    handleBackButtonWithState(stateJson);
                }
            }
        );
    }
    
    /**
     * Handle the back button action based on app state
     */
    private void handleBackButtonWithState(String stateJson) {
        Log.d(TAG, "App state JSON: " + stateJson);
        
        try {
            // Parse the state from JSON
            boolean isMenuLocked = stateJson.contains("\"menuLocked\":true");
            boolean isInActivity = !stateJson.contains("\"active\":\"main\"");
            String source = stateJson.contains("\"source\":\"alpine\"") ? "alpine" : "fallback";
            
            Log.d(TAG, "Parsed state - Locked: " + isMenuLocked + ", InActivity: " + isInActivity + ", Source: " + source);
            
            if (isInActivity) {
                if (!isMenuLocked) {
                    // If in activity and menu is not locked, open hamburger menu
                    Log.d(TAG, "Opening hamburger menu");
                    bridge.getWebView().evaluateJavascript(
                        "(function() { " +
                        "  var attempts = 0; " +
                        "  var maxAttempts = 10; " +
                        "  " +
                        "  function tryOpenMenu() { " +
                        "    attempts++; " +
                        "    try { " +
                        "      var appElement = document.querySelector('[x-data=\"app()\"]'); " +
                        "      if (appElement && window.Alpine && typeof window.Alpine.$data === 'function') { " +
                        "        var app = window.Alpine.$data(appElement); " +
                        "        if (app && typeof app === 'object' && 'menuOpen' in app) { " +
                        "          app.menuOpen = true; " +
                        "          if (window.debugLog) { " +
                        "            window.debugLog('BACK_BUTTON', 'Android back button opened hamburger menu'); " +
                        "          } else { " +
                        "            console.log('BACK_BUTTON: Menu opened by Android back button'); " +
                        "          } " +
                        "          return; " +
                        "        } " +
                        "      } " +
                        "    } catch (e) { " +
                        "      console.error('BACK_BUTTON: Error opening menu:', e); " +
                        "    } " +
                        "    " +
                        "    if (attempts < maxAttempts) { " +
                        "      setTimeout(tryOpenMenu, 100); " +
                        "    } else { " +
                        "      console.error('BACK_BUTTON: Could not open menu after ' + maxAttempts + ' attempts'); " +
                        "    } " +
                        "  } " +
                        "  " +
                        "  tryOpenMenu(); " +
                        "})()",
                        null
                    );
                    // Prevent default back behavior - do nothing, callback handles it
                    return;
                } else {
                    // If menu is locked, prevent back button
                    Log.d(TAG, "Menu is locked, preventing back button");
                    // Prevent default back behavior - do nothing, callback handles it
                    return;
                }
            } else {
                // If in main menu, allow default back behavior (exit app)
                Log.d(TAG, "In main menu, allowing default back behavior - exiting app");
                // Disable the callback so the system can handle the back button normally
                if (backCallback != null) {
                    backCallback.setEnabled(false);
                }
                // Now let the system handle the back button
                getOnBackPressedDispatcher().onBackPressed();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling back button", e);
            // Default to allowing back behavior on error
            if (backCallback != null) {
                backCallback.setEnabled(false);
            }
            getOnBackPressedDispatcher().onBackPressed();
        }
    }
    
    /**
     * JavaScript-Schnittstelle für den Menü-Sperrzustand
     */
    public class MenuLockInterface {
        @JavascriptInterface
        public void setMenuLockState(boolean isLocked) {
            Log.d(TAG, "Menu lock state updated from JavaScript: " + isLocked);
        }
    }
}
