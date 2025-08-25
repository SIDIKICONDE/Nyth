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
    const std::string AIFF = "AIFF";  // Audio Interchange File Format (Apple)
    const std::string M4A_AAC = "M4A_AAC";  // AAC dans conteneur M4A
    
    // Extensions de fichier
    const std::string ALAC_EXT = ".m4a";
    const std::string CAF_EXT = ".caf";
    const std::string AIFF_EXT = ".aiff";
    const std::string M4A_EXT = ".m4a";
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
    
    // Format AIFF (Audio Interchange File Format)
    struct AIFFConfig {
        bool enabled = true;
        bool compressed = false;  // false = PCM non compressé, true = AIFF-C
        int bitsPerSample = 16;   // 8, 16, 24, ou 32 bits
    };
    
    // Format M4A avec AAC
    struct M4AConfig {
        bool enabled = true;
        int bitrate = 128000;     // 128 kbps par défaut
        int aacProfile = 2;       // AAC-LC = 2, HE-AAC = 5, HE-AACv2 = 29
        bool vbr = true;          // Variable Bit Rate
    };
    
    ALACConfig alac;
    CAFConfig caf;
    AIFFConfig aiff;
    M4AConfig m4a;
    
    // Méthodes utilitaires
    static IOSAudioFormatConfig forHighQualityRecording() {
        IOSAudioFormatConfig config;
        config.alac.compressionLevel = 0;  // Meilleure qualité
        config.caf.formatID = kAudioFormatAppleLossless;
        return config;
    }
    
    static IOSAudioFormatConfig forVoiceRecording() {
        IOSAudioFormatConfig config;
        config.m4a.enabled = true;
        config.m4a.bitrate = 64000;  // 64 kbps pour la voix
        config.m4a.aacProfile = 2;   // AAC-LC
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
        } else if (format == IOSAudioFormats::AIFF) {
            return kAudioFileAIFFType;
        } else if (format == IOSAudioFormats::M4A_AAC) {
            return kAudioFileM4AType;
        }
        return kAudioFileWAVEType;  // Par défaut
    }
    
    // Obtenir l'AudioFormatID pour un format donné
    static AudioFormatID getAudioFormatID(const std::string& format) {
        if (format == IOSAudioFormats::ALAC) {
            return kAudioFormatAppleLossless;
        } else if (format == IOSAudioFormats::AIFF) {
            return kAudioFormatLinearPCM;  // AIFF utilise PCM
        } else if (format == IOSAudioFormats::M4A_AAC) {
            return kAudioFormatMPEG4AAC;
        }
        return kAudioFormatLinearPCM;  // Par défaut pour CAF et WAV
    }
    
    // Vérifier si le format est supporté sur iOS
    static bool isFormatSupported(const std::string& format) {
        return format == IOSAudioFormats::ALAC ||
               format == IOSAudioFormats::CAF ||
               format == IOSAudioFormats::AIFF ||
               format == IOSAudioFormats::M4A_AAC ||
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
        } else if (format == IOSAudioFormats::AIFF) {
            desc.mFormatID = kAudioFormatLinearPCM;
            desc.mFormatFlags = kAudioFormatFlagIsBigEndian | 
                               kAudioFormatFlagIsSignedInteger | 
                               kAudioFormatFlagIsPacked;
            desc.mBitsPerChannel = 16;
            desc.mFramesPerPacket = 1;
            desc.mBytesPerFrame = desc.mChannelsPerFrame * 2;
            desc.mBytesPerPacket = desc.mBytesPerFrame;
        } else if (format == IOSAudioFormats::M4A_AAC) {
            desc.mFormatID = kAudioFormatMPEG4AAC;
            desc.mFramesPerPacket = 1024;  // AAC typique
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