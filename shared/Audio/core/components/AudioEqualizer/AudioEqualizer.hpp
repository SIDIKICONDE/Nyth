#pragma once
#ifndef AUDIOFX_AUDIOEQUALIZER_HPP
#define AUDIOFX_AUDIOEQUALIZER_HPP

// C++17 standard headers - optimisé
#include <algorithm>
#include <atomic>
#include <cstdint>
#include <cstddef>
#include <functional>
#include <mutex>
#include <string>
#include <type_traits>
#include <vector>


// Project headers
#include "CoreConstants.hpp"
#include "EQBand.hpp"
#include "EQPreset.hpp"

namespace Nyth {
namespace Audio {
namespace FX {

class AudioEqualizer {
public:
  // Constructor and destructor
  AudioEqualizer(size_t numBands = NUM_BANDS,
                 uint32_t sampleRate = DEFAULT_SAMPLE_RATE);
  ~AudioEqualizer();

  // Initialize equalizer with specific parameters
  void initialize(size_t numBands, uint32_t sampleRate);

  // Processing methods - templates defined in AudioEqualizerTemplates.hpp
  template <typename T = float,
            typename = std::enable_if_t<std::is_floating_point<T>::value>>
  void process(const std::vector<T> &input, std::vector<T> &output,
               const std::string &location = NYTH_SOURCE_LOCATION);

  template <typename T = float,
            typename = std::enable_if_t<std::is_floating_point<T>::value>>
  void processStereo(const std::vector<T> &inputL, const std::vector<T> &inputR,
                     std::vector<T> &outputL, std::vector<T> &outputR,
                     const std::string &location = NYTH_SOURCE_LOCATION);

  // Mono processing method for single channel audio
  void processMono(const float* input, float* output, size_t numSamples);

  // Band control
  void setBandGain(size_t bandIndex, double gainDB);
  void setBandFrequency(size_t bandIndex, double frequency);
  void setBandQ(size_t bandIndex, double q);
  void setBandType(size_t bandIndex, FilterType type);
  void setBandEnabled(size_t bandIndex, bool enabled);

  // Get band parameters
  double getBandGain(size_t bandIndex) const;
  double getBandFrequency(size_t bandIndex) const;
  double getBandQ(size_t bandIndex) const;
  FilterType getBandType(size_t bandIndex) const;
  bool isBandEnabled(size_t bandIndex) const;

  // Global controls
  void setMasterGain(double gainDB);
  double getMasterGain() const;
  void setBypass(bool bypass);
  bool isBypassed() const;

  // Preset management
  void loadPreset(const EQPreset &preset);
  void savePreset(EQPreset &preset) const;
  void resetAllBands();

  // Reset and initialization
  void reset();

  // Sample rate
  void setSampleRate(uint32_t sampleRate);
  uint32_t getSampleRate() const;

  // Get number of bands
  size_t getNumBands() const { return m_bands.size(); }

  // Thread-safe parameter updates
  void beginParameterUpdate();
  void endParameterUpdate();

  // RAII helper for parameter updates
  class ParameterUpdateGuard {
  public:
    explicit ParameterUpdateGuard(AudioEqualizer &eq) : m_eq(eq) {
      m_eq.beginParameterUpdate();
    }
    ~ParameterUpdateGuard() { m_eq.endParameterUpdate(); }
    ParameterUpdateGuard(const ParameterUpdateGuard &) = delete;
    ParameterUpdateGuard &operator=(const ParameterUpdateGuard &) = delete;

  private:
    AudioEqualizer &m_eq;
  };

  // Debug and validation
  std::string
  getDebugInfo(const std::string &location = NYTH_SOURCE_LOCATION) const;

  template <typename T = float,
            typename = std::enable_if_t<std::is_floating_point<T>::value>>
  bool
  validateAudioBuffer(const std::vector<T> &buffer,
                      const std::string &location = NYTH_SOURCE_LOCATION) const;

  // Filter operations
    std::vector<std::reference_wrapper<const EQBand>> getActiveBands() const;
  std::vector<std::reference_wrapper<const EQBand>>
      getBandsByType(FilterType type) const;

private:
  // Implementation details
  void setupDefaultBands();
  void updateFilters();
  void updateBandFilter(size_t bandIndex);
  void processOptimized(const std::vector<float> &input,
                        std::vector<float> &output);
  void processStereoOptimized(const std::vector<float> &inputL,
                              const std::vector<float> &inputR,
                              std::vector<float> &outputL,
                              std::vector<float> &outputR);

  // Helper functions
  double dbToLinear(double db) const;
  double linearToDb(double linear) const;

  // Type dispatch helpers for C++11 compatibility
  template <typename T>
  void processTypeDispatch(const std::vector<T> &input, std::vector<T> &output, std::true_type) {
    processOptimized(input, output);
  }

