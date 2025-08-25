import Foundation
import AVFoundation

/// Formats audio supportés par iOS
@objc
public enum AudioFormat: Int, CaseIterable {
    // Formats compressés avec perte
    case aac = 0        // Advanced Audio Coding (.m4a, .aac) - Recommandé pour la plupart des cas
    case mp3            // MPEG Audio Layer III (.mp3)
    case amr            // Adaptive Multi-Rate (.amr) - Pour la voix
    case amrWB          // AMR WideBand (.amr) - Voix haute qualité
    case ilbc           // Internet Low Bitrate Codec (.ilbc) - VoIP
    
    // Formats compressés sans perte
    case alac           // Apple Lossless Audio Codec (.m4a)
    case flac           // Free Lossless Audio Codec (.flac)
    
    // Formats non compressés
    case pcmInt16       // PCM 16-bit entier (.wav, .aiff)
    case pcmInt32       // PCM 32-bit entier (.wav, .aiff)
    case pcmFloat32     // PCM 32-bit flottant (.wav, .aiff)
    case pcmFloat64     // PCM 64-bit flottant (.wav, .aiff)
    
    // Formats spécialisés
    case opus           // Opus (.opus) - Haute qualité, faible latence
    case speex          // Speex (.spx) - Optimisé pour la voix
    
    /// Extension de fichier recommandée
    public var fileExtension: String {
        switch self {
        case .aac, .alac:
            return "m4a"
        case .mp3:
            return "mp3"
        case .amr, .amrWB:
            return "amr"
        case .ilbc:
            return "ilbc"
        case .flac:
            return "flac"
        case .pcmInt16, .pcmInt32, .pcmFloat32, .pcmFloat64:
            return "wav"
        case .opus:
            return "opus"
        case .speex:
            return "spx"
        }
    }
    
    /// Nom lisible du format
    public var displayName: String {
        switch self {
        case .aac:
            return "AAC (Advanced Audio Coding)"
        case .mp3:
            return "MP3"
        case .amr:
            return "AMR (Adaptive Multi-Rate)"
        case .amrWB:
            return "AMR-WB (WideBand)"
        case .ilbc:
            return "iLBC (Internet Low Bitrate Codec)"
        case .alac:
            return "ALAC (Apple Lossless)"
        case .flac:
            return "FLAC (Free Lossless)"
        case .pcmInt16:
            return "PCM 16-bit Integer"
        case .pcmInt32:
            return "PCM 32-bit Integer"
        case .pcmFloat32:
            return "PCM 32-bit Float"
        case .pcmFloat64:
            return "PCM 64-bit Float"
        case .opus:
            return "Opus"
        case .speex:
            return "Speex"
        }
    }
    
    /// Type de format (compressé avec perte, sans perte, non compressé)
    public var formatType: FormatType {
        switch self {
        case .aac, .mp3, .amr, .amrWB, .ilbc, .opus, .speex:
            return .compressedLossy
        case .alac, .flac:
            return .compressedLossless
        case .pcmInt16, .pcmInt32, .pcmFloat32, .pcmFloat64:
            return .uncompressed
        }
    }
    
    /// Usage recommandé
    public var recommendedUsage: UsageType {
        switch self {
        case .aac, .mp3:
            return .general
        case .amr, .amrWB, .ilbc, .speex:
            return .voice
        case .alac, .flac, .pcmFloat32, .pcmFloat64:
            return .music
        case .pcmInt16, .pcmInt32:
            return .professional
        case .opus:
            return .streaming
        }
    }
    
    /// Format ID pour AVAudioFile
    public var formatID: AudioFormatID {
        switch self {
        case .aac:
            return kAudioFormatMPEG4AAC
        case .mp3:
            return kAudioFormatMPEGLayer3
        case .amr:
            return kAudioFormatAMR
        case .amrWB:
            return kAudioFormatAMR_WB
        case .ilbc:
            return kAudioFormatiLBC
        case .alac:
            return kAudioFormatAppleLossless
        case .flac:
            return kAudioFormatFLAC
        case .pcmInt16:
            return kAudioFormatLinearPCM
        case .pcmInt32:
            return kAudioFormatLinearPCM
        case .pcmFloat32:
            return kAudioFormatLinearPCM
        case .pcmFloat64:
            return kAudioFormatLinearPCM
        case .opus:
            return kAudioFormatOpus
        case .speex:
            return 0x73706578 // 'spex'
        }
    }
}

