import Foundation
import Capacitor
import AVFoundation
import UIKit

@objc(MuteDetectorPlugin)
public class MuteDetectorPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MuteDetectorPlugin"
    public let jsName = "MuteDetector"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isDeviceMuted", returnType: CAPPluginReturnPromise)
    ]

    public override func load() {
        // WebKit runs WebView audio on the app's shared AVAudioSession. iOS
        // deactivates the session while the app is backgrounded, so it must be
        // reactivated whenever the app becomes active again or WebView audio
        // stays silent after a foreground transition.
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(reactivateAudioSession),
            name: UIApplication.didBecomeActiveNotification,
            object: nil)

        configureAudioSession()
    }

    private func configureAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        do {
            // .playback ignores the hardware silent switch, consistent with
            // navigator.audioSession.type = "playback" on the web side.
            // .mixWithOthers lets other apps' audio continue alongside the
            // game sounds.
            try audioSession.setCategory(.playback, options: .mixWithOthers)
            try audioSession.setActive(true)
            NSLog("[MuteDetector] Audio session configured (playback, mixWithOthers, active)")
        } catch {
            NSLog("[MuteDetector] Audio session configuration failed: %@", error.localizedDescription)
        }
    }

    @objc private func reactivateAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setActive(true)
            NSLog("[MuteDetector] Audio session reactivated on didBecomeActive")
        } catch {
            NSLog("[MuteDetector] Audio session reactivation failed: %@", error.localizedDescription)
        }
    }

    @objc func isDeviceMuted(_ call: CAPPluginCall) {
        // outputVolume is readable without activating the session. setActive
        // must not be called here: this method runs on a timer, and repeated
        // session activations reconfigure the shared session and can silence
        // WebView audio output.
        let volumeLevel = AVAudioSession.sharedInstance().outputVolume
        let isMuted = volumeLevel <= 0.1

        NSLog("[MuteDetector] Device volume: %.3f -> %@", volumeLevel,
              isMuted ? "MUTED" : "NOT_MUTED")

        call.resolve([
            "isMuted": isMuted,
            "volumeLevel": volumeLevel
        ])
    }
}
