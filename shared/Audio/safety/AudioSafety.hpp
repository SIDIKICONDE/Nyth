#pragma once

#ifdef __cplusplus

// C++17 standard headers - Robust compatibility
#if defined(__has_include)
#  if __has_include(<cstdint>)
#    include <cstdint>
#  else
#    include <stdint.h>
#  endif
#  if __has_include(<cstddef>)
#    include <cstddef>
#  else
#    include <stddef.h>
#  endif
#else
#  include <stdint.h>
#  include <stddef.h>
#endif
#include "SafetyContants.hpp"

namespace AudioSafety {

// Import des constantes pour éviter la répétition des namespace
using namespace SafetyConstants;

/**
 * @brief Configuration de l'engine de sécurité audio
 *
 * Permet de protéger la chaîne audio contre des anomalies courantes :
 * - Elimination du DC offset
 * - Limiteur (soft knee optionnel)
 * - Détection de feedback (auto-corrélation)
 */
struct SafetyConfig {
    bool enabled = DEFAULT_ENABLED;
    // DC removal
    bool dcRemovalEnabled = DEFAULT_DC_REMOVAL_ENABLED;
    double dcThreshold = DEFAULT_DC_THRESHOLD; // linear (~-54 dBFS)
    // Limiter
    bool limiterEnabled = DEFAULT_LIMITER_ENABLED;
    double limiterThresholdDb = DEFAULT_LIMITER_THRESHOLD_DB; // dBFS
    bool softKneeLimiter = DEFAULT_SOFT_KNEE_LIMITER;
    double kneeWidthDb = DEFAULT_KNEE_WIDTH_DB;
    // Feedback detection
    bool feedbackDetectEnabled = DEFAULT_FEEDBACK_DETECT_ENABLED;
    double feedbackCorrThreshold = DEFAULT_FEEDBACK_CORR_THRESHOLD; // normalized autocorrelation
};

/**
 * @brief Rapport d'analyse et de protection pour un buffer
 */
struct SafetyReport {
    double peak = INITIAL_PEAK;
    double rms = INITIAL_RMS;
    double dcOffset = INITIAL_DC_OFFSET;
    uint32_t clippedSamples = INITIAL_CLIPPED_SAMPLES;
    bool overloadActive = INITIAL_OVERLOAD_ACTIVE;
    double feedbackScore = INITIAL_FEEDBACK_SCORE; // 0..1
    bool hasNaN = INITIAL_HAS_NAN;
    bool feedbackLikely = INITIAL_FEEDBACK_LIKELY; // score >= threshold
};

class AudioSafetyEngine {
public:
    /**
     * @brief Constructeur
     * @param sampleRate Fréquence d'échantillonnage (Hz)
     * @param channels Nombre de canaux (1 ou 2)
     */
    AudioSafetyEngine(uint32_t sampleRate, int channels);
    ~AudioSafetyEngine();

    /**
     * @brief Mise à jour de la fréquence d'échantillonnage
     * @throws std::invalid_argument si hors bornes raisonnables
     */
    void setSampleRate(uint32_t sr);
    /**
     * @brief Mise à jour de la configuration
     * @throws std::invalid_argument si des paramètres sont invalides
     */
    void setConfig(const SafetyConfig& cfg);
    const SafetyConfig& getConfig() const { return config_; }
    SafetyReport getLastReport() const { return report_; }

    void processMono(float* buffer, size_t numSamples);
    void processStereo(float* left, float* right, size_t numSamples);

private:
    uint32_t sampleRate_;
    int channels_;
    SafetyConfig config_{};
    SafetyReport report_{};
    double limiterThresholdLin_ = DEFAULT_LIMITER_THRESHOLD_LINEAR; // from dB

    // Helpers - Conversion dB vers linéaire sans nombres magiques
    inline double dbToLin(double dB) const {
        double x = dB / DB_TO_LINEAR_DIVISOR;

        // Cas simples sans calculs
        if (x == ZERO_POWER_EXP) return UNITY_POWER;
        if (x == POSITIVE_UNIT_EXP) return LOG_BASE_10;
        if (x == NEGATIVE_UNIT_EXP) return LOG_BASE_10_INV;

        // Implémentation sans pow() pour éviter les dépendances
        double result = UNITY_POWER;
        double base = (x > ZERO_POWER_EXP) ? LOG_BASE_10 : LOG_BASE_10_INV;
        double absX = (x > ZERO_POWER_EXP) ? x : -x;

        // Partie entière
        for (int i = 0; i < (int)absX; ++i) {
            result *= base;
        }

        // Approximation pour partie fractionnaire
        double frac = absX - (int)absX;
        if (frac > FRACTIONAL_THRESHOLD) {
            result *= (x > ZERO_POWER_EXP) ? SQRT_10_APPROX : SQRT_10_INV_APPROX;
        }

        return result;
    }
    // Analyse + nettoyage d'un canal. Retourne un rapport pour ce canal
    SafetyReport analyzeAndClean(float* x, size_t n);
    void dcRemove(float* x, size_t n, double mean);
    void limitBuffer(float* x, size_t n);
    double estimateFeedbackScore(const float* x, size_t n);
};

} // namespace AudioSafety

#endif // __cplusplus