/// Type de format audio
@objc
public enum FormatType: Int {
    case compressedLossy    // Compression avec perte
    case compressedLossless // Compression sans perte
    case uncompressed       // Non compressé
}

/// Usage recommandé du format
@objc
public enum UsageType: Int {
    case general        // Usage général
    case voice          // Optimisé pour la voix
    case music          // Optimisé pour la musique
    case professional   // Usage professionnel
    case streaming      // Optimisé pour le streaming
}

/// Qualité d'enregistrement
@objc
public enum AudioQuality: Int {
    case low = 0
    case medium
    case high
    case maximum
    
    /// Bitrate pour les formats compressés (en kbps)
    public func bitrate(for format: AudioFormat) -> Int {
        switch format {
        case .aac:
            switch self {
            case .low: return 64
            case .medium: return 128
            case .high: return 192
            case .maximum: return 256
            }
        case .mp3:
            switch self {
            case .low: return 96
            case .medium: return 160
            case .high: return 256
            case .maximum: return 320
            }
        case .opus:
            switch self {
            case .low: return 32
            case .medium: return 64
            case .high: return 128
            case .maximum: return 256
            }
        case .amr:
            return 12 // AMR a un bitrate fixe
        case .amrWB:
            return 24 // AMR-WB a un bitrate fixe
        case .ilbc:
            return 15 // iLBC a des bitrates fixes (13.33 ou 15.2)
        case .speex:
            switch self {
            case .low: return 8
            case .medium: return 15
            case .high: return 24
            case .maximum: return 44
            }
        default:
            return 0 // Les formats non compressés n'ont pas de bitrate
        }
    }
    
    /// Taux d'échantillonnage recommandé (en Hz)
    public func sampleRate(for format: AudioFormat) -> Double {
        switch format {
        case .amr:
            return 8000
        case .amrWB:
            return 16000
        case .ilbc:
            return 8000
        case .speex:
            switch self {
            case .low: return 8000
            case .medium: return 16000
            case .high, .maximum: return 32000
            }
        case .opus:
            return 48000 // Opus supporte plusieurs taux mais 48kHz est recommandé
        default:
            switch self {
            case .low: return 22050
            case .medium: return 44100
            case .high: return 48000
            case .maximum: return 96000
            }
        }
    }
}

/// Configuration audio complète
@objc
public class AudioConfiguration: NSObject {
    
    @objc public let format: AudioFormat
    @objc public let quality: AudioQuality
    @objc public let channels: Int
    @objc public let sampleRate: Double
    @objc public let bitDepth: Int
    
    /// Initialisation avec des valeurs par défaut
    @objc
    public override init() {
        self.format = .aac
        self.quality = .high
        self.channels = 1
        self.sampleRate = 44100
        self.bitDepth = 16
        super.init()
    }
    
    /// Initialisation personnalisée
    @objc
    public init(format: AudioFormat,
                quality: AudioQuality = .high,
                channels: Int = 1,
                sampleRate: Double? = nil,
                bitDepth: Int = 16) {
        self.format = format
        self.quality = quality
        self.channels = channels
        self.sampleRate = sampleRate ?? quality.sampleRate(for: format)
        self.bitDepth = bitDepth
        super.init()
    }
    
