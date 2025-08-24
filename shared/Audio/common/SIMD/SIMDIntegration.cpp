#include "SIMDIntegration.hpp"
#include <iostream>
#include <iomanip>
#include <algorithm>

namespace AudioNR {
namespace MathUtils {

// Variables statiques
bool SIMDIntegration::simdEnabled_ = true;
bool SIMDIntegration::initialized_ = false;

// Implémentation SIMDIntegration
bool SIMDIntegration::isSIMDMathAvailable() {
    return AudioNR::SIMD::SIMDDetector::hasSIMD();
}

std::string SIMDIntegration::getSIMDMathInfo() {
    std::string info = "SIMD Math Integration Status:\n";
    info += "  SIMD Available: " + std::string(isSIMDMathAvailable() ? "Yes" : "No") + "\n";
    info += "  SIMD Type: " + AudioNR::SIMD::SIMDDetector::getBestSIMDType() + "\n";
    info += "  SIMD Enabled: " + std::string(simdEnabled_ ? "Yes" : "No") + "\n";
    info += "  Vector Size: " + std::to_string(AudioNR::SIMD::SIMDDetector::getVectorSize()) + "\n";
    return info;
}

void SIMDIntegration::enableSIMDAcceleration(bool enable) {
    simdEnabled_ = enable && isSIMDMathAvailable();
    initialized_ = true;
}

bool SIMDIntegration::isSIMDAccelerationEnabled() {
    return initialized_ && simdEnabled_ && isSIMDMathAvailable();
}

float SIMDIntegration::expint_with_simd(float x) {
    if (isSIMDAccelerationEnabled()) {
        // Utilise la version SIMD optimisée
        return AudioNR::SIMD::SIMDMathFunctions::expint_e1_scalar(x);
    } else {
        // Fallback vers l'implémentation originale
        // Ici on pourrait appeler la fonction originale de MathUtils
        return AudioNR::SIMD::SIMDMathFunctions::expint_e1_scalar(x);
    }
}

void SIMDIntegration::expint_vectorized(const float* x, float* result, size_t count) {
    if (isSIMDAccelerationEnabled()) {
        AudioNR::SIMD::SIMDMathFunctions::expint_e1_vectorized(x, result, count);
    } else {
        // Version scalaire de fallback
        for (size_t i = 0; i < count; ++i) {
            result[i] = AudioNR::SIMD::SIMDMathFunctions::expint_e1_scalar(x[i]);
        }
    }
}

void SIMDIntegration::runMathUtilsSIMDBenchmark(size_t count) {
    std::cout << "=== MathUtils SIMD Benchmark ===" << std::endl;
    std::cout << getSIMDMathInfo() << std::endl;

    if (!isSIMDAccelerationEnabled()) {
        std::cout << "SIMD acceleration is disabled or not available." << std::endl;
        return;
    }

    // Préparation des données de test
    std::vector<float> testData(count);
    for (size_t i = 0; i < count; ++i) {
        testData[i] = 0.1f + static_cast<float>(rand()) / RAND_MAX * 10.0f;
    }

    // Benchmark expint_vectorized
    auto start = std::chrono::high_resolution_clock::now();

    for (int iter = 0; iter < 10; ++iter) {
        std::vector<float> result(count);
        expint_vectorized(testData.data(), result.data(), count);
    }

    auto end = std::chrono::high_resolution_clock::now();
    double timeMs = std::chrono::duration<double, std::milli>(end - start).count();

    double throughput = count * 10 / (timeMs / 1000.0);
    std::cout << "expint_vectorized (" << count << " samples, 10 iterations):" << std::endl;
    std::cout << "  Time: " << std::fixed << std::setprecision(2) << timeMs << " ms" << std::endl;
    std::cout << "  Throughput: " << (throughput / 1000000.0) << " M samples/sec" << std::endl;
}

// Implémentation MathUtilsSIMDExtension
float MathUtilsSIMDExtension::calculateMeanSIMD(const float* data, size_t count) {
    return AudioNR::SIMD::SIMDMathFunctions::mean(data, count);
}

float MathUtilsSIMDExtension::calculateRMSSIMD(const float* data, size_t count) {
    return AudioNR::SIMD::SIMDMath::rms(data, count);
}

float MathUtilsSIMDExtension::calculatePeakSIMD(const float* data, size_t count) {
    return AudioNR::SIMD::SIMDMath::max(data, count);
}

void MathUtilsSIMDExtension::normalizeAudioSIMD(float* data, size_t count, float targetRMS) {
    AudioNR::SIMD::SIMDMathFunctions::normalize(data, count, targetRMS);
}

void MathUtilsSIMDExtension::convertFloatToInt16SIMD(const float* input, int16_t* output, size_t count) {
    AudioNR::SIMD::SIMDUtils::convertFloat32ToInt16(input, output, count);
}

void MathUtilsSIMDExtension::convertInt16ToFloatSIMD(const int16_t* input, float* output, size_t count) {
    AudioNR::SIMD::SIMDUtils::convertInt16ToFloat32(input, output, count);
}

void MathUtilsSIMDExtension::applyGainSIMD(float* data, size_t count, float gain) {
    AudioNR::SIMD::SIMDUtils::applyGain(data, count, gain);
}

void MathUtilsSIMDExtension::mixAudioSIMD(const float* input1, const float* input2, float* output,
                                        size_t count, float gain1, float gain2) {
    AudioNR::SIMD::SIMDUtils::mixFloat32(input1, input2, output, count, gain1, gain2);
}

// Implémentation SIMDHelper
void SIMDHelper::replaceScalarWithSIMD(float* data, size_t count,
                                     std::function<void(float*, size_t)> scalarFunc,
                                     std::function<void(float*, size_t)> simdFunc) {
    if (AudioNR::SIMD::SIMDDetector::hasSIMD()) {
        // Utilise la version SIMD si disponible
        std::cout << "Using SIMD-accelerated version" << std::endl;
        simdFunc(data, count);
    } else {
        // Fallback vers la version scalaire
        std::cout << "Using scalar version (SIMD not available)" << std::endl;
        scalarFunc(data, count);
    }
}

void SIMDHelper::compareScalarSIMD(std::function<void(float*, size_t)> scalarFunc,
                                 std::function<void(float*, size_t)> simdFunc,
                                 const std::string& functionName,
                                 size_t count) {
    std::cout << "=== Performance Comparison: " << functionName << " ===" << std::endl;

    // Préparation des données
    std::vector<float> scalarData(count), simdData(count);
    for (size_t i = 0; i < count; ++i) {
        scalarData[i] = simdData[i] = static_cast<float>(rand()) / RAND_MAX;
    }

    // Benchmark version scalaire
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        scalarFunc(scalarData.data(), count);
    }
    auto end = std::chrono::high_resolution_clock::now();
    double scalarTime = std::chrono::duration<double, std::milli>(end - start).count();

