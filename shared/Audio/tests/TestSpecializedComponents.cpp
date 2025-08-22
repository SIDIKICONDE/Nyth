/**
 * @file TestSpecializedComponents.cpp
 * @brief Tests pour les composants spécialisés du module Audio Core
 * @author Test Framework
 * @date 2024
 */

#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <immintrin.h>
#include <cmath>
#include <random>
#include <chrono>
#include <limits>

#include "../core/BranchFreeAlgorithms.hpp"
#include "../core/DbLookupTable.hpp"
#include "../core/BiquadFilterOptimized.hpp"
#include "../core/BiquadFilterSIMD.hpp"
#include "../core/BiquadFilterSafe.hpp"
#include "../core/CoreConstants.hpp"

using namespace AudioFX;
using namespace testing;

// ============================================================================
// BranchFreeAlgorithms Tests
// ============================================================================

class BranchFreeAlgorithmsTest : public Test {
protected:
    std::mt19937 gen{42};
    std::uniform_real_distribution<float> dist{-1.0f, 1.0f};
    std::uniform_real_distribution<double> distDouble{-1.0, 1.0};
};

TEST_F(BranchFreeAlgorithmsTest, Clamp) {
    // Test float clamp
    EXPECT_FLOAT_EQ(BranchFree::clamp(0.5f, 0.0f, 1.0f), 0.5f);
    EXPECT_FLOAT_EQ(BranchFree::clamp(-0.5f, 0.0f, 1.0f), 0.0f);
    EXPECT_FLOAT_EQ(BranchFree::clamp(1.5f, 0.0f, 1.0f), 1.0f);
    
    // Test double clamp
    EXPECT_DOUBLE_EQ(BranchFree::clamp(0.5, -1.0, 1.0), 0.5);
    EXPECT_DOUBLE_EQ(BranchFree::clamp(-2.0, -1.0, 1.0), -1.0);
    EXPECT_DOUBLE_EQ(BranchFree::clamp(2.0, -1.0, 1.0), 1.0);
    
    // Test edge cases
    EXPECT_FLOAT_EQ(BranchFree::clamp(0.0f, 0.0f, 0.0f), 0.0f);
    EXPECT_TRUE(std::isnan(BranchFree::clamp(NAN, 0.0f, 1.0f)));
}

TEST_F(BranchFreeAlgorithmsTest, Abs) {
    // Test float abs
    EXPECT_FLOAT_EQ(BranchFree::abs(5.0f), 5.0f);
    EXPECT_FLOAT_EQ(BranchFree::abs(-5.0f), 5.0f);
    EXPECT_FLOAT_EQ(BranchFree::abs(0.0f), 0.0f);
    
    // Test double abs
    EXPECT_DOUBLE_EQ(BranchFree::abs(3.14), 3.14);
    EXPECT_DOUBLE_EQ(BranchFree::abs(-3.14), 3.14);
    
    // Test special values
    EXPECT_TRUE(std::isinf(BranchFree::abs(INFINITY)));
    EXPECT_TRUE(std::isinf(BranchFree::abs(-INFINITY)));
}

TEST_F(BranchFreeAlgorithmsTest, Sign) {
    // Test float sign
    EXPECT_FLOAT_EQ(BranchFree::sign(5.0f), 1.0f);
    EXPECT_FLOAT_EQ(BranchFree::sign(-5.0f), -1.0f);
    EXPECT_FLOAT_EQ(BranchFree::sign(0.0f), 0.0f);
    
    // Test double sign
    EXPECT_DOUBLE_EQ(BranchFree::sign(100.0), 1.0);
    EXPECT_DOUBLE_EQ(BranchFree::sign(-100.0), -1.0);
}

TEST_F(BranchFreeAlgorithmsTest, Select) {
    // Test float select
    EXPECT_FLOAT_EQ(BranchFree::select(true, 1.0f, 2.0f), 1.0f);
    EXPECT_FLOAT_EQ(BranchFree::select(false, 1.0f, 2.0f), 2.0f);
    
    // Test double select
    EXPECT_DOUBLE_EQ(BranchFree::select(true, 3.14, 2.71), 3.14);
    EXPECT_DOUBLE_EQ(BranchFree::select(false, 3.14, 2.71), 2.71);
}

