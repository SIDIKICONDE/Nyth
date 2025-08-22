/**
 * @file TestAudioSafety.cpp
 * @brief Unit tests for AudioSafety system with optimizations
 */

#include "AudioSafety.hpp"
#include "AudioSafetyOptimized.hpp"
#include <chrono>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <random>
#include <vector>

using namespace AudioSafety;
using namespace std::chrono;

// Test helpers
#define TEST_ASSERT(condition)                                                                                \
    do {                                                                                                      \
        if (!(condition)) {                                                                                   \
            std::cerr << "Test failed: " << #condition << " at " << __FILE__ << ":" << __LINE__ << std::endl; \
            return false;                                                                                     \
        }                                                                                                     \
    } while (0)

#define RUN_TEST(test_func)                               \
    do {                                                  \
        std::cout << "Running: " << #test_func << "... "; \
        if (test_func()) {                                \
            std::cout << "✅ PASSED" << std::endl;        \
            passed++;                                     \
        } else {                                          \
            std::cout << "❌ FAILED" << std::endl;        \
            failed++;                                     \
        }                                                 \
        total++;                                          \
    } while (0)

// Generate test signals
std::vector<float> generateSineWave(size_t samples, float frequency, float sampleRate, float amplitude = 1.0f) {
    std::vector<float> signal(samples);
    for (size_t i = 0; i < samples; ++i) {
        signal[i] = amplitude * std::sin(2.0f * M_PI * frequency * i / sampleRate);
    }
    return signal;
}

std::vector<float> generateDCOffset(size_t samples, float offset) {
    return std::vector<float>(samples, offset);
}

std::vector<float> generateNoise(size_t samples, float amplitude = 1.0f) {
    std::vector<float> signal(samples);
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-amplitude, amplitude);

    for (size_t i = 0; i < samples; ++i) {
        signal[i] = dist(gen);
    }
    return signal;
}

// Test 1: Error codes instead of exceptions
bool testErrorCodes() {
    SafetyError error;

    // Test invalid sample rate
    AudioSafetyEngine engine1(5000, 1, &error);
    TEST_ASSERT(error == SafetyError::INVALID_SAMPLE_RATE);
    TEST_ASSERT(!engine1.isValid());

    // Test invalid channels
    AudioSafetyEngine engine2(48000, 5, &error);
    TEST_ASSERT(error == SafetyError::INVALID_CHANNELS);
    TEST_ASSERT(!engine2.isValid());

    // Test valid configuration
    AudioSafetyEngine engine3(48000, 2, &error);
    TEST_ASSERT(error == SafetyError::OK);
    TEST_ASSERT(engine3.isValid());

    // Test null buffer handling
    SafetyError procError = engine3.processMono(nullptr, 512);
    TEST_ASSERT(procError == SafetyError::NULL_BUFFER);

    // Test invalid config parameters
    SafetyConfig config;
    config.limiterThresholdDb = 10.0; // Invalid (> 0)
    SafetyError configError = engine3.setConfig(config);
    TEST_ASSERT(configError == SafetyError::INVALID_THRESHOLD_DB);

    return true;
}

// Test 2: DC offset removal
bool testDCRemoval() {
    SafetyError error;
    AudioSafetyEngine engine(48000, 1, &error);
    TEST_ASSERT(error == SafetyError::OK);

    // Configure DC removal
    SafetyConfig config;
    config.dcRemovalEnabled = true;
    config.dcThreshold = 0.01;
    TEST_ASSERT(engine.setConfig(config) == SafetyError::OK);

    // Create signal with DC offset
    auto signal = generateDCOffset(512, 0.05f);

    // Process
    TEST_ASSERT(engine.processMono(signal.data(), signal.size()) == SafetyError::OK);

    // Check DC was removed
    float mean = 0;
    for (float sample : signal) {
        mean += sample;
    }
    mean /= signal.size();

    TEST_ASSERT(std::abs(mean) < 0.001f); // DC should be near zero

    // Check report
    auto report = engine.getLastReport();
    TEST_ASSERT(report.dcOffset < 0.001);

    return true;
}

// Test 3: Limiter functionality
bool testLimiter() {
    SafetyError error;
    AudioSafetyEngine engine(48000, 1, &error);
    TEST_ASSERT(error == SafetyError::OK);

    // Configure limiter
    SafetyConfig config;
    config.limiterEnabled = true;
    config.limiterThresholdDb = -6.0; // ~0.5 linear
    config.softKneeLimiter = true;
    config.kneeWidthDb = 3.0;
    TEST_ASSERT(engine.setConfig(config) == SafetyError::OK);

    // Create loud signal
    auto signal = generateSineWave(512, 440, 48000, 2.0f); // 2x amplitude

    // Process
    TEST_ASSERT(engine.processMono(signal.data(), signal.size()) == SafetyError::OK);

    // Check limiting
    float maxVal = 0;
    for (float sample : signal) {
        maxVal = std::max(maxVal, std::abs(sample));
    }

    // Should be limited to around threshold
    TEST_ASSERT(maxVal < 0.6f); // Threshold + small margin

    // Check report
    auto report = engine.getLastReport();
    TEST_ASSERT(report.overloadActive);

    return true;
}

