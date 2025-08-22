/**
 * @file TestAudioCore.cpp
 * @brief Suite de tests complète pour le module Audio Core
 * @author Test Framework
 * @date 2024
 * 
 * Tests professionnels couvrant:
 * - Gestion des erreurs
 * - Filtres Biquad
 * - Égaliseur audio
 * - Pool de mémoire
 * - Thread safety
 * - Performance
 */

#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <thread>
#include <chrono>
#include <random>
#include <numeric>
#include <algorithm>
#include <cmath>
#include <future>
#include <atomic>

// Audio Core headers
#include "../core/AudioError.hpp"
#include "../core/BiquadFilter.hpp"
#include "../core/AudioEqualizer.hpp"
#include "../core/MemoryPool.hpp"
#include "../core/ThreadSafeBiquadFilter.hpp"
#include "../core/BranchFreeAlgorithms.hpp"
#include "../core/DbLookupTable.hpp"
#include "../core/EQPresetFactory.hpp"

using namespace AudioFX;
using namespace testing;

// ============================================================================
// Test Fixtures
// ============================================================================

class AudioErrorTest : public Test {
protected:
    void SetUp() override {
        // Setup for error tests
    }
};

class BiquadFilterTest : public Test {
protected:
    std::unique_ptr<BiquadFilter> filter;
    const double sampleRate = 48000.0;
    const size_t bufferSize = 1024;
    std::vector<float> inputBuffer;
    std::vector<float> outputBuffer;
    
    void SetUp() override {
        filter = std::make_unique<BiquadFilter>();
        inputBuffer.resize(bufferSize);
        outputBuffer.resize(bufferSize);
        generateTestSignal();
    }
    
    void generateTestSignal() {
        // Generate a test signal with multiple frequency components
        for (size_t i = 0; i < bufferSize; ++i) {
            double t = static_cast<double>(i) / sampleRate;
            inputBuffer[i] = static_cast<float>(
                0.3 * std::sin(2.0 * M_PI * 440.0 * t) +    // 440 Hz
                0.2 * std::sin(2.0 * M_PI * 880.0 * t) +    // 880 Hz
                0.1 * std::sin(2.0 * M_PI * 1760.0 * t)     // 1760 Hz
            );
        }
    }
    
    double calculateRMS(const std::vector<float>& buffer) {
        double sum = 0.0;
        for (float sample : buffer) {
            sum += sample * sample;
        }
        return std::sqrt(sum / buffer.size());
    }
    
    double calculateFrequencyResponse(double frequency) {
        const size_t testSamples = 8192;
        std::vector<float> input(testSamples);
        std::vector<float> output(testSamples);
        
        // Generate pure sine wave
        for (size_t i = 0; i < testSamples; ++i) {
            double t = static_cast<double>(i) / sampleRate;
            input[i] = static_cast<float>(std::sin(2.0 * M_PI * frequency * t));
        }
        
        filter->process(input, output);
        
        // Skip transient response
        size_t skipSamples = 1000;
        double inputRMS = 0.0, outputRMS = 0.0;
        
        for (size_t i = skipSamples; i < testSamples; ++i) {
            inputRMS += input[i] * input[i];
            outputRMS += output[i] * output[i];
        }
        
        inputRMS = std::sqrt(inputRMS / (testSamples - skipSamples));
        outputRMS = std::sqrt(outputRMS / (testSamples - skipSamples));
        
        return outputRMS / (inputRMS + 1e-10); // Avoid division by zero
    }
};

class AudioEqualizerTest : public Test {
protected:
    std::unique_ptr<AudioEqualizer> equalizer;
    const uint32_t sampleRate = 48000;
    const size_t numBands = 10;
    const size_t bufferSize = 2048;
    std::vector<float> inputL, inputR;
    std::vector<float> outputL, outputR;
    
    void SetUp() override {
        equalizer = std::make_unique<AudioEqualizer>(numBands, sampleRate);
        inputL.resize(bufferSize);
        inputR.resize(bufferSize);
        outputL.resize(bufferSize);
        outputR.resize(bufferSize);
        generateStereoTestSignal();
    }
    
