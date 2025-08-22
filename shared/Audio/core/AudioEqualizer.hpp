#pragma once
#ifndef AUDIOEQUALIZER_HPP_INCLUDED
#define AUDIOEQUALIZER_HPP_INCLUDED

// C++17 standard headers
#include <cstdint>
#include <cstddef>
#include <cstring>
#include <string>        // Pour std::string et std::to_string
#include <array>
#include <memory>
#include <atomic>
#include <mutex>
#include <vector>
#include <algorithm>
#include <type_traits>
#include <functional>    // Pour std::reference_wrapper et std::cref
#include <iterator>

// Legacy headers
#include "BiquadFilter.hpp"
#include "CoreConstants.hpp"

// C++17 compatible - no platform-specific SIMD optimizations

namespace AudioFX {

// Forward declaration
struct EQBand;

// C++17 SFINAE-based type traits to replace concepts
template<typename T>
struct is_audio_buffer_type {
    template<typename U>
    static auto test_data(int) -> decltype(std::declval<U>().data(), std::true_type{});
    template<typename>
    static std::false_type test_data(...);

    template<typename U>
    static auto test_size(int) -> decltype(std::declval<U>().size(), std::true_type{});
    template<typename>
    static std::false_type test_size(...);

    static constexpr bool value = std::is_pointer_v<T> ||
                                 (decltype(test_data<T>(0))::value &&
                                  decltype(test_size<T>(0))::value);
};

template<typename T>
constexpr bool is_audio_buffer_type_v = is_audio_buffer_type<T>::value;

template<typename T>
struct is_equalizer_band_type {
    static constexpr bool value = std::is_same_v<T, EQBand>;
};

template<typename T>
constexpr bool is_equalizer_band_type_v = is_equalizer_band_type<T>::value;

// Macro pour remplacer source_location
#define NYTH_SOURCE_LOCATION (std::string(__FILE__) + ":" + std::to_string(__LINE__))

// Structure for a single EQ band
struct EQBand {
    double frequency;
    double gain;      // in dB
    double q;
    FilterType type;
    std::unique_ptr<BiquadFilter> filter;
    bool enabled;

    EQBand() : frequency(EqualizerConstants::DEFAULT_CENTER_FREQUENCY),
               gain(EqualizerConstants::ZERO_GAIN),
               q(DEFAULT_Q),
               type(FilterType::PEAK), enabled(true) {
        filter = std::make_unique<BiquadFilter>();
    }
};

// Preset structure
struct EQPreset {
    std::string name;
    std::vector<double> gains;  // Gains for each band in dB
};

class AudioEqualizer {
public:
    AudioEqualizer(size_t numBands = NUM_BANDS,
                   uint32_t sampleRate = DEFAULT_SAMPLE_RATE);
    ~AudioEqualizer();

    // Initialize equalizer with specific parameters
    void initialize(size_t numBands, uint32_t sampleRate);

    // C++17 modernized processing methods with SFINAE
    template<typename T = float,
             typename = std::enable_if_t<std::is_floating_point_v<T>>>
    void process(const std::vector<T>& input, std::vector<T>& output,
                const std::string& location = NYTH_SOURCE_LOCATION);

    template<typename T = float,
             typename = std::enable_if_t<std::is_floating_point_v<T>>>
    void processStereo(const std::vector<T>& inputL, const std::vector<T>& inputR,
                      std::vector<T>& outputL, std::vector<T>& outputR,
                      const std::string& location = NYTH_SOURCE_LOCATION);

    // Pure C++17 implementation - no legacy methods

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
    void loadPreset(const EQPreset& preset);
    void savePreset(EQPreset& preset) const;
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
        explicit ParameterUpdateGuard(AudioEqualizer& eq) : m_eq(eq) {
            m_eq.beginParameterUpdate();
        }
        ~ParameterUpdateGuard() {
            m_eq.endParameterUpdate();
        }
        ParameterUpdateGuard(const ParameterUpdateGuard&) = delete;
        ParameterUpdateGuard& operator=(const ParameterUpdateGuard&) = delete;

    private:
        AudioEqualizer& m_eq;
    };

    // C++17 enhanced methods
    std::string getDebugInfo(const std::string& location = NYTH_SOURCE_LOCATION) const;

    template<typename T = float,
             typename = std::enable_if_t<std::is_floating_point_v<T>>>
    bool validateAudioBuffer(const std::vector<T>& buffer,
                           const std::string& location = NYTH_SOURCE_LOCATION) const;

    // C++17 filter operations - returning vectors instead of ranges
    std::vector<std::reference_wrapper<const EQBand>> getActiveBands() const {
        std::vector<std::reference_wrapper<const EQBand>> activeBands;
        for (const auto& band : m_bands) {
            if (band.enabled) {
                activeBands.emplace_back(std::cref(band));
            }
        }
        return activeBands;
    }

    std::vector<std::reference_wrapper<const EQBand>> getBandsByType(FilterType type) const {
        std::vector<std::reference_wrapper<const EQBand>> filteredBands;
        for (const auto& band : m_bands) {
            if (band.type == type) {
                filteredBands.emplace_back(std::cref(band));
            }
        }
        return filteredBands;
    }

private:
    std::vector<EQBand> m_bands;
    uint32_t m_sampleRate;

    // Master controls
    std::atomic<double> m_masterGain;
    std::atomic<bool> m_bypass;

    // Thread safety
    mutable std::mutex m_parameterMutex;
    std::atomic<bool> m_parametersChanged;

    // Helper functions
    void updateFilters();
    void updateBandFilter(size_t bandIndex);
    double dbToLinear(double db) const;
    double linearToDb(double linear) const;

    // Optimized processing paths
    void processOptimized(const std::vector<float>& input, std::vector<float>& output);

    // Default band setup
    void setupDefaultBands();
};

// Preset factory
class EQPresetFactory {
public:
    static EQPreset createFlatPreset();
    static EQPreset createRockPreset();
    static EQPreset createPopPreset();
    static EQPreset createJazzPreset();
    static EQPreset createClassicalPreset();
    static EQPreset createElectronicPreset();
    static EQPreset createVocalBoostPreset();
    static EQPreset createBassBoostPreset();
    static EQPreset createTrebleBoostPreset();
    static EQPreset createLoudnessPreset();
};

} // namespace AudioFX

#endif // AUDIOEQUALIZER_HPP_INCLUDED
