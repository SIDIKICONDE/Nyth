#pragma once
#ifndef AUDIOFX_AUDIOEQUALIZER_HPP
#define AUDIOFX_AUDIOEQUALIZER_HPP

// C++17 standard headers - optimisé
#include <atomic>
#include <cstddef>
#include <cstdint>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <vector>


// Project headers
#include "CoreConstants.hpp"
#include "EQBand.hpp"
#include "EQPreset.hpp"

namespace AudioFX {

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
            typename = std::enable_if_t<std::is_floating_point_v<T>>>
  void process(const std::vector<T> &input, std::vector<T> &output,
               const std::string &location = NYTH_SOURCE_LOCATION);

  template <typename T = float,
            typename = std::enable_if_t<std::is_floating_point_v<T>>>
  void processStereo(const std::vector<T> &inputL, const std::vector<T> &inputR,
                     std::vector<T> &outputL, std::vector<T> &outputR,
                     const std::string &location = NYTH_SOURCE_LOCATION);

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
            typename = std::enable_if_t<std::is_floating_point_v<T>>>
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

  // Member variables
  std::vector<EQBand> m_bands;
  uint32_t m_sampleRate;
  std::atomic<double> m_masterGain;
  std::atomic<bool> m_bypass;
  std::atomic<bool> m_parametersChanged;
  mutable std::mutex m_parameterMutex;
  
  // Performance optimization: cached active filters
  mutable std::vector<BiquadFilter*> m_activeFiltersCache;
  mutable std::atomic<bool> m_activeFiltersCacheDirty{true};
};

} // namespace AudioFX

// Include template implementations
#include "AudioEqualizerTemplates.hpp"

// Include preset factory
#include "EQPresetFactory.hpp"

#endif // AUDIOFX_AUDIOEQUALIZER_HPP
