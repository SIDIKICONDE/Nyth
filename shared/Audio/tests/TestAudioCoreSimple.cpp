/**
 * @file TestAudioCoreSimple.cpp
 * @brief Tests simplifiés pour le module Audio Core
 * @author Test Framework
 * @date 2024
 */

#include <gtest/gtest.h>
#include <cmath>
#include <vector>
#include <memory>
#include <thread>
#include <chrono>

// Audio Core headers
#include "../core/AudioError.hpp"
#include "../core/BiquadFilter.hpp"
#include "../core/AudioEqualizer.hpp"
#include "../core/CoreConstants.hpp"

using namespace AudioFX;
using namespace testing;

// ============================================================================
// AudioError Tests
// ============================================================================

TEST(AudioErrorTest, ErrorCodeValues) {
    EXPECT_EQ(static_cast<int>(AudioError::OK), 0);
    EXPECT_NE(static_cast<int>(AudioError::NULL_POINTER), 0);
    EXPECT_NE(static_cast<int>(AudioError::INVALID_SIZE), 0);
}

TEST(AudioErrorTest, AudioResultSuccess) {
    AudioResult<int> result(42);
    EXPECT_TRUE(result.isOk());
    EXPECT_FALSE(result.hasError());
    EXPECT_EQ(result.value(), 42);
    EXPECT_EQ(result.error(), AudioError::OK);
}

TEST(AudioErrorTest, AudioResultError) {
    AudioResult<int> result(AudioError::INVALID_PARAMETER);
    EXPECT_FALSE(result.isOk());
    EXPECT_TRUE(result.hasError());
    EXPECT_EQ(result.error(), AudioError::INVALID_PARAMETER);
    EXPECT_EQ(result.valueOr(-1), -1);
}

// ============================================================================
// BiquadFilter Tests
// ============================================================================

TEST(BiquadFilterTest, Initialization) {
    BiquadFilter filter;
    double a0, a1, a2, b0, b1, b2;
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);
    
    // Default coefficients should be bypass
    EXPECT_DOUBLE_EQ(a0, 1.0);
    EXPECT_DOUBLE_EQ(a1, 0.0);
    EXPECT_DOUBLE_EQ(a2, 0.0);
    EXPECT_DOUBLE_EQ(b0, 1.0);
    EXPECT_DOUBLE_EQ(b1, 0.0);
    EXPECT_DOUBLE_EQ(b2, 0.0);
}

TEST(BiquadFilterTest, LowpassFilter) {
    BiquadFilter filter;
    const double sampleRate = 48000.0;
    const double cutoffFreq = 1000.0;
    const double q = 0.707;
    
    filter.calculateLowpass(cutoffFreq, sampleRate, q);
    
    // Generate test signal
    std::vector<float> input(1024);
    std::vector<float> output(1024);
    
    for (size_t i = 0; i < input.size(); ++i) {
        double t = static_cast<double>(i) / sampleRate;
        input[i] = static_cast<float>(std::sin(2.0 * M_PI * 440.0 * t));
    }
    
    filter.process(input, output);
    
    // Output should not be all zeros
    double sum = 0.0;
    for (float sample : output) {
        sum += std::abs(sample);
    }
    EXPECT_GT(sum, 0.0);
}

TEST(BiquadFilterTest, HighpassFilter) {
    BiquadFilter filter;
    const double sampleRate = 48000.0;
    const double cutoffFreq = 2000.0;
    const double q = 0.707;
    
    filter.calculateHighpass(cutoffFreq, sampleRate, q);
    
    // Test that coefficients were set
    double a0, a1, a2, b0, b1, b2;
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);
    
    // Coefficients should not be bypass anymore
    EXPECT_NE(a0, 1.0);
    EXPECT_NE(b1, 0.0);
}

TEST(BiquadFilterTest, SingleSampleProcessing) {
    BiquadFilter filter;
    const double sampleRate = 48000.0;
    
    filter.calculateLowpass(1000.0, sampleRate, 0.707);
    
    // Process single samples
    float sample = 0.5f;
    float output = filter.processSample(sample);
    
    // Output should be valid
    EXPECT_FALSE(std::isnan(output));
    EXPECT_FALSE(std::isinf(output));
}

TEST(BiquadFilterTest, FilterReset) {
    BiquadFilter filter;
    const double sampleRate = 48000.0;
    
    filter.calculateLowpass(100.0, sampleRate, 0.707);
    
    // Process some samples
    std::vector<float> input(100, 1.0f);
    std::vector<float> output1(100);
    filter.process(input, output1);
    
    // Reset and process again
    filter.reset();
    std::vector<float> output2(100);
    filter.process(input, output2);
    
    // First samples after reset should be identical
    EXPECT_FLOAT_EQ(output1[0], output2[0]);
}

// ============================================================================
// AudioEqualizer Tests
// ============================================================================

TEST(AudioEqualizerTest, Initialization) {
    AudioEqualizer equalizer(10, 48000);
    
    EXPECT_EQ(equalizer.getNumBands(), 10);
    EXPECT_EQ(equalizer.getSampleRate(), 48000);
    EXPECT_FALSE(equalizer.isBypassed());
    // Note: Default master gain is 1.0 (unity gain), not 0.0
    EXPECT_DOUBLE_EQ(equalizer.getMasterGain(), 1.0);
}

