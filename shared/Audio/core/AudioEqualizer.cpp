

#include "AudioEqualizer.hpp" // keep name; will be renamed to .hpp logically via header guard
#include <cmath>
#include <algorithm>
#include <format>
#include <ranges>
#include <span>
#include <source_location>
#include <stdexcept>
#include <iterator>

namespace AudioEqualizer {

AudioEqualizer::AudioEqualizer(size_t numBands, uint32_t sampleRate)
    : m_sampleRate(sampleRate)
    , m_masterGain(1.0)
    , m_bypass(false)
    , m_parametersChanged(false) {
    initialize(numBands, sampleRate);
}

AudioEqualizer::~AudioEqualizer() = default;

void AudioEqualizer::initialize(size_t numBands, uint32_t sampleRate) {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    
    m_sampleRate = sampleRate;
    m_bands.clear();
    m_bands.resize(numBands);
    
    // Plus de buffer temporaire nécessaire (master gain appliqué in-place)
    
    // Setup default bands
    setupDefaultBands();
    
    // Update all filters
    updateFilters();
}

void AudioEqualizer::setupDefaultBands() {
    size_t numBands = m_bands.size();
    
    if (numBands == NUM_BANDS) {
        // Use predefined frequencies for 10-band EQ
        std::ranges::for_each(std::views::iota(size_t{0}, numBands),
                             [this](size_t i) {
                                 m_bands[i].frequency = DEFAULT_FREQUENCIES[i];
                                 m_bands[i].gain = 0.0;
                                 m_bands[i].q = DEFAULT_Q;
                                 m_bands[i].type = FilterType::PEAK;
                                 m_bands[i].enabled = true;
                             });
        
        // Set first and last bands as shelf filters
        m_bands[0].type = FilterType::LOWSHELF;
        m_bands[numBands - 1].type = FilterType::HIGHSHELF;
    } else {
        // Calculate logarithmically spaced frequencies
        double minFreq = 20.0;
        double maxFreq = 20000.0;
        double logMin = std::log10(minFreq);
        double logMax = std::log10(maxFreq);
        double logStep = (logMax - logMin) / (numBands - 1);
        
        std::ranges::for_each(std::views::iota(size_t{0}, numBands),
                             [this, logMin, logStep](size_t i) {
                                 double logFreq = logMin + i * logStep;
                                 m_bands[i].frequency = std::pow(10.0, logFreq);
                                 m_bands[i].gain = 0.0;
                                 m_bands[i].q = DEFAULT_Q;
                                 m_bands[i].type = FilterType::PEAK;
                                 m_bands[i].enabled = true;
                             });
        
        // Set first and last bands as shelf filters
        if (numBands > 0) {
            m_bands[0].type = FilterType::LOWSHELF;
            if (numBands > 1) {
                m_bands[numBands - 1].type = FilterType::HIGHSHELF;
            }
        }
    }
}

void AudioEqualizer::updateFilters() {
    std::ranges::for_each(std::views::iota(size_t{0}, m_bands.size()),
                         [this](size_t i) {
                             updateBandFilter(i);
                         });
}

void AudioEqualizer::updateBandFilter(size_t bandIndex) {
    if (bandIndex >= m_bands.size()) return;
    
    EQBand& band = m_bands[bandIndex];
    
    switch (band.type) {
        case FilterType::LOWPASS:
            band.filter->calculateLowpass(band.frequency, m_sampleRate, band.q);
            break;
        case FilterType::HIGHPASS:
            band.filter->calculateHighpass(band.frequency, m_sampleRate, band.q);
            break;
        case FilterType::BANDPASS:
            band.filter->calculateBandpass(band.frequency, m_sampleRate, band.q);
            break;
        case FilterType::NOTCH:
            band.filter->calculateNotch(band.frequency, m_sampleRate, band.q);
            break;
        case FilterType::PEAK:
            band.filter->calculatePeaking(band.frequency, m_sampleRate, band.q, band.gain);
            break;
        case FilterType::LOWSHELF:
            band.filter->calculateLowShelf(band.frequency, m_sampleRate, band.q, band.gain);
            break;
        case FilterType::HIGHSHELF:
            band.filter->calculateHighShelf(band.frequency, m_sampleRate, band.q, band.gain);
            break;
        case FilterType::ALLPASS:
            band.filter->calculateAllpass(band.frequency, m_sampleRate, band.q);
            break;
    }
}

void AudioEqualizer::process(std::span<const float> input, std::span<float> output) {
    if (m_bypass.load()) {
        // Bypass mode - just copy input to output
        if (input.data() != output.data()) {
            std::ranges::copy(input, output.begin());
        }
        return;
    }

    // Use optimized processing path
    processOptimized(input, output);
}

void AudioEqualizer::processOptimized(std::span<const float> input, std::span<float> output) {
    // Check if parameters have changed
    if (m_parametersChanged.load()) {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        updateFilters();
        m_parametersChanged.store(false);
    }

    // Optimisation: traiter par blocs plus grands pour améliorer la localité du cache
    constexpr size_t OPTIMAL_BLOCK_SIZE = 1024;  // Augmenté pour meilleure efficacité cache
    size_t numSamples = input.size();
    size_t processedSamples = 0;

    // Pré-calculer les filtres actifs pour éviter les vérifications répétées
    // Protéger l'accès à m_bands pour éviter les data races
    std::vector<const EQBand*> activeBands;
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        activeBands.reserve(m_bands.size());
        std::ranges::copy_if(m_bands, std::back_inserter(activeBands),
                            [](const EQBand& band) {
                                return band.enabled && std::abs(band.gain) > 0.01;
                            });
    }

