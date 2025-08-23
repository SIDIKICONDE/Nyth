
#include "AudioEqualizer.hpp"
#include "EQPreset.hpp"

// Headers système C++ standard
#include <algorithm>
#include <cmath>
#include <string>
#include <iterator>
#include <mutex>
#include <sstream>
#include <vector>

namespace Audio {
namespace core {

// Import des constantes pour éviter la répétition des namespace
using namespace AudioFX;
using namespace AudioFX::EqualizerConstants;

AudioEqualizer::AudioEqualizer(size_t numBands, uint32_t sampleRate)
    : m_sampleRate(sampleRate)
    , m_masterGain(EqualizerConstants::DEFAULT_MASTER_GAIN)
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

    // Setup default bands
    setupDefaultBands();

    // Update all filters
    updateFilters();
}

void AudioEqualizer::setupDefaultBands() {
    size_t numBands = m_bands.size();

    if (numBands == NUM_BANDS) {
        // Use predefined frequencies for 10-band EQ
        for (size_t i = EqualizerConstants::FIRST_BAND_INDEX; i < numBands; ++i) {
            m_bands[i].frequency = DEFAULT_FREQUENCIES[i];
            m_bands[i].gain = EqualizerConstants::ZERO_GAIN;
            m_bands[i].q = DEFAULT_Q;
            m_bands[i].type = FilterType::PEAK;
            m_bands[i].enabled = true;
        }

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

        for (size_t i = EqualizerConstants::FIRST_BAND_INDEX; i < numBands; ++i) {
            double logFreq = logMin + i * logStep;
            m_bands[i].frequency = std::pow(EqualizerConstants::LOGARITHMIC_BASE, logFreq);
            m_bands[i].gain = EqualizerConstants::ZERO_GAIN;
            m_bands[i].q = DEFAULT_Q;
            m_bands[i].type = FilterType::PEAK;
            m_bands[i].enabled = true;
        }

        // Set first and last bands as shelf filters
        if (numBands > EqualizerConstants::FIRST_BAND_INDEX) {
            m_bands[EqualizerConstants::FIRST_BAND_INDEX].type = FilterType::LOWSHELF;
            if (numBands > EqualizerConstants::MINIMUM_BANDS_FOR_SHELF) {
                m_bands[numBands - EqualizerConstants::STEP_INCREMENT].type = FilterType::HIGHSHELF;
            }
        }
    }
}

void AudioEqualizer::updateFilters() {
    for (size_t i = EqualizerConstants::FIRST_BAND_INDEX; i < m_bands.size(); ++i) {
        updateBandFilter(i);
    }
}

void AudioEqualizer::updateBandFilter(size_t bandIndex) {
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

void AudioEqualizer::processOptimized(const std::vector<float>& input, std::vector<float>& output) {
    // Check if parameters have changed
    if (m_parametersChanged.load()) {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        updateFilters();
        m_parametersChanged.store(false);
    }

    // Optimisation: traiter par blocs plus grands pour améliorer la localité du cache
    constexpr size_t OPTIMAL_BLOCK_SIZE_LOCAL = EqualizerConstants::OPTIMAL_BLOCK_SIZE;
    size_t numSamples = input.size();

    // Pré-calculer les filtres actifs pour éviter les vérifications répétées
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
                std::copy(input.begin(), input.end(), output.begin());
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
            AUDIO_PREFETCH(&input[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_READ, EqualizerConstants::PREFETCH_LOCALITY);
            AUDIO_PREFETCH(&output[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_WRITE, EqualizerConstants::PREFETCH_LOCALITY);
        }

        // Copier l'entrée vers la sortie si nécessaire
        if (output.data() != input.data()) {
            std::copy(input.data() + offset, input.data() + offset + blockSize, output.data() + offset);
        }

        // Appliquer chaque filtre actif en séquence
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

void AudioEqualizer::processStereoOptimized(const std::vector<float>& inputL, const std::vector<float>& inputR,
                                           std::vector<float>& outputL, std::vector<float>& outputR) {
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
            AUDIO_PREFETCH(&inputL[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_READ, EqualizerConstants::PREFETCH_LOCALITY);
            AUDIO_PREFETCH(&inputR[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_READ, EqualizerConstants::PREFETCH_LOCALITY);
            AUDIO_PREFETCH(&outputL[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_WRITE, EqualizerConstants::PREFETCH_LOCALITY);
            AUDIO_PREFETCH(&outputR[offset + OPTIMAL_BLOCK_SIZE_LOCAL], EqualizerConstants::PREFETCH_WRITE, EqualizerConstants::PREFETCH_LOCALITY);
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
void AudioEqualizer::setBandGain(size_t bandIndex, double gainDB) {
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

void AudioEqualizer::setBandFrequency(size_t bandIndex, double frequency) {
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

void AudioEqualizer::setBandQ(size_t bandIndex, double q) {
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
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].gain : EqualizerConstants::ZERO_GAIN;
}

double AudioEqualizer::getBandFrequency(size_t bandIndex) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    return (bandIndex < m_bands.size()) ? m_bands[bandIndex].frequency : EqualizerConstants::ZERO_GAIN;
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
    for (size_t i = EqualizerConstants::FIRST_BAND_INDEX; i < numBands; ++i) {
        m_bands[i].gain = preset.gains[i];
    }

    m_parametersChanged.store(true);
}

void AudioEqualizer::savePreset(EQPreset& preset) const {
    std::lock_guard<std::mutex> lock(m_parameterMutex);

    preset.gains.clear();
    preset.gains.reserve(m_bands.size());

    std::transform(m_bands.begin(), m_bands.end(), std::back_inserter(preset.gains),
                          [](const EQBand& band) {
                              return band.gain;
                          });
}

void AudioEqualizer::resetAllBands() {
    std::lock_guard<std::mutex> lock(m_parameterMutex);

    std::for_each(m_bands.begin(), m_bands.end(), [](EQBand& band) {
        band.gain = EqualizerConstants::ZERO_GAIN;
    });

    m_parametersChanged.store(true);
}

void AudioEqualizer::reset() {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    
    // Reset all bands to default values
    setupDefaultBands();
    
    // Reset master gain and bypass
    m_masterGain.store(EqualizerConstants::DEFAULT_MASTER_GAIN);
    m_bypass.store(false);
    
    // Mark parameters as changed to trigger filter update
    m_parametersChanged.store(true);
}

void AudioEqualizer::processMono(const float* input, float* output, size_t numSamples) {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    
    // Check if bypass is enabled
    if (m_bypass.load()) {
        std::copy(input, input + numSamples, output);
        return;
    }
    
    // Convert to vectors for processing
    std::vector<float> inputVector(input, input + numSamples);
    std::vector<float> outputVector(numSamples);
    
    // Process using the optimized mono method
    processOptimized(inputVector, outputVector);
    
    // Apply master gain
    double masterGain = m_masterGain.load();
    if (std::abs(masterGain - EqualizerConstants::DEFAULT_MASTER_GAIN) > 0.001) {
        double gainLinear = dbToLinear(masterGain);
        for (size_t i = 0; i < numSamples; ++i) {
            output[i] = static_cast<float>(outputVector[i] * gainLinear);
        }
    } else {
        std::copy(outputVector.begin(), outputVector.end(), output);
    }
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
    return std::pow(EqualizerConstants::LOG_BASE_10, db / EqualizerConstants::DB_CONVERSION_FACTOR);
}

double AudioEqualizer::linearToDb(double linear) const {
    return EqualizerConstants::DB_CONVERSION_FACTOR * std::log10(std::max(linear, EPSILON));
}

// Filter operations
std::vector<std::reference_wrapper<const EQBand>> AudioEqualizer::getActiveBands() const {
    std::vector<std::reference_wrapper<const EQBand>> activeBands;
    std::lock_guard<std::mutex> lock(m_parameterMutex);

    for (const auto& band : m_bands) {
        if (band.enabled) {
            activeBands.emplace_back(std::cref(band));
        }
    }
    return activeBands;
}

std::vector<std::reference_wrapper<const EQBand>> AudioEqualizer::getBandsByType(FilterType type) const {
    std::vector<std::reference_wrapper<const EQBand>> filteredBands;
    std::lock_guard<std::mutex> lock(m_parameterMutex);

    for (const auto& band : m_bands) {
        if (band.type == type) {
            filteredBands.emplace_back(std::cref(band));
        }
    }
    return filteredBands;
}

// C++17 formatted debugging
std::string AudioEqualizer::getDebugInfo(const std::string& location) const {
    (void)location; // Éviter warning unused
    std::ostringstream oss;
    oss << "AudioEqualizer Debug Info:\n"
        << "  Sample Rate: " << m_sampleRate << " Hz\n"
        << "  Master Gain: " << getMasterGain() << " dB\n"
        << "  Bypassed: " << (isBypassed() ? "true" : "false") << "\n"
        << "  Number of Bands: " << getNumBands() << "\n"
        << "  Bands:\n";

    for (size_t i = EqualizerConstants::FIRST_BAND_INDEX; i < m_bands.size(); ++i) {
        const auto& band = m_bands[i];
        oss << "    Band " << i << ": Freq=" << band.frequency << "Hz, Gain="
            << band.gain << "dB, Q=" << band.q << ", Type="
            << static_cast<int>(band.type) << ", Enabled="
            << (band.enabled ? "true" : "false") << "\n";
    }

    return oss.str();
}

// Les définitions de validateAudioBuffer sont dans AudioEqualizer.inl

// Explicit template instantiations
template void Audio::core::AudioEqualizer::process<float>(const std::vector<float>&, std::vector<float>&, const std::string&);
template void Audio::core::AudioEqualizer::process<double>(const std::vector<double>&, std::vector<double>&, const std::string&);
template void Audio::core::AudioEqualizer::processStereo<float>(const std::vector<float>&, const std::vector<float>&,
                                                  std::vector<float>&, std::vector<float>&, const std::string&);
template void Audio::core::AudioEqualizer::processStereo<double>(const std::vector<double>&, const std::vector<double>&,
                                                   std::vector<double>&, std::vector<double>&, const std::string&);

template bool Audio::core::AudioEqualizer::validateAudioBuffer<float>(const std::vector<float>&, const std::string&) const;
template bool Audio::core::AudioEqualizer::validateAudioBuffer<double>(const std::vector<double>&, const std::string&) const;

} // namespace core
} // namespace Audio
