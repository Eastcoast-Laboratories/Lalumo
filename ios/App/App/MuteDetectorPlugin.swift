import Foundation
import Capacitor
import AVFoundation

@objc(MuteDetectorPlugin)
public class MuteDetectorPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MuteDetectorPlugin"
    public let jsName = "MuteDetector"
    public let pluginMethods = [
        "isDeviceMuted"
    ]

    @objc func isDeviceMuted(_ call: CAPPluginCall) {
        let audioSession = AVAudioSession.sharedInstance()

        do {
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

            // outputVolume only reflects the hardware volume buttons and
            // stays > 0 when the silent switch is on.
            // secondaryAudioShouldBeSilencedHint covers the silent switch
            // (iPhone) / Control Center mute (iPad).
            let volumeLevel = audioSession.outputVolume
            let silenceHint = audioSession.secondaryAudioShouldBeSilencedHint
            let isMuted = volumeLevel <= 0.001 || silenceHint

            NSLog("[MuteDetector] Device mute status: %@ (outputVolume=%.3f, silenceHint=%@)",
                  isMuted ? "MUTED" : "NOT_MUTED", volumeLevel,
                  silenceHint ? "true" : "false")

            call.resolve([
                "isMuted": isMuted,
                "volumeLevel": volumeLevel,
                "silenceHint": silenceHint
            ])
        } catch {
            NSLog("[MuteDetector] Error checking device mute status: %@", error.localizedDescription)
            call.reject("Failed to check mute status", nil, error)
        }
    }
}
