# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor WebView and JavaScript interface rules
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep all Capacitor plugin classes
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }

# Keep WebView JavaScript interfaces
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# Keep all classes that might be used by JavaScript
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Keep line numbers for debugging
-keepattributes SourceFile,LineNumberTable

# Don't obfuscate class names that JavaScript might reference
-keepnames class ** { *; }

# Keep all public methods that might be called from JavaScript
-keepclassmembers class * {
    public *;
}

# Prevent crashes from missing classes
-dontwarn com.getcapacitor.**
-dontwarn com.capacitorjs.**

# Keep splash screen plugin
-keep class com.capacitorjs.plugins.splashscreen.** { *; }