TEST_F(BranchFreeAlgorithmsTest, SoftClip) {
    // Test soft clipping
    EXPECT_NEAR(BranchFree::softClip(0.0f), 0.0f, 0.001f);
    EXPECT_NEAR(BranchFree::softClip(0.5f), 0.462f, 0.01f); // tanh(0.5)
    EXPECT_NEAR(BranchFree::softClip(2.0f), 0.964f, 0.01f); // tanh(2.0)
    EXPECT_NEAR(BranchFree::softClip(-2.0f), -0.964f, 0.01f);
    
    // Should never exceed [-1, 1]
    for (int i = 0; i < 100; ++i) {
        float value = dist(gen) * 100.0f; // Large range
        float clipped = BranchFree::softClip(value);
        EXPECT_GE(clipped, -1.0f);
        EXPECT_LE(clipped, 1.0f);
    }
}

TEST_F(BranchFreeAlgorithmsTest, FastTanh) {
    // Compare with standard tanh
    for (float x = -3.0f; x <= 3.0f; x += 0.5f) {
        float fast = BranchFree::fastTanh(x);
        float standard = std::tanh(x);
        EXPECT_NEAR(fast, standard, 0.05f); // Allow 5% error for fast approximation
    }
}

TEST_F(BranchFreeAlgorithmsTest, Lerp) {
    // Test linear interpolation
    EXPECT_FLOAT_EQ(BranchFree::lerp(0.0f, 10.0f, 0.0f), 0.0f);
    EXPECT_FLOAT_EQ(BranchFree::lerp(0.0f, 10.0f, 1.0f), 10.0f);
    EXPECT_FLOAT_EQ(BranchFree::lerp(0.0f, 10.0f, 0.5f), 5.0f);
    EXPECT_FLOAT_EQ(BranchFree::lerp(0.0f, 10.0f, 0.25f), 2.5f);
    
    // Test with negative values
    EXPECT_DOUBLE_EQ(BranchFree::lerp(-10.0, 10.0, 0.5), 0.0);
}

TEST_F(BranchFreeAlgorithmsTest, Smoothstep) {
    // Test smoothstep function
    EXPECT_FLOAT_EQ(BranchFree::smoothstep(0.0f, 1.0f, -0.5f), 0.0f);
    EXPECT_FLOAT_EQ(BranchFree::smoothstep(0.0f, 1.0f, 0.0f), 0.0f);
    EXPECT_FLOAT_EQ(BranchFree::smoothstep(0.0f, 1.0f, 0.5f), 0.5f);
    EXPECT_FLOAT_EQ(BranchFree::smoothstep(0.0f, 1.0f, 1.0f), 1.0f);
    EXPECT_FLOAT_EQ(BranchFree::smoothstep(0.0f, 1.0f, 1.5f), 1.0f);
}

TEST_F(BranchFreeAlgorithmsTest, Performance) {
    const int iterations = 1000000;
    std::vector<float> inputs(iterations);
    std::vector<float> outputs(iterations);
    
    // Generate random inputs
    for (int i = 0; i < iterations; ++i) {
        inputs[i] = dist(gen) * 10.0f;
    }
    
    // Benchmark branch-free clamp
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        outputs[i] = BranchFree::clamp(inputs[i], -1.0f, 1.0f);
    }
    auto end = std::chrono::high_resolution_clock::now();
    auto branchFreeDuration = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start);
    
    // Benchmark standard clamp
    start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        outputs[i] = std::max(-1.0f, std::min(1.0f, inputs[i]));
    }
    end = std::chrono::high_resolution_clock::now();
    auto standardDuration = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start);
    
    // Branch-free should be competitive or faster
    double speedup = static_cast<double>(standardDuration.count()) / branchFreeDuration.count();
    std::cout << "Branch-free clamp speedup: " << speedup << "x" << std::endl;
    
    // Should be at least as fast
    EXPECT_GT(speedup, 0.8);
}

// ============================================================================
// DbLookupTable Tests
// ============================================================================

class DbLookupTableTest : public Test {
protected:
    void SetUp() override {
        // Tables are static, so they're already initialized
    }
};

TEST_F(DbLookupTableTest, DbToLinear) {
    // Test common dB values
    EXPECT_NEAR(DbLookupTable::dbToLinear(0.0f), 1.0f, 0.001f);
    EXPECT_NEAR(DbLookupTable::dbToLinear(-6.0f), 0.501f, 0.01f);
    EXPECT_NEAR(DbLookupTable::dbToLinear(6.0f), 1.995f, 0.01f);
    EXPECT_NEAR(DbLookupTable::dbToLinear(-20.0f), 0.1f, 0.01f);
    EXPECT_NEAR(DbLookupTable::dbToLinear(20.0f), 10.0f, 0.1f);
    
    // Test extreme values
    EXPECT_NEAR(DbLookupTable::dbToLinear(-60.0f), 0.001f, 0.0001f);
    EXPECT_GT(DbLookupTable::dbToLinear(40.0f), 50.0f);
    
    // Test out of range values (should use calculation)
    float veryLowDb = -100.0f;
    float result = DbLookupTable::dbToLinear(veryLowDb);
    EXPECT_GT(result, 0.0f);
    EXPECT_LT(result, 0.0001f);
}