    // Si aucun filtre actif, appliquer seulement le gain master
    if (activeBands.empty()) {
        float masterGainLinear = static_cast<float>(dbToLinear(m_masterGain.load()));
        if (std::abs(masterGainLinear - 1.0f) < 0.001f) {
            // Pas de traitement nécessaire, copie directe
            if (input.data() != output.data()) {
                std::ranges::copy(input, output.begin());
            }
        } else {
            // C++20 pure implementation - no SIMD
            std::ranges::transform(input, output.begin(),
                                 [masterGainLinear](float sample) {
                                     return sample * masterGainLinear;
                                 });
        }
        return;
    }

    while (processedSamples < numSamples) {
        size_t samplesToProcess = std::min(OPTIMAL_BLOCK_SIZE, numSamples - processedSamples);
        auto blockInput = input.subspan(processedSamples, samplesToProcess);
        auto blockOutput = output.subspan(processedSamples, samplesToProcess);

        // Copier l'entrée vers la sortie pour le premier filtre
        if (blockOutput.data() != blockInput.data()) {
            std::ranges::copy(blockInput, blockOutput.begin());
        }

        // Appliquer chaque bande de filtre active
        std::ranges::for_each(activeBands, [&](const EQBand* band) {
            band->filter->process(std::span<float>(blockOutput.data(), samplesToProcess),
                                std::span<float>(blockOutput.data(), samplesToProcess));
        });

        // Appliquer le gain master - C++20 pure
        float masterGainLinear = static_cast<float>(dbToLinear(m_masterGain.load()));
        if (std::abs(masterGainLinear - 1.0f) > 0.001f) {
            std::ranges::transform(blockOutput, blockOutput.begin(),
                                 [masterGainLinear](float sample) {
                                     return sample * masterGainLinear;
                                 });
        }

        processedSamples += samplesToProcess;
    }
}