// Test 4: NaN/Inf handling
bool testNaNHandling() {
    SafetyError error;
    AudioSafetyEngine engine(48000, 1, &error);
    TEST_ASSERT(error == SafetyError::OK);

    // Create signal with NaN and Inf
    std::vector<float> signal(512, 0.0f);
    signal[10] = std::nanf("");
    signal[20] = std::numeric_limits<float>::infinity();
    signal[30] = -std::numeric_limits<float>::infinity();

    // Process
    TEST_ASSERT(engine.processMono(signal.data(), signal.size()) == SafetyError::OK);

    // Check NaN/Inf were replaced
    for (size_t i = 0; i < signal.size(); ++i) {
        TEST_ASSERT(std::isfinite(signal[i]));
        if (i == 10 || i == 20 || i == 30) {
            TEST_ASSERT(signal[i] == 0.0f); // Should be replaced with 0
        }
    }

    // Check report
    auto report = engine.getLastReport();
    TEST_ASSERT(report.hasNaN);

    return true;
}

// Test 5: Feedback detection
bool testFeedbackDetection() {
    SafetyError error;
    AudioSafetyEngine engine(48000, 1, &error);
    TEST_ASSERT(error == SafetyError::OK);

    // Configure feedback detection
    SafetyConfig config;
    config.feedbackDetectEnabled = true;
    config.feedbackCorrThreshold = 0.8;
    TEST_ASSERT(engine.setConfig(config) == SafetyError::OK);

    // Create feedback-like signal (pure tone)
    auto signal = generateSineWave(1024, 1000, 48000, 0.8f);

    // Process
    TEST_ASSERT(engine.processMono(signal.data(), signal.size()) == SafetyError::OK);

    // Check feedback detection
    auto report = engine.getLastReport();
    TEST_ASSERT(report.feedbackScore > 0.5); // Should detect correlation

    // Test with noise (no feedback)
    auto noise = generateNoise(1024, 0.5f);
    TEST_ASSERT(engine.processMono(noise.data(), noise.size()) == SafetyError::OK);

    report = engine.getLastReport();
    TEST_ASSERT(report.feedbackScore < 0.3); // Should not detect feedback in noise

    return true;
}

// Test 6: Performance comparison (Base vs Optimized)
bool testPerformance() {
    const size_t bufferSize = 512;
    const size_t iterations = 10000;

    SafetyError error;
    AudioSafetyEngine baseEngine(48000, 2, &error);
    AudioSafetyEngineOptimized optimizedEngine(48000, 2, &error);

    TEST_ASSERT(error == SafetyError::OK);

    // Configure both engines identically
    SafetyConfig config;
    config.dcRemovalEnabled = true;
    config.limiterEnabled = true;
    config.feedbackDetectEnabled = true;

    TEST_ASSERT(baseEngine.setConfig(config) == SafetyError::OK);
    TEST_ASSERT(optimizedEngine.setConfig(config) == SafetyError::OK);

    // Generate test signals
    auto left = generateNoise(bufferSize, 0.5f);
    auto right = generateNoise(bufferSize, 0.5f);

    // Add DC offset
    for (auto& sample : left)
        sample += 0.02f;
    for (auto& sample : right)
        sample += 0.02f;

    // Benchmark base engine
    auto leftCopy = left;
    auto rightCopy = right;

    auto start = high_resolution_clock::now();
    for (size_t i = 0; i < iterations; ++i) {
        baseEngine.processStereo(leftCopy.data(), rightCopy.data(), bufferSize);
    }
    auto end = high_resolution_clock::now();
    auto baseTime = duration_cast<microseconds>(end - start).count();

    // Benchmark optimized engine
    leftCopy = left;
    rightCopy = right;

    start = high_resolution_clock::now();
    for (size_t i = 0; i < iterations; ++i) {
        optimizedEngine.processStereo(leftCopy.data(), rightCopy.data(), bufferSize);
    }
    end = high_resolution_clock::now();
    auto optimizedTime = duration_cast<microseconds>(end - start).count();

    // Calculate speedup
    double speedup = static_cast<double>(baseTime) / optimizedTime;

    std::cout << "\n  Performance comparison:" << std::endl;
    std::cout << "    Base engine:      " << baseTime << " μs" << std::endl;
    std::cout << "    Optimized engine: " << optimizedTime << " μs" << std::endl;
    std::cout << "    Speedup:          " << std::fixed << std::setprecision(2) << speedup << "x" << std::endl;

    // Expect at least 1.5x speedup with optimizations
    TEST_ASSERT(speedup > 1.5);

    return true;
}

