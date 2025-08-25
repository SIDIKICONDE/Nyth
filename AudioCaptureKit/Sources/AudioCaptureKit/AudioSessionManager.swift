import Foundation
import AVFoundation

final class AudioSessionManager {
    enum SessionError: Error {
        case microphonePermissionDenied
        case configurationFailed
        case activationFailed
    }

    private let session = AVAudioSession.sharedInstance()
    private var isActive: Bool = false

    func requestRecordPermission(completion: @escaping (Bool) -> Void) {
        switch session.recordPermission {
        case .granted:
            completion(true)
        case .denied:
            completion(false)
        case .undetermined:
            session.requestRecordPermission { granted in
                DispatchQueue.main.async { completion(granted) }
            }
        @unknown default:
            completion(false)
        }
    }

    func configure(with config: AudioCaptureConfig) throws {
        let category: AVAudioSession.Category = config.categoryPlayAndRecord ? .playAndRecord : .record
        var options: AVAudioSession.CategoryOptions = []
        if config.allowsBluetooth {
            options.insert(.allowBluetooth)
            options.insert(.allowBluetoothA2DP)
        }
        if config.usesSpeaker {
            options.insert(.defaultToSpeaker)
        }

        do {
            try session.setCategory(category, mode: .default, options: options)
            try session.setPreferredSampleRate(config.sampleRate)
            if let fpb = config.framesPerBuffer, config.sampleRate > 0 {
                let duration = Double(fpb) / config.sampleRate
                try session.setPreferredIOBufferDuration(duration)
            }
        } catch {
            throw SessionError.configurationFailed
        }
    }

    func activate() throws {
        do {
            try session.setActive(true, options: [.notifyOthersOnDeactivation])
            isActive = true
        } catch {
            throw SessionError.activationFailed
        }
    }

    func deactivate() {
        do {
            try session.setActive(false)
            isActive = false
        } catch {
            // best-effort
        }
    }
}

