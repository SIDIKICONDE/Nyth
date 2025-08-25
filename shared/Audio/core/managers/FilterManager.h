#pragma once

#include "../../common/config/AudioConfig.h"
#include "../../common/dsp/BiquadFilter.hpp"
#include "../../common/jsi/JSICallbackManager.h"
#include <atomic>
#include <functional>
#include <memory>
#include <mutex>
#include <unordered_map>

namespace facebook {
namespace react {

class FilterManager {
public:
    explicit FilterManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~FilterManager();

    // === Gestion du cycle de vie ===
    bool initialize(const Nyth::Audio::AudioConfig& config);
    int64_t createFilter();
    bool destroyFilter(int64_t filterId);
    bool filterExists(int64_t filterId) const;

    // === Configuration des filtres ===
    bool setFilterConfig(int64_t filterId, double frequency, double q, double gainDB, int filterType);
    bool getFilterConfig(int64_t filterId, double& frequency, double& q, double& gainDB, int& filterType) const;

    // === Types de filtres spécifiques ===
    bool setLowpass(int64_t filterId, double frequency, double q);
    bool setHighpass(int64_t filterId, double frequency, double q);
    bool setBandpass(int64_t filterId, double frequency, double q);
    bool setNotch(int64_t filterId, double frequency, double q);
    bool setPeaking(int64_t filterId, double frequency, double q, double gainDB);
    bool setLowShelf(int64_t filterId, double frequency, double q, double gainDB);
    bool setHighShelf(int64_t filterId, double frequency, double q, double gainDB);
    bool setAllpass(int64_t filterId, double frequency, double q);

    // === Processing ===
    bool processMono(int64_t filterId, const float* input, float* output, size_t numSamples);
    bool processStereo(int64_t filterId, const float* inputL, const float* inputR, float* outputL, float* outputR,
                       size_t numSamples);

    // === Utilitaires ===
    bool resetFilter(int64_t filterId);
    bool getFilterInfo(int64_t filterId, double& a0, double& a1, double& a2, double& b1, double& b2) const;

    // === Statistiques ===
    size_t getFilterCount() const;
    std::vector<int64_t> getAllFilterIds() const;

private:
    // === Membres privés ===
    std::unordered_map<int64_t, std::unique_ptr<Nyth::Audio::FX::BiquadFilter>> filters_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    mutable std::mutex filtersMutex_;
    std::atomic<int64_t> nextFilterId_{1};

    // === Configuration ===
    uint32_t sampleRate_ = 44100;

    // === Méthodes helpers ===
    Nyth::Audio::FX::BiquadFilter* getFilter(int64_t filterId) const;
    bool validateFilterId(int64_t filterId) const;
    bool validateParameters(double frequency, double q, double gainDB = 0.0) const;
};

} // namespace react
} // namespace facebook
