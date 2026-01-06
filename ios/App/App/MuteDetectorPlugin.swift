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
            
            // Check if device is muted (silent switch on)
            let isMuted = audioSession.outputVolume == 0 || 
                         (try? audioSession.currentRoute.outputs.isEmpty) ?? true
            
            // Log the mute status
            let volumeLevel = audioSession.outputVolume
            NSLog("[MuteDetector] Device mute status: %@ (outputVolume=%.2f)", 
                  isMuted ? "MUTED" : "NOT_MUTED", volumeLevel)
            
            call.resolve([
                "isMuted": isMuted,
                "volumeLevel": volumeLevel
            ])
        } catch {
            NSLog("[MuteDetector] Error checking device mute status: %@", error.localizedDescription)
            call.reject("Failed to check mute status", nil, error)
        }
    }
}
