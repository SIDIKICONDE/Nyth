/**
 * @file TestCorrections.cpp
 * @brief Unit tests for critical corrections applied to AudioFX system
 * 
 * Tests validate:
 * 1. Error code system
 * 2. Bounds checking
 * 3. Thread safety
 * 4. Merge conflict resolution
 */

#include <iostream>
#include <cassert>
#include <vector>
#include <thread>
#include <chrono>
#include <cmath>
#include <random>

// Include corrected headers
#include "../core/AudioError.hpp"
#include "../core/BiquadFilterSafe.hpp"
#include "../core/ThreadSafeBiquadFilter.hpp"
#include "../core/CoreConstants.hpp"
#include "../effects/EffectConstants.hpp"

using namespace AudioFX;

// Test helpers
#define TEST_ASSERT(condition) \
    do { \
        if (!(condition)) { \
            std::cerr << "Test failed: " << #condition << " at " \
                     << __FILE__ << ":" << __LINE__ << std::endl; \
            return false; \
        } \
    } while(0)

#define RUN_TEST(test_func) \
    do { \
        std::cout << "Running: " << #test_func << "... "; \
        if (test_func()) { \
            std::cout << "PASSED" << std::endl; \
            passed++; \
        } else { \
            std::cout << "FAILED" << std::endl; \
            failed++; \
        } \
        total++; \
    } while(0)

// Test 1: Error code system
bool testErrorCodeSystem() {
    // Test error creation and checking
    AudioError err1 = AudioError::OK;
    TEST_ASSERT(err1 == AudioError::OK);
    
    AudioError err2 = AudioError::NULL_POINTER;
    TEST_ASSERT(err2 != AudioError::OK);
    
    // Test AudioResult
    AudioResult<int> result1(42);
    TEST_ASSERT(result1.isOk());
    TEST_ASSERT(result1.value() == 42);
    
    AudioResult<int> result2(AudioError::INVALID_SIZE);
    TEST_ASSERT(result2.hasError());
    TEST_ASSERT(result2.error() == AudioError::INVALID_SIZE);
    
    // Test monadic operations
    auto result3 = result1.map([](int x) -> int { return x * 2; });
    TEST_ASSERT(result3.isOk());
    TEST_ASSERT(result3.value() == 84);
    
    // Test validator
    TEST_ASSERT(AudioValidator::validatePointer<float>(nullptr) == AudioError::NULL_POINTER);
    float dummy = 0;
    TEST_ASSERT(AudioValidator::validatePointer(&dummy) == AudioError::OK);
    
    // Test sample rate validation
    TEST_ASSERT(AudioValidator::validateSampleRate(48000) == AudioError::OK);
    TEST_ASSERT(AudioValidator::validateSampleRate(5000) == AudioError::INVALID_SAMPLE_RATE);
    TEST_ASSERT(AudioValidator::validateSampleRate(200000) == AudioError::INVALID_SAMPLE_RATE);
    
    // Test NaN/Inf detection
    float nan_val = std::nanf("");
    float inf_val = std::numeric_limits<float>::infinity();
    TEST_ASSERT(AudioValidator::validateFinite(nan_val) == AudioError::NAN_DETECTED);
    TEST_ASSERT(AudioValidator::validateFinite(inf_val) == AudioError::INF_DETECTED);
    TEST_ASSERT(AudioValidator::validateFinite(1.0f) == AudioError::OK);
    
    return true;
}