TEST(AudioEqualizerTest, BandConfiguration) {
    AudioEqualizer equalizer(10, 48000);
    const size_t bandIndex = 3;
    const double gainDB = 6.0;
    const double frequency = 1000.0;
    const double q = 2.0;
    
    equalizer.setBandGain(bandIndex, gainDB);
    equalizer.setBandFrequency(bandIndex, frequency);
    equalizer.setBandQ(bandIndex, q);
    equalizer.setBandEnabled(bandIndex, true);
    
    EXPECT_DOUBLE_EQ(equalizer.getBandGain(bandIndex), gainDB);
    EXPECT_DOUBLE_EQ(equalizer.getBandFrequency(bandIndex), frequency);
    EXPECT_DOUBLE_EQ(equalizer.getBandQ(bandIndex), q);
    EXPECT_TRUE(equalizer.isBandEnabled(bandIndex));
}

TEST(AudioEqualizerTest, BypassMode) {
    AudioEqualizer equalizer(5, 48000);
    
    std::vector<float> input(1024);
    std::vector<float> output(1024);
    
    // Generate test signal
    for (size_t i = 0; i < input.size(); ++i) {
        input[i] = static_cast<float>(std::sin(2.0 * M_PI * 440.0 * i / 48000.0));
    }
    
    // Set bypass
    equalizer.setBypass(true);
    equalizer.process(input, output);
    
    // Bypassed output should match input
    for (size_t i = 0; i < input.size(); ++i) {
        EXPECT_FLOAT_EQ(output[i], input[i]);
    }
}

TEST(AudioEqualizerTest, MasterGain) {
    AudioEqualizer equalizer(5, 48000);
    const double masterGainDB = -6.0;
    
    equalizer.setMasterGain(masterGainDB);
    EXPECT_DOUBLE_EQ(equalizer.getMasterGain(), masterGainDB);
    
    std::vector<float> input(1024, 0.5f);
    std::vector<float> output(1024);
    
    equalizer.process(input, output);
    
    // Output should be attenuated
    double inputRMS = 0.0, outputRMS = 0.0;
    for (size_t i = 0; i < input.size(); ++i) {
        inputRMS += input[i] * input[i];
        outputRMS += output[i] * output[i];
    }
    
    EXPECT_LT(outputRMS, inputRMS);
}

// ============================================================================
// Performance Tests
// ============================================================================

TEST(PerformanceTest, BiquadFilterSpeed) {
    BiquadFilter filter;
    const double sampleRate = 48000.0;
    const size_t bufferSize = 4096;
    const int iterations = 1000;
    
    filter.calculateLowpass(1000.0, sampleRate, 0.707);
    
    std::vector<float> input(bufferSize);
    std::vector<float> output(bufferSize);
    
    // Generate test signal
    for (size_t i = 0; i < bufferSize; ++i) {
        input[i] = static_cast<float>(std::sin(2.0 * M_PI * 440.0 * i / sampleRate));
    }
    
    auto start = std::chrono::high_resolution_clock::now();
    
    for (int i = 0; i < iterations; ++i) {
        filter.process(input, output);
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    
    double samplesPerSecond = (bufferSize * iterations * 1000000.0) / duration.count();
    double realTimeRatio = samplesPerSecond / sampleRate;
    
    // Should be able to process faster than real-time
    EXPECT_GT(realTimeRatio, 1.0);
    
    std::cout << "BiquadFilter Performance: " 
              << samplesPerSecond / 1000000.0 << " MSamples/sec, "
              << realTimeRatio << "x real-time" << std::endl;
}

// ============================================================================
// Edge Cases
// ============================================================================

TEST(EdgeCaseTest, EmptyBuffers) {
    BiquadFilter filter;
    AudioEqualizer equalizer(5, 48000);
    
    std::vector<float> empty;
    std::vector<float> output;
    
    // Should handle empty buffers gracefully
    EXPECT_NO_THROW(filter.process(empty, output));
    EXPECT_NO_THROW(equalizer.process(empty, output));
    EXPECT_TRUE(output.empty());
}

TEST(EdgeCaseTest, ExtremeFrequencies) {
    BiquadFilter filter;
    const double sampleRate = 48000.0;
    
    // Very low frequency
    EXPECT_NO_THROW(filter.calculateLowpass(0.1, sampleRate, 0.707));
    
    // Nyquist frequency
    EXPECT_NO_THROW(filter.calculateHighpass(sampleRate / 2.0 - 1.0, sampleRate, 0.707));
}

// ============================================================================
// Main function
// ============================================================================

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    
    std::cout << "Running Audio Core Simple Test Suite" << std::endl;
    std::cout << "=====================================" << std::endl;
    
    int result = RUN_ALL_TESTS();
    
    std::cout << "=====================================" << std::endl;
    std::cout << "Test Suite Complete" << std::endl;
    
    return result;
}