#pragma once

#include "../core/AudioEqualizer.hpp"
#include "NoiseConstants.hpp"
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
        
        uint32_t sampleRate = MultibandProcessorConstants::DEFAULT_SAMPLE_RATE;
        size_t fftSize = MultibandProcessorConstants::DEFAULT_FFT_SIZE;
        BandMode bandMode = BARK_SCALE;
        
        // Profil de réduction par bande
        struct BandProfile {
            float subBassReduction = MultibandProcessorConstants::DEFAULT_SUB_BASS_REDUCTION;     // < 60 Hz
            float bassReduction = MultibandProcessorConstants::DEFAULT_BASS_REDUCTION;            // 60-250 Hz
            float lowMidReduction = MultibandProcessorConstants::DEFAULT_LOW_MID_REDUCTION;       // 250-500 Hz
            float midReduction = MultibandProcessorConstants::DEFAULT_MID_REDUCTION;              // 500-2k Hz
            float highMidReduction = MultibandProcessorConstants::DEFAULT_HIGH_MID_REDUCTION;     // 2k-4k Hz
            float highReduction = MultibandProcessorConstants::DEFAULT_HIGH_REDUCTION;            // 4k-8k Hz
            float ultraHighReduction = MultibandProcessorConstants::DEFAULT_ULTRA_HIGH_REDUCTION; // > 8k Hz
        } profile;
    };
    
    explicit MultibandProcessor(const Config& config)
        : config_(config)
        , equalizer_(std::make_unique<Audio::core::AudioEqualizer>(MultibandProcessorConstants::NUM_BANDS, config.sampleRate))
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
        const float frequencies[] = {
            MultibandProcessorConstants::FREQ_SUB_BASS,
            MultibandProcessorConstants::FREQ_BASS,
            MultibandProcessorConstants::FREQ_LOW_MID,
            MultibandProcessorConstants::FREQ_MID,
            MultibandProcessorConstants::FREQ_HIGH_MID,
            MultibandProcessorConstants::FREQ_HIGH,
            MultibandProcessorConstants::FREQ_ULTRA_HIGH
        };
        
        for (size_t i = 0; i < MultibandProcessorConstants::NUM_BANDS; ++i) {
            equalizer_->setBandFrequency(i, frequencies[i]);
            equalizer_->setBandQ(i, MultibandProcessorConstants::DEFAULT_Q_FACTOR); // Q standard
            equalizer_->setBandType(i, Audio::AudioFX::FilterType::PEAKING);
        }
        
        updateBandGains();
    }
    
    void updateBandGains() {
        const float gains[] = {
            MultibandProcessorConstants::DB_REDUCTION_FACTOR * config_.profile.subBassReduction,
            MultibandProcessorConstants::DB_REDUCTION_FACTOR * config_.profile.bassReduction,
            MultibandProcessorConstants::DB_REDUCTION_FACTOR * config_.profile.lowMidReduction,
            MultibandProcessorConstants::DB_REDUCTION_FACTOR * config_.profile.midReduction,
            MultibandProcessorConstants::DB_REDUCTION_FACTOR * config_.profile.highMidReduction,
            MultibandProcessorConstants::DB_REDUCTION_FACTOR * config_.profile.highReduction,
            MultibandProcessorConstants::DB_REDUCTION_FACTOR * config_.profile.ultraHighReduction
        };
        
        for (size_t i = 0; i < MultibandProcessorConstants::NUM_BANDS; ++i) {
            equalizer_->setBandGain(i, gains[i]);
        }
    }
    
    Config config_;
    std::unique_ptr<Audio::core::AudioEqualizer> equalizer_;
};

} // namespace AudioNR