void AudioEqualizer::processStereo(std::span<const float> inputL, std::span<const float> inputR,
                                  std::span<float> outputL, std::span<float> outputR) {
    if (m_bypass.load()) {
        // Bypass mode - C++20 pure
        if (outputL.data() != inputL.data() || outputR.data() != inputR.data()) {
            std::ranges::copy(inputL, outputL.begin());
            std::ranges::copy(inputR, outputR.begin());
        }
        return;
    }

    // Check if parameters have changed
    if (m_parametersChanged.load()) {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        updateFilters();
        m_parametersChanged.store(false);
    }

    // Optimisation: traiter par blocs plus grands
    constexpr size_t OPTIMAL_BLOCK_SIZE = 1024;
    size_t numSamples = inputL.size();
    size_t processedSamples = 0;

    // Pré-calculer les filtres actifs
    // Protéger l'accès à m_bands pour éviter les data races
    std::vector<const EQBand*> activeBands;
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        activeBands.reserve(m_bands.size());
        std::ranges::copy_if(m_bands, std::back_inserter(activeBands),
                            [](const EQBand& band) {
                                return band.enabled && std::abs(band.gain) > 0.01;
                            });
    }

    while (processedSamples < numSamples) {
        size_t samplesToProcess = std::min(OPTIMAL_BLOCK_SIZE, numSamples - processedSamples);
        auto blockInputL = inputL.subspan(processedSamples, samplesToProcess);
        auto blockInputR = inputR.subspan(processedSamples, samplesToProcess);
        auto blockOutputL = outputL.subspan(processedSamples, samplesToProcess);
        auto blockOutputR = outputR.subspan(processedSamples, samplesToProcess);

        // Copier l'entrée vers la sortie
        if (blockOutputL.data() != blockInputL.data() || blockOutputR.data() != blockInputR.data()) {
            std::ranges::copy(blockInputL, blockOutputL.begin());
            std::ranges::copy(blockInputR, blockOutputR.begin());
        }

        // Appliquer chaque bande de filtre active
        std::ranges::for_each(activeBands, [&](const EQBand* band) {
            band->filter->processStereo(std::span<float>(blockOutputL.data(), samplesToProcess),
                                       std::span<float>(blockOutputR.data(), samplesToProcess),
                                       std::span<float>(blockOutputL.data(), samplesToProcess),
                                       std::span<float>(blockOutputR.data(), samplesToProcess));
        });

        // Appliquer le gain master - C++20 pure
        float masterGainLinear = static_cast<float>(dbToLinear(m_masterGain.load()));
        if (std::abs(masterGainLinear - 1.0f) > 0.001f) {
            std::ranges::transform(blockOutputL, blockOutputL.begin(),
                                 [masterGainLinear](float sample) {
                                     return sample * masterGainLinear;
                                 });
            std::ranges::transform(blockOutputR, blockOutputR.begin(),
                                 [masterGainLinear](float sample) {
                                     return sample * masterGainLinear;
                                 });
        }

        processedSamples += samplesToProcess;
    }
}

// Band control methods
void AudioEqualizer::setBandGain(size_t bandIndex, double gainDB) {
    if (bandIndex >= m_bands.size()) return;
    
    gainDB = std::max(MIN_GAIN_DB, std::min(MAX_GAIN_DB, gainDB));
    
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        m_bands[bandIndex].gain = gainDB;
        m_parametersChanged.store(true);
    }
}

void AudioEqualizer::setBandFrequency(size_t bandIndex, double frequency) {
    if (bandIndex >= m_bands.size()) return;
    
    frequency = std::max(20.0, std::min(m_sampleRate / 2.0, frequency));
    
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        m_bands[bandIndex].frequency = frequency;
        m_parametersChanged.store(true);
    }
}

void AudioEqualizer::setBandQ(size_t bandIndex, double q) {
    if (bandIndex >= m_bands.size()) return;
    
    q = std::max(MIN_Q, std::min(MAX_Q, q));
    
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        m_bands[bandIndex].q = q;
        m_parametersChanged.store(true);
    }
}

void AudioEqualizer::setBandType(size_t bandIndex, FilterType type) {
    if (bandIndex >= m_bands.size()) return;
    
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        m_bands[bandIndex].type = type;
        m_parametersChanged.store(true);
    }
}

void AudioEqualizer::setBandEnabled(size_t bandIndex, bool enabled) {
    if (bandIndex >= m_bands.size()) return;
    
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        m_bands[bandIndex].enabled = enabled;
    }
}

// Get band parameters
double AudioEqualizer::getBandGain(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].gain : 0.0;
}

double AudioEqualizer::getBandFrequency(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].frequency : 0.0;
}

double AudioEqualizer::getBandQ(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].q : DEFAULT_Q;
}

FilterType AudioEqualizer::getBandType(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].type : FilterType::PEAK;
}

bool AudioEqualizer::isBandEnabled(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].enabled : false;
}

// Global controls
void AudioEqualizer::setMasterGain(double gainDB) {
    gainDB = std::max(MIN_GAIN_DB, std::min(MAX_GAIN_DB, gainDB));
    m_masterGain.store(gainDB);
}

double AudioEqualizer::getMasterGain() const {
    return m_masterGain.load();
}

void AudioEqualizer::setBypass(bool bypass) {
    m_bypass.store(bypass);
}

bool AudioEqualizer::isBypassed() const {
    return m_bypass.load();
}

