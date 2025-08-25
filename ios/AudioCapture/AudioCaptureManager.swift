//
//  AudioCaptureManager.swift
//  AudioCapture
//
//  Manager singleton pour faciliter l'utilisation et l'intégration avec TurboModule
//

import Foundation
import AVFoundation

/// Manager principal pour la capture audio
/// Cette classe fournit une interface simplifiée pour l'intégration avec TurboModule JSI
@objc public class AudioCaptureManager: NSObject {
    
    // MARK: - Singleton
    
    /// Instance partagée
    @objc public static let shared = AudioCaptureManager()
    
    // MARK: - Properties
    
    /// Le moteur de capture audio
    private let captureEngine: AudioCaptureEngine
    
    /// Buffer pour stocker temporairement les données audio
    private var audioDataBuffer: [Data] = []
    
    /// Taille maximale du buffer en nombre d'échantillons
    private let maxBufferSize = 10
    
    /// Queue pour la gestion thread-safe du buffer
    private let bufferQueue = DispatchQueue(label: "com.audiocapture.buffer", attributes: .concurrent)
    
    /// Callback pour l'intégration JSI
    @objc public var onAudioData: ((Data) -> Void)?
    
    /// Callback pour les changements d'état
    @objc public var onStateChange: ((String) -> Void)?
    
    /// Callback pour les erreurs
    @objc public var onError: ((String, String) -> Void)?
    
    /// Callback pour le niveau audio
    @objc public var onAudioLevel: ((Float) -> Void)?
    
    // MARK: - Initialization
    
    private override init() {
        self.captureEngine = AudioCaptureEngine()
        super.init()
        self.captureEngine.delegate = self
    }
    
    // MARK: - Public Methods
    
    /// Configure la capture audio avec des paramètres simples
    /// - Parameters:
    ///   - sampleRate: Taux d'échantillonnage (par défaut 44100)
    ///   - channels: Nombre de canaux (1 ou 2)
    ///   - format: Format audio ("float32", "int16", "int32")
    @objc public func configure(
        sampleRate: Double = 44100,
        channels: Int = 1,
        format: String = "float32"
    ) throws {
        let config = AudioCaptureConfiguration()
        config.sampleRate = sampleRate
        config.channelCount = channels
        
        // Convertit le format string en enum
        switch format.lowercased() {
        case "float32":
            config.format = .pcmFloat32
        case "int16":
            config.format = .pcmInt16
        case "int32":
            config.format = .pcmInt32
        default:
            throw AudioCaptureError.invalidConfiguration("Format non supporté: \(format)")
        }
        
        try captureEngine.configure(with: config)
    }
    
    /// Démarre l'enregistrement
    @objc public func startRecording() throws {
        try captureEngine.startRecording()
    }
    
    /// Arrête l'enregistrement
    @objc public func stopRecording() {
        captureEngine.stopRecording()
    }
    
    /// Vérifie si l'enregistrement est en cours
    @objc public var isRecording: Bool {
        return captureEngine.isRecording
    }
    
    /// Demande la permission du microphone
    @objc public func requestPermission(completion: @escaping (Bool) -> Void) {
        captureEngine.requestMicrophonePermission(completion: completion)
    }
    
    /// Vérifie si la permission est accordée
    @objc public func hasPermission() -> Bool {
        return captureEngine.isMicrophonePermissionGranted()
    }
    
    /// Récupère et vide le buffer audio
    @objc public func flushAudioBuffer() -> [Data] {
        return bufferQueue.sync(flags: .barrier) {
            let data = audioDataBuffer
            audioDataBuffer.removeAll()
            return data
        }
    }
    
    /// Active/désactive la mesure du niveau audio
    @objc public func setLevelMeasurementEnabled(_ enabled: Bool) {
        captureEngine.configuration.enableLevelMeasurement = enabled
    }
    
    // MARK: - Helper Methods for JSI Integration
    
    /// Convertit les données audio en tableau de Float32
    @objc public func convertDataToFloatArray(_ data: Data) -> [Float] {
        let floatCount = data.count / MemoryLayout<Float>.size
        var floatArray = [Float](repeating: 0, count: floatCount)
        
        data.withUnsafeBytes { bytes in
            let floatPointer = bytes.bindMemory(to: Float.self)
            floatArray = Array(UnsafeBufferPointer(start: floatPointer.baseAddress, count: floatCount))
        }
        
        return floatArray
    }
    
    /// Convertit les données audio en base64
    @objc public func convertDataToBase64(_ data: Data) -> String {
        return data.base64EncodedString()
    }
}

// MARK: - AudioCaptureDelegate

extension AudioCaptureManager: AudioCaptureDelegate {
    
    public func audioCapture(didReceiveAudioData data: Data) {
        // Ajoute au buffer
        bufferQueue.async(flags: .barrier) {
            self.audioDataBuffer.append(data)
            if self.audioDataBuffer.count > self.maxBufferSize {
                self.audioDataBuffer.removeFirst()
            }
        }
        
        // Appelle le callback JSI
        onAudioData?(data)
    }
    
    public func audioCaptureDidStart() {
        onStateChange?("recording")
    }
    
    public func audioCaptureDidStop() {
        onStateChange?("stopped")
    }
    
    public func audioCapture(didFailWithError error: Error) {
        let errorCode = (error as? AudioCaptureError) != nil ? "AudioCaptureError" : "SystemError"
        onError?(errorCode, error.localizedDescription)
    }
    
    public func audioCapture(didUpdateAudioLevel level: Float) {
        onAudioLevel?(level)
    }
}