    void generateStereoTestSignal() {
        std::mt19937 gen(42);
        std::normal_distribution<float> dist(0.0f, 0.1f);
        
        for (size_t i = 0; i < bufferSize; ++i) {
            double t = static_cast<double>(i) / sampleRate;
            // Left channel: lower frequencies
            inputL[i] = 0.3f * std::sin(2.0f * M_PI * 200.0f * t) +
                       0.2f * std::sin(2.0f * M_PI * 500.0f * t) +
                       dist(gen);
            // Right channel: higher frequencies
            inputR[i] = 0.3f * std::sin(2.0f * M_PI * 1000.0f * t) +
                       0.2f * std::sin(2.0f * M_PI * 2000.0f * t) +
                       dist(gen);
        }
    }
};

class MemoryPoolTest : public Test {
protected:
    static constexpr size_t poolSize = 100;
    std::unique_ptr<LockFreeMemoryPool<float>> floatPool;
    std::unique_ptr<RealTimeMemoryPool<AudioBuffer>> bufferPool;
    
    struct AudioBuffer {
        float data[1024];
        size_t size;
    };
    
    void SetUp() override {
        floatPool = std::make_unique<LockFreeMemoryPool<float>>(poolSize);
        bufferPool = std::make_unique<RealTimeMemoryPool<AudioBuffer>>(10);
    }
};

// ============================================================================
// AudioError Tests
// ============================================================================

TEST_F(AudioErrorTest, ErrorCodeValues) {
    EXPECT_EQ(static_cast<int>(AudioError::OK), 0);
    EXPECT_NE(static_cast<int>(AudioError::NULL_POINTER), 0);
    EXPECT_NE(static_cast<int>(AudioError::INVALID_SIZE), 0);
}

TEST_F(AudioErrorTest, AudioResultSuccess) {
    AudioResult<int> result(42);
    EXPECT_TRUE(result.isOk());
    EXPECT_FALSE(result.hasError());
    EXPECT_EQ(result.value(), 42);
    EXPECT_EQ(result.error(), AudioError::OK);
}

TEST_F(AudioErrorTest, AudioResultError) {
    AudioResult<int> result(AudioError::INVALID_PARAMETER);
    EXPECT_FALSE(result.isOk());
    EXPECT_TRUE(result.hasError());
    EXPECT_EQ(result.error(), AudioError::INVALID_PARAMETER);
    EXPECT_EQ(result.valueOr(-1), -1);
}

TEST_F(AudioErrorTest, ErrorStringConversion) {
    EXPECT_FALSE(AudioErrorHelper::toString(AudioError::OK).empty());
    EXPECT_FALSE(AudioErrorHelper::toString(AudioError::NULL_POINTER).empty());
    EXPECT_FALSE(AudioErrorHelper::toString(AudioError::PROCESSING_FAILED).empty());
}

TEST_F(AudioErrorTest, ErrorValidation) {
    AudioValidator validator;
    
    // Test null pointer validation
    float* nullPtr = nullptr;
    EXPECT_EQ(validator.checkNotNull(nullPtr), AudioError::NULL_POINTER);
    
    float value = 1.0f;
    EXPECT_EQ(validator.checkNotNull(&value), AudioError::OK);
    
    // Test range validation
    EXPECT_EQ(validator.checkInRange(0.5, 0.0, 1.0), AudioError::OK);
    EXPECT_EQ(validator.checkInRange(1.5, 0.0, 1.0), AudioError::OUT_OF_RANGE);
    EXPECT_EQ(validator.checkInRange(-0.5, 0.0, 1.0), AudioError::OUT_OF_RANGE);
}

TEST_F(AudioErrorTest, ChainedOperations) {
    auto processAudio = [](float gain) -> AudioResult<float> {
        if (gain < 0.0f || gain > 2.0f) {
            return AudioError::OUT_OF_RANGE;
        }
        return gain * 0.5f;
    };
    
    auto result1 = processAudio(1.0f);
    EXPECT_TRUE(result1.isOk());
    EXPECT_FLOAT_EQ(result1.value(), 0.5f);
    
    auto result2 = processAudio(3.0f);
    EXPECT_FALSE(result2.isOk());
    EXPECT_EQ(result2.error(), AudioError::OUT_OF_RANGE);
}

// ============================================================================
// BiquadFilter Tests
// ============================================================================

TEST_F(BiquadFilterTest, Initialization) {
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

TEST_F(BiquadFilterTest, LowpassFilter) {
    const double cutoffFreq = 1000.0;
    const double q = 0.707; // Butterworth response
    
    filter->calculateLowpass(cutoffFreq, sampleRate, q);
    filter->process(inputBuffer, outputBuffer);
    
    // Verify frequency response
    double response500Hz = calculateFrequencyResponse(500.0);
    double response2000Hz = calculateFrequencyResponse(2000.0);
    double response5000Hz = calculateFrequencyResponse(5000.0);
    
    // Low frequencies should pass through
    EXPECT_GT(response500Hz, 0.9);
    
    // High frequencies should be attenuated
    EXPECT_LT(response2000Hz, 0.5);
    EXPECT_LT(response5000Hz, 0.1);
}

TEST_F(BiquadFilterTest, HighpassFilter) {
    const double cutoffFreq = 2000.0;
    const double q = 0.707;
    
    filter->calculateHighpass(cutoffFreq, sampleRate, q);
    
    double response500Hz = calculateFrequencyResponse(500.0);
    double response5000Hz = calculateFrequencyResponse(5000.0);
    
    // Low frequencies should be attenuated
    EXPECT_LT(response500Hz, 0.1);
    
    // High frequencies should pass through
    EXPECT_GT(response5000Hz, 0.9);
}

TEST_F(BiquadFilterTest, BandpassFilter) {
    const double centerFreq = 1000.0;
    const double q = 2.0;
    
    filter->calculateBandpass(centerFreq, sampleRate, q);
    
    double response200Hz = calculateFrequencyResponse(200.0);
    double response1000Hz = calculateFrequencyResponse(1000.0);
    double response5000Hz = calculateFrequencyResponse(5000.0);
    
    // Center frequency should pass through
    EXPECT_GT(response1000Hz, 0.7);
    
    // Frequencies far from center should be attenuated
    EXPECT_LT(response200Hz, 0.3);
    EXPECT_LT(response5000Hz, 0.3);
}

TEST_F(BiquadFilterTest, NotchFilter) {
    const double notchFreq = 1000.0;
    const double q = 10.0;
    
    filter->calculateNotch(notchFreq, sampleRate, q);
    
    double response500Hz = calculateFrequencyResponse(500.0);
    double response1000Hz = calculateFrequencyResponse(1000.0);
    double response2000Hz = calculateFrequencyResponse(2000.0);
    
    // Notch frequency should be heavily attenuated
    EXPECT_LT(response1000Hz, 0.1);
    
    // Other frequencies should pass through
    EXPECT_GT(response500Hz, 0.9);
    EXPECT_GT(response2000Hz, 0.9);
}

TEST_F(BiquadFilterTest, PeakingFilter) {
    const double centerFreq = 1000.0;
    const double q = 2.0;
    const double gainDB = 6.0;
    
    filter->calculatePeaking(centerFreq, sampleRate, q, gainDB);
    
    double response1000Hz = calculateFrequencyResponse(1000.0);
    double response500Hz = calculateFrequencyResponse(500.0);
    
    // Center frequency should be boosted
    EXPECT_GT(response1000Hz, 1.8); // ~6dB boost
    EXPECT_LT(response1000Hz, 2.2);
    
    // Other frequencies should be relatively unaffected
    EXPECT_GT(response500Hz, 0.9);
    EXPECT_LT(response500Hz, 1.1);
}

TEST_F(BiquadFilterTest, StereoProcessing) {
    std::vector<float> inputL(bufferSize), inputR(bufferSize);
    std::vector<float> outputL(bufferSize), outputR(bufferSize);
    
    // Generate different signals for L and R
    for (size_t i = 0; i < bufferSize; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        inputL[i] = static_cast<float>(std::sin(2.0 * M_PI * 440.0 * t));
        inputR[i] = static_cast<float>(std::sin(2.0 * M_PI * 880.0 * t));
    }
    
    filter->calculateLowpass(600.0, sampleRate, 0.707);
    filter->processStereo(inputL, inputR, outputL, outputR);
    
    // Left channel (440Hz) should pass through
    double rmsL = calculateRMS(outputL);
    EXPECT_GT(rmsL, 0.6);
    
    // Right channel (880Hz) should be attenuated
    double rmsR = calculateRMS(outputR);
    EXPECT_LT(rmsR, 0.4);
}

TEST_F(BiquadFilterTest, SingleSampleProcessing) {
    filter->calculateLowpass(1000.0, sampleRate, 0.707);
    
    // Process samples one by one
    std::vector<float> singleSampleOutput;
    for (float sample : inputBuffer) {
        singleSampleOutput.push_back(filter->processSample(sample));
    }
    
    // Compare with batch processing
    filter->reset();
    filter->process(inputBuffer, outputBuffer);
    
    // Results should be identical
    for (size_t i = 0; i < bufferSize; ++i) {
        EXPECT_NEAR(singleSampleOutput[i], outputBuffer[i], 1e-6f);
    }
}

TEST_F(BiquadFilterTest, FilterReset) {
    filter->calculateLowpass(100.0, sampleRate, 0.707);
    
    // Process first half
    std::vector<float> firstHalf(inputBuffer.begin(), inputBuffer.begin() + bufferSize/2);
    std::vector<float> output1(bufferSize/2);
    filter->process(firstHalf, output1);
    
    // Reset and process again
    filter->reset();
    std::vector<float> output2(bufferSize/2);
    filter->process(firstHalf, output2);
    
    // After reset, outputs should be identical
    for (size_t i = 0; i < bufferSize/2; ++i) {
        EXPECT_FLOAT_EQ(output1[i], output2[i]);
    }
}

TEST_F(BiquadFilterTest, DenormalHandling) {
    // Create signal that might produce denormals
    std::vector<float> verySmallSignal(bufferSize);
    for (size_t i = 0; i < bufferSize; ++i) {
        verySmallSignal[i] = 1e-40f; // Very small number
    }
    
    filter->calculateLowpass(100.0, sampleRate, 10.0); // High Q for potential instability
    filter->process(verySmallSignal, outputBuffer);
    
    // Check no NaN or Inf in output
    for (float sample : outputBuffer) {
        EXPECT_FALSE(std::isnan(sample));
        EXPECT_FALSE(std::isinf(sample));
    }
}

// ============================================================================
// AudioEqualizer Tests
// ============================================================================

TEST_F(AudioEqualizerTest, Initialization) {
    EXPECT_EQ(equalizer->getNumBands(), numBands);
    EXPECT_EQ(equalizer->getSampleRate(), sampleRate);
    EXPECT_FALSE(equalizer->isBypassed());
    EXPECT_DOUBLE_EQ(equalizer->getMasterGain(), 0.0);
}

TEST_F(AudioEqualizerTest, BandConfiguration) {
    const size_t bandIndex = 3;
    const double gainDB = 6.0;
    const double frequency = 1000.0;
    const double q = 2.0;
    
    equalizer->setBandGain(bandIndex, gainDB);
    equalizer->setBandFrequency(bandIndex, frequency);
    equalizer->setBandQ(bandIndex, q);
    equalizer->setBandType(bandIndex, FilterType::PEAKING);
    equalizer->setBandEnabled(bandIndex, true);
    
    EXPECT_DOUBLE_EQ(equalizer->getBandGain(bandIndex), gainDB);
    EXPECT_DOUBLE_EQ(equalizer->getBandFrequency(bandIndex), frequency);
    EXPECT_DOUBLE_EQ(equalizer->getBandQ(bandIndex), q);
    EXPECT_EQ(equalizer->getBandType(bandIndex), FilterType::PEAKING);
    EXPECT_TRUE(equalizer->isBandEnabled(bandIndex));
}

TEST_F(AudioEqualizerTest, PresetManagement) {
    // Load a preset
    EQPreset rockPreset = EQPresetFactory::createRockPreset();
    equalizer->loadPreset(rockPreset);
    
    // Verify preset was loaded
    for (size_t i = 0; i < std::min(rockPreset.bands.size(), equalizer->getNumBands()); ++i) {
        EXPECT_DOUBLE_EQ(equalizer->getBandGain(i), rockPreset.bands[i].gainDB);
        EXPECT_DOUBLE_EQ(equalizer->getBandFrequency(i), rockPreset.bands[i].frequency);
    }
    
    // Save current settings to a new preset
    EQPreset savedPreset;
    equalizer->savePreset(savedPreset);
    EXPECT_EQ(savedPreset.bands.size(), equalizer->getNumBands());
}

TEST_F(AudioEqualizerTest, StereoProcessing) {
    // Boost 1kHz band
    for (size_t i = 0; i < numBands; ++i) {
        double freq = 31.25 * std::pow(2.0, i); // Octave bands starting at 31.25Hz
        if (std::abs(freq - 1000.0) < 200.0) {
            equalizer->setBandGain(i, 12.0); // 12dB boost
            break;
        }
    }
    
    equalizer->processStereo(inputL, inputR, outputL, outputR);
    
    // Output should have higher RMS due to boost
    double inputRMS = calculateRMS(inputL);
    double outputRMS = calculateRMS(outputL);
    EXPECT_GT(outputRMS, inputRMS * 1.5); // Expect significant boost
}

TEST_F(AudioEqualizerTest, BypassMode) {
    // Set some EQ bands
    equalizer->setBandGain(2, 12.0);
    equalizer->setBandGain(5, -12.0);
    
    // Process with EQ enabled
    equalizer->processStereo(inputL, inputR, outputL, outputR);
    std::vector<float> eqOutputL = outputL;
    
    // Process with bypass
    equalizer->setBypass(true);
    equalizer->processStereo(inputL, inputR, outputL, outputR);
    
    // Bypassed output should match input
    for (size_t i = 0; i < bufferSize; ++i) {
        EXPECT_FLOAT_EQ(outputL[i], inputL[i]);
        EXPECT_FLOAT_EQ(outputR[i], inputR[i]);
    }
    
    // EQ output should be different from input
    bool isDifferent = false;
    for (size_t i = 0; i < bufferSize; ++i) {
        if (std::abs(eqOutputL[i] - inputL[i]) > 0.001f) {
            isDifferent = true;
            break;
        }
    }
    EXPECT_TRUE(isDifferent);
}

TEST_F(AudioEqualizerTest, MasterGain) {
    const double masterGainDB = -6.0;
    equalizer->setMasterGain(masterGainDB);
    
    equalizer->process(inputL, outputL);
    
    double inputRMS = calculateRMS(inputL);
    double outputRMS = calculateRMS(outputL);
    double expectedRatio = std::pow(10.0, masterGainDB / 20.0);
    
    EXPECT_NEAR(outputRMS / inputRMS, expectedRatio, 0.05);
}

TEST_F(AudioEqualizerTest, ThreadSafeParameterUpdate) {
    std::atomic<bool> stopFlag{false};
    std::atomic<int> updateCount{0};
    
    // Thread that continuously updates parameters
    std::thread updateThread([this, &stopFlag, &updateCount]() {
        std::mt19937 gen(123);
        std::uniform_real_distribution<double> gainDist(-12.0, 12.0);
        std::uniform_int_distribution<size_t> bandDist(0, numBands - 1);
        
        while (!stopFlag.load()) {
            AudioEqualizer::ParameterUpdateGuard guard(*equalizer);
            size_t band = bandDist(gen);
            equalizer->setBandGain(band, gainDist(gen));
            updateCount++;
            std::this_thread::sleep_for(std::chrono::microseconds(100));
        }
    });
    
    // Thread that continuously processes audio
    std::thread processThread([this, &stopFlag]() {
        while (!stopFlag.load()) {
            equalizer->processStereo(inputL, inputR, outputL, outputR);
            std::this_thread::sleep_for(std::chrono::microseconds(50));
        }
    });
    
    // Let threads run for a while
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    stopFlag = true;
    
    updateThread.join();
    processThread.join();
    
    // Should have completed many updates without crashes
    EXPECT_GT(updateCount.load(), 100);
}

// ============================================================================
// MemoryPool Tests
// ============================================================================

TEST_F(MemoryPoolTest, BasicAllocationDeallocation) {
    // Allocate all blocks
    std::vector<float*> allocated;
    for (size_t i = 0; i < poolSize; ++i) {
        float* ptr = floatPool->allocate();
        ASSERT_NE(ptr, nullptr);
        allocated.push_back(ptr);
        *ptr = static_cast<float>(i);
    }
    
    // Pool should be exhausted
    EXPECT_EQ(floatPool->allocate(), nullptr);
    EXPECT_EQ(floatPool->getAllocatedCount(), poolSize);
    
    // Deallocate all
    for (size_t i = 0; i < poolSize; ++i) {
        EXPECT_FLOAT_EQ(*allocated[i], static_cast<float>(i));
        floatPool->deallocate(allocated[i]);
    }
    
    // Should be able to allocate again
    float* ptr = floatPool->allocate();
    EXPECT_NE(ptr, nullptr);
    floatPool->deallocate(ptr);
}

TEST_F(MemoryPoolTest, ConcurrentAllocation) {
    const int numThreads = 8;
    const int allocationsPerThread = poolSize / numThreads;
    std::atomic<int> successCount{0};
    std::vector<std::thread> threads;
    
    auto allocateTask = [this, &successCount, allocationsPerThread]() {
        std::vector<float*> localAllocated;
        for (int i = 0; i < allocationsPerThread; ++i) {
            float* ptr = floatPool->allocate();
            if (ptr != nullptr) {
                localAllocated.push_back(ptr);
                successCount++;
            }
        }
        
        // Deallocate after a short delay
        std::this_thread::sleep_for(std::chrono::microseconds(100));
        for (float* ptr : localAllocated) {
            floatPool->deallocate(ptr);
        }
    };
    
    // Launch threads
    for (int i = 0; i < numThreads; ++i) {
        threads.emplace_back(allocateTask);
    }
    
    // Wait for completion
    for (auto& t : threads) {
        t.join();
    }
    
    // Most allocations should succeed
    EXPECT_GT(successCount.load(), poolSize * 0.9);
    
    // Pool should be empty after all deallocations
    EXPECT_EQ(floatPool->getAllocatedCount(), 0);
}

TEST_F(MemoryPoolTest, RealTimePoolAlignment) {
    AudioBuffer* buffer = bufferPool->allocate();
    ASSERT_NE(buffer, nullptr);
    
    // Check alignment (should be at least 16-byte aligned for SIMD)
    uintptr_t addr = reinterpret_cast<uintptr_t>(buffer);
    EXPECT_EQ(addr % 16, 0);
    
    bufferPool->deallocate(buffer);
}

TEST_F(MemoryPoolTest, StressTest) {
    const int iterations = 10000;
    std::mt19937 gen(42);
    std::uniform_int_distribution<int> actionDist(0, 1);
    std::vector<float*> allocated;
    
    for (int i = 0; i < iterations; ++i) {
        if (actionDist(gen) == 0 && allocated.size() < poolSize) {
            // Allocate
            float* ptr = floatPool->allocate();
            if (ptr != nullptr) {
                allocated.push_back(ptr);
                *ptr = static_cast<float>(i);
            }
        } else if (!allocated.empty()) {
            // Deallocate random element
            std::uniform_int_distribution<size_t> indexDist(0, allocated.size() - 1);
            size_t index = indexDist(gen);
            floatPool->deallocate(allocated[index]);
            allocated.erase(allocated.begin() + index);
        }
    }
    
    // Clean up remaining allocations
    for (float* ptr : allocated) {
        floatPool->deallocate(ptr);
    }
    
    EXPECT_EQ(floatPool->getAllocatedCount(), 0);
}

// ============================================================================
// Thread Safety Tests
// ============================================================================

TEST(ThreadSafetyTest, ThreadSafeBiquadFilter) {
    ThreadSafeBiquadFilter filter;
    const double sampleRate = 48000.0;
    const size_t bufferSize = 1024;
    
    // Configure filter
    filter.calculateLowpass(1000.0, sampleRate, 0.707);
    
    std::atomic<bool> stopFlag{false};
    std::atomic<int> processCount{0};
    std::atomic<int> updateCount{0};
    
    // Processing thread
    std::thread processThread([&]() {
        std::vector<float> input(bufferSize, 0.5f);
        std::vector<float> output(bufferSize);
        
        while (!stopFlag.load()) {
            filter.process(input, output);
            processCount++;
            std::this_thread::yield();
        }
    });
    
    // Parameter update thread
    std::thread updateThread([&]() {
        std::mt19937 gen(123);
        std::uniform_real_distribution<double> freqDist(100.0, 10000.0);
        
        while (!stopFlag.load()) {
            filter.calculateLowpass(freqDist(gen), sampleRate, 0.707);
            updateCount++;
            std::this_thread::sleep_for(std::chrono::microseconds(10));
        }
    });
    
    // Let threads run
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    stopFlag = true;
    
    processThread.join();
    updateThread.join();
    
    // Should have completed many operations without deadlock
    EXPECT_GT(processCount.load(), 1000);
    EXPECT_GT(updateCount.load(), 100);
}

// ============================================================================
// Performance Tests
// ============================================================================

TEST(PerformanceTest, BiquadFilterThroughput) {
    BiquadFilter filter;
    const double sampleRate = 48000.0;
    const size_t bufferSize = 4096;
    const int iterations = 10000;
    
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
    
    // Should be able to process at least 100x real-time
    EXPECT_GT(realTimeRatio, 100.0);
    
    // Log performance metrics
    std::cout << "BiquadFilter Performance: " 
              << samplesPerSecond / 1000000.0 << " MSamples/sec, "
              << realTimeRatio << "x real-time" << std::endl;
}

TEST(PerformanceTest, EqualizerThroughput) {
    AudioEqualizer equalizer(10, 48000);
    const size_t bufferSize = 4096;
    const int iterations = 1000;
    
    // Configure some bands
    for (size_t i = 0; i < 10; ++i) {
        equalizer.setBandGain(i, (i % 2 == 0) ? 6.0 : -6.0);
    }
    
    std::vector<float> inputL(bufferSize);
    std::vector<float> inputR(bufferSize);
    std::vector<float> outputL(bufferSize);
    std::vector<float> outputR(bufferSize);
    
    // Generate test signal
    for (size_t i = 0; i < bufferSize; ++i) {
        inputL[i] = static_cast<float>(std::sin(2.0 * M_PI * 440.0 * i / 48000.0));
        inputR[i] = static_cast<float>(std::sin(2.0 * M_PI * 880.0 * i / 48000.0));
    }
    
    auto start = std::chrono::high_resolution_clock::now();
    
    for (int i = 0; i < iterations; ++i) {
        equalizer.processStereo(inputL, inputR, outputL, outputR);
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    
    double samplesPerSecond = (bufferSize * 2 * iterations * 1000000.0) / duration.count();
    double realTimeRatio = samplesPerSecond / (48000.0 * 2); // Stereo
    
    // Should be able to process at least 10x real-time
    EXPECT_GT(realTimeRatio, 10.0);
    
    std::cout << "Equalizer Performance: " 
              << samplesPerSecond / 1000000.0 << " MSamples/sec, "
              << realTimeRatio << "x real-time" << std::endl;
}

TEST(PerformanceTest, MemoryPoolAllocationSpeed) {
    LockFreeMemoryPool<float> pool(1000);
    const int iterations = 100000;
    
    auto start = std::chrono::high_resolution_clock::now();
    
    for (int i = 0; i < iterations; ++i) {
        float* ptr = pool.allocate();
        if (ptr) {
            *ptr = static_cast<float>(i);
            pool.deallocate(ptr);
        }
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start);
    
    double nsPerOperation = static_cast<double>(duration.count()) / iterations;
    
    // Should be very fast (< 100ns per allocation/deallocation pair)
    EXPECT_LT(nsPerOperation, 100.0);
    
    std::cout << "Memory Pool Performance: " 
              << nsPerOperation << " ns per alloc/dealloc pair" << std::endl;
}

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

TEST(EdgeCaseTest, ExtremeFrequencies) {
    BiquadFilter filter;
    const double sampleRate = 48000.0;
    
    // Very low frequency
    EXPECT_NO_THROW(filter.calculateLowpass(0.1, sampleRate, 0.707));
    
    // Nyquist frequency
    EXPECT_NO_THROW(filter.calculateHighpass(sampleRate / 2.0 - 1.0, sampleRate, 0.707));
    
    // Invalid frequencies should be handled gracefully
    EXPECT_NO_THROW(filter.calculateLowpass(-100.0, sampleRate, 0.707));
    EXPECT_NO_THROW(filter.calculateLowpass(sampleRate, sampleRate, 0.707));
}

TEST(EdgeCaseTest, ExtremeGains) {
    AudioEqualizer equalizer(5, 48000);
    
    // Extreme gains
    EXPECT_NO_THROW(equalizer.setBandGain(0, 60.0));  // Very high gain
    EXPECT_NO_THROW(equalizer.setBandGain(1, -60.0)); // Very low gain
    EXPECT_NO_THROW(equalizer.setMasterGain(100.0));  // Extreme master gain
    
    // Process with extreme settings
    std::vector<float> input(1024, 0.1f);
    std::vector<float> output(1024);
    EXPECT_NO_THROW(equalizer.process(input, output));
    
    // Check for NaN or Inf
    for (float sample : output) {
        EXPECT_FALSE(std::isnan(sample));
        EXPECT_FALSE(std::isinf(sample));
    }
}

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

TEST(EdgeCaseTest, MismatchedBufferSizes) {
    BiquadFilter filter;
    
    std::vector<float> input(1024);
    std::vector<float> output(512); // Different size
    
    // Should resize output buffer
    EXPECT_NO_THROW(filter.process(input, output));
    EXPECT_EQ(output.size(), input.size());
}

// ============================================================================
// Integration Tests
// ============================================================================

TEST(IntegrationTest, CompleteSignalChain) {
    // Create a complete signal processing chain
    const uint32_t sampleRate = 48000;
    const size_t bufferSize = 2048;
    
    // Components
    BiquadFilter highpass;
    AudioEqualizer equalizer(5, sampleRate);
    BiquadFilter lowpass;
    
    // Configure chain
    highpass.calculateHighpass(80.0, sampleRate, 0.707);  // Remove DC
    
    equalizer.setBandFrequency(0, 100.0);
    equalizer.setBandGain(0, 3.0);
    equalizer.setBandType(0, FilterType::LOW_SHELF);
    
    equalizer.setBandFrequency(2, 1000.0);
    equalizer.setBandGain(2, 6.0);
    equalizer.setBandType(2, FilterType::PEAKING);
    
    equalizer.setBandFrequency(4, 10000.0);
    equalizer.setBandGain(4, -3.0);
    equalizer.setBandType(4, FilterType::HIGH_SHELF);
    
    lowpass.calculateLowpass(15000.0, sampleRate, 0.707);  // Anti-aliasing
    
    // Generate complex test signal
    std::vector<float> input(bufferSize);
    for (size_t i = 0; i < bufferSize; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        input[i] = 0.3f * std::sin(2.0f * M_PI * 100.0f * t) +
                  0.3f * std::sin(2.0f * M_PI * 1000.0f * t) +
                  0.2f * std::sin(2.0f * M_PI * 5000.0f * t) +
                  0.1f * std::sin(2.0f * M_PI * 10000.0f * t);
    }
    
    // Process through chain
    std::vector<float> temp1(bufferSize);
    std::vector<float> temp2(bufferSize);
    std::vector<float> output(bufferSize);
    
    highpass.process(input, temp1);
    equalizer.process(temp1, temp2);
    lowpass.process(temp2, output);
    
    // Verify output is valid
    for (float sample : output) {
        EXPECT_FALSE(std::isnan(sample));
        EXPECT_FALSE(std::isinf(sample));
        EXPECT_LT(std::abs(sample), 10.0f); // Reasonable range
    }
    
    // Output should be different from input due to processing
    double difference = 0.0;
    for (size_t i = 0; i < bufferSize; ++i) {
        difference += std::abs(output[i] - input[i]);
    }
    EXPECT_GT(difference, 0.1);
}

// ============================================================================
// Main function
// ============================================================================

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    
    // Set up test environment
    std::cout << "Running Audio Core Test Suite" << std::endl;
    std::cout << "=============================" << std::endl;
    
    int result = RUN_ALL_TESTS();
    
    std::cout << "=============================" << std::endl;
    std::cout << "Test Suite Complete" << std::endl;
    
    return result;
}