  template <typename T>
  void processTypeDispatch(const std::vector<T> &input, std::vector<T> &output, std::false_type) {
    std::vector<float> tempInput(input.begin(), input.end());
    std::vector<float> tempOutput(tempInput.size());
    processOptimized(tempInput, tempOutput);
    std::copy(tempOutput.begin(), tempOutput.end(), output.begin());
  }

  template <typename T>
  void processStereoTypeDispatch(const std::vector<T> &inputL, const std::vector<T> &inputR,
                                 std::vector<T> &outputL, std::vector<T> &outputR, std::true_type) {
    processStereoOptimized(inputL, inputR, outputL, outputR);
  }

  template <typename T>
  void processStereoTypeDispatch(const std::vector<T> &inputL, const std::vector<T> &inputR,
                                 std::vector<T> &outputL, std::vector<T> &outputR, std::false_type) {
    std::vector<float> tempInputL(inputL.begin(), inputL.end());
    std::vector<float> tempInputR(inputR.begin(), inputR.end());
    std::vector<float> tempOutputL(tempInputL.size());
    std::vector<float> tempOutputR(tempInputR.size());
    processStereoOptimized(tempInputL, tempInputR, tempOutputL, tempOutputR);
    std::copy(tempOutputL.begin(), tempOutputL.end(), outputL.begin());
    std::copy(tempOutputR.begin(), tempOutputR.end(), outputR.begin());
  }

  // Member variables
  std::vector<EQBand> m_bands;
  uint32_t m_sampleRate;
  std::atomic<double> m_masterGain;
  std::atomic<bool> m_bypass;
  std::atomic<bool> m_parametersChanged;
  mutable std::mutex m_parameterMutex;
};

// ============================================================================
// Template implementations
// ============================================================================

template <typename T, typename SFINAE>
inline void AudioEqualizer::process(const std::vector<T> &input,
                                    std::vector<T> &output,
                                    const std::string &location) {
  // C++17 static assertion pour validation de type à la compilation
  static_assert(
      std::is_floating_point<T>::value,
      "AudioEqualizer::process requires floating point type (float or double)");

  // Validation des tailles de buffers
  if (input.size() != output.size()) {
    output.resize(input.size());
  }

  // Mode bypass - copie directe optimisée
  if (m_bypass.load()) {
    if (input.data() != output.data()) {
      std::copy(input.begin(), input.end(), output.begin());
    }
    return;
  }

  // Mise à jour des filtres si nécessaire
  if (m_parametersChanged.load()) {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    updateFilters();
    m_parametersChanged.store(false);
  }

  // Traitement spécialisé selon le type avec SFINAE (compatible C++11)
  processTypeDispatch(input, output, std::is_same<T, float>{});
}

template <typename T, typename SFINAE>
inline void AudioEqualizer::processStereo(const std::vector<T> &inputL,
                                          const std::vector<T> &inputR,
                                          std::vector<T> &outputL,
                                          std::vector<T> &outputR,
                                          const std::string &location) {
  // C++17 static assertion pour validation de type à la compilation
  static_assert(std::is_floating_point<T>::value,
                "AudioEqualizer::processStereo requires floating point type "
                "(float or double)");

  // Validation des tailles de buffers stéréo
  if (inputL.size() != outputL.size()) {
    outputL.resize(inputL.size());
  }
  if (inputR.size() != outputR.size()) {
    outputR.resize(inputR.size());
  }

  // Mode bypass - copie directe optimisée
  if (m_bypass.load()) {
    if (outputL.data() != inputL.data()) {
      std::copy(inputL.begin(), inputL.end(), outputL.begin());
    }
    if (outputR.data() != inputR.data()) {
      std::copy(inputR.begin(), inputR.end(), outputR.begin());
    }
    return;
  }

  // Mise à jour des filtres si nécessaire
  if (m_parametersChanged.load()) {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    updateFilters();
    m_parametersChanged.store(false);
  }

  // Traitement spécialisé selon le type avec SFINAE (compatible C++11)
  processStereoTypeDispatch(inputL, inputR, outputL, outputR, std::is_same<T, float>{});
}

template <typename T, typename SFINAE>
inline bool
AudioEqualizer::validateAudioBuffer(const std::vector<T> &buffer,
                                    const std::string &location) const {
  // C++17 static assertion pour validation de type à la compilation
  static_assert(std::is_floating_point<T>::value,
                "AudioEqualizer::validateAudioBuffer requires floating point "
                "type (float or double)");

  // Vérification basique du buffer
  if (buffer.empty()) {
    return false;
  }

  // C++17 algorithm pour vérifier les valeurs NaN/Inf avec std::all_of
  return std::all_of(buffer.begin(), buffer.end(),
                     [](const T &sample) { return std::isfinite(sample); });
}

} // namespace FX
} // namespace Audio
} // namespace Nyth

#endif // NYTH_AUDIO_FX_AUDIOEQUALIZER_HPP