// Test 2: Bounds checking in BiquadFilterSafe
bool testBoundsChecking() {
    BiquadFilterSafe filter;
    
    // Test null pointer handling
    AudioError err = filter.processSafe(nullptr, nullptr, 100);
    TEST_ASSERT(err == AudioError::NULL_POINTER);
    
    // Test valid processing
    std::vector<float> input(512, 0.5f);
    std::vector<float> output(512);
    
    err = filter.processSafe(input.data(), output.data(), input.size());
    TEST_ASSERT(err == AudioError::OK);
    
    // Test NaN handling
    input[10] = std::nanf("");
    err = filter.processSafe(input.data(), output.data(), input.size());
    TEST_ASSERT(err == AudioError::NAN_DETECTED);
    
    // Reset input
    input[10] = 0.5f;
    
    // Test coefficient validation
    err = filter.setCoeffcientsSafe(1.0, 0.5, 0.25, 1.0, -0.5, 0.25);
    TEST_ASSERT(err == AudioError::OK);
    
    err = filter.setCoeffcientsSafe(std::nanf(""), 0.5, 0.25, 1.0, -0.5, 0.25);
    TEST_ASSERT(err == AudioError::NAN_DETECTED);
    
    // Test frequency validation
    err = filter.calculateLowpassSafe(1000, 48000, 0.707);
    TEST_ASSERT(err == AudioError::OK);
    
    err = filter.calculateLowpassSafe(30000, 48000, 0.707); // Above Nyquist
    TEST_ASSERT(err == AudioError::INVALID_FREQUENCY);
    
    err = filter.calculateLowpassSafe(1000, 48000, 0.001); // Q too low
    TEST_ASSERT(err == AudioError::INVALID_Q_FACTOR);
    
    // Test SafeAudioBuffer
    SafeAudioBuffer<float> safeBuf(output.data(), output.size());
    
    auto result = safeBuf.at(10); // returns AudioResult<float> by value
    TEST_ASSERT(result.isOk());
    
    auto result2 = safeBuf.at(1000); // Out of bounds
    TEST_ASSERT(result2.hasError());
    TEST_ASSERT(result2.error() == AudioError::OUT_OF_RANGE);
    
    // Test buffer validation
    err = safeBuf.validate();
    TEST_ASSERT(err == AudioError::OK);
    
    output[20] = std::nanf("");
    err = safeBuf.validate();
    TEST_ASSERT(err == AudioError::NAN_DETECTED);
    output[20] = 0.0f; // Reset
    
    // Test AlignedAudioBuffer
    AlignedAudioBuffer<float> alignedBuf(1024);
    TEST_ASSERT(alignedBuf.size() == 1024);
    TEST_ASSERT(alignedBuf.data() != nullptr);
    
    // Check alignment (should be 64-byte aligned for SIMD)
    TEST_ASSERT(reinterpret_cast<uintptr_t>(alignedBuf.data()) % 64 == 0);
    
    return true;
}

