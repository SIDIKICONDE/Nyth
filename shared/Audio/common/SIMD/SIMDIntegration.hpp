#pragma once

#ifdef __cplusplus
#include "SIMDCore.hpp"
#include "SIMDMathFunctions.hpp"
#include <memory>
#include <vector>

// Intégration avec MathUtils.hpp existant
namespace AudioNR {

// Forward declarations pour éviter les dépendances circulaires
namespace MathUtils {

// Classe d'intégration SIMD pour MathUtils
class SIMDIntegration {
public:
    static bool isSIMDMathAvailable();
    static std::string getSIMDMathInfo();

    // Méthodes d'intégration pour les fonctions existantes
    static void enableSIMDAcceleration(bool enable);
    static bool isSIMDAccelerationEnabled();

    // Wrapper pour les fonctions expint avec SIMD
    static float expint_with_simd(float x);
    static void expint_vectorized(const float* x, float* result, size_t count);

    // Benchmarking intégré
    static void runMathUtilsSIMDBenchmark(size_t count = 1000000);

private:
    static bool simdEnabled_;
    static bool initialized_;
};

// Extension SIMD pour les fonctions de MathUtils
class MathUtilsSIMDExtension {
public:
    // Version SIMD des fonctions statistiques
    static float calculateMeanSIMD(const float* data, size_t count);
    static float calculateRMSSIMD(const float* data, size_t count);
    static float calculatePeakSIMD(const float* data, size_t count);
    static void normalizeAudioSIMD(float* data, size_t count, float targetRMS = 1.0f);

    // Version SIMD des conversions
    static void convertFloatToInt16SIMD(const float* input, int16_t* output, size_t count);
    static void convertInt16ToFloatSIMD(const int16_t* input, float* output, size_t count);

    // Version SIMD des opérations de base
    static void applyGainSIMD(float* data, size_t count, float gain);
    static void mixAudioSIMD(const float* input1, const float* input2, float* output,
                            size_t count, float gain1, float gain2);
};

// Classe utilitaire pour la migration progressive
class SIMDHelper {
public:
    // Fonctions de compatibilité pour faciliter la migration
    static void replaceScalarWithSIMD(float* data, size_t count,
                                     std::function<void(float*, size_t)> scalarFunc,
                                     std::function<void(float*, size_t)> simdFunc);

    // Benchmark comparatif
    static void compareScalarSIMD(std::function<void(float*, size_t)> scalarFunc,
                                 std::function<void(float*, size_t)> simdFunc,
                                 const std::string& functionName,
                                 size_t count = 100000);

    // Recommandations d'optimisation
    static void suggestOptimizations(const std::string& functionName, size_t count);
};

} // namespace MathUtils

// Intégration avec les fonctionnalités audio de base
namespace Audio {
namespace SIMD {

// Wrapper pour faciliter l'utilisation depuis les composants audio
class AudioSIMDWrapper {
public:
    // Interface unifiée pour les opérations audio courantes
    static void processAudioBuffer(float* buffer, size_t count,
                                  float gain = 1.0f, float pan = 0.0f);

    static void applyAudioEffect(float* buffer, size_t count,
                               const std::string& effectType,
                               float intensity = 0.5f);

    static void mixAudioBuffers(const float* input1, const float* input2,
                               float* output, size_t count,
                               float gain1 = 1.0f, float gain2 = 1.0f);

    // Fonctions d'analyse audio SIMD
    static float analyzeRMS(const float* buffer, size_t count);
    static float analyzePeak(const float* buffer, size_t count);
    static float analyzeMean(const float* buffer, size_t count);

    // Conversion de format optimisée
    static void convertFormat(const void* input, void* output,
                            size_t count, const std::string& fromFormat,
                            const std::string& toFormat);
};

// Gestionnaire d'effets audio SIMD
class SIMDAudioEffectManager {
public:
    enum EffectType {
        LOWPASS_FILTER,
        HIGHPASS_FILTER,
        BANDPASS_FILTER,
        REVERB,
        DELAY,
        DISTORTION,
        CHORUS,
        FLANGER
    };

    void addEffect(EffectType type, float parameter = 0.5f);
    void removeEffect(size_t index);
    void processAudio(float* buffer, size_t count, float sampleRate = 44100.0f);

    size_t getEffectCount() const;
    std::string getEffectInfo(size_t index) const;

private:
    std::vector<std::unique_ptr<AudioNR::SIMD::SIMDProcessorFloat>> effects_;
};

} // namespace SIMD
} // namespace Audio

} // namespace AudioNR

#endif // __cplusplus