TEST_F(DbLookupTableTest, LinearToDb) {
    // Test common linear values
    EXPECT_NEAR(DbLookupTable::linearToDb(1.0f), 0.0f, 0.1f);
    EXPECT_NEAR(DbLookupTable::linearToDb(0.5f), -6.02f, 0.5f);
    EXPECT_NEAR(DbLookupTable::linearToDb(2.0f), 6.02f, 0.5f);
    EXPECT_NEAR(DbLookupTable::linearToDb(0.1f), -20.0f, 1.0f);
    EXPECT_NEAR(DbLookupTable::linearToDb(10.0f), 20.0f, 1.0f);
    
    // Test edge cases
    EXPECT_LT(DbLookupTable::linearToDb(0.0f), -60.0f);
    EXPECT_LT(DbLookupTable::linearToDb(0.00001f), -80.0f);
}

TEST_F(DbLookupTableTest, Accuracy) {
    // Test accuracy of lookup table vs calculation
    for (float db = -60.0f; db <= 60.0f; db += 1.0f) {
        float tableResult = DbLookupTable::dbToLinear(db);
        float calcResult = std::pow(10.0f, db / 20.0f);
        float error = std::abs(tableResult - calcResult) / calcResult;
        EXPECT_LT(error, 0.01f); // Less than 1% error
    }
}

TEST_F(DbLookupTableTest, RoundTrip) {
    // Test round-trip conversion
    for (float db = -40.0f; db <= 40.0f; db += 5.0f) {
        float linear = DbLookupTable::dbToLinear(db);
        float dbBack = DbLookupTable::linearToDb(linear);
        EXPECT_NEAR(db, dbBack, 1.0f);
    }
    
    for (float linear = 0.1f; linear <= 10.0f; linear += 0.5f) {
        float db = DbLookupTable::linearToDb(linear);
        float linearBack = DbLookupTable::dbToLinear(db);
        EXPECT_NEAR(linear, linearBack, linear * 0.05f); // 5% tolerance
    }
}

TEST_F(DbLookupTableTest, PerformanceComparison) {
    const int iterations = 1000000;
    std::vector<float> dbValues(iterations);
    std::vector<float> results(iterations);
    
    // Generate test values
    std::mt19937 gen(42);
    std::uniform_real_distribution<float> dist(-60.0f, 60.0f);
    for (int i = 0; i < iterations; ++i) {
        dbValues[i] = dist(gen);
    }
    
    // Benchmark lookup table
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        results[i] = DbLookupTable::dbToLinear(dbValues[i]);
    }
    auto end = std::chrono::high_resolution_clock::now();
    auto lookupDuration = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start);
    
    // Benchmark direct calculation
    start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        results[i] = std::pow(10.0f, dbValues[i] / 20.0f);
    }
    end = std::chrono::high_resolution_clock::now();
    auto calcDuration = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start);
    
    double speedup = static_cast<double>(calcDuration.count()) / lookupDuration.count();
    std::cout << "DbLookupTable speedup: " << speedup << "x faster than pow()" << std::endl;
    
    // Lookup table should be significantly faster
    EXPECT_GT(speedup, 2.0);
}

// ============================================================================
// BiquadFilterSafe Tests
// ============================================================================

class BiquadFilterSafeTest : public Test {
protected:
    std::unique_ptr<BiquadFilterSafe> filter;
    const double sampleRate = 48000.0;
    const size_t bufferSize = 1024;
    
    void SetUp() override {
        filter = std::make_unique<BiquadFilterSafe>();
    }
};

TEST_F(BiquadFilterSafeTest, NullPointerHandling) {
    float* nullInput = nullptr;
    float* nullOutput = nullptr;
    std::vector<float> validBuffer(bufferSize);
    
    // Should handle null pointers gracefully
    auto result = filter->processSafe(nullInput, validBuffer.data(), bufferSize);
    EXPECT_EQ(result, AudioError::NULL_POINTER);
    
    result = filter->processSafe(validBuffer.data(), nullOutput, bufferSize);
    EXPECT_EQ(result, AudioError::NULL_POINTER);
    
    result = filter->processSafe(nullInput, nullOutput, bufferSize);
    EXPECT_EQ(result, AudioError::NULL_POINTER);
}

