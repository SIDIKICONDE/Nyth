#pragma once
#ifndef AUDIOEQUALIZER_HPP_INCLUDED
#define AUDIOEQUALIZER_HPP_INCLUDED

// C++20 standard headers
#include <cstdint>
#include <cstddef>
#include <cstring>
#include <array>
#include <memory>
#include <atomic>
#include <mutex>
#include <vector>
// #include <concepts> // Supprimé pour C++17
#include <algorithm>
// #include <source_location> // Supprimé pour C++17
#include <type_traits>

// Legacy headers
#include "BiquadFilter.hpp"
#include "CoreConstants.hpp"

// C++20 pure - no platform-specific SIMD optimizations

namespace AudioFX {

// Forward declaration
struct EQBand;

// C++20 Concepts for better type safety (use concepts from CoreConstants.hpp)
template<typename T>
concept AudioBufferType = std::is_pointer_v<T> || requires(T t) {
    typename T::value_type;
    { t.data() } -> std::same_as<typename T::pointer>;
    { t.size() } -> std::same_as<typename T::size_type>;
};

template<typename T>
concept EqualizerBandType = std::same_as<T, EQBand>;

using enum FilterType; // C++20 using enum

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
    
    // C++20 modernized processing methods
    template<AudioSampleType T = float>
    void process(std::vector<const T>& input, std::vector<T>& output,
                std::source_location location = std::string(__FILE__) + ":" + std::to_string(__LINE__));

    template<AudioSampleType T = float>
    void processStereo(std::vector<const T>& inputL, std::vector<const T>& inputR,
                      std::vector<T>& outputL, std::vector<T>& outputR,
                      std::source_location location = std::string(__FILE__) + ":" + std::to_string(__LINE__));

    // Pure C++20 implementation - no legacy methods
    
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

    // C++20 enhanced methods
    std::string getDebugInfo(std::source_location location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) const;

    template<AudioSampleType T = float>
    bool validateAudioBuffer(std::vector<const T>& buffer,
                           std::source_location location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) const;

    // C++20 range-based operations
    auto getActiveBands() const {
        return m_bands | std::views::filter(&EQBand::enabled);
    }

    auto getBandsByType(FilterType type) const {
        return m_bands | std::views::filter([type](const EQBand& band) {
            return band.type == type;
        });
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
    void processOptimized(std::vector<const float>& input, std::vector<float>& output);
    
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
