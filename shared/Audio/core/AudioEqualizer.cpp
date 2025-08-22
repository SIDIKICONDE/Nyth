

#include "AudioEqualizer.hpp" // keep name; will be renamed to .hpp logically via header guard
#include <cmath>
#include <algorithm>
#include "../../compat/format.hpp"
#include <ranges>
#include <span>
#include <source_location>
#include <stdexcept>
#include <iterator>

namespace AudioFX {

// Import des constantes pour éviter la répétition des namespace
using namespace EqualizerConstants;

AudioFX::AudioEqualizer::AudioEqualizer(size_t numBands, uint32_t sampleRate)
    : m_sampleRate(sampleRate)
    , m_masterGain(EqualizerConstants::DEFAULT_MASTER_GAIN)
    , m_bypass(false)
    , m_parametersChanged(false) {
    initialize(numBands, sampleRate);
}

AudioFX::AudioEqualizer::~AudioEqualizer() = default;

void AudioFX::AudioEqualizer::initialize(size_t numBands, uint32_t sampleRate) {
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

void AudioFX::AudioEqualizer::setupDefaultBands() {
    size_t numBands = m_bands.size();
    
    if (numBands == NUM_BANDS) {
        // Use predefined frequencies for 10-band EQ
        std::ranges::for_each(std::views::iota(size_t{EqualizerConstants::FIRST_BAND_INDEX}, numBands),
                             [this](size_t i) {
                                 m_bands[i].frequency = DEFAULT_FREQUENCIES[i];
                                 m_bands[i].gain = EqualizerConstants::ZERO_GAIN;
                                 m_bands[i].q = DEFAULT_Q;
                                 m_bands[i].type = FilterType::PEAK;
                                 m_bands[i].enabled = true;
                             });
        
        // Set first and last bands as shelf filters
        m_bands[EqualizerConstants::FIRST_BAND_INDEX].type = FilterType::LOWSHELF;
        m_bands[numBands - EqualizerConstants::STEP_INCREMENT].type = FilterType::HIGHSHELF;
    } else {
        // Calculate logarithmically spaced frequencies
        double minFreq = EqualizerConstants::MIN_FREQUENCY_HZ;
        double maxFreq = EqualizerConstants::MAX_FREQUENCY_HZ;
        double logMin = std::log10(minFreq);
        double logMax = std::log10(maxFreq);
        double logStep = (logMax - logMin) / (numBands - EqualizerConstants::STEP_INCREMENT);
        
        std::ranges::for_each(std::views::iota(size_t{EqualizerConstants::FIRST_BAND_INDEX}, numBands),
                             [this, logMin, logStep](size_t i) {
                                 double logFreq = logMin + i * logStep;
                                 m_bands[i].frequency = std::pow(EqualizerConstants::LOGARITHMIC_BASE, logFreq);
                                 m_bands[i].gain = EqualizerConstants::ZERO_GAIN;
                                 m_bands[i].q = DEFAULT_Q;
                                 m_bands[i].type = FilterType::PEAK;
                                 m_bands[i].enabled = true;
                             });
        
        // Set first and last bands as shelf filters
        if (numBands > EqualizerConstants::FIRST_BAND_INDEX) {
            m_bands[EqualizerConstants::FIRST_BAND_INDEX].type = FilterType::LOWSHELF;
            if (numBands > EqualizerConstants::MINIMUM_BANDS_FOR_SHELF) {
                m_bands[numBands - EqualizerConstants::STEP_INCREMENT].type = FilterType::HIGHSHELF;
            }
        }
    }
}

void AudioFX::AudioEqualizer::updateFilters() {
    std::ranges::for_each(std::views::iota(size_t{EqualizerConstants::FIRST_BAND_INDEX}, m_bands.size()),
                         [this](size_t i) {
                             updateBandFilter(i);
                         });
}

void AudioFX::AudioEqualizer::updateBandFilter(size_t bandIndex) {
    if (bandIndex >= m_bands.size()) return;
    
    EQBand& band = m_bands[bandIndex];
    
    // Calculate filter coefficients based on band type
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

template<>
void AudioFX::AudioEqualizer::process<float>(std::span<const float> input, std::span<float> output, std::source_location location) {
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

void AudioFX::AudioEqualizer::processOptimized(std::span<const float> input, std::span<float> output) {
    // Check if parameters have changed
    if (m_parametersChanged.load()) {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        updateFilters();
        m_parametersChanged.store(false);
    }

    // Optimisation: traiter par blocs plus grands pour améliorer la localité du cache
    constexpr size_t OPTIMAL_BLOCK_SIZE_LOCAL = EqualizerConstants::OPTIMAL_BLOCK_SIZE;  // Utilise la constante globale
    size_t numSamples = input.size();
    
    // Pré-calculer les filtres actifs pour éviter les vérifications répétées
    // Protéger l'accès à m_bands pour éviter les data races
    std::vector<BiquadFilter*> activeFilters;
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        activeFilters.reserve(m_bands.size());
        for (const auto& band : m_bands) {
            if (band.enabled && std::abs(band.gain) > EqualizerConstants::ACTIVE_GAIN_THRESHOLD) {
                activeFilters.push_back(band.filter.get());
            }
        }
    }

    // Pré-calculer le gain master une seule fois
    float masterGainLinear = static_cast<float>(dbToLinear(m_masterGain.load()));
    bool needsMasterGain = std::abs(masterGainLinear - EqualizerConstants::UNITY_GAIN_F) > EqualizerConstants::MASTER_GAIN_THRESHOLD;

    // Si aucun filtre actif, appliquer seulement le gain master
    if (activeFilters.empty()) {
        if (!needsMasterGain) {
            // Pas de traitement nécessaire, copie directe
            if (input.data() != output.data()) {
                std::ranges::copy(input, output.begin());
            }
        } else {
            // Appliquer le gain master avec unrolling
            size_t i = EqualizerConstants::FIRST_BAND_INDEX;
            for (; i + EqualizerConstants::UNROLL_OFFSET_3 < numSamples; i += EqualizerConstants::UNROLL_FACTOR) {
                output[i] = input[i] * masterGainLinear;
                output[i + EqualizerConstants::UNROLL_OFFSET_1] = input[i + EqualizerConstants::UNROLL_OFFSET_1] * masterGainLinear;
                output[i + EqualizerConstants::UNROLL_OFFSET_2] = input[i + EqualizerConstants::UNROLL_OFFSET_2] * masterGainLinear;
                output[i + EqualizerConstants::UNROLL_OFFSET_3] = input[i + EqualizerConstants::UNROLL_OFFSET_3] * masterGainLinear;
            }
            for (; i < numSamples; ++i) {
                output[i] = input[i] * masterGainLinear;
            }
        }
        return;
    }

    // Traitement par blocs avec prefetch
    for (size_t offset = EqualizerConstants::FIRST_BAND_INDEX; offset < numSamples; offset += OPTIMAL_BLOCK_SIZE_LOCAL) {
        size_t blockSize = std::min(OPTIMAL_BLOCK_SIZE_LOCAL, numSamples - offset);
        
        // Prefetch next block
        if (offset + OPTIMAL_BLOCK_SIZE_LOCAL < numSamples) {
            __builtin_prefetch(&input[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_READ, EqualizerConstants::PREFETCH_LOCALITY);
            __builtin_prefetch(&output[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_WRITE, EqualizerConstants::PREFETCH_LOCALITY);
        }

        // Copier l'entrée vers la sortie si nécessaire
        if (output.data() != input.data()) {
            std::copy(input.data() + offset, input.data() + offset + blockSize, output.data() + offset);
        }

        // Appliquer chaque filtre actif en séquence
        // L'ordre est important pour l'égaliseur
        for (auto* filter : activeFilters) {
            filter->process(output.data() + offset, output.data() + offset, blockSize);
        }

        // Appliquer le gain master si nécessaire
        if (needsMasterGain) {
            float* blockPtr = output.data() + offset;
            size_t i = EqualizerConstants::FIRST_BAND_INDEX;
            
            // Unroll par UNROLL_FACTOR pour meilleure performance
            for (; i + EqualizerConstants::UNROLL_OFFSET_3 < blockSize; i += EqualizerConstants::UNROLL_FACTOR) {
                blockPtr[i] *= masterGainLinear;
                blockPtr[i + EqualizerConstants::UNROLL_OFFSET_1] *= masterGainLinear;
                blockPtr[i + EqualizerConstants::UNROLL_OFFSET_2] *= masterGainLinear;
                blockPtr[i + EqualizerConstants::UNROLL_OFFSET_3] *= masterGainLinear;
            }
            for (; i < blockSize; ++i) {
                blockPtr[i] *= masterGainLinear;
            }
        }
    }
}

template<>
void AudioFX::AudioEqualizer::processStereo<float>(std::span<const float> inputL, std::span<const float> inputR,
                                         std::span<float> outputL, std::span<float> outputR, std::source_location location) {
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
    constexpr size_t OPTIMAL_BLOCK_SIZE_LOCAL = EqualizerConstants::OPTIMAL_BLOCK_SIZE;
    size_t numSamples = inputL.size();

    // Pré-calculer les filtres actifs
    std::vector<BiquadFilter*> activeFilters;
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        activeFilters.reserve(m_bands.size());
        for (const auto& band : m_bands) {
            if (band.enabled && std::abs(band.gain) > EqualizerConstants::ACTIVE_GAIN_THRESHOLD) {
                activeFilters.push_back(band.filter.get());
            }
        }
    }

    // Pré-calculer le gain master
    float masterGainLinear = static_cast<float>(dbToLinear(m_masterGain.load()));
    bool needsMasterGain = std::abs(masterGainLinear - EqualizerConstants::UNITY_GAIN_F) > EqualizerConstants::MASTER_GAIN_THRESHOLD;

    // Si aucun filtre actif, appliquer seulement le gain master
    if (activeFilters.empty() && !needsMasterGain) {
        // Copie directe optimisée
        if (outputL.data() != inputL.data() || outputR.data() != inputR.data()) {
            std::copy(inputL.data(), inputL.data() + numSamples, outputL.data());
            std::copy(inputR.data(), inputR.data() + numSamples, outputR.data());
        }
        return;
    }

    // Traitement par blocs avec prefetch
    for (size_t offset = EqualizerConstants::FIRST_BAND_INDEX; offset < numSamples; offset += OPTIMAL_BLOCK_SIZE_LOCAL) {
        size_t blockSize = std::min(OPTIMAL_BLOCK_SIZE_LOCAL, numSamples - offset);
        
        // Prefetch next block
        if (offset + OPTIMAL_BLOCK_SIZE_LOCAL < numSamples) {
            __builtin_prefetch(&inputL[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_READ, EqualizerConstants::PREFETCH_LOCALITY);
            __builtin_prefetch(&inputR[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_READ, EqualizerConstants::PREFETCH_LOCALITY);
            __builtin_prefetch(&outputL[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_WRITE, EqualizerConstants::PREFETCH_LOCALITY);
            __builtin_prefetch(&outputR[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_WRITE, EqualizerConstants::PREFETCH_LOCALITY);
        }

        // Copier l'entrée vers la sortie si nécessaire
        if (outputL.data() != inputL.data()) {
            std::copy(inputL.data() + offset, inputL.data() + offset + blockSize, outputL.data() + offset);
        }
        if (outputR.data() != inputR.data()) {
            std::copy(inputR.data() + offset, inputR.data() + offset + blockSize, outputR.data() + offset);
        }

        // Appliquer chaque filtre actif
        for (auto* filter : activeFilters) {
            filter->processStereo(outputL.data() + offset, outputR.data() + offset,
                                outputL.data() + offset, outputR.data() + offset, blockSize);
        }

        // Appliquer le gain master si nécessaire avec unrolling
        if (needsMasterGain) {
            float* blockPtrL = outputL.data() + offset;
            float* blockPtrR = outputR.data() + offset;
            size_t i = EqualizerConstants::FIRST_BAND_INDEX;
            
            // Unroll par UNROLL_FACTOR
            for (; i + EqualizerConstants::UNROLL_OFFSET_3 < blockSize; i += EqualizerConstants::UNROLL_FACTOR) {
                blockPtrL[i] *= masterGainLinear;
                blockPtrL[i + EqualizerConstants::UNROLL_OFFSET_1] *= masterGainLinear;
                blockPtrL[i + EqualizerConstants::UNROLL_OFFSET_2] *= masterGainLinear;
                blockPtrL[i + EqualizerConstants::UNROLL_OFFSET_3] *= masterGainLinear;
                
                blockPtrR[i] *= masterGainLinear;
                blockPtrR[i + EqualizerConstants::UNROLL_OFFSET_1] *= masterGainLinear;
                blockPtrR[i + EqualizerConstants::UNROLL_OFFSET_2] *= masterGainLinear;
                blockPtrR[i + EqualizerConstants::UNROLL_OFFSET_3] *= masterGainLinear;
            }
            
            // Traiter les échantillons restants
            for (; i < blockSize; ++i) {
                blockPtrL[i] *= masterGainLinear;
                blockPtrR[i] *= masterGainLinear;
            }
        }
    }
}

// Band control methods
void AudioFX::AudioEqualizer::setBandGain(size_t bandIndex, double gainDB) {
    if (bandIndex >= m_bands.size()) return;
    
    gainDB = std::max(MIN_GAIN_DB, std::min(MAX_GAIN_DB, gainDB));
    
    // Si on est déjà dans une session de mise à jour, pas besoin de lock
    if (m_parameterMutex.try_lock()) {
        m_bands[bandIndex].gain = gainDB;
        m_parametersChanged.store(true);
        m_parameterMutex.unlock();
    } else {
        // On est déjà dans une session de mise à jour
        m_bands[bandIndex].gain = gainDB;
        m_parametersChanged.store(true);
    }
}

void AudioFX::AudioEqualizer::setBandFrequency(size_t bandIndex, double frequency) {
    if (bandIndex >= m_bands.size()) return;
    
    frequency = std::max(EqualizerConstants::MIN_FREQUENCY_HZ, std::min(m_sampleRate / EqualizerConstants::NYQUIST_DIVISOR, frequency));
    
    // Si on est déjà dans une session de mise à jour, pas besoin de lock
    if (m_parameterMutex.try_lock()) {
        m_bands[bandIndex].frequency = frequency;
        m_parametersChanged.store(true);
        m_parameterMutex.unlock();
    } else {
        // On est déjà dans une session de mise à jour
        m_bands[bandIndex].frequency = frequency;
        m_parametersChanged.store(true);
    }
}

void AudioFX::AudioEqualizer::setBandQ(size_t bandIndex, double q) {
    if (bandIndex >= m_bands.size()) return;
    
    q = std::max(MIN_Q, std::min(MAX_Q, q));
    
    // Si on est déjà dans une session de mise à jour, pas besoin de lock
    if (m_parameterMutex.try_lock()) {
        m_bands[bandIndex].q = q;
        m_parametersChanged.store(true);
        m_parameterMutex.unlock();
    } else {
        // On est déjà dans une session de mise à jour
        m_bands[bandIndex].q = q;
        m_parametersChanged.store(true);
    }
}

void AudioFX::AudioEqualizer::setBandType(size_t bandIndex, FilterType type) {
    if (bandIndex >= m_bands.size()) return;
    
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        m_bands[bandIndex].type = type;
        m_parametersChanged.store(true);
    }
}

void AudioFX::AudioEqualizer::setBandEnabled(size_t bandIndex, bool enabled) {
    if (bandIndex >= m_bands.size()) return;
    
    {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        m_bands[bandIndex].enabled = enabled;
    }
}

// Get band parameters
double AudioFX::AudioEqualizer::getBandGain(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].gain : EqualizerConstants::ZERO_GAIN;
}

double AudioFX::AudioEqualizer::getBandFrequency(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].frequency : EqualizerConstants::ZERO_GAIN;
}

double AudioFX::AudioEqualizer::getBandQ(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].q : DEFAULT_Q;
}

FilterType AudioFX::AudioEqualizer::getBandType(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].type : FilterType::PEAK;
}

bool AudioFX::AudioEqualizer::isBandEnabled(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].enabled : false;
}

// Global controls
void AudioFX::AudioEqualizer::setMasterGain(double gainDB) {
    gainDB = std::max(MIN_GAIN_DB, std::min(MAX_GAIN_DB, gainDB));
    m_masterGain.store(gainDB);
}

double AudioFX::AudioEqualizer::getMasterGain() const {
    return m_masterGain.load();
}

void AudioFX::AudioEqualizer::setBypass(bool bypass) {
    m_bypass.store(bypass);
}

bool AudioFX::AudioEqualizer::isBypassed() const {
    return m_bypass.load();
}

// Preset management
void AudioFX::AudioEqualizer::loadPreset(const EQPreset& preset) {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    
    size_t numBands = std::min(preset.gains.size(), m_bands.size());
    std::ranges::for_each(std::views::iota(size_t{EqualizerConstants::FIRST_BAND_INDEX}, numBands),
                         [this, &preset](size_t i) {
                             m_bands[i].gain = preset.gains[i];
                         });
    
    m_parametersChanged.store(true);
}

void AudioFX::AudioEqualizer::savePreset(EQPreset& preset) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    
    preset.gains.clear();
    preset.gains.reserve(m_bands.size());
    
    std::ranges::transform(m_bands, std::back_inserter(preset.gains),
                          [](const EQBand& band) {
                              return band.gain;
                          });
}

void AudioFX::AudioEqualizer::resetAllBands() {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    
    std::ranges::for_each(m_bands, [](EQBand& band) {
        band.gain = EqualizerConstants::ZERO_GAIN;
    });
    
    m_parametersChanged.store(true);
}

void AudioFX::AudioEqualizer::setSampleRate(uint32_t sampleRate) {
    if (sampleRate != m_sampleRate) {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        m_sampleRate = sampleRate;
        m_parametersChanged.store(true);
    }
}

uint32_t AudioFX::AudioEqualizer::getSampleRate() const {
    return m_sampleRate;
}

void AudioFX::AudioEqualizer::beginParameterUpdate() {
    m_parameterMutex.lock();
}

void AudioFX::AudioEqualizer::endParameterUpdate() {
    m_parametersChanged.store(true);
    m_parameterMutex.unlock();
}

// Helper functions
double AudioFX::AudioEqualizer::dbToLinear(double db) const {
    return std::pow(EqualizerConstants::LOG_BASE_10, db / EqualizerConstants::DB_CONVERSION_FACTOR);
}

double AudioFX::AudioEqualizer::linearToDb(double linear) const {
    return EqualizerConstants::DB_CONVERSION_FACTOR * std::log10(std::max(linear, EPSILON));
}

// Preset Factory implementations
EQPreset EQPresetFactory::createFlatPreset() {
    EQPreset preset;
    preset.name = "Flat";
    preset.gains = std::vector<double>(NUM_BANDS, EqualizerConstants::ZERO_GAIN);
    return preset;
}

EQPreset EQPresetFactory::createRockPreset() {
    EQPreset preset;
    preset.name = "Rock";
    preset.gains = std::vector<double>(PresetGains::ROCK.begin(), PresetGains::ROCK.end());
    return preset;
}

EQPreset EQPresetFactory::createPopPreset() {
    EQPreset preset;
    preset.name = "Pop";
    preset.gains = std::vector<double>(PresetGains::POP.begin(), PresetGains::POP.end());
    return preset;
}

EQPreset EQPresetFactory::createJazzPreset() {
    EQPreset preset;
    preset.name = "Jazz";
    preset.gains = std::vector<double>(PresetGains::JAZZ.begin(), PresetGains::JAZZ.end());
    return preset;
}

EQPreset EQPresetFactory::createClassicalPreset() {
    EQPreset preset;
    preset.name = "Classical";
    preset.gains = std::vector<double>(PresetGains::CLASSICAL.begin(), PresetGains::CLASSICAL.end());
    return preset;
}

EQPreset EQPresetFactory::createElectronicPreset() {
    EQPreset preset;
    preset.name = "Electronic";
    preset.gains = std::vector<double>(PresetGains::ELECTRONIC.begin(), PresetGains::ELECTRONIC.end());
    return preset;
}

EQPreset EQPresetFactory::createVocalBoostPreset() {
    EQPreset preset;
    preset.name = "Vocal Boost";
    preset.gains = std::vector<double>(PresetGains::VOCAL_BOOST.begin(), PresetGains::VOCAL_BOOST.end());
    return preset;
}

EQPreset EQPresetFactory::createBassBoostPreset() {
    EQPreset preset;
    preset.name = "Bass Boost";
    preset.gains = std::vector<double>(PresetGains::BASS_BOOST.begin(), PresetGains::BASS_BOOST.end());
    return preset;
}

EQPreset EQPresetFactory::createTrebleBoostPreset() {
    EQPreset preset;
    preset.name = "Treble Boost";
    preset.gains = std::vector<double>(PresetGains::TREBLE_BOOST.begin(), PresetGains::TREBLE_BOOST.end());
    return preset;
}

EQPreset EQPresetFactory::createLoudnessPreset() {
    EQPreset preset;
    preset.name = "Loudness";
    preset.gains = std::vector<double>(PresetGains::LOUDNESS.begin(), PresetGains::LOUDNESS.end());
    return preset;
}

// C++20 modernized processing methods
template<AudioSampleType T>
void AudioFX::AudioEqualizer::process(std::span<const T> input, std::span<T> output,
                            std::source_location location) {
    // C++20 validation
    if (input.size() != output.size()) {
        throw std::invalid_argument(nyth::format(
            "Input and output spans must have the same size. Input: {}, Output: {} [{}:{}]",
            input.size(), output.size(), location.file_name(), location.line()));
    }

    if (!validateAudioBuffer(input, location)) {
        throw std::invalid_argument(nyth::format(
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
void AudioFX::AudioEqualizer::processStereo(std::span<const T> inputL, std::span<const T> inputR,
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
std::string AudioFX::AudioEqualizer::getDebugInfo(std::source_location location) const {
    std::string info = nyth::format(
        "AudioEqualizer Debug Info:\n"
        "  Sample Rate: {} Hz\n"
        "  Master Gain: {:.2f} dB\n"
        "  Bypassed: {}\n"
        "  Number of Bands: {}\n"
        "  Location: {}:{} ({})\n"
        "  Bands:\n",
        m_sampleRate, getMasterGain(), isBypassed(), getNumBands(),
        location.file_name(), location.line(), location.function_name());

    for (size_t i = EqualizerConstants::FIRST_BAND_INDEX; i < m_bands.size(); ++i) {
        const auto& band = m_bands[i];
        info += nyth::format(
            "    Band {}: Freq={:.1f}Hz, Gain={:.2f}dB, Q={:.2f}, Type={}, Enabled={}\n",
            i, band.frequency, band.gain, band.q,
            static_cast<int>(band.type), band.enabled);
    }

    return info;
}

// C++20 buffer validation
template<AudioSampleType T>
bool AudioFX::AudioEqualizer::validateAudioBuffer(std::span<const T> buffer,
                                       std::source_location location) const {
    if (buffer.empty()) {
        return false;
    }

    // Check for NaN or infinite values
    auto invalidValues = std::ranges::count_if(buffer, [](T sample) {
        return !std::isfinite(static_cast<double>(sample));
    });

    if (invalidValues > EqualizerConstants::FIRST_BAND_INDEX) {
        return false;
    }

    return true;
}

// Explicit template instantiations
template void AudioFX::AudioEqualizer::process<float>(std::span<const float>, std::span<float>, std::source_location);
template void AudioFX::AudioEqualizer::process<double>(std::span<const double>, std::span<double>, std::source_location);
template void AudioFX::AudioEqualizer::processStereo<float>(std::span<const float>, std::span<const float>,
                                                  std::span<float>, std::span<float>, std::source_location);
template void AudioFX::AudioEqualizer::processStereo<double>(std::span<const double>, std::span<const double>,
                                                   std::span<double>, std::span<double>, std::source_location);

template bool AudioFX::AudioEqualizer::validateAudioBuffer<float>(std::span<const float>, std::source_location) const;
template bool AudioFX::AudioEqualizer::validateAudioBuffer<double>(std::span<const double>, std::source_location) const;

} // namespace AudioFX
