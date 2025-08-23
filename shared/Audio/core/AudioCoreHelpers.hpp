#pragma once

#include "AudioEqualizer.hpp"
#include "AudioError.hpp"
#include "BiquadFilter.hpp"
#include "../NativeAudioCoreModule.h"
#include <memory>
#include <map>

namespace AudioFX {
namespace CoreHelpers {

// === Conversion d'enums ===
AudioFX::FilterType convertToAudioFXFilterType(NythCoreFilterType type);
NythCoreFilterType convertFromAudioFXFilterType(AudioFX::FilterType type);

// === Helpers pour l'égaliseur ===
bool equalizerSetMasterGain(Audio::core::AudioEqualizer* eq, double gainDB);
bool equalizerSetBypass(Audio::core::AudioEqualizer* eq, bool bypass);
bool equalizerSetSampleRate(Audio::core::AudioEqualizer* eq, uint32_t sampleRate);
bool equalizerSetBand(Audio::core::AudioEqualizer* eq, size_t bandIndex, const NythCoreBandConfig* config);
bool equalizerProcessMono(Audio::core::AudioEqualizer* eq, const float* input, float* output, size_t numSamples);
bool equalizerProcessStereo(Audio::core::AudioEqualizer* eq, const float* inputL, const float* inputR, 
                           float* outputL, float* outputR, size_t numSamples);

// === Helpers pour les filtres Biquad ===
int64_t filterCreate(std::map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>>& filters, std::atomic<int64_t>& nextId);
bool filterDestroy(std::map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>>& filters, int64_t filterId);
bool filterSetConfig(AudioFX::BiquadFilter* filter, const NythCoreFilterConfig* config, uint32_t sampleRate);
bool filterProcessMono(AudioFX::BiquadFilter* filter, const float* input, float* output, size_t numSamples);
bool filterProcessStereo(AudioFX::BiquadFilter* filter, const float* inputL, const float* inputR, 
                        float* outputL, float* outputR, size_t numSamples);
bool filterReset(AudioFX::BiquadFilter* filter);

} // namespace CoreHelpers
} // namespace AudioFX