TEST_F(BiquadFilterSafeTest, InvalidSizeHandling) {
    std::vector<float> input(bufferSize);
    std::vector<float> output(bufferSize);
    
    // Zero size
    auto result = filter->processSafe(input.data(), output.data(), 0);
    EXPECT_EQ(result, AudioError::INVALID_SIZE);
    
    // Extremely large size (potential overflow)
    result = filter->processSafe(input.data(), output.data(), SIZE_MAX);
    EXPECT_EQ(result, AudioError::BUFFER_TOO_LARGE);
}

TEST_F(BiquadFilterSafeTest, NaNHandling) {
    std::vector<float> input(bufferSize);
    std::vector<float> output(bufferSize);
    
    // Insert NaN in input
    input[bufferSize/2] = NAN;
    
    filter->calculateLowpass(1000.0, sampleRate, 0.707);
    auto result = filter->processSafe(input.data(), output.data(), bufferSize);
    
    // Should detect and handle NaN
    EXPECT_EQ(result, AudioError::NAN_DETECTED);
}

TEST_F(BiquadFilterSafeTest, InfinityHandling) {
    std::vector<float> input(bufferSize);
    std::vector<float> output(bufferSize);
    
    // Insert infinity in input
    input[bufferSize/2] = INFINITY;
    
    filter->calculateLowpass(1000.0, sampleRate, 0.707);
    auto result = filter->processSafe(input.data(), output.data(), bufferSize);
    
    // Should detect and handle infinity
    EXPECT_EQ(result, AudioError::INF_DETECTED);
}

TEST_F(BiquadFilterSafeTest, ValidProcessing) {
    std::vector<float> input(bufferSize);
    std::vector<float> output(bufferSize);
    
    // Generate valid signal
    for (size_t i = 0; i < bufferSize; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        input[i] = static_cast<float>(std::sin(2.0 * M_PI * 440.0 * t));
    }
    
    filter->calculateLowpass(1000.0, sampleRate, 0.707);
    auto result = filter->processSafe(input.data(), output.data(), bufferSize);
    
    EXPECT_EQ(result, AudioError::OK);
    
    // Output should be valid
    for (size_t i = 0; i < bufferSize; ++i) {
        EXPECT_FALSE(std::isnan(output[i]));
        EXPECT_FALSE(std::isinf(output[i]));
    }
}

// ============================================================================
// SIMD Optimizations Tests
// ============================================================================

#ifdef __SSE2__
class BiquadFilterSIMDTest : public Test {
protected:
    const double sampleRate = 48000.0;
    const size_t bufferSize = 1024;
    
    void SetUp() override {
        // Ensure buffer is aligned for SIMD
        ASSERT_EQ(bufferSize % 4, 0);
    }
    
    bool compareBuffers(const std::vector<float>& a, const std::vector<float>& b, float tolerance = 1e-5f) {
        if (a.size() != b.size()) return false;
        for (size_t i = 0; i < a.size(); ++i) {
            if (std::abs(a[i] - b[i]) > tolerance) {
                return false;
            }
        }
        return true;
    }
};

TEST_F(BiquadFilterSIMDTest, SSEProcessing) {
    BiquadFilterSIMD simdFilter;
    BiquadFilter standardFilter;
    
    std::vector<float> input(bufferSize);
    std::vector<float> outputSIMD(bufferSize);
    std::vector<float> outputStandard(bufferSize);
    
    // Generate test signal
    for (size_t i = 0; i < bufferSize; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        input[i] = static_cast<float>(
            0.3 * std::sin(2.0 * M_PI * 440.0 * t) +
            0.2 * std::sin(2.0 * M_PI * 880.0 * t)
        );
    }
    
    // Configure both filters identically
    simdFilter.calculateLowpass(1000.0, sampleRate, 0.707);
    standardFilter.calculateLowpass(1000.0, sampleRate, 0.707);
    
    // Process
    simdFilter.processSSE(input.data(), outputSIMD.data(), bufferSize);
    standardFilter.process(input, outputStandard);
    
    // Results should be very close
    EXPECT_TRUE(compareBuffers(outputSIMD, outputStandard, 1e-4f));
}

