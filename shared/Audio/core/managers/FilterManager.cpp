#include "FilterManager.h"
#include <algorithm>

namespace facebook {
namespace react {

FilterManager::FilterManager(std::shared_ptr<JSICallbackManager> callbackManager) : callbackManager_(callbackManager) {}

FilterManager::~FilterManager() {
    std::lock_guard<std::mutex> lock(filtersMutex_);
    filters_.clear();
}

// === Gestion du cycle de vie ===
int64_t FilterManager::createFilter() {
    std::lock_guard<std::mutex> lock(filtersMutex_);

    try {
        int64_t filterId = nextFilterId_++;
        filters_[filterId] = std::make_unique<Nyth::Audio::FX::BiquadFilter>();
        return filterId;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to create filter: ") + e.what());
        }
        return -1;
    }
}

bool FilterManager::destroyFilter(int64_t filterId) {
    std::lock_guard<std::mutex> lock(filtersMutex_);

    auto it = filters_.find(filterId);
    if (it != filters_.end()) {
        filters_.erase(it);
        return true;
    }

    return false;
}

bool FilterManager::filterExists(int64_t filterId) const {
    std::lock_guard<std::mutex> lock(filtersMutex_);
    return filters_.find(filterId) != filters_.end();
}

// === Configuration des filtres ===
bool FilterManager::setFilterConfig(int64_t filterId, double frequency, double q, double gainDB, int filterType) {
    if (!validateFilterId(filterId) || !validateParameters(frequency, q, gainDB)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(filtersMutex_);

    auto it = filters_.find(filterId);
    if (it == filters_.end()) {
        return false;
    }

    try {
        auto* filter = it->second.get();

        // Configuration du filtre selon le type
        switch (filterType) {
            case 0: // LOWPASS
                filter->calculateLowpass(frequency, sampleRate_, q);
                break;
            case 1: // HIGHPASS
                filter->calculateHighpass(frequency, sampleRate_, q);
                break;
            case 2: // BANDPASS
                filter->calculateBandpass(frequency, sampleRate_, q);
                break;
            case 3: // NOTCH
                filter->calculateNotch(frequency, sampleRate_, q);
                break;
            case 4: // PEAK
                filter->calculatePeaking(frequency, sampleRate_, q, gainDB);
                break;
            case 5: // LOWSHELF
                filter->calculateLowShelf(frequency, sampleRate_, q, gainDB);
                break;
            case 6: // HIGHSHELF
                filter->calculateHighShelf(frequency, sampleRate_, q, gainDB);
                break;
            case 7: // ALLPASS
                filter->calculateAllpass(frequency, sampleRate_, q);
                break;
            default:
                return false;
        }

        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set filter config: ") + e.what());
        }
        return false;
    }
}

bool FilterManager::getFilterConfig(int64_t filterId, double& frequency, double& q, double& gainDB,
                                    int& filterType) const {
    if (!validateFilterId(filterId)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(filtersMutex_);

    auto it = filters_.find(filterId);
    if (it == filters_.end()) {
        return false;
    }

    // Note: BiquadFilter ne fournit pas de getters pour les paramètres
    // Nous retournons des valeurs par défaut
    frequency = 1000.0;
    q = 1.0;
    gainDB = 0.0;
    filterType = 4; // PEAK par défaut

    return true;
}

// === Types de filtres spécifiques ===
bool FilterManager::setLowpass(int64_t filterId, double frequency, double q) {
    return setFilterConfig(filterId, frequency, q, 0.0, 0);
}

bool FilterManager::setHighpass(int64_t filterId, double frequency, double q) {
    return setFilterConfig(filterId, frequency, q, 0.0, 1);
}

bool FilterManager::setBandpass(int64_t filterId, double frequency, double q) {
    return setFilterConfig(filterId, frequency, q, 0.0, 2);
}

bool FilterManager::setNotch(int64_t filterId, double frequency, double q) {
    return setFilterConfig(filterId, frequency, q, 0.0, 3);
}

bool FilterManager::setPeaking(int64_t filterId, double frequency, double q, double gainDB) {
    return setFilterConfig(filterId, frequency, q, gainDB, 4);
}

bool FilterManager::setLowShelf(int64_t filterId, double frequency, double q, double gainDB) {
    return setFilterConfig(filterId, frequency, q, gainDB, 5);
}

bool FilterManager::setHighShelf(int64_t filterId, double frequency, double q, double gainDB) {
    return setFilterConfig(filterId, frequency, q, gainDB, 6);
}

bool FilterManager::setAllpass(int64_t filterId, double frequency, double q) {
    return setFilterConfig(filterId, frequency, q, 0.0, 7);
}

// === Processing ===
bool FilterManager::processMono(int64_t filterId, const float* input, float* output, size_t numSamples) {
    if (!validateFilterId(filterId) || !input || !output || numSamples == 0) {
        return false;
    }

    std::lock_guard<std::mutex> lock(filtersMutex_);

    auto it = filters_.find(filterId);
    if (it == filters_.end()) {
        return false;
    }

    try {
        auto* filter = it->second.get();
        filter->processMono(input, output, numSamples);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to process mono: ") + e.what());
        }
        return false;
    }
}

bool FilterManager::processStereo(int64_t filterId, const float* inputL, const float* inputR, float* outputL,
                                  float* outputR, size_t numSamples) {
    if (!validateFilterId(filterId) || !inputL || !inputR || !outputL || !outputR || numSamples == 0) {
        return false;
    }

    std::lock_guard<std::mutex> lock(filtersMutex_);

    auto it = filters_.find(filterId);
    if (it == filters_.end()) {
        return false;
    }

    try {
        auto* filter = it->second.get();
        filter->processStereo(inputL, inputR, outputL, outputR, numSamples);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to process stereo: ") + e.what());
        }
        return false;
    }
}