// Test 3: Thread safety
bool testThreadSafety() {
    ThreadSafeBiquadFilter filter;
    
    // Configure filter
    filter.calculateLowpass(1000, 48000, 0.707);
    
    const size_t bufferSize = 512;
    const int numThreads = 4;
    const int iterationsPerThread = 100;
    
    std::vector<std::thread> threads;
    std::atomic<int> successCount(0);
    std::atomic<int> busyCount(0);
    
    // Launch multiple threads trying to process simultaneously
    for (int t = 0; t < numThreads; ++t) {
        threads.emplace_back([&, t]() {
            std::vector<float> input(bufferSize);
            std::vector<float> output(bufferSize);
            
            // Generate test signal
            for (size_t i = 0; i < bufferSize; ++i) {
                input[i] = std::sin(2.0f * M_PI * 440.0f * i / 48000.0f);
            }
            
            for (int iter = 0; iter < iterationsPerThread; ++iter) {
                AudioError err = filter.process(input.data(), output.data(), bufferSize);
                
                if (err == AudioError::OK) {
                    successCount++;
                } else if (err == AudioError::RESOURCE_BUSY) {
                    busyCount++;
                } else {
                    // Unexpected error
                    TEST_ASSERT(false);
                }
                
                // Small delay to increase contention
                std::this_thread::sleep_for(std::chrono::microseconds(10));
            }
        });
    }
    
    // Wait for all threads
    for (auto& t : threads) {
        t.join();
    }
    
    // Verify results
    int totalAttempts = numThreads * iterationsPerThread;
    TEST_ASSERT(successCount + busyCount == totalAttempts);
    
    std::cout << "\n  Thread safety stats: " 
              << successCount << " successful, " 
              << busyCount << " busy (expected behavior)" << std::endl;
    
    // Test lock-free version
    LockFreeBiquadFilter lockFreeFilter;
    
    // This should never block
    std::vector<float> input(bufferSize, 0.5f);
    std::vector<float> output(bufferSize);
    
    // Multiple threads processing simultaneously
    threads.clear();
    std::atomic<bool> allSuccess(true);
    
    for (int t = 0; t < numThreads; ++t) {
        threads.emplace_back([&]() {
            std::vector<float> localInput(bufferSize, 0.5f);
            std::vector<float> localOutput(bufferSize);
            
            for (int iter = 0; iter < iterationsPerThread; ++iter) {
                lockFreeFilter.process(localInput.data(), localOutput.data(), bufferSize);
                
                // Verify output is reasonable (not NaN/Inf)
                for (size_t i = 0; i < bufferSize; ++i) {
                    if (!std::isfinite(localOutput[i])) {
                        allSuccess = false;
                        break;
                    }
                }
            }
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    TEST_ASSERT(allSuccess);
    
    return true;
}

// Test 4: Merge conflict resolution
bool testMergeConflictResolution() {
    // Test that constants are properly defined after merge conflict resolution
    
    // These should be defined
    TEST_ASSERT(AudioFX::DEFAULT_DELAY_MS == 100.0);
    TEST_ASSERT(AudioFX::DEFAULT_FEEDBACK == 0.5);
    TEST_ASSERT(AudioFX::DEFAULT_MIX == 0.5);
    
    // New utility constants should use numeric_limits
    TEST_ASSERT(AudioFX::FLOAT_MAX == std::numeric_limits<float>::max());
    TEST_ASSERT(AudioFX::FLOAT_MIN == std::numeric_limits<float>::lowest());
    TEST_ASSERT(AudioFX::FLOAT_EPSILON == std::numeric_limits<float>::epsilon());
    
    // Performance constants should still be there
    TEST_ASSERT(AudioFX::UNROLL_BLOCK_SIZE == 4);
    TEST_ASSERT(AudioFX::PREFETCH_DISTANCE == 64);
    
    return true;
}

// Test 5: Integration test
bool testIntegration() {
    // Test that all components work together
    
    // Create safe filter
    BiquadFilterSafe filter;
    
    // Configure with validation
    AudioError err = filter.calculateLowpassSafe(1000, 48000, 0.707);
    TEST_ASSERT(err == AudioError::OK);
    
    // Create aligned buffer
    AlignedAudioBuffer<float> inputBuf(1024);
    AlignedAudioBuffer<float> outputBuf(1024);
    
    // Fill with test signal
    for (size_t i = 0; i < inputBuf.size(); ++i) {
        inputBuf.data()[i] = std::sin(2.0f * M_PI * 440.0f * i / 48000.0f) * 0.5f;
    }
    
    // Process with bounds checking
    err = filter.processSafe(inputBuf.data(), outputBuf.data(), inputBuf.size());
    TEST_ASSERT(err == AudioError::OK);
    
    // Validate output
    SafeAudioBuffer<float> safeOut = outputBuf.getSafe();
    err = safeOut.validate();
    TEST_ASSERT(err == AudioError::OK);
    
    // Check output is reasonable
    for (size_t i = 0; i < outputBuf.size(); ++i) {
        TEST_ASSERT(std::abs(outputBuf.data()[i]) <= 10.0f); // Within clamp range
    }
    
    return true;
}

// Performance test
bool testPerformance() {
    const size_t bufferSize = 512;
    const int iterations = 10000;
    
    std::vector<float> input(bufferSize);
    std::vector<float> output(bufferSize);
    
    // Generate test signal
    for (size_t i = 0; i < bufferSize; ++i) {
        input[i] = std::sin(2.0f * M_PI * 440.0f * i / 48000.0f);
    }
    
    // Test unsafe version performance
    BiquadFilter unsafeFilter;
    unsafeFilter.calculateLowpass(1000, 48000, 0.707);
    
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        unsafeFilter.process(input.data(), output.data(), bufferSize);
    }
    auto end = std::chrono::high_resolution_clock::now();
    auto unsafeTime = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
    
    // Test safe version performance
    BiquadFilterSafe safeFilter;
    safeFilter.calculateLowpassSafe(1000, 48000, 0.707);
    
    start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        AudioError err = safeFilter.processSafe(input.data(), output.data(), bufferSize);
        if (err != AudioError::OK) {
            TEST_ASSERT(false);
        }
    }
    end = std::chrono::high_resolution_clock::now();
    auto safeTime = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
    
    double overhead = (double)(safeTime - unsafeTime) / unsafeTime * 100.0;
    
    std::cout << "\n  Performance comparison:" << std::endl;
    std::cout << "    Unsafe: " << unsafeTime << " μs" << std::endl;
    std::cout << "    Safe:   " << safeTime << " μs" << std::endl;
    std::cout << "    Overhead: " << overhead << "%" << std::endl;
    
    // Accept up to 50% overhead for safety
    TEST_ASSERT(overhead < 50.0);
    
    return true;
}

// Main test runner
int main() {
    std::cout << "=== AudioFX Corrections Test Suite ===" << std::endl;
    std::cout << "Testing critical corrections applied to the system\n" << std::endl;
    
    int passed = 0, failed = 0, total = 0;
    
    // Run all tests
    RUN_TEST(testErrorCodeSystem);
    RUN_TEST(testBoundsChecking);
    RUN_TEST(testThreadSafety);
    RUN_TEST(testMergeConflictResolution);
    RUN_TEST(testIntegration);
    RUN_TEST(testPerformance);
    
    // Print summary
    std::cout << "\n=== Test Summary ===" << std::endl;
    std::cout << "Total:  " << total << std::endl;
    std::cout << "Passed: " << passed << std::endl;
    std::cout << "Failed: " << failed << std::endl;
    
    if (failed == 0) {
        std::cout << "\n✅ All tests PASSED! The corrections are working correctly." << std::endl;
        return 0;
    } else {
        std::cout << "\n❌ Some tests FAILED. Please review the corrections." << std::endl;
        return 1;
    }
}