// Preset management
void AudioEqualizer::loadPreset(const EQPreset& preset) {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    
    size_t numBands = std::min(preset.gains.size(), m_bands.size());
    std::ranges::for_each(std::views::iota(size_t{0}, numBands),
                         [this, &preset](size_t i) {
                             m_bands[i].gain = preset.gains[i];
                         });
    
    m_parametersChanged.store(true);
}

void AudioEqualizer::savePreset(EQPreset& preset) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    
    preset.gains.clear();
    preset.gains.reserve(m_bands.size());
    
    std::ranges::transform(m_bands, std::back_inserter(preset.gains),
                          [](const EQBand& band) {
                              return band.gain;
                          });
}

void AudioEqualizer::resetAllBands() {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    
    std::ranges::for_each(m_bands, [](EQBand& band) {
        band.gain = 0.0;
    });
    
    m_parametersChanged.store(true);
}

void AudioEqualizer::setSampleRate(uint32_t sampleRate) {
    if (sampleRate != m_sampleRate) {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        m_sampleRate = sampleRate;
        m_parametersChanged.store(true);
    }
}

uint32_t AudioEqualizer::getSampleRate() const {
    return m_sampleRate;
}

void AudioEqualizer::beginParameterUpdate() {
    m_parameterMutex.lock();
}

void AudioEqualizer::endParameterUpdate() {
    m_parametersChanged.store(true);
    m_parameterMutex.unlock();
}

// Helper functions
double AudioEqualizer::dbToLinear(double db) const {
    return std::pow(10.0, db / 20.0);
}

double AudioEqualizer::linearToDb(double linear) const {
    return 20.0 * std::log10(std::max(linear, EPSILON));
}

// Preset Factory implementations
EQPreset EQPresetFactory::createFlatPreset() {
    EQPreset preset;
    preset.name = "Flat";
    preset.gains = std::vector<double>(NUM_BANDS, 0.0);
    return preset;
}

EQPreset EQPresetFactory::createRockPreset() {
    EQPreset preset;
    preset.name = "Rock";
    preset.gains = {4.0, 3.0, -1.0, -2.0, -1.0, 2.0, 3.0, 4.0, 3.0, 2.0};
    return preset;
}

EQPreset EQPresetFactory::createPopPreset() {
    EQPreset preset;
    preset.name = "Pop";
    preset.gains = {-1.0, 2.0, 4.0, 3.0, 0.0, -1.0, -1.0, 0.0, 2.0, 3.0};
    return preset;
}

EQPreset EQPresetFactory::createJazzPreset() {
    EQPreset preset;
    preset.name = "Jazz";
    preset.gains = {0.0, 2.0, 1.0, 2.0, -2.0, -2.0, 0.0, 1.0, 2.0, 3.0};
    return preset;
}

EQPreset EQPresetFactory::createClassicalPreset() {
    EQPreset preset;
    preset.name = "Classical";
    preset.gains = {0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -2.0, -2.0, -2.0, -3.0};
    return preset;
}

EQPreset EQPresetFactory::createElectronicPreset() {
    EQPreset preset;
    preset.name = "Electronic";
    preset.gains = {4.0, 3.0, 1.0, 0.0, -2.0, 2.0, 1.0, 1.0, 3.0, 4.0};
    return preset;
}

EQPreset EQPresetFactory::createVocalBoostPreset() {
    EQPreset preset;
    preset.name = "Vocal Boost";
    preset.gains = {-2.0, -1.0, 0.0, 2.0, 4.0, 4.0, 3.0, 2.0, 0.0, -1.0};
    return preset;
}

EQPreset EQPresetFactory::createBassBoostPreset() {
    EQPreset preset;
    preset.name = "Bass Boost";
    preset.gains = {6.0, 5.0, 4.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0};
    return preset;
}

EQPreset EQPresetFactory::createTrebleBoostPreset() {
    EQPreset preset;
    preset.name = "Treble Boost";
    preset.gains = {0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0, 4.0, 5.0, 6.0};
    return preset;
}

EQPreset EQPresetFactory::createLoudnessPreset() {
    EQPreset preset;
    preset.name = "Loudness";
    preset.gains = {5.0, 3.0, 0.0, -1.0, -2.0, -2.0, -1.0, 0.0, 3.0, 5.0};
    return preset;
}

