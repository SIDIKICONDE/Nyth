import Foundation
import AVFoundation

/// Presets d'enregistrement audio prédéfinis
@objc
public enum AudioRecorderPreset: Int {
    case voiceNote      // Notes vocales, mémos
    case voiceCall      // Appels VoIP
    case musicHigh      // Musique haute qualité
    case musicStandard  // Musique qualité standard
    case professional   // Enregistrement professionnel
    case compact        // Fichiers compacts
    case streaming      // Optimisé pour le streaming
}

/// AudioRecorder - Module natif iOS pour la capture audio
/// Conçu pour être intégré dans un TurboModule React Native
@objc(AudioRecorder)
public class AudioRecorder: NSObject {
    
    // MARK: - Properties
    
    /// Session audio partagée pour gérer la configuration audio système
    private let audioSession = AVAudioSession.sharedInstance()
    
    /// Engine audio pour l'enregistrement
    private var audioEngine: AVAudioEngine?
    
    /// Noeud d'entrée pour capturer le microphone
    private var inputNode: AVAudioInputNode?
    
    /// Format audio pour l'enregistrement
    private var recordingFormat: AVAudioFormat?
    
    /// File d'écriture pour sauvegarder l'audio
    private var audioFile: AVAudioFile?
    
    /// URL du fichier en cours d'enregistrement
    private var currentRecordingURL: URL?
    
    /// État de l'enregistrement
    @objc public private(set) var isRecording: Bool = false
    
    /// État de pause
    @objc public private(set) var isPaused: Bool = false
    
    /// Delegate pour les callbacks
    @objc public weak var delegate: AudioRecorderDelegate?
    
    // MARK: - Configuration
    
    /// Configuration audio actuelle
    @objc public var audioConfiguration: AudioConfiguration = .voiceRecording {
        didSet {
            // Reconfigure le format d'enregistrement si nécessaire
            setupRecordingFormat()
        }
    }
    
    // MARK: - Initialization
    
    @objc
    public override init() {
        super.init()
        setupAudioEngine()
    }
    
    deinit {
        stopRecording()
        audioEngine = nil
    }
    
    // MARK: - Setup
    
    /// Configure l'engine audio
    private func setupAudioEngine() {
        audioEngine = AVAudioEngine()
        inputNode = audioEngine?.inputNode
        
        // Configure le format d'enregistrement
        setupRecordingFormat()
    }
    
    /// Configure le format d'enregistrement basé sur la configuration audio
    private func setupRecordingFormat() {
        guard let inputNode = inputNode else {
            delegate?.audioRecorder(self, didFailWithError: AudioRecorderError.setupFailed)
            return
        }
        
        // Obtient le format d'entrée natif
        let inputFormat = inputNode.outputFormat(forBus: 0)
        
        // Crée le format d'enregistrement basé sur la configuration
        recordingFormat = AVAudioFormat(
            commonFormat: .pcmFormatFloat32,
            sampleRate: audioConfiguration.sampleRate,
            channels: AVAudioChannelCount(audioConfiguration.channels),
            interleaved: true
        )
        
        // Si le format n'est pas supporté, utilise le format natif
        if recordingFormat == nil {
            recordingFormat = inputFormat
        }
    }
    
    /// Configure la session audio AVAudioSession
    @objc
    public func configureAudioSession() throws {
        do {
            // Configure la session pour l'enregistrement
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            try audioSession.setActive(true)
            
            // Notifie le delegate de la configuration réussie
            delegate?.audioRecorderDidConfigureSession(self)
            
        } catch {
            let recorderError = AudioRecorderError.sessionConfigurationFailed(error)
            delegate?.audioRecorder(self, didFailWithError: recorderError)
            throw recorderError
        }
    }
    
    // MARK: - Permissions
    
