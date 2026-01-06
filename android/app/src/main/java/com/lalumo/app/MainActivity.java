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
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleBackButton();
            }
        });
        
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
        Log.d(TAG, "Back button pressed, checking menu lock state");
        
        // Check if navigation is locked via JavaScript
        bridge.getWebView().evaluateJavascript(
            "(function() { " +
            "  if (window.Alpine && document.querySelector('[x-data]')) { " +
            "    var isMenuLocked = Alpine.store('app').menuLocked; " +
            "    return isMenuLocked; " +
            "  } else { " +
            "    return localStorage.getItem('lalumo_menu_locked') === 'true'; " +
            "  } " +
            "})()",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    // Strip quotes if present
                    value = value.replace("\"", "");
                    boolean isMenuLocked = Boolean.parseBoolean(value);
                    Log.d(TAG, "Menu lock state: " + isMenuLocked);
                    
                    if (!isMenuLocked) {
                        // If menu is not locked, navigate back to main menu
                        Log.d(TAG, "Navigation not locked, returning to main menu");
                        bridge.getWebView().evaluateJavascript(
                            "if (window.Alpine) { " +
                            "  Alpine.store('app').active = 'main'; " +
                            "} else { " +
                            "  window.location.hash = '#main'; " +
                            "}",
                            null
                        );
                    } else {
                        // If menu is locked, do nothing (default back behavior is prevented)
                        Log.d(TAG, "Navigation is locked, ignoring back button");
                    }
                }
            }
        );
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