    // Benchmark version SIMD
    start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        simdFunc(simdData.data(), count);
    }
    end = std::chrono::high_resolution_clock::now();
    double simdTime = std::chrono::duration<double, std::milli>(end - start).count();

    double speedup = scalarTime / simdTime;

    std::cout << "Scalar version: " << scalarTime << " ms" << std::endl;
    std::cout << "SIMD version: " << simdTime << " ms" << std::endl;
    std::cout << "Speedup: " << speedup << "x" << std::endl;
    std::cout << "SIMD available: " << (AudioNR::SIMD::SIMDDetector::hasSIMD() ? "Yes" : "No") << std::endl;
}

void SIMDHelper::suggestOptimizations(const std::string& functionName, size_t count) {
    std::cout << "=== Optimization Suggestions for " << functionName << " ===" << std::endl;

    if (count < 1000) {
        std::cout << "Small data size (" << count << " elements)" << std::endl;
        std::cout << "Suggestion: Keep using scalar version for small datasets" << std::endl;
    } else if (count < 10000) {
        std::cout << "Medium data size (" << count << " elements)" << std::endl;
        std::cout << "Suggestion: SIMD benefits may be limited, test both versions" << std::endl;
    } else {
        std::cout << "Large data size (" << count << " elements)" << std::endl;
        std::cout << "Suggestion: Use SIMD version for optimal performance" << std::endl;
    }

    if (AudioNR::SIMD::SIMDDetector::hasAVX2()) {
        std::cout << "Hardware: AVX2 detected - full SIMD acceleration available" << std::endl;
    } else if (AudioNR::SIMD::SIMDDetector::hasSSE2()) {
        std::cout << "Hardware: SSE2 detected - good SIMD acceleration available" << std::endl;
    } else {
        std::cout << "Hardware: No SIMD detected - consider scalar optimizations" << std::endl;
    }
}

} // namespace MathUtils