    /// Vérifie et demande les permissions du microphone
    @objc
    public func requestMicrophonePermission(completion: @escaping (Bool) -> Void) {
        switch audioSession.recordPermission {
        case .granted:
            completion(true)
            
        case .denied:
            completion(false)
            
        case .undetermined:
            audioSession.requestRecordPermission { granted in
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
            
        @unknown default:
            completion(false)
        }
    }
    
    // MARK: - Audio Format Configuration
    
    /// Configure le format audio pour l'enregistrement
    @objc
    public func setAudioFormat(_ format: AudioFormat, quality: AudioQuality = .high) {
        audioConfiguration = AudioConfiguration(format: format, quality: quality, channels: audioConfiguration.channels)
    }
    
    /// Configure avec un preset prédéfini
    @objc
    public func usePreset(_ preset: AudioRecorderPreset) {
        switch preset {
        case .voiceNote:
            audioConfiguration = .voiceRecording
        case .voiceCall:
            audioConfiguration = .voipCall
        case .musicHigh:
            audioConfiguration = .musicHighQuality
        case .musicStandard:
            audioConfiguration = .musicStandard
        case .professional:
            audioConfiguration = .professionalRecording
        case .compact:
            audioConfiguration = .compact
        case .streaming:
            audioConfiguration = .streaming
        }
    }
    
    /// Obtient les formats supportés
    @objc
    public static func supportedFormats() -> [AudioFormat] {
        return AudioFormat.allCases
    }
    
    /// Obtient la taille estimée du fichier par minute
    @objc
    public func estimatedFileSizePerMinute() -> Double {
        return audioConfiguration.estimatedFileSizePerMinute
    }
    
    // MARK: - Recording Control
    
    /// Démarre l'enregistrement audio
    @objc
    public func startRecording(toFileURL url: URL? = nil) throws {
        // Vérifie les permissions
        guard audioSession.recordPermission == .granted else {
            throw AudioRecorderError.permissionDenied
        }
        
        // Vérifie l'état
        guard !isRecording else {
            throw AudioRecorderError.alreadyRecording
        }
        
        // Configure la session audio si nécessaire
        if !audioSession.isOtherAudioPlaying {
            try configureAudioSession()
        }
        
        // Prépare l'URL du fichier
        let fileURL = url ?? generateDefaultFileURL()
        currentRecordingURL = fileURL
        
        // Crée le fichier audio avec les paramètres de la configuration
        guard recordingFormat != nil else {
            throw AudioRecorderError.invalidFormat
        }
        
        do {
            audioFile = try AVAudioFile(forWriting: fileURL, settings: audioConfiguration.audioSettings)
        } catch {
            throw AudioRecorderError.fileCreationFailed(error)
        }
        
        // Configure le tap sur le noeud d'entrée
        guard let inputNode = inputNode else {
            throw AudioRecorderError.inputNodeUnavailable
        }
        
        // Utilise le format natif pour le tap et convertit si nécessaire
        let tapFormat = inputNode.outputFormat(forBus: 0)
        
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: tapFormat) { [weak self] buffer, time in
            guard let self = self, let audioFile = self.audioFile else { return }
            
            do {
                try audioFile.write(from: buffer)
                
                // Calcule et notifie le niveau audio
                self.calculateAndNotifyAudioLevel(from: buffer)
                
            } catch {
                DispatchQueue.main.async {
                    self.delegate?.audioRecorder(self, didFailWithError: AudioRecorderError.writeFailed(error))
                }
            }
        }
        
        // Démarre l'engine
        guard let audioEngine = audioEngine else {
            throw AudioRecorderError.engineUnavailable
        }
        
        do {
            try audioEngine.start()
            isRecording = true
            isPaused = false
            
            // Notifie le delegate
            delegate?.audioRecorderDidStartRecording(self)
            
        } catch {
            inputNode.removeTap(onBus: 0)
            throw AudioRecorderError.engineStartFailed(error)
        }
    }
    
    /// Arrête l'enregistrement
    @objc
    public func stopRecording() {
        guard isRecording else { return }
        
        // Arrête l'engine
        audioEngine?.stop()
        inputNode?.removeTap(onBus: 0)
        
        // Ferme le fichier
        audioFile = nil
        
        // Met à jour l'état
        isRecording = false
        isPaused = false
        
        // Notifie le delegate avec l'URL du fichier
        if let url = currentRecordingURL {
            delegate?.audioRecorder(self, didFinishRecordingToURL: url)
        }
        
        currentRecordingURL = nil
    }
    
    /// Met en pause l'enregistrement
    @objc
    public func pauseRecording() {
        guard isRecording && !isPaused else { return }
        
        audioEngine?.pause()
        isPaused = true
        
        delegate?.audioRecorderDidPauseRecording(self)
    }
    
    /// Reprend l'enregistrement
    @objc
    public func resumeRecording() throws {
        guard isRecording && isPaused else { return }
        
        do {
            try audioEngine?.start()
            isPaused = false
            
            delegate?.audioRecorderDidResumeRecording(self)
            
        } catch {
            throw AudioRecorderError.engineStartFailed(error)
        }
    }
    