    /// Paramètres pour AVAudioFile
    public var audioSettings: [String: Any] {
        var settings: [String: Any] = [:]
        
        // Format de base
        settings[AVFormatIDKey] = format.formatID
        settings[AVSampleRateKey] = sampleRate
        settings[AVNumberOfChannelsKey] = channels
        
        // Paramètres spécifiques au format
        switch format {
        case .aac, .mp3, .opus:
            // Formats compressés avec bitrate
            let bitrate = quality.bitrate(for: format) * 1000 // Convertir en bps
            settings[AVEncoderBitRateKey] = bitrate
            
            if format == .aac {
                settings[AVEncoderAudioQualityKey] = audioQualityValue
            }
            
        case .alac, .flac:
            // Formats sans perte
            settings[AVEncoderBitDepthHintKey] = bitDepth
            
        case .pcmInt16:
            settings[AVLinearPCMBitDepthKey] = 16
            settings[AVLinearPCMIsFloatKey] = false
            settings[AVLinearPCMIsBigEndianKey] = false
            settings[AVLinearPCMIsNonInterleaved] = false
            
        case .pcmInt32:
            settings[AVLinearPCMBitDepthKey] = 32
            settings[AVLinearPCMIsFloatKey] = false
            settings[AVLinearPCMIsBigEndianKey] = false
            settings[AVLinearPCMIsNonInterleaved] = false
            
        case .pcmFloat32:
            settings[AVLinearPCMBitDepthKey] = 32
            settings[AVLinearPCMIsFloatKey] = true
            settings[AVLinearPCMIsBigEndianKey] = false
            settings[AVLinearPCMIsNonInterleaved] = false
            
        case .pcmFloat64:
            settings[AVLinearPCMBitDepthKey] = 64
            settings[AVLinearPCMIsFloatKey] = true
            settings[AVLinearPCMIsBigEndianKey] = false
            settings[AVLinearPCMIsNonInterleaved] = false
            
        case .amr, .amrWB, .ilbc, .speex:
            // Formats vocaux avec paramètres fixes
            break
        }
        
        return settings
    }
    
    /// Valeur de qualité pour AVAudioQuality
    private var audioQualityValue: Int {
        switch quality {
        case .low:
            return AVAudioQuality.low.rawValue
        case .medium:
            return AVAudioQuality.medium.rawValue
        case .high:
            return AVAudioQuality.high.rawValue
        case .maximum:
            return AVAudioQuality.max.rawValue
        }
    }
    
    /// Taille estimée du fichier par minute (en MB)
    public var estimatedFileSizePerMinute: Double {
        switch format.formatType {
        case .compressedLossy:
            let bitrate = quality.bitrate(for: format)
            return Double(bitrate) * 60 / 8 / 1024 // kbps * 60s / 8 bits / 1024 KB
            
        case .compressedLossless:
            // Estimation approximative pour les formats sans perte
            return Double(channels) * sampleRate * Double(bitDepth) * 60 / 8 / 1024 / 1024 * 0.6
            
        case .uncompressed:
            // Calcul exact pour PCM
            return Double(channels) * sampleRate * Double(bitDepth) * 60 / 8 / 1024 / 1024
        }
    }
    
    /// Description lisible de la configuration
    public override var description: String {
        return "\(format.displayName) - \(quality) quality - \(Int(sampleRate))Hz - \(channels)ch"
    }
}

/// Presets de configuration prédéfinis
extension AudioConfiguration {
    
    /// Configuration pour enregistrement vocal (podcasts, mémos vocaux)
    @objc
    public static var voiceRecording: AudioConfiguration {
        return AudioConfiguration(format: .aac, quality: .medium, channels: 1, sampleRate: 44100)
    }
    
    /// Configuration pour appels VoIP
    @objc
    public static var voipCall: AudioConfiguration {
        return AudioConfiguration(format: .opus, quality: .medium, channels: 1, sampleRate: 16000)
    }
    
    /// Configuration pour musique haute qualité
    @objc
    public static var musicHighQuality: AudioConfiguration {
        return AudioConfiguration(format: .alac, quality: .maximum, channels: 2, sampleRate: 48000, bitDepth: 24)
    }
    
    /// Configuration pour musique standard
    @objc
    public static var musicStandard: AudioConfiguration {
        return AudioConfiguration(format: .aac, quality: .high, channels: 2, sampleRate: 44100)
    }
    
    /// Configuration pour enregistrement professionnel
    @objc
    public static var professionalRecording: AudioConfiguration {
        return AudioConfiguration(format: .pcmFloat32, quality: .maximum, channels: 2, sampleRate: 96000)
    }
    
    /// Configuration pour fichiers compacts (faible espace)
    @objc
    public static var compact: AudioConfiguration {
        return AudioConfiguration(format: .aac, quality: .low, channels: 1, sampleRate: 22050)
    }
    
    /// Configuration pour streaming
    @objc
    public static var streaming: AudioConfiguration {
        return AudioConfiguration(format: .opus, quality: .high, channels: 2, sampleRate: 48000)
    }
}