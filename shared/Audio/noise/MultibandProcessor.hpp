#pragma once

#include "../core/AudioEqualizer.hpp"
#include <memory>
#include <vector>

namespace AudioNR {

/**
 * @brief Wrapper autour de AudioEqualizer pour le traitement multiband dans le contexte de réduction de bruit
 */
class MultibandProcessor {
public:
    struct Config {
        enum BandMode {
            LINEAR_SCALE,
            LOG_SCALE,
            BARK_SCALE,
            MEL_SCALE
        };
        
        uint32_t sampleRate = 48000;
        size_t fftSize = 2048;
        BandMode bandMode = BARK_SCALE;
        
        // Profil de réduction par bande
        struct BandProfile {
            float subBassReduction = 0.9f;     // < 60 Hz
            float bassReduction = 0.7f;        // 60-250 Hz
            float lowMidReduction = 0.5f;      // 250-500 Hz
            float midReduction = 0.3f;         // 500-2k Hz
            float highMidReduction = 0.4f;     // 2k-4k Hz
            float highReduction = 0.6f;        // 4k-8k Hz
            float ultraHighReduction = 0.8f;   // > 8k Hz
        } profile;
    };
    
    explicit MultibandProcessor(const Config& config)
        : config_(config)
        , equalizer_(std::make_unique<Audio::core::AudioEqualizer>(7, config.sampleRate))
    {
        setupBands();
    }
    
    void process(const float* input, float* output, size_t numSamples) {
        equalizer_->processMono(input, output, numSamples);
    }
    
    void setReductionProfile(const Config::BandProfile& profile) {
        config_.profile = profile;
        updateBandGains();
    }
    
    const Config& getConfig() const { return config_; }
    
private:
    void setupBands() {
        // Configuration des bandes de fréquence selon le mode
        const float frequencies[] = {60.0f, 250.0f, 500.0f, 2000.0f, 4000.0f, 8000.0f, 16000.0f};
        
        for (size_t i = 0; i < 7; ++i) {
            equalizer_->setBandFrequency(i, frequencies[i]);
            equalizer_->setBandQ(i, 0.707f); // Q standard
            equalizer_->setBandType(i, Audio::AudioFX::FilterType::PEAKING);
        }
        
        updateBandGains();
    }
    
    void updateBandGains() {
        const float gains[] = {
            -20.0f * config_.profile.subBassReduction,
            -20.0f * config_.profile.bassReduction,
            -20.0f * config_.profile.lowMidReduction,
            -20.0f * config_.profile.midReduction,
            -20.0f * config_.profile.highMidReduction,
            -20.0f * config_.profile.highReduction,
            -20.0f * config_.profile.ultraHighReduction
        };
        
        for (size_t i = 0; i < 7; ++i) {
            equalizer_->setBandGain(i, gains[i]);
        }
    }
    
    Config config_;
    std::unique_ptr<Audio::core::AudioEqualizer> equalizer_;
};

} // namespace AudioNR