    // MARK: - Audio Level Monitoring
    
    /// Calcule et notifie le niveau audio
    private func calculateAndNotifyAudioLevel(from buffer: AVAudioPCMBuffer) {
        guard let channelData = buffer.floatChannelData else { return }
        
        let channelDataValue = channelData.pointee
        let channelDataArray = Array(UnsafeBufferPointer(start: channelDataValue, count: Int(buffer.frameLength)))
        
        // Calcule le RMS (Root Mean Square)
        let rms = sqrt(channelDataArray.map { $0 * $0 }.reduce(0, +) / Float(buffer.frameLength))
        
        // Convertit en décibels
        let avgPower = 20 * log10(rms)
        
        DispatchQueue.main.async {
            self.delegate?.audioRecorder(self, didUpdateAudioLevel: avgPower)
        }
    }
    
    // MARK: - Helpers
    
    /// Génère une URL par défaut pour le fichier audio
    private func generateDefaultFileURL() -> URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd-HH-mm-ss"
        let fileName = "audio-recording-\(dateFormatter.string(from: Date())).\(audioConfiguration.format.fileExtension)"
        return documentsPath.appendingPathComponent(fileName)
    }
}

// MARK: - AudioRecorderError

/// Erreurs spécifiques au module AudioRecorder
@objc
public enum AudioRecorderError: Int, LocalizedError {
    case setupFailed
    case sessionConfigurationFailed
    case permissionDenied
    case alreadyRecording
    case notRecording
    case invalidFormat
    case fileCreationFailed
    case inputNodeUnavailable
    case engineUnavailable
    case engineStartFailed
    case writeFailed
    
    public var errorDescription: String? {
        switch self {
        case .setupFailed:
            return "Failed to setup audio engine"
        case .sessionConfigurationFailed:
            return "Failed to configure audio session"
        case .permissionDenied:
            return "Microphone permission denied"
        case .alreadyRecording:
            return "Already recording"
        case .notRecording:
            return "Not currently recording"
        case .invalidFormat:
            return "Invalid audio format"
        case .fileCreationFailed:
            return "Failed to create audio file"
        case .inputNodeUnavailable:
            return "Audio input node unavailable"
        case .engineUnavailable:
            return "Audio engine unavailable"
        case .engineStartFailed:
            return "Failed to start audio engine"
        case .writeFailed:
            return "Failed to write audio data"
        }
    }
    
    /// Initialise avec une erreur sous-jacente
    static func sessionConfigurationFailed(_ underlyingError: Error) -> AudioRecorderError {
        return .sessionConfigurationFailed
    }
    
    static func fileCreationFailed(_ underlyingError: Error) -> AudioRecorderError {
        return .fileCreationFailed
    }
    
    static func engineStartFailed(_ underlyingError: Error) -> AudioRecorderError {
        return .engineStartFailed
    }
    
    static func writeFailed(_ underlyingError: Error) -> AudioRecorderError {
        return .writeFailed
    }
}

// MARK: - AudioRecorderDelegate

/// Protocole delegate pour les callbacks de l'enregistreur audio
@objc
public protocol AudioRecorderDelegate: AnyObject {
    
    /// Appelé quand la session audio est configurée avec succès
    @objc optional func audioRecorderDidConfigureSession(_ recorder: AudioRecorder)
    
    /// Appelé quand l'enregistrement démarre
    @objc optional func audioRecorderDidStartRecording(_ recorder: AudioRecorder)
    
    /// Appelé quand l'enregistrement est mis en pause
    @objc optional func audioRecorderDidPauseRecording(_ recorder: AudioRecorder)
    
    /// Appelé quand l'enregistrement reprend
    @objc optional func audioRecorderDidResumeRecording(_ recorder: AudioRecorder)
    
    /// Appelé quand l'enregistrement se termine avec succès
    @objc optional func audioRecorder(_ recorder: AudioRecorder, didFinishRecordingToURL url: URL)
    
    /// Appelé quand le niveau audio est mis à jour (en décibels)
    @objc optional func audioRecorder(_ recorder: AudioRecorder, didUpdateAudioLevel level: Float)
    
    /// Appelé en cas d'erreur
    @objc optional func audioRecorder(_ recorder: AudioRecorder, didFailWithError error: AudioRecorderError)
}