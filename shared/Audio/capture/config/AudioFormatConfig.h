#pragma once

#include "../../common/config/AudioLimits.h"
#include "../../common/config/Constant.hpp"
#include <string>

namespace Nyth {
namespace Audio {

// === Constantes pour les formats audio ===
namespace AudioFormats {
    const std::string AAC = "AAC";
    const std::string M4A = "M4A";
    const std::string FLAC = "FLAC";
    const std::string WAV = "WAV";
#ifdef __APPLE__
#if TARGET_OS_IOS
    const std::string ALAC = "ALAC";  // Apple Lossless Audio Codec
    const std::string CAF = "CAF";    // Core Audio Format
    const std::string AMR = "AMR";    // Adaptive Multi-Rate
#endif
#endif
}

// === Configuration des formats audio pour plateformes mobiles ===
struct AudioFormatConfig {
    // === Format principal ===
    std::string format = AudioFormats::AAC; // "AAC", "M4A", "FLAC", "WAV"

    // === Configuration AAC (recommandé pour mobile) ===
    int aacBitrate = Constants::AAC_BITRATE_MEDIUM; // 128 kbps par défaut
    int aacProfile = 2; // AAC-LC = 2, HE-AAC = 5, HE-AACv2 = 29

    // === Configuration qualité ===
    float quality = Constants::AUDIO_QUALITY_HIGH; // 90% qualité par défaut

    // === Options de compression ===
    bool enableVBR = true; // Variable Bit Rate pour meilleure qualité
    bool enableMetadata = true; // Inclure métadonnées (tags ID3, etc.)

    // === Configuration spécifique plateforme ===
    bool useHardwareEncoding = true; // Utiliser l'encodage matériel si disponible
    bool enableFastStart = true; // Optimisation pour la lecture en streaming

    // === Validation ===
    bool isValid() const {
        if (format != AudioFormats::AAC && format != AudioFormats::M4A && format != AudioFormats::FLAC && format != AudioFormats::WAV
#ifdef __APPLE__
#if TARGET_OS_IOS
            && format != AudioFormats::ALAC && format != AudioFormats::CAF && format != AudioFormats::AMR
#endif
#endif
        ) {
            return false;
        }

        // Validation bitrate AAC
        if (format == AudioFormats::AAC || format == AudioFormats::M4A) {
            if (aacBitrate < Constants::AAC_BITRATE_LOW || aacBitrate > Constants::AAC_BITRATE_MAX) {
                return false;
            }
        }

        // Validation qualité
        if (quality < 0.0f || quality > 1.0f) {
            return false;
        }

        return true;
    }

    std::string getValidationError() const {
        if (format != AudioFormats::AAC && format != AudioFormats::M4A && format != AudioFormats::FLAC && format != AudioFormats::WAV
#ifdef __APPLE__
#if TARGET_OS_IOS
            && format != AudioFormats::ALAC && format != AudioFormats::CAF && format != AudioFormats::AMR
#endif
#endif
        ) {
            return "Format must be 'AAC', 'M4A', 'FLAC', 'WAV'"
#ifdef __APPLE__
#if TARGET_OS_IOS
                   ", 'ALAC', 'CAF', or 'AMR'"
#endif
#endif
            ;
        }

        if (format == AudioFormats::AAC || format == AudioFormats::M4A) {
            if (aacBitrate < Constants::AAC_BITRATE_LOW) {
                return "AAC bitrate too low (minimum " + std::to_string(Constants::AAC_BITRATE_LOW) + ")";
            }
            if (aacBitrate > Constants::AAC_BITRATE_MAX) {
                return "AAC bitrate too high (maximum " + std::to_string(Constants::AAC_BITRATE_MAX) + ")";
            }
        }

        if (quality < 0.0f || quality > 1.0f) {
            return "Quality must be between 0.0 and 1.0";
        }

        return "";
    }

    // === Méthodes utilitaires ===
    std::string getFileExtension() const {
        if (format == AudioFormats::AAC) return ".aac";
        if (format == AudioFormats::M4A) return ".m4a";
        if (format == AudioFormats::FLAC) return ".flac";
        if (format == AudioFormats::WAV) return ".wav";
#ifdef __APPLE__
#if TARGET_OS_IOS
        if (format == AudioFormats::ALAC) return ".m4a";  // ALAC utilise l'extension .m4a
        if (format == AudioFormats::CAF) return ".caf";
        if (format == AudioFormats::AMR) return ".amr";
#endif
#endif
        return ".aac"; // Par défaut
    }

    bool isLossless() const {
        return format == AudioFormats::FLAC || format == AudioFormats::WAV
#ifdef __APPLE__
#if TARGET_OS_IOS
            || format == AudioFormats::ALAC  // ALAC est sans perte
#endif
#endif
        ;
    }

    bool isMobileOptimized() const {
        return format == AudioFormats::AAC || format == AudioFormats::M4A;
    }

    // === Configuration par usage ===
    static AudioFormatConfig forVoiceRecording() {
        AudioFormatConfig config;
        config.format = AudioFormats::AAC;
        config.aacBitrate = Constants::AAC_BITRATE_LOW;
        config.quality = Constants::AUDIO_QUALITY_MEDIUM;
        config.enableVBR = true;
        return config;
    }

    static AudioFormatConfig forMusicRecording() {
        AudioFormatConfig config;
        config.format = AudioFormats::FLAC; // Pour la qualité sans perte
        config.quality = Constants::AUDIO_QUALITY_LOSSLESS;
        return config;
    }

    static AudioFormatConfig forStreaming() {
        AudioFormatConfig config;
        config.format = AudioFormats::AAC;
        config.aacBitrate = Constants::AAC_BITRATE_HIGH;
        config.quality = Constants::AUDIO_QUALITY_HIGH;
        config.enableFastStart = true;
        return config;
    }
};

// === Fonctions helper pour les formats ===
namespace AudioFormat {

    // Vérifier si le format est supporté nativement par Android
    inline bool isAndroidNative(const std::string& format) {
        return format == AudioFormats::AAC || format == AudioFormats::FLAC || format == AudioFormats::WAV;
    }

    // Vérifier si le format est supporté nativement par iOS
    inline bool isIOSNative(const std::string& format) {
        return format == AudioFormats::AAC || format == AudioFormats::M4A || format == AudioFormats::FLAC || format == AudioFormats::WAV
#ifdef __APPLE__
#if TARGET_OS_IOS
            || format == AudioFormats::ALAC || format == AudioFormats::CAF || format == AudioFormats::AMR
#endif
#endif
        ;
    }

    // Obtenir le meilleur format pour la plateforme
    inline std::string getBestFormatForPlatform() {
#ifdef __ANDROID__
        return AudioFormats::AAC; // Format natif Android
#elif defined(__APPLE__) && TARGET_OS_IOS
        return AudioFormats::M4A; // Format natif iOS (conteneur pour AAC)
#else
        return AudioFormats::FLAC; // Format universel sans perte
#endif
    }

} // namespace AudioFormat

} // namespace Audio
} // namespace Nyth