// Implémentation AudioSIMDWrapper
namespace Audio {
namespace SIMD {

void AudioSIMDWrapper::processAudioBuffer(float* buffer, size_t count,
                                        float gain, float pan) {
    // Application du gain
    if (gain != 1.0f) {
        AudioNR::SIMD::SIMDUtils::applyGain(buffer, count, gain);
    }

    // Application du panoramique simple
    if (pan != 0.0f) {
        // Version simplifiée du panoramique
        float leftGain = 1.0f - std::max(0.0f, pan);
        float rightGain = 1.0f - std::max(0.0f, -pan);

        // Pour un buffer stéréo simulé (alternance gauche/droite)
        for (size_t i = 0; i < count; i += 2) {
            if (i < count) buffer[i] *= leftGain;
            if (i + 1 < count) buffer[i + 1] *= rightGain;
        }
    }
}

void AudioSIMDWrapper::applyAudioEffect(float* buffer, size_t count,
                                      const std::string& effectType,
                                      float intensity) {
    if (effectType == "distortion") {
        AudioNR::SIMD::SIMDMathFunctions::apply_tanh_distortion(buffer, count, intensity);
    } else if (effectType == "lowpass") {
        AudioNR::SIMD::SIMDMathFunctions::apply_lowpass_filter(buffer, count,
            1000.0f + intensity * 15000.0f, 44100.0f);
    } else if (effectType == "highpass") {
        AudioNR::SIMD::SIMDMathFunctions::apply_highpass_filter(buffer, count,
            100.0f + intensity * 1000.0f, 44100.0f);
    } else {
        std::cout << "Unknown effect type: " << effectType << std::endl;
    }
}

void AudioSIMDWrapper::mixAudioBuffers(const float* input1, const float* input2,
                                     float* output, size_t count,
                                     float gain1, float gain2) {
    AudioNR::SIMD::SIMDUtils::mixFloat32(input1, input2, output, count, gain1, gain2);
}

float AudioSIMDWrapper::analyzeRMS(const float* buffer, size_t count) {
    return AudioNR::SIMD::SIMDMath::rms(buffer, count);
}

float AudioSIMDWrapper::analyzePeak(const float* buffer, size_t count) {
    return AudioNR::SIMD::SIMDMath::max(buffer, count);
}

float AudioSIMDWrapper::analyzeMean(const float* buffer, size_t count) {
    return AudioNR::SIMD::SIMDMathFunctions::mean(buffer, count);
}

void AudioSIMDWrapper::convertFormat(const void* input, void* output,
                                   size_t count, const std::string& fromFormat,
                                   const std::string& toFormat) {
    if (fromFormat == "float32" && toFormat == "int16") {
        AudioNR::SIMD::SIMDUtils::convertFloat32ToInt16(
            static_cast<const float*>(input),
            static_cast<int16_t*>(output), count);
    } else if (fromFormat == "int16" && toFormat == "float32") {
        AudioNR::SIMD::SIMDUtils::convertInt16ToFloat32(
            static_cast<const int16_t*>(input),
            static_cast<float*>(output), count);
    } else {
        std::cout << "Unsupported format conversion: " << fromFormat << " -> " << toFormat << std::endl;
    }
}

// Implémentation SIMDAudioEffectManager
void SIMDAudioEffectManager::addEffect(EffectType type, float parameter) {
    std::unique_ptr<AudioNR::SIMD::SIMDProcessor> effect;

    switch (type) {
        case LOWPASS_FILTER:
            effect = std::make_unique<AudioNR::SIMD::SIMDFilter>(
                AudioNR::SIMD::SIMDFilter::LOWPASS, 2000.0f + parameter * 18000.0f, 0.707f);
            break;
        case HIGHPASS_FILTER:
            effect = std::make_unique<AudioNR::SIMD::SIMDFilter>(
                AudioNR::SIMD::SIMDFilter::HIGHPASS, 200.0f + parameter * 1800.0f, 0.707f);
            break;
        case DISTORTION:
            effect = std::make_unique<AudioNR::SIMD::SIMDDistortion>(
                AudioNR::SIMD::SIMDDistortion::TANH, 1.0f + parameter * 3.0f, 0.5f);
            break;
        case REVERB:
            effect = std::make_unique<AudioNR::SIMD::SIMDReverb>(
                0.2f + parameter * 0.6f, 0.3f, 0.8f);
            break;
        case DELAY:
            effect = std::make_unique<AudioNR::SIMD::SIMDDelay>(
                200.0f + parameter * 800.0f, 0.3f, 0.4f);
            break;
        default:
            std::cout << "Effect type not implemented yet" << std::endl;
            return;
    }

    effects_.push_back(std::move(effect));
}

void SIMDAudioEffectManager::removeEffect(size_t index) {
    if (index < effects_.size()) {
        effects_.erase(effects_.begin() + index);
    }
}

void SIMDAudioEffectManager::processAudio(float* buffer, size_t count, float sampleRate) {
    for (auto& effect : effects_) {
        if (effect && effect->isEnabled()) {
            effect->setSampleRate(sampleRate);
            effect->process(buffer, count);
        }
    }
}

size_t SIMDAudioEffectManager::getEffectCount() const {
    return effects_.size();
}

std::string SIMDAudioEffectManager::getEffectInfo(size_t index) const {
    if (index >= effects_.size()) return "Invalid index";

    return effects_[index]->getName() +
           " (SIMD: " + (effects_[index]->isSIMDAccelerated() ? "Yes" : "No") + ")";
}

} // namespace SIMD
} // namespace Audio

} // namespace AudioNR
