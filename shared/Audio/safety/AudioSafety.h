#pragma once

#ifdef __cplusplus

#include <sys/types.h>
#include <sys/time.h>
#include <cstddef>
#include <cstdint>
#include <cmath>

namespace AudioSafety {

/**
 * @brief Configuration de l'engine de sécurité audio
 *
 * Permet de protéger la chaîne audio contre des anomalies courantes :
 * - Elimination du DC offset
 * - Limiteur (soft knee optionnel)
 * - Détection de feedback (auto-corrélation)
 */
struct SafetyConfig {
    bool enabled = true;
    // DC removal
    bool dcRemovalEnabled = true;
    double dcThreshold = 0.002; // linear (~-54 dBFS)
    // Limiter
    bool limiterEnabled = true;
    double limiterThresholdDb = -1.0; // dBFS
    bool softKneeLimiter = true;
    double kneeWidthDb = 6.0;
    // Feedback detection
    bool feedbackDetectEnabled = true;
    double feedbackCorrThreshold = 0.95; // normalized autocorrelation
};

/**
 * @brief Rapport d'analyse et de protection pour un buffer
 */
struct SafetyReport {
    double peak = 0.0;
    double rms = 0.0;
    double dcOffset = 0.0;
    uint32_t clippedSamples = 0;
    bool overloadActive = false;
    double feedbackScore = 0.0; // 0..1
    bool hasNaN = false;
    bool feedbackLikely = false; // score >= threshold
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
    double limiterThresholdLin_ = 0.89; // from dB

    // Helpers
    inline double dbToLin(double dB) const { return std::pow(10.0, dB / 20.0); }
    // Analyse + nettoyage d'un canal. Retourne un rapport pour ce canal
    SafetyReport analyzeAndClean(float* x, size_t n);
    void dcRemove(float* x, size_t n, double mean);
    void limitBuffer(float* x, size_t n);
    double estimateFeedbackScore(const float* x, size_t n);
};

} // namespace AudioSafety

#endif // __cplusplus


