import Foundation
import AVFoundation

// MARK: - TurboModule Bridge Extension

/// Extension pour faciliter l'intégration avec React Native TurboModule
extension AudioRecorder {
    
    // MARK: - TurboModule Compatible Methods
    
    /// Démarre l'enregistrement avec des paramètres compatibles TurboModule
    @objc
    public func startRecordingWithOptions(_ options: [String: Any], 
                                        resolver: @escaping RCTPromiseResolveBlock,
                                        rejecter: @escaping RCTPromiseRejectBlock) {
        
        // Parse les options
        let fileName = options["fileName"] as? String
        let sampleRate = options["sampleRate"] as? Double ?? AudioConfiguration.sampleRate
        let channels = options["channels"] as? Int ?? Int(AudioConfiguration.channels)
        let quality = options["quality"] as? String ?? "high"
        
        // Demande les permissions si nécessaire
        requestMicrophonePermission { [weak self] granted in
            guard granted else {
                rejecter("PERMISSION_DENIED", "Microphone permission denied", nil)
                return
            }
            
            // Configure l'URL du fichier
            let fileURL: URL
            if let fileName = fileName {
                let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                fileURL = documentsPath.appendingPathComponent(fileName)
            } else {
                fileURL = self?.generateDefaultFileURL() ?? URL(fileURLWithPath: "")
            }
            
            // Démarre l'enregistrement
            do {
                try self?.startRecording(toFileURL: fileURL)
                resolver([
                    "status": "started",
                    "filePath": fileURL.path
                ])
            } catch {
                rejecter("START_FAILED", error.localizedDescription, error)
            }
        }
    }
    
    /// Arrête l'enregistrement et retourne le chemin du fichier
    @objc
    public func stopRecordingWithResolver(_ resolver: @escaping RCTPromiseResolveBlock,
                                        rejecter: @escaping RCTPromiseRejectBlock) {
        guard isRecording else {
            rejecter("NOT_RECORDING", "Not currently recording", nil)
            return
        }
        
        let filePath = currentRecordingURL?.path ?? ""
        stopRecording()
        
        // Retourne les métadonnées du fichier
        var result: [String: Any] = [
            "status": "stopped",
            "filePath": filePath
        ]
        
        // Ajoute la durée si possible
        if let url = currentRecordingURL,
           let audioFile = try? AVAudioFile(forReading: url) {
            let duration = Double(audioFile.length) / audioFile.fileFormat.sampleRate
            result["duration"] = duration
        }
        
        resolver(result)
    }
    
    /// Met en pause l'enregistrement
    @objc
    public func pauseRecordingWithResolver(_ resolver: @escaping RCTPromiseResolveBlock,
                                         rejecter: @escaping RCTPromiseRejectBlock) {
        guard isRecording && !isPaused else {
            rejecter("INVALID_STATE", "Cannot pause: not recording or already paused", nil)
            return
        }
        
        pauseRecording()
        resolver(["status": "paused"])
    }
    
    /// Reprend l'enregistrement
    @objc
    public func resumeRecordingWithResolver(_ resolver: @escaping RCTPromiseResolveBlock,
                                          rejecter: @escaping RCTPromiseRejectBlock) {
        guard isRecording && isPaused else {
            rejecter("INVALID_STATE", "Cannot resume: not paused", nil)
            return
        }
        
        do {
            try resumeRecording()
            resolver(["status": "resumed"])
        } catch {
            rejecter("RESUME_FAILED", error.localizedDescription, error)
        }
    }
    
    /// Obtient l'état actuel de l'enregistreur
    @objc
    public func getRecordingStatus() -> [String: Any] {
        return [
            "isRecording": isRecording,
            "isPaused": isPaused,
            "currentFilePath": currentRecordingURL?.path ?? NSNull()
        ]
    }
    
    /// Configure les options audio avancées
    @objc
    public func configureAudioOptions(_ options: [String: Any],
                                    resolver: @escaping RCTPromiseResolveBlock,
                                    rejecter: @escaping RCTPromiseRejectBlock) {
        
        do {
            // Parse les options de session
            if let categoryString = options["category"] as? String {
                let category = audioSessionCategory(from: categoryString)
                try audioSession.setCategory(category)
            }
            
            if let modeString = options["mode"] as? String {
                let mode = audioSessionMode(from: modeString)
                try audioSession.setMode(mode)
            }
            
            if let sampleRate = options["sampleRate"] as? Double {
                try audioSession.setPreferredSampleRate(sampleRate)
            }
            
            if let ioBufferDuration = options["ioBufferDuration"] as? Double {
                try audioSession.setPreferredIOBufferDuration(ioBufferDuration)
            }
            
            resolver(["status": "configured"])
            
        } catch {
            rejecter("CONFIGURATION_FAILED", error.localizedDescription, error)
        }
    }
}

// MARK: - Type Aliases for TurboModule

/// Types pour la compatibilité avec React Native
public typealias RCTPromiseResolveBlock = (Any?) -> Void
public typealias RCTPromiseRejectBlock = (String?, String?, Error?) -> Void

// MARK: - Helper Methods

extension AudioRecorder {
    
    /// Convertit une chaîne en AVAudioSession.Category
    private func audioSessionCategory(from string: String) -> AVAudioSession.Category {
        switch string.lowercased() {
        case "playback":
            return .playback
        case "record":
            return .record
        case "playandrecord":
            return .playAndRecord
        default:
            return .playAndRecord
        }
    }
    
    /// Convertit une chaîne en AVAudioSession.Mode
    private func audioSessionMode(from string: String) -> AVAudioSession.Mode {
        switch string.lowercased() {
        case "default":
            return .default
        case "voicechat":
            return .voiceChat
        case "videochat":
            return .videoChat
        case "measurement":
            return .measurement
        default:
            return .default
        }
    }
}

// MARK: - Event Emitter Support

/// Structure pour représenter les événements émis vers JavaScript
public struct AudioRecorderEvent {
    public let name: String
    public let body: [String: Any]
    
    public static func recordingStarted() -> AudioRecorderEvent {
        return AudioRecorderEvent(name: "recordingStarted", body: [:])
    }
    
    public static func recordingStopped(filePath: String, duration: Double?) -> AudioRecorderEvent {
        var body: [String: Any] = ["filePath": filePath]
        if let duration = duration {
            body["duration"] = duration
        }
        return AudioRecorderEvent(name: "recordingStopped", body: body)
    }
    
    public static func recordingPaused() -> AudioRecorderEvent {
        return AudioRecorderEvent(name: "recordingPaused", body: [:])
    }
    
    public static func recordingResumed() -> AudioRecorderEvent {
        return AudioRecorderEvent(name: "recordingResumed", body: [:])
    }
    
    public static func audioLevel(_ level: Float) -> AudioRecorderEvent {
        return AudioRecorderEvent(name: "audioLevel", body: ["level": level])
    }
    
    public static func error(_ error: AudioRecorderError) -> AudioRecorderEvent {
        return AudioRecorderEvent(name: "error", body: [
            "code": error.rawValue,
            "message": error.localizedDescription
        ])
    }
}