// C++20 modernized processing methods
template<AudioSampleType T>
void AudioEqualizer::process(std::span<const T> input, std::span<T> output,
                            std::source_location location) {
    // C++20 validation
    if (input.size() != output.size()) {
        throw std::invalid_argument(std::format(
            "Input and output spans must have the same size. Input: {}, Output: {} [{}:{}]",
            input.size(), output.size(), location.file_name(), location.line()));
    }

    if (!validateAudioBuffer(input, location)) {
        throw std::invalid_argument(std::format(
            "Invalid audio buffer [{}:{}]", location.file_name(), location.line()));
    }

    // Direct C++20 implementation
    if constexpr (std::is_same_v<T, float>) {
        process(input, output);
    } else {
        // Convert to float for processing
        std::vector<float> tempInput(input.begin(), input.end());
        std::vector<float> tempOutput(output.size());
        process(std::span<const float>(tempInput), std::span<float>(tempOutput));
        std::ranges::copy(tempOutput, output.begin());
    }
}

template<AudioSampleType T>
void AudioEqualizer::processStereo(std::span<const T> inputL, std::span<const T> inputR,
                                  std::span<T> outputL, std::span<T> outputR,
                                  std::source_location location) {
    // C++20 validation
    if (inputL.size() != inputR.size() || inputL.size() != outputL.size() || inputR.size() != outputR.size()) {
        throw std::invalid_argument(std::format(
            "All spans must have the same size [{}:{}]", location.file_name(), location.line()));
    }

    // Direct C++20 implementation
    if constexpr (std::is_same_v<T, float>) {
        processStereo(inputL, inputR, outputL, outputR);
    } else {
        // Convert to float for processing
        std::vector<float> tempInputL(inputL.begin(), inputL.end());
        std::vector<float> tempInputR(inputR.begin(), inputR.end());
        std::vector<float> tempOutputL(outputL.size());
        std::vector<float> tempOutputR(outputR.size());

        processStereo(std::span<const float>(tempInputL), std::span<const float>(tempInputR),
                     std::span<float>(tempOutputL), std::span<float>(tempOutputR));

        std::ranges::copy(tempOutputL, outputL.begin());
        std::ranges::copy(tempOutputR, outputR.begin());
    }
}

// C++20 formatted debugging
std::string AudioEqualizer::getDebugInfo(std::source_location location) const {
    std::string info = std::format(
        "AudioEqualizer Debug Info:\n"
        "  Sample Rate: {} Hz\n"
        "  Master Gain: {:.2f} dB\n"
        "  Bypassed: {}\n"
        "  Number of Bands: {}\n"
        "  Location: {}:{} ({})\n"
        "  Bands:\n",
        m_sampleRate, getMasterGain(), isBypassed(), getNumBands(),
        location.file_name(), location.line(), location.function_name());

    for (size_t i = 0; i < m_bands.size(); ++i) {
        const auto& band = m_bands[i];
        info += std::format(
            "    Band {}: Freq={:.1f}Hz, Gain={:.2f}dB, Q={:.2f}, Type={}, Enabled={}\n",
            i, band.frequency, band.gain, band.q,
            static_cast<int>(band.type), band.enabled);
    }

    return info;
}

// C++20 buffer validation
template<AudioSampleType T>
bool AudioEqualizer::validateAudioBuffer(std::span<const T> buffer,
                                       std::source_location location) const {
    if (buffer.empty()) {
        return false;
    }

    // Check for NaN or infinite values
    auto invalidValues = std::ranges::count_if(buffer, [](T sample) {
        return !std::isfinite(static_cast<double>(sample));
    });

    if (invalidValues > 0) {
        return false;
    }

    return true;
}

// Explicit template instantiations
template void AudioEqualizer::process<float>(std::span<const float>, std::span<float>, std::source_location);
template void AudioEqualizer::process<double>(std::span<const double>, std::span<double>, std::source_location);
template void AudioEqualizer::processStereo<float>(std::span<const float>, std::span<const float>,
                                                  std::span<float>, std::span<float>, std::source_location);
template void AudioEqualizer::processStereo<double>(std::span<const double>, std::span<const double>,
                                                   std::span<double>, std::span<double>, std::source_location);

template bool AudioEqualizer::validateAudioBuffer<float>(std::span<const float>, std::source_location) const;
template bool AudioEqualizer::validateAudioBuffer<double>(std::span<const double>, std::source_location) const;

} // namespace AudioEqualizer