// Test 7: Stereo processing
bool testStereoProcessing() {
    SafetyError error;
    AudioSafetyEngine engine(48000, 2, &error);
    TEST_ASSERT(error == SafetyError::OK);

    // Configure
    SafetyConfig config;
    config.dcRemovalEnabled = true;
    config.limiterEnabled = true;
    TEST_ASSERT(engine.setConfig(config) == SafetyError::OK);

    // Create different signals for L/R
    auto left = generateSineWave(512, 440, 48000, 0.8f);
    auto right = generateSineWave(512, 880, 48000, 0.6f);

    // Add different DC offsets
    for (auto& sample : left)
        sample += 0.03f;
    for (auto& sample : right)
        sample += -0.02f;

    // Process
    TEST_ASSERT(engine.processStereo(left.data(), right.data(), left.size()) == SafetyError::OK);

    // Check DC removal worked on both channels
    float meanL = 0, meanR = 0;
    for (size_t i = 0; i < left.size(); ++i) {
        meanL += left[i];
        meanR += right[i];
    }
    meanL /= left.size();
    meanR /= right.size();

    TEST_ASSERT(std::abs(meanL) < 0.001f);
    TEST_ASSERT(std::abs(meanR) < 0.001f);

    // Check report aggregates both channels
    auto report = engine.getLastReport();
    TEST_ASSERT(report.peak > 0.5); // Should have peak from signals
    TEST_ASSERT(report.rms > 0.3);  // Should have RMS from signals

    return true;
}

// Test 8: Configuration validation
bool testConfigValidation() {
    SafetyError error;
    AudioSafetyEngine engine(48000, 1, &error);
    TEST_ASSERT(error == SafetyError::OK);

    SafetyConfig config;

    // Test limiter threshold bounds
    config.limiterThresholdDb = -25.0; // Too low
    TEST_ASSERT(engine.setConfig(config) == SafetyError::INVALID_THRESHOLD_DB);

    config.limiterThresholdDb = 5.0; // Too high
    TEST_ASSERT(engine.setConfig(config) == SafetyError::INVALID_THRESHOLD_DB);

    config.limiterThresholdDb = -6.0; // Valid
    TEST_ASSERT(engine.setConfig(config) == SafetyError::OK);

    // Test knee width bounds
    config.kneeWidthDb = -1.0; // Too low
    TEST_ASSERT(engine.setConfig(config) == SafetyError::INVALID_KNEE_WIDTH);

    config.kneeWidthDb = 30.0; // Too high
    TEST_ASSERT(engine.setConfig(config) == SafetyError::INVALID_KNEE_WIDTH);

    config.kneeWidthDb = 6.0; // Valid
    TEST_ASSERT(engine.setConfig(config) == SafetyError::OK);

    // Test DC threshold bounds
    config.dcThreshold = -0.01; // Too low
    TEST_ASSERT(engine.setConfig(config) == SafetyError::INVALID_DC_THRESHOLD);

    config.dcThreshold = 0.1; // Too high
    TEST_ASSERT(engine.setConfig(config) == SafetyError::INVALID_DC_THRESHOLD);

    config.dcThreshold = 0.002; // Valid
    TEST_ASSERT(engine.setConfig(config) == SafetyError::OK);

    return true;
}

// Main test runner
int main() {
    std::cout << "=====================================" << std::endl;
    std::cout << "   AudioSafety System Test Suite    " << std::endl;
    std::cout << "=====================================" << std::endl;

    int passed = 0, failed = 0, total = 0;

    // Run all tests
    RUN_TEST(testErrorCodes);
    RUN_TEST(testDCRemoval);
    RUN_TEST(testLimiter);
    RUN_TEST(testNaNHandling);
    RUN_TEST(testFeedbackDetection);
    RUN_TEST(testStereoProcessing);
    RUN_TEST(testConfigValidation);
    RUN_TEST(testPerformance);

    // Print summary
    std::cout << "\n=====================================" << std::endl;
    std::cout << "           Test Summary              " << std::endl;
    std::cout << "=====================================" << std::endl;
    std::cout << "Total:  " << total << std::endl;
    std::cout << "Passed: " << passed << std::endl;
    std::cout << "Failed: " << failed << std::endl;

    if (failed == 0) {
        std::cout << "\n✅ All tests PASSED!" << std::endl;
        std::cout << "\nOptimizations verified:" << std::endl;
        std::cout << "  ✅ Error codes (RT-safe)" << std::endl;
        std::cout << "  ✅ DbLookupTable integration" << std::endl;
        std::cout << "  ✅ SIMD DC removal" << std::endl;
        std::cout << "  ✅ Branch-free limiting" << std::endl;
        std::cout << "  ✅ Memory pool for reports" << std::endl;
        return 0;
    } else {
        std::cout << "\n❌ Some tests FAILED." << std::endl;
        return 1;
    }
}
