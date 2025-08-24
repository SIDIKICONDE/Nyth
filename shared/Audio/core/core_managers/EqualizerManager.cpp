#include "EqualizerManager.h"
#include <algorithm>

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

        AudioFX::FilterType type = convertToAudioFXFilterType(filterType);
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

        AudioFX::FilterType type = equalizer_->getBandType(bandIndex);
        filterType = convertFromAudioFXFilterType(type);

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
        AudioFX::FilterType type = convertToAudioFXFilterType(filterType);
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
        std::vector<float> inputVec(input, input + numSamples);
        std::vector<float> outputVec(numSamples);

        equalizer_->processMono(inputVec, outputVec);

        std::copy(outputVec.begin(), outputVec.end(), output);
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
        AudioFX::EQPreset preset;

        // Presets prédéfinis
        if (presetName == "flat") {
            preset = AudioFX::EQPresetFactory::createFlatPreset();
        } else if (presetName == "rock") {
            preset = AudioFX::EQPresetFactory::createRockPreset();
        } else if (presetName == "pop") {
            preset = AudioFX::EQPresetFactory::createPopPreset();
        } else if (presetName == "jazz") {
            preset = AudioFX::EQPresetFactory::createJazzPreset();
        } else if (presetName == "classical") {
            preset = AudioFX::EQPresetFactory::createClassicalPreset();
        } else if (presetName == "electronic") {
            preset = AudioFX::EQPresetFactory::createElectronicPreset();
        } else if (presetName == "vocal_boost") {
            preset = AudioFX::EQPresetFactory::createVocalBoostPreset();
        } else if (presetName == "bass_boost") {
            preset = AudioFX::EQPresetFactory::createBassBoostPreset();
        } else if (presetName == "treble_boost") {
            preset = AudioFX::EQPresetFactory::createTrebleBoostPreset();
        } else if (presetName == "loudness") {
            preset = AudioFX::EQPresetFactory::createLoudnessPreset();
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
        AudioFX::EQPreset preset;
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
AudioFX::FilterType EqualizerManager::convertToAudioFXFilterType(int filterType) const {
    switch (filterType) {
        case 0:
            return AudioFX::FilterType::LOWPASS;
        case 1:
            return AudioFX::FilterType::HIGHPASS;
        case 2:
            return AudioFX::FilterType::BANDPASS;
        case 3:
            return AudioFX::FilterType::NOTCH;
        case 4:
            return AudioFX::FilterType::PEAK;
        case 5:
            return AudioFX::FilterType::LOWSHELF;
        case 6:
            return AudioFX::FilterType::HIGHSHELF;
        case 7:
            return AudioFX::FilterType::ALLPASS;
        default:
            return AudioFX::FilterType::PEAK;
    }
}

int EqualizerManager::convertFromAudioFXFilterType(AudioFX::FilterType type) const {
    switch (type) {
        case AudioFX::FilterType::LOWPASS:
            return 0;
        case AudioFX::FilterType::HIGHPASS:
            return 1;
        case AudioFX::FilterType::BANDPASS:
            return 2;
        case AudioFX::FilterType::NOTCH:
            return 3;
        case AudioFX::FilterType::PEAK:
            return 4;
        case AudioFX::FilterType::LOWSHELF:
            return 5;
        case AudioFX::FilterType::HIGHSHELF:
            return 6;
        case AudioFX::FilterType::ALLPASS:
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

} // namespace react
} // namespace facebook
