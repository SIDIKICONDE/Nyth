#include "EqualizerManager.h"
#include <algorithm>
#include "../../common/SIMD/SIMDIntegration.hpp"

namespace facebook {
namespace react {

EqualizerManager::EqualizerManager(std::shared_ptr<JSICallbackManager> callbackManager)
    : callbackManager_(callbackManager) {}

EqualizerManager::~EqualizerManager() {
    release();
}

// === Cycle de vie ===
bool EqualizerManager::initialize(const Nyth::Audio::AudioConfig& config) {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    try {
        // Nettoyer l'instance existante
        if (equalizer_) {
            equalizer_.reset();
        }

        // Créer un nouvel égaliseur avec le nombre de bandes approprié
        equalizer_ = std::make_unique<Audio::core::AudioEqualizer>(10, config.sampleRate);
        equalizer_->setMasterGain(0.0);
        equalizer_->setBypass(false);

        config_ = config;
        isInitialized_.store(true);
        return true;

    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to initialize equalizer: ") + e.what());
        }
        return false;
    }
}

bool EqualizerManager::isInitialized() const {
    return isInitialized_.load() && equalizer_ != nullptr;
}

void EqualizerManager::release() {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (equalizer_) {
        equalizer_.reset();
    }

    isInitialized_.store(false);
}

// === Configuration globale ===
bool EqualizerManager::setMasterGain(double gainDB) {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        equalizer_->setMasterGain(gainDB);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set master gain: ") + e.what());
        }
        return false;
    }
}

bool EqualizerManager::setBypass(bool bypass) {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        equalizer_->setBypass(bypass);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set bypass: ") + e.what());
        }
        return false;
    }
}

bool EqualizerManager::setSampleRate(uint32_t sampleRate) {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        equalizer_->setSampleRate(sampleRate);
        config_.sampleRate = sampleRate;
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set sample rate: ") + e.what());
        }
        return false;
    }
}

double EqualizerManager::getMasterGain() const {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return 0.0;
    }

    return equalizer_->getMasterGain();
}

bool EqualizerManager::isBypassed() const {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return true;
    }

    return equalizer_->isBypassed();
}

// === Configuration des bandes ===
bool EqualizerManager::setBand(size_t bandIndex, double frequency, double gainDB, double q, int filterType,
                               bool enabled) {
    if (!validateBandIndex(bandIndex) || !validateParameters(frequency, gainDB, q)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        equalizer_->setBandFrequency(bandIndex, frequency);
        equalizer_->setBandGain(bandIndex, gainDB);
        equalizer_->setBandQ(bandIndex, q);
        equalizer_->setBandEnabled(bandIndex, enabled);

        Nyth::Audio::FX::FilterType type = convertToFilterType(filterType);
        equalizer_->setBandType(bandIndex, type);

        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set band config: ") + e.what());
        }
        return false;
    }
}

bool EqualizerManager::getBand(size_t bandIndex, double& frequency, double& gainDB, double& q, int& filterType,
                               bool& enabled) const {
    if (!validateBandIndex(bandIndex)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        frequency = equalizer_->getBandFrequency(bandIndex);
        gainDB = equalizer_->getBandGain(bandIndex);
        q = equalizer_->getBandQ(bandIndex);
        enabled = equalizer_->isBandEnabled(bandIndex);

        Nyth::Audio::FX::FilterType type = equalizer_->getBandType(bandIndex);
        filterType = convertFromFilterType(type);

        return true;
    } catch (const std::exception& e) {
        return false;
    }
}

bool EqualizerManager::setBandGain(size_t bandIndex, double gainDB) {
    if (!validateBandIndex(bandIndex)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        equalizer_->setBandGain(bandIndex, gainDB);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set band gain: ") + e.what());
        }
        return false;
    }
}

bool EqualizerManager::setBandFrequency(size_t bandIndex, double frequency) {
    if (!validateBandIndex(bandIndex) || !validateParameters(frequency, 0.0, 1.0)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        equalizer_->setBandFrequency(bandIndex, frequency);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set band frequency: ") + e.what());
        }
        return false;
    }
}

bool EqualizerManager::setBandQ(size_t bandIndex, double q) {
    if (!validateBandIndex(bandIndex)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        equalizer_->setBandQ(bandIndex, q);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set band Q: ") + e.what());
        }
        return false;
    }
}

bool EqualizerManager::setBandType(size_t bandIndex, int filterType) {
    if (!validateBandIndex(bandIndex)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        Nyth::Audio::FX::FilterType type = convertToFilterType(filterType);
        equalizer_->setBandType(bandIndex, type);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set band type: ") + e.what());
        }
        return false;
    }
}

