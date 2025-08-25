#pragma once

#ifdef __APPLE__
#if TARGET_OS_IOS

#include <string>
#include <AudioToolbox/AudioToolbox.h>

namespace Nyth {
namespace Audio {
namespace iOS {

// === Formats audio spécifiques iOS ===
namespace IOSAudioFormats {
    // Formats Apple natifs
    const std::string ALAC = "ALAC";  // Apple Lossless Audio Codec
    const std::string CAF = "CAF";    // Core Audio Format
    const std::string AMR = "AMR";    // Adaptive Multi-Rate (pour la voix)
    
    // Extensions de fichier
    const std::string ALAC_EXT = ".m4a";
    const std::string CAF_EXT = ".caf";
    const std::string AMR_EXT = ".amr";
}

// === Configuration spécifique pour les formats iOS ===
struct IOSAudioFormatConfig {
    // Format ALAC (Apple Lossless)
    struct ALACConfig {
        bool enabled = true;
        int compressionLevel = 0;  // 0 = meilleure qualité, plus gros fichier
        bool fastMode = false;     // Mode rapide pour l'encodage temps réel
    };
    
    // Format CAF (Core Audio Format)
    struct CAFConfig {
        bool enabled = true;
        AudioFormatID formatID = kAudioFormatLinearPCM;  // Par défaut PCM
        bool allowsVariableFrames = true;  // Pour les enregistrements longs
        bool optimizeForSpeech = false;    // Optimisation pour la voix
    };
    
    // Format AMR (Adaptive Multi-Rate)
    struct AMRConfig {
        bool enabled = true;
        int bitrate = 12200;  // 12.2 kbps par défaut (AMR-NB)
        bool wideband = false;  // false = AMR-NB (8kHz), true = AMR-WB (16kHz)
        bool dtxEnabled = true;  // Discontinuous Transmission (économie batterie)
    };
    
    ALACConfig alac;
    CAFConfig caf;
    AMRConfig amr;
    
    // Méthodes utilitaires
    static IOSAudioFormatConfig forHighQualityRecording() {
        IOSAudioFormatConfig config;
        config.alac.compressionLevel = 0;  // Meilleure qualité
        config.caf.formatID = kAudioFormatAppleLossless;
        return config;
    }
    
    static IOSAudioFormatConfig forVoiceRecording() {
        IOSAudioFormatConfig config;
        config.amr.enabled = true;
        config.amr.bitrate = 7950;  // 7.95 kbps pour économie
        config.caf.optimizeForSpeech = true;
        return config;
    }
    
    static IOSAudioFormatConfig forLongRecording() {
        IOSAudioFormatConfig config;
        config.caf.enabled = true;  // CAF n'a pas de limite 4GB
        config.caf.allowsVariableFrames = true;
        return config;
    }
};

// === Helpers pour la conversion de format ===
class IOSAudioFormatHelper {
public:
    // Obtenir l'AudioFileTypeID pour un format donné
    static AudioFileTypeID getAudioFileType(const std::string& format) {
        if (format == IOSAudioFormats::ALAC) {
            return kAudioFileM4AType;
        } else if (format == IOSAudioFormats::CAF) {
            return kAudioFileCAFType;
        } else if (format == IOSAudioFormats::AMR) {
            return kAudioFileAMRType;
        }
        return kAudioFileWAVEType;  // Par défaut
    }
    
    // Obtenir l'AudioFormatID pour un format donné
    static AudioFormatID getAudioFormatID(const std::string& format) {
        if (format == IOSAudioFormats::ALAC) {
            return kAudioFormatAppleLossless;
        } else if (format == IOSAudioFormats::AMR) {
            return kAudioFormatAMR;
        }
        return kAudioFormatLinearPCM;  // Par défaut pour CAF et WAV
    }
    
    // Vérifier si le format est supporté sur iOS
    static bool isFormatSupported(const std::string& format) {
        return format == IOSAudioFormats::ALAC ||
               format == IOSAudioFormats::CAF ||
               format == IOSAudioFormats::AMR ||
               format == "WAV" || format == "M4A" || 
               format == "AAC" || format == "FLAC";
    }
    
    // Obtenir la description audio pour un format
    static AudioStreamBasicDescription getAudioDescription(
        const std::string& format,
        double sampleRate,
        int channelCount) {
        
        AudioStreamBasicDescription desc = {0};
        desc.mSampleRate = sampleRate;
        desc.mChannelsPerFrame = channelCount;
        
        if (format == IOSAudioFormats::ALAC) {
            desc.mFormatID = kAudioFormatAppleLossless;
            desc.mFormatFlags = kAppleLosslessFormatFlag_16BitSourceData;
            desc.mFramesPerPacket = 4096;  // Typique pour ALAC
        } else if (format == IOSAudioFormats::AMR) {
            desc.mFormatID = kAudioFormatAMR;
            desc.mSampleRate = 8000;  // AMR-NB utilise 8kHz
            desc.mChannelsPerFrame = 1;  // Mono seulement
            desc.mFramesPerPacket = 160;  // 20ms frames
        } else if (format == IOSAudioFormats::CAF) {
            desc.mFormatID = kAudioFormatLinearPCM;
            desc.mFormatFlags = kAudioFormatFlagIsFloat | 
                               kAudioFormatFlagIsPacked;
            desc.mBitsPerChannel = 32;
            desc.mFramesPerPacket = 1;
            desc.mBytesPerFrame = desc.mChannelsPerFrame * 4;
            desc.mBytesPerPacket = desc.mBytesPerFrame;
        }
        
        return desc;
    }
};

} // namespace iOS
} // namespace Audio
} // namespace Nyth

#endif // TARGET_OS_IOS
#endif // __APPLE__