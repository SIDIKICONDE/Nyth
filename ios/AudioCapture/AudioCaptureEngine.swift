//
//  AudioCaptureEngine.swift
//  AudioCapture
//
//  Implémentation principale de la capture audio utilisant AVAudioEngine
//

import AVFoundation
import Accelerate

/// Implémentation de la capture audio utilisant AVAudioEngine
@objc public class AudioCaptureEngine: NSObject, AudioCaptureProtocol {
    
    // MARK: - Properties
    
    /// Delegate pour les callbacks
    public weak var delegate: AudioCaptureDelegate?
    
    /// Configuration actuelle
    public private(set) var configuration: AudioCaptureConfiguration
    
    /// Indique si l'enregistrement est en cours
    public private(set) var isRecording = false
    
    // MARK: - Private Properties
    
    /// Le moteur audio
    private var audioEngine: AVAudioEngine?
    
    /// Le nœud d'entrée (microphone)
    private var inputNode: AVAudioInputNode?
    
    /// Format audio pour l'enregistrement
    private var recordingFormat: AVAudioFormat?
    
    /// Timer pour la mesure du niveau audio
    private var levelTimer: Timer?
    
    /// Buffer pour le calcul du niveau audio
    private var levelBuffer: [Float] = []
    
    /// Queue pour le traitement audio
    private let audioQueue = DispatchQueue(label: "com.audiocapture.processing", qos: .userInitiated)
    
    /// Queue pour les callbacks
    private let callbackQueue = DispatchQueue(label: "com.audiocapture.callback", qos: .userInitiated)
    
    // MARK: - Initialization
    
    public override init() {
        self.configuration = AudioCaptureConfiguration()
        super.init()
    }
    
    // MARK: - AudioCaptureProtocol Implementation
    
    public func configure(with configuration: AudioCaptureConfiguration) throws {
        guard !isRecording else {
            throw AudioCaptureError.recordingAlreadyInProgress
        }
        
        // Valide la configuration
        try validateConfiguration(configuration)
        
        self.configuration = configuration
        
        // Configure la session audio
        let bufferDuration = Double(configuration.bufferSize) / configuration.sampleRate
        try AudioSessionManager.shared.configureForRecording(
            sampleRate: configuration.sampleRate,
            bufferDuration: bufferDuration
        )
        
        // Initialise le moteur audio
        try setupAudioEngine()
    }
    
    public func startRecording() throws {
        guard !isRecording else {
            throw AudioCaptureError.recordingAlreadyInProgress
        }
        
        guard let engine = audioEngine else {
            throw AudioCaptureError.audioEngineNotInitialized
        }
        
        // Vérifie les permissions
        guard isMicrophonePermissionGranted() else {
            throw AudioCaptureError.microphonePermissionDenied
        }
        
        do {
            // Démarre le moteur audio
            try engine.start()
            isRecording = true
            
            // Démarre la mesure du niveau audio si activée
            if configuration.enableLevelMeasurement {
                startLevelMeasurement()
            }
            
            // Notifie le delegate
            callbackQueue.async {
                self.delegate?.audioCaptureDidStart()
            }
            
        } catch {
            throw AudioCaptureError.engineStartFailed(error)
        }
    }
    
    public func stopRecording() {
        guard isRecording else { return }
        
        // Arrête la mesure du niveau audio
        stopLevelMeasurement()
        
        // Arrête le moteur audio
        audioEngine?.stop()
        isRecording = false
        
        // Notifie le delegate
        callbackQueue.async {
            self.delegate?.audioCaptureDidStop()
        }
    }
    