// === Utilitaires ===
bool FilterManager::resetFilter(int64_t filterId) {
    if (!validateFilterId(filterId)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(filtersMutex_);

    auto it = filters_.find(filterId);
    if (it == filters_.end()) {
        return false;
    }

    try {
        auto* filter = it->second.get();
        filter->reset();
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to reset filter: ") + e.what());
        }
        return false;
    }
}

bool FilterManager::getFilterInfo(int64_t filterId, double& a0, double& a1, double& a2, double& b1, double& b2) const {
    if (!validateFilterId(filterId)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(filtersMutex_);

    auto it = filters_.find(filterId);
    if (it == filters_.end()) {
        return false;
    }

    // Note: BiquadFilter ne fournit pas d'accès direct aux coefficients
    // Nous retournons des valeurs par défaut
    a0 = 1.0;
    a1 = 0.0;
    a2 = 0.0;
    b1 = 0.0;
    b2 = 0.0;

    return true;
}

// === Statistiques ===
size_t FilterManager::getFilterCount() const {
    std::lock_guard<std::mutex> lock(filtersMutex_);
    return filters_.size();
}

std::vector<int64_t> FilterManager::getAllFilterIds() const {
    std::lock_guard<std::mutex> lock(filtersMutex_);

    std::vector<int64_t> ids;
    ids.reserve(filters_.size());

    for (const auto& pair : filters_) {
        ids.push_back(pair.first);
    }

    return ids;
}

// === Méthodes privées ===
Nyth::Audio::FX::BiquadFilter* FilterManager::getFilter(int64_t filterId) const {
    auto it = filters_.find(filterId);
    if (it != filters_.end()) {
        return it->second.get();
    }
    return nullptr;
}

bool FilterManager::validateFilterId(int64_t filterId) const {
    return filterId > 0;
}

bool FilterManager::validateParameters(double frequency, double q, double gainDB) const {
    // Validation basique des paramètres
    return frequency > 0.0 && frequency < sampleRate_ / 2.0 && q > 0.0 && q <= 10.0 && gainDB >= -60.0 &&
           gainDB <= 30.0;
}

} // namespace react
} // namespace facebook
