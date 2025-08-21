#pragma once

#ifdef __cplusplus
#if __has_include(<cstddef>)
#include <cstddef>
#else
#include <stddef.h>
#endif
#if __has_include(<cstdint>)
#include <cstdint>
#else
#include <stdint.h>
#endif
#include <vector>
#include <memory>

#include "SpectralNR.hpp"
#include "NoiseReducer.hpp"

namespace AudioNR {

/**
 * @brief Suppresseur de bruit C++20 pur (pipeline NoiseReducer + SpectralNR)
 *
 * Implémentation sans dépendances C. Compose un expander temporel (NoiseReducer)
 * et une réduction spectrale (SpectralNR) pour un résultat robuste et portable.
 */
class RNNoiseSuppressor {
public:
    RNNoiseSuppressor();
    ~RNNoiseSuppressor();

    /**
     * @brief Initialiser le moteur C++ (pas de dépendance C)
     * @param sampleRate Fréquence d'échantillonnage
     * @param numChannels 1 (mono) ou 2 (stéréo)
     * @return true si initialisé
     */
    bool initialize(uint32_t sampleRate, int numChannels);

    /**
     * @brief Indique si le suppresseur est prêt
     * @return true si initialisé
     */
    bool isAvailable() const;

    /**
     * @brief Régler l'agressivité (0.0 doux → 3.0 agressif)
     */
    void setAggressiveness(double aggressiveness);

    /**
     * @brief Traiter un flux mono
     */
    void processMono(const float* input, float* output, size_t numSamples);
    
    /**
     * @brief Traiter un flux stéréo
     * @note Downmix vers mono pour la réduction spectrale puis upmix
     */
    void processStereo(const float* inL, const float* inR,
                       float* outL, float* outR,
                       size_t numSamples);

private:
    bool available_{false};
    uint32_t sampleRate_{48000};
    int channels_{1};
    double aggressiveness_{1.0};

    // Modules C++20
    std::unique_ptr<NoiseReducer> gate_;
    std::unique_ptr<SpectralNR> spectral_;

    // Configs courantes
    NoiseReducerConfig gateCfg_{};
    SpectralNRConfig spectralCfg_{};

    // Tampons temporaires pour éviter des allocations répétées
    std::vector<float> scratchL_;
    std::vector<float> scratchR_;
    std::vector<float> scratchMono_;
    std::vector<float> scratchOut_;

    void applyAggressivenessToConfigs();
};

} // namespace AudioNR
#endif // __cplusplus