bool EqualizerManager::setBandEnabled(size_t bandIndex, bool enabled) {
    if (!validateBandIndex(bandIndex)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        equalizer_->setBandEnabled(bandIndex, enabled);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set band enabled: ") + e.what());
        }
        return false;
    }
}

// === Informations ===
size_t EqualizerManager::getNumBands() const {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return 0;
    }

    return equalizer_->getNumBands();
}

uint32_t EqualizerManager::getSampleRate() const {
    return config_.sampleRate;
}

// === Processing ===
bool EqualizerManager::processMono(const float* input, float* output, size_t numSamples) {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_ || !input || !output || numSamples == 0) {
        return false;
    }

    try {
        // Utiliser SIMD si disponible et taille suffisante
        if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && numSamples >= 64) {
            // Copier directement dans les buffers alignés
            std::vector<float> inputVec(input, input + numSamples);
            std::vector<float> outputVec(numSamples);

            equalizer_->processMono(inputVec, outputVec);

            // Appliquer normalisation SIMD si nécessaire
            if (config_.autoNormalize) {
                AudioNR::MathUtils::MathUtilsSIMDExtension::normalizeAudioSIMD(
                    outputVec.data(), numSamples, config_.targetRMS);
            }

            std::copy(outputVec.begin(), outputVec.end(), output);
        } else {
            // Version standard
            std::vector<float> inputVec(input, input + numSamples);
            std::vector<float> outputVec(numSamples);

            equalizer_->processMono(inputVec, outputVec);
            std::copy(outputVec.begin(), outputVec.end(), output);
        }
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to process mono: ") + e.what());
        }
        return false;
    }
}

bool EqualizerManager::processStereo(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                     size_t numSamples) {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_ || !inputL || !inputR || !outputL || !outputR || numSamples == 0) {
        return false;
    }

    try {
        std::vector<float> inputLVec(inputL, inputL + numSamples);
        std::vector<float> inputRVec(inputR, inputR + numSamples);
        std::vector<float> outputLVec(numSamples);
        std::vector<float> outputRVec(numSamples);

        equalizer_->processStereo(inputLVec, inputRVec, outputLVec, outputRVec);

        std::copy(outputLVec.begin(), outputLVec.end(), outputL);
        std::copy(outputRVec.begin(), outputRVec.end(), outputR);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to process stereo: ") + e.what());
        }
        return false;
    }
}

// === Presets ===
bool EqualizerManager::loadPreset(const std::string& presetName) {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        Nyth::Audio::FX::EQPreset preset;

        // Presets prédéfinis
        if (presetName == "flat") {
            preset = Nyth::Audio::FX::EQPresetFactory::createFlatPreset();
        } else if (presetName == "rock") {
            preset = Nyth::Audio::FX::EQPresetFactory::createRockPreset();
        } else if (presetName == "pop") {
            preset = Nyth::Audio::FX::EQPresetFactory::createPopPreset();
        } else if (presetName == "jazz") {
            preset = Nyth::Audio::FX::EQPresetFactory::createJazzPreset();
        } else if (presetName == "classical") {
            preset = Nyth::Audio::FX::EQPresetFactory::createClassicalPreset();
        } else if (presetName == "electronic") {
            preset = Nyth::Audio::FX::EQPresetFactory::createElectronicPreset();
        } else if (presetName == "vocal_boost") {
            preset = Nyth::Audio::FX::EQPresetFactory::createVocalBoostPreset();
        } else if (presetName == "bass_boost") {
            preset = Nyth::Audio::FX::EQPresetFactory::createBassBoostPreset();
        } else if (presetName == "treble_boost") {
            preset = Nyth::Audio::FX::EQPresetFactory::createTrebleBoostPreset();
        } else if (presetName == "loudness") {
            preset = Nyth::Audio::FX::EQPresetFactory::createLoudnessPreset();
        } else {
            // Vérifier les presets personnalisés
            auto it = customPresets_.find(presetName);
            if (it != customPresets_.end()) {
                preset = it->second;
            } else {
                return false;
            }
        }

        equalizer_->loadPreset(preset);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to load preset: ") + e.what());
        }
        return false;
    }
}

bool EqualizerManager::savePreset(const std::string& presetName) {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return false;
    }

    try {
        Nyth::Audio::FX::EQPreset preset;
        equalizer_->savePreset(preset);
        customPresets_[presetName] = preset;
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to save preset: ") + e.what());
        }
        return false;
    }
}

