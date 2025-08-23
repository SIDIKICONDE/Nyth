#include "AudioCoreHelpers.hpp"
#include <algorithm>
#include <vector>

namespace AudioFX {
namespace CoreHelpers {

// === Conversion d'enums ===
AudioFX::FilterType convertToAudioFXFilterType(NythCoreFilterType type) {
    switch (type) {
        case CORE_FILTER_LOWPASS:    return AudioFX::FilterType::LOWPASS;
        case CORE_FILTER_HIGHPASS:   return AudioFX::FilterType::HIGHPASS;
        case CORE_FILTER_BANDPASS:   return AudioFX::FilterType::BANDPASS;
        case CORE_FILTER_NOTCH:      return AudioFX::FilterType::NOTCH;
        case CORE_FILTER_PEAK:       return AudioFX::FilterType::PEAK;
        case CORE_FILTER_LOWSHELF:   return AudioFX::FilterType::LOWSHELF;
        case CORE_FILTER_HIGHSHELF:  return AudioFX::FilterType::HIGHSHELF;
        case CORE_FILTER_ALLPASS:    return AudioFX::FilterType::ALLPASS;
        default:                     return AudioFX::FilterType::PEAK;
    }
}

NythCoreFilterType convertFromAudioFXFilterType(AudioFX::FilterType type) {
    switch (type) {
        case AudioFX::FilterType::LOWPASS:    return CORE_FILTER_LOWPASS;
        case AudioFX::FilterType::HIGHPASS:   return CORE_FILTER_HIGHPASS;
        case AudioFX::FilterType::BANDPASS:   return CORE_FILTER_BANDPASS;
        case AudioFX::FilterType::NOTCH:      return CORE_FILTER_NOTCH;
        case AudioFX::FilterType::PEAK:       return CORE_FILTER_PEAK;
        case AudioFX::FilterType::LOWSHELF:   return CORE_FILTER_LOWSHELF;
        case AudioFX::FilterType::HIGHSHELF:  return CORE_FILTER_HIGHSHELF;
        case AudioFX::FilterType::ALLPASS:    return CORE_FILTER_ALLPASS;
        default:                              return CORE_FILTER_PEAK;
    }
}

// === Helpers pour l'égaliseur ===
bool equalizerSetMasterGain(Audio::core::AudioEqualizer* eq, double gainDB) {
    if (!eq) return false;
    eq->setMasterGain(gainDB);
    return true;
}

bool equalizerSetBypass(Audio::core::AudioEqualizer* eq, bool bypass) {
    if (!eq) return false;
    eq->setBypass(bypass);
    return true;
}

bool equalizerSetSampleRate(Audio::core::AudioEqualizer* eq, uint32_t sampleRate) {
    if (!eq) return false;
    eq->setSampleRate(sampleRate);
    return true;
}

bool equalizerSetBand(Audio::core::AudioEqualizer* eq, size_t bandIndex, const NythCoreBandConfig* config) {
    if (!eq || !config) return false;
    try {
        eq->setBandFrequency(bandIndex, config->frequency);
        eq->setBandGain(bandIndex, config->gainDB);
        eq->setBandQ(bandIndex, config->q);
        eq->setBandEnabled(bandIndex, config->enabled);
        eq->setBandType(bandIndex, convertToAudioFXFilterType(config->type));
        return true;
    } catch (...) {
        return false;
    }
}

bool equalizerProcessMono(Audio::core::AudioEqualizer* eq, const float* input, float* output, size_t numSamples) {
    if (!eq || !input || !output || numSamples == 0) return false;
    try {
        eq->processMono(input, output, numSamples);
        return true;
    } catch (...) {
        return false;
    }
}

bool equalizerProcessStereo(Audio::core::AudioEqualizer* eq, const float* inputL, const float* inputR, 
                           float* outputL, float* outputR, size_t numSamples) {
    if (!eq || !inputL || !inputR || !outputL || !outputR || numSamples == 0) return false;
    try {
        std::vector<float> inputLVec(inputL, inputL + numSamples);
        std::vector<float> inputRVec(inputR, inputR + numSamples);
        std::vector<float> outputLVec(numSamples);
        std::vector<float> outputRVec(numSamples);

        eq->processStereo(inputLVec, inputRVec, outputLVec, outputRVec);

        std::copy(outputLVec.begin(), outputLVec.end(), outputL);
        std::copy(outputRVec.begin(), outputRVec.end(), outputR);
        return true;
    } catch (...) {
        return false;
    }
}

// === Helpers pour les filtres Biquad ===
int64_t filterCreate(std::map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>>& filters, std::atomic<int64_t>& nextId) {
    try {
        int64_t filterId = nextId++;
        filters[filterId] = std::make_unique<AudioFX::BiquadFilter>();
        return filterId;
    } catch (...) {
        return -1;
    }
}

bool filterDestroy(std::map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>>& filters, int64_t filterId) {
    auto it = filters.find(filterId);
    if (it != filters.end()) {
        filters.erase(it);
        return true;
    }
    return false;
}

bool filterSetConfig(AudioFX::BiquadFilter* filter, const NythCoreFilterConfig* config, uint32_t sampleRate) {
    if (!filter || !config) return false;

    switch (config->type) {
        case CORE_FILTER_LOWPASS:
            filter->calculateLowpass(config->frequency, sampleRate, config->q);
            break;
        case CORE_FILTER_HIGHPASS:
            filter->calculateHighpass(config->frequency, sampleRate, config->q);
            break;
        case CORE_FILTER_BANDPASS:
            filter->calculateBandpass(config->frequency, sampleRate, config->q);
            break;
        case CORE_FILTER_NOTCH:
            filter->calculateNotch(config->frequency, sampleRate, config->q);
            break;
        case CORE_FILTER_PEAK:
            filter->calculatePeaking(config->frequency, sampleRate, config->q, config->gainDB);
            break;
        case CORE_FILTER_LOWSHELF:
            filter->calculateLowShelf(config->frequency, sampleRate, config->q, config->gainDB);
            break;
        case CORE_FILTER_HIGHSHELF:
            filter->calculateHighShelf(config->frequency, sampleRate, config->q, config->gainDB);
            break;
        case CORE_FILTER_ALLPASS:
            filter->calculateAllpass(config->frequency, sampleRate, config->q);
            break;
        default:
            return false;
    }
    return true;
}

bool filterProcessMono(AudioFX::BiquadFilter* filter, const float* input, float* output, size_t numSamples) {
    if (!filter) return false;
    filter->processMono(input, output, numSamples);
    return true;
}

bool filterProcessStereo(AudioFX::BiquadFilter* filter, const float* inputL, const float* inputR, 
                        float* outputL, float* outputR, size_t numSamples) {
    if (!filter) return false;
    filter->processStereo(inputL, inputR, outputL, outputR, numSamples);
    return true;
}

bool filterReset(AudioFX::BiquadFilter* filter) {
    if (!filter) return false;
    filter->reset();
    return true;
}

} // namespace CoreHelpers
} // namespace AudioFX