    public func requestMicrophonePermission(completion: @escaping (Bool) -> Void) {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            DispatchQueue.main.async {
                completion(granted)
            }
        }
    }
    
    public func isMicrophonePermissionGranted() -> Bool {
        return AVAudioSession.sharedInstance().recordPermission == .granted
    }
    
    // MARK: - Private Methods
    
    /// Configure le moteur audio
    private func setupAudioEngine() throws {
        // Crée un nouveau moteur audio
        let engine = AVAudioEngine()
        self.audioEngine = engine
        
        // Récupère le nœud d'entrée
        self.inputNode = engine.inputNode
        
        guard let inputNode = self.inputNode else {
            throw AudioCaptureError.audioEngineNotInitialized
        }
        
        // Configure le format d'enregistrement
        let format = try createAudioFormat()
        self.recordingFormat = format
        
        // Installe un tap sur le nœud d'entrée pour capturer l'audio
        inputNode.installTap(
            onBus: 0,
            bufferSize: AVAudioFrameCount(configuration.bufferSize),
            format: format
        ) { [weak self] buffer, time in
            self?.processAudioBuffer(buffer, time: time)
        }
        
        // Prépare le moteur
        engine.prepare()
    }
    
    /// Crée le format audio basé sur la configuration
    private func createAudioFormat() throws -> AVAudioFormat {
        let commonFormat: AVAudioCommonFormat
        
        switch configuration.format {
        case .pcmFloat32:
            commonFormat = .pcmFormatFloat32
        case .pcmInt16:
            commonFormat = .pcmFormatInt16
        case .pcmInt32:
            commonFormat = .pcmFormatInt32
        }
        
        guard let format = AVAudioFormat(
            commonFormat: commonFormat,
            sampleRate: configuration.sampleRate,
            channels: AVAudioChannelCount(configuration.channelCount),
            interleaved: true
        ) else {
            throw AudioCaptureError.audioFormatNotSupported
        }
        
        return format
    }
    
    /// Traite un buffer audio
    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer, time: AVAudioTime) {
        audioQueue.async { [weak self] in
            guard let self = self else { return }
            
            // Convertit le buffer en Data
            if let audioData = self.convertBufferToData(buffer) {
                // Met à jour le niveau audio si nécessaire
                if self.configuration.enableLevelMeasurement {
                    self.updateAudioLevel(from: buffer)
                }
                
                // Envoie les données au delegate
                self.callbackQueue.async {
                    self.delegate?.audioCapture(didReceiveAudioData: audioData)
                }
            }
        }
    }
    
    /// Convertit un AVAudioPCMBuffer en Data
    private func convertBufferToData(_ buffer: AVAudioPCMBuffer) -> Data? {
        guard let channelData = buffer.floatChannelData else { return nil }
        
        let channelCount = Int(buffer.format.channelCount)
        let frameLength = Int(buffer.frameLength)
        let bytesPerFrame = buffer.format.streamDescription.pointee.mBytesPerFrame
        
        // Crée un Data avec la taille appropriée
        var data = Data(count: frameLength * Int(bytesPerFrame))
        
        data.withUnsafeMutableBytes { bytes in
            let destination = bytes.bindMemory(to: Float.self)
            
            // Copie les données audio
            if channelCount == 1 {
                // Mono: copie directe
                memcpy(destination.baseAddress, channelData[0], frameLength * MemoryLayout<Float>.size)
            } else {
                // Stéréo ou plus: entrelace les canaux
                for frame in 0..<frameLength {
                    for channel in 0..<channelCount {
                        destination[frame * channelCount + channel] = channelData[channel][frame]
                    }
                }
            }
        }
        
        return data
    }
    
    /// Met à jour le niveau audio
    private func updateAudioLevel(from buffer: AVAudioPCMBuffer) {
        guard let channelData = buffer.floatChannelData else { return }
        
        let channelCount = Int(buffer.format.channelCount)
        let frameLength = Int(buffer.frameLength)
        
        // Calcule le RMS (Root Mean Square) pour chaque canal
        var totalRMS: Float = 0.0
        
        for channel in 0..<channelCount {
            var rms: Float = 0.0
            vDSP_rmsqv(channelData[channel], 1, &rms, vDSP_Length(frameLength))
            totalRMS += rms
        }
        
        // Moyenne des canaux
        let averageRMS = totalRMS / Float(channelCount)
        
        // Stocke dans le buffer circulaire
        levelBuffer.append(averageRMS)
        if levelBuffer.count > 10 {
            levelBuffer.removeFirst()
        }
    }
    
    /// Démarre la mesure périodique du niveau audio
    private func startLevelMeasurement() {
        levelTimer = Timer.scheduledTimer(
            withTimeInterval: configuration.levelUpdateInterval,
            repeats: true
        ) { [weak self] _ in
            self?.reportAudioLevel()
        }
    }
    
    /// Arrête la mesure du niveau audio
    private func stopLevelMeasurement() {
        levelTimer?.invalidate()
        levelTimer = nil
        levelBuffer.removeAll()
    }
    
    /// Rapporte le niveau audio au delegate
    private func reportAudioLevel() {
        guard !levelBuffer.isEmpty else { return }
        
        // Calcule la moyenne des dernières mesures
        let averageLevel = levelBuffer.reduce(0, +) / Float(levelBuffer.count)
        
        // Normalise entre 0 et 1 (assume que le maximum est environ 1.0 pour float audio)
        let normalizedLevel = min(averageLevel, 1.0)
        
        callbackQueue.async {
            self.delegate?.audioCapture?(didUpdateAudioLevel: normalizedLevel)
        }
    }
    
    /// Valide la configuration
    private func validateConfiguration(_ config: AudioCaptureConfiguration) throws {
        // Vérifie le taux d'échantillonnage
        let supportedSampleRates = [8000.0, 16000.0, 22050.0, 44100.0, 48000.0]
        if !supportedSampleRates.contains(config.sampleRate) {
            throw AudioCaptureError.invalidConfiguration(
                "Le taux d'échantillonnage \(config.sampleRate) n'est pas supporté"
            )
        }
        
        // Vérifie le nombre de canaux
        if config.channelCount < 1 || config.channelCount > 2 {
            throw AudioCaptureError.invalidConfiguration(
                "Le nombre de canaux doit être 1 (mono) ou 2 (stéréo)"
            )
        }
        
        // Vérifie la taille du buffer
        if config.bufferSize < 64 || config.bufferSize > 8192 {
            throw AudioCaptureError.invalidConfiguration(
                "La taille du buffer doit être entre 64 et 8192 échantillons"
            )
        }
    }
    
    // MARK: - Cleanup
    
    deinit {
        stopRecording()
        inputNode?.removeTap(onBus: 0)
        AudioSessionManager.shared.removeAllObservers()
    }
}