#ifdef __AVX__
TEST_F(BiquadFilterSIMDTest, AVXProcessing) {
    BiquadFilterSIMD simdFilter;
    BiquadFilter standardFilter;
    
    // AVX processes 8 samples at once
    const size_t avxBufferSize = 1024;
    std::vector<float, aligned_allocator<float, 32>> input(avxBufferSize);
    std::vector<float, aligned_allocator<float, 32>> outputAVX(avxBufferSize);
    std::vector<float> outputStandard(avxBufferSize);
    
    // Generate test signal
    for (size_t i = 0; i < avxBufferSize; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        input[i] = static_cast<float>(std::sin(2.0 * M_PI * 1000.0 * t));
    }
    
    // Configure filters
    simdFilter.calculateBandpass(2000.0, sampleRate, 1.0);
    standardFilter.calculateBandpass(2000.0, sampleRate, 1.0);
    
    // Process
    simdFilter.processAVX(input.data(), outputAVX.data(), avxBufferSize);
    standardFilter.process(input, outputStandard);
    
    // Compare results
    EXPECT_TRUE(compareBuffers(outputAVX, outputStandard, 1e-4f));
}
#endif // __AVX__

TEST_F(BiquadFilterSIMDTest, PerformanceComparison) {
    BiquadFilterSIMD simdFilter;
    BiquadFilter standardFilter;
    
    const size_t perfBufferSize = 16384;
    const int iterations = 1000;
    
    std::vector<float> input(perfBufferSize);
    std::vector<float> output(perfBufferSize);
    
    // Generate test signal
    for (size_t i = 0; i < perfBufferSize; ++i) {
        input[i] = static_cast<float>(std::sin(2.0 * M_PI * 440.0 * i / sampleRate));
    }
    
    // Configure filters
    simdFilter.calculateLowpass(5000.0, sampleRate, 0.707);
    standardFilter.calculateLowpass(5000.0, sampleRate, 0.707);
    
    // Benchmark SIMD
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        simdFilter.processSSE(input.data(), output.data(), perfBufferSize);
    }
    auto end = std::chrono::high_resolution_clock::now();
    auto simdDuration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    
    // Benchmark standard
    start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        standardFilter.process(input, output);
    }
    end = std::chrono::high_resolution_clock::now();
    auto standardDuration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    
    double speedup = static_cast<double>(standardDuration.count()) / simdDuration.count();
    std::cout << "SIMD speedup: " << speedup << "x" << std::endl;
    
    // SIMD should be faster
    EXPECT_GT(speedup, 1.5);
}
#endif // __SSE2__

// ============================================================================
// Constants Validation Tests
// ============================================================================

TEST(CoreConstantsTest, MathConstants) {
    // Verify mathematical constants
    EXPECT_NEAR(AudioFX::PI_PRECISE, M_PI, 1e-15);
    EXPECT_NEAR(AudioFX::TWO_PI, 2.0 * M_PI, 1e-15);
    EXPECT_NEAR(AudioFX::HALF_PI, M_PI / 2.0, 1e-15);
    EXPECT_NEAR(AudioFX::SQRT2, std::sqrt(2.0), 1e-15);
}

TEST(CoreConstantsTest, AudioConstants) {
    // Verify audio-specific constants
    EXPECT_EQ(AudioFX::DEFAULT_SAMPLE_RATE, 48000u);
    EXPECT_EQ(AudioFX::DEFAULT_BUFFER_SIZE, 512u);
    EXPECT_EQ(AudioFX::NUM_BANDS, 10u);
    
    // Verify limits
    EXPECT_GT(AudioFX::MAX_FREQUENCY, 20000.0);
    EXPECT_LT(AudioFX::MIN_FREQUENCY, 20.0);
    EXPECT_GT(AudioFX::MAX_Q, 10.0);
    EXPECT_LT(AudioFX::MIN_Q, 0.5);
}

TEST(CoreConstantsTest, SafetyConstants) {
    // Verify safety thresholds
    EXPECT_LT(AudioFX::EPSILON, 1e-6);
    EXPECT_LT(AudioFX::DENORMAL_THRESHOLD, 1e-30f);
    EXPECT_GT(AudioFX::CLIP_THRESHOLD, 0.9f);
    EXPECT_LT(AudioFX::CLIP_THRESHOLD, 1.0f);
}

// ============================================================================
// Main function
// ============================================================================

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    
    std::cout << "Running Specialized Components Test Suite" << std::endl;
    std::cout << "=========================================" << std::endl;
    
    int result = RUN_ALL_TESTS();
    
    std::cout << "=========================================" << std::endl;
    std::cout << "Test Suite Complete" << std::endl;
    
    return result;
}