void EqualizerManager::resetAllBands() {
    std::lock_guard<std::mutex> lock(equalizerMutex_);

    if (!isInitialized_.load() || !equalizer_) {
        return;
    }

    try {
        equalizer_->reset();
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to reset bands: ") + e.what());
        }
    }
}

std::vector<std::string> EqualizerManager::getAvailablePresets() const {
    std::vector<std::string> presets = {"flat",       "rock",        "pop",        "jazz",         "classical",
                                        "electronic", "vocal_boost", "bass_boost", "treble_boost", "loudness"};

    // Ajouter les presets personnalisés
    for (const auto& pair : customPresets_) {
        presets.push_back(pair.first);
    }

    return presets;
}

// === Méthodes privées ===
Nyth::Audio::FX::FilterType EqualizerManager::convertToFilterType(int filterType) const {
    switch (filterType) {
        case 0:
            return Nyth::Audio::FX::FilterType::LOWPASS;
        case 1:
            return Nyth::Audio::FX::FilterType::HIGHPASS;
        case 2:
            return Nyth::Audio::FX::FilterType::BANDPASS;
        case 3:
            return Nyth::Audio::FX::FilterType::NOTCH;
        case 4:
            return Nyth::Audio::FX::FilterType::PEAK;
        case 5:
            return Nyth::Audio::FX::FilterType::LOWSHELF;
        case 6:
            return Nyth::Audio::FX::FilterType::HIGHSHELF;
        case 7:
            return Nyth::Audio::FX::FilterType::ALLPASS;
        default:
            return Nyth::Audio::FX::FilterType::PEAK;
    }
}

int EqualizerManager::convertFromFilterType(Nyth::Audio::FX::FilterType type) const {
    switch (type) {
        case Nyth::Audio::FX::FilterType::LOWPASS:
            return 0;
        case Nyth::Audio::FX::FilterType::HIGHPASS:
            return 1;
        case Nyth::Audio::FX::FilterType::BANDPASS:
            return 2;
        case Nyth::Audio::FX::FilterType::NOTCH:
            return 3;
        case Nyth::Audio::FX::FilterType::PEAK:
            return 4;
        case Nyth::Audio::FX::FilterType::LOWSHELF:
            return 5;
        case Nyth::Audio::FX::FilterType::HIGHSHELF:
            return 6;
        case Nyth::Audio::FX::FilterType::ALLPASS:
            return 7;
        default:
            return 4;
    }
}

bool EqualizerManager::validateBandIndex(size_t bandIndex) const {
    return bandIndex < getNumBands();
}

bool EqualizerManager::validateParameters(double frequency, double gainDB, double q) const {
    // Validation basique des paramètres
    return frequency > 0.0 && frequency < config_.sampleRate / 2.0 && gainDB >= -60.0 && gainDB <= 30.0 && q > 0.0 &&
           q <= 10.0;
}

// === Implémentations SIMD ===

float EqualizerManager::calculateRMS_SIMD(const float* data, size_t count) const {
    if (!data || count == 0) return 0.0f;

    if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && count >= 64) {
        return AudioNR::MathUtils::MathUtilsSIMDExtension::calculateRMSSIMD(data, count);
    } else {
        // Version standard
        float sum = 0.0f;
        for (size_t i = 0; i < count; ++i) {
            sum += data[i] * data[i];
        }
        return std::sqrt(sum / count);
    }
}

float EqualizerManager::calculatePeak_SIMD(const float* data, size_t count) const {
    if (!data || count == 0) return 0.0f;

    if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && count >= 64) {
        return AudioNR::MathUtils::MathUtilsSIMDExtension::calculatePeakSIMD(data, count);
    } else {
        // Version standard
        float peak = 0.0f;
        for (size_t i = 0; i < count; ++i) {
            peak = std::max(peak, std::abs(data[i]));
        }
        return peak;
    }
}

void EqualizerManager::normalizeAudio_SIMD(float* data, size_t count, float targetRMS) const {
    if (!data || count == 0) return;

    if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && count >= 64) {
        AudioNR::MathUtils::MathUtilsSIMDExtension::normalizeAudioSIMD(data, count, targetRMS);
    } else {
        // Version standard
        float rms = calculateRMS_SIMD(data, count);
        if (rms > 0.0f) {
            float gain = targetRMS / rms;
            for (size_t i = 0; i < count; ++i) {
                data[i] *= gain;
            }
        }
    }
}

} // namespace react
} // namespace facebook
