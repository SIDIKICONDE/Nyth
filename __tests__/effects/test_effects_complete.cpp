#include "../../shared/Audio/effects/EffectBase.hpp"
#include "../../shared/Audio/effects/Compressor.hpp"
#include "../../shared/Audio/effects/Delay.hpp"
#include "../../shared/Audio/effects/EffectChain.hpp"
#include "../../shared/Audio/effects/EffectConstants.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <chrono>
#include <memory>
#include <cstdint>
#include <cstddef>

// Définir M_PI si non défini
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

class EffectsTest {
private:
    static constexpr double EPSILON = 1e-6;
    static constexpr size_t TEST_BUFFER_SIZE = 1024;
    static constexpr uint32_t TEST_SAMPLE_RATE = 48000;
    
    std::vector<float> m_inputBuffer;
    std::vector<float> m_outputBuffer;
    std::vector<float> m_inputBufferL;
    std::vector<float> m_inputBufferR;
    std::vector<float> m_outputBufferL;
    std::vector<float> m_outputBufferR;
    
    void generateTestSignal() {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
        
        m_inputBuffer.resize(TEST_BUFFER_SIZE);
        m_outputBuffer.resize(TEST_BUFFER_SIZE);
        m_inputBufferL.resize(TEST_BUFFER_SIZE);
        m_inputBufferR.resize(TEST_BUFFER_SIZE);
        m_outputBufferL.resize(TEST_BUFFER_SIZE);
        m_outputBufferR.resize(TEST_BUFFER_SIZE);
        
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            m_inputBuffer[i] = dist(gen);
            m_inputBufferL[i] = dist(gen);
            m_inputBufferR[i] = dist(gen);
        }
    }
    
public:
    EffectsTest() {
        generateTestSignal();
    }
    
    void testEffectBaseConstruction() {
        std::cout << "🧪 Test 1: EffectBase Construction...\n";
        
        AudioFX::IAudioEffect effect;
        assert(effect.isEnabled());
        
        effect.setSampleRate(44100, 2);
        effect.setEnabled(false);
        assert(!effect.isEnabled());
        
        std::cout << "✅ EffectBase Construction OK\n";
    }
    
    void testEffectBaseProcessing() {
        std::cout << "🧪 Test 2: EffectBase Processing...\n";
        
        AudioFX::IAudioEffect effect;
        effect.setSampleRate(TEST_SAMPLE_RATE, 1);
        
        // Test mono processing
        std::span<const float> inputSpan(m_inputBuffer);
        std::span<float> outputSpan(m_outputBuffer);
        
        effect.processMono(inputSpan, outputSpan);
        
        // Verify passthrough behavior
        bool passthroughWorking = true;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(m_outputBuffer[i] - m_inputBuffer[i]) > EPSILON) {
                passthroughWorking = false;
                break;
            }
        }
        assert(passthroughWorking);
        
        // Test stereo processing
        std::span<const float> inputLSpan(m_inputBufferL);
        std::span<const float> inputRSpan(m_inputBufferR);
        std::span<float> outputLSpan(m_outputBufferL);
        std::span<float> outputRSpan(m_outputBufferR);
        
        effect.processStereo(inputLSpan, inputRSpan, outputLSpan, outputRSpan);
        
        // Verify stereo passthrough
        bool stereoPassthroughWorking = true;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(m_outputBufferL[i] - m_inputBufferL[i]) > EPSILON ||
                std::abs(m_outputBufferR[i] - m_inputBufferR[i]) > EPSILON) {
                stereoPassthroughWorking = false;
                break;
            }
        }
        assert(stereoPassthroughWorking);
        
        std::cout << "✅ EffectBase Processing OK\n";
    }
    
    void testCompressorConstruction() {
        std::cout << "🧪 Test 3: Compressor Construction...\n";
        
        AudioFX::CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);
        
        // Test default parameters
        compressor.setParameters(-20.0, 4.0, 10.0, 100.0, 0.0);
        
        std::cout << "✅ Compressor Construction OK\n";
    }
    
    void testCompressorProcessing() {
        std::cout << "🧪 Test 4: Compressor Processing...\n";
        
        AudioFX::CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 1);
        compressor.setParameters(-20.0, 4.0, 10.0, 100.0, 0.0);
        
        // Create a loud signal to test compression
        std::vector<float> loudInput(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            loudInput[i] = 0.8f * std::sin(2.0f * M_PI * 440.0f * i / TEST_SAMPLE_RATE);
        }
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        std::span<const float> inputSpan(loudInput);
        std::span<float> outputSpan(output);
        
        compressor.processMono(inputSpan, outputSpan);
        
        // Verify that compression occurred (output should be different from input)
        bool compressionOccurred = false;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(output[i] - loudInput[i]) > EPSILON) {
                compressionOccurred = true;
                break;
            }
        }
        assert(compressionOccurred);
        
        std::cout << "✅ Compressor Processing OK\n";
    }
    
    void testCompressorStereoProcessing() {
        std::cout << "🧪 Test 5: Compressor Stereo Processing...\n";
        
        AudioFX::CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);
        compressor.setParameters(-30.0, 4.0, 10.0, 100.0, 0.0); // Seuil plus bas
        
        // Create loud stereo signal
        std::vector<float> loudInputL(TEST_BUFFER_SIZE);
        std::vector<float> loudInputR(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            loudInputL[i] = 0.95f * std::sin(2.0f * M_PI * 440.0f * i / TEST_SAMPLE_RATE);
            loudInputR[i] = 0.95f * std::sin(2.0f * M_PI * 880.0f * i / TEST_SAMPLE_RATE);
        }
        
        std::vector<float> outputL(TEST_BUFFER_SIZE);
        std::vector<float> outputR(TEST_BUFFER_SIZE);
        
        std::span<const float> inputLSpan(loudInputL);
        std::span<const float> inputRSpan(loudInputR);
        std::span<float> outputLSpan(outputL);
        std::span<float> outputRSpan(outputR);
        
        compressor.processStereoModern(inputLSpan, inputRSpan, outputLSpan, outputRSpan);
        
        // Verify stereo compression occurred
        bool stereoCompressionOccurred = false;
        size_t differencesFound = 0;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(outputL[i] - loudInputL[i]) > EPSILON ||
                std::abs(outputR[i] - loudInputR[i]) > EPSILON) {
                stereoCompressionOccurred = true;
                differencesFound++;
                if (differencesFound <= 5) {
                    std::cout << "  Diff L[" << i << "]: " << outputL[i] << " vs " << loudInputL[i] << std::endl;
                    std::cout << "  Diff R[" << i << "]: " << outputR[i] << " vs " << loudInputR[i] << std::endl;
                }
            }
        }
        std::cout << "  Differences found: " << differencesFound << "/100" << std::endl;
        assert(stereoCompressionOccurred);
        
        std::cout << "✅ Compressor Stereo Processing OK\n";
    }
    
    void testDelayConstruction() {
        std::cout << "🧪 Test 6: Delay Construction...\n";
        
        AudioFX::DelayEffect delay;
        delay.setSampleRate(TEST_SAMPLE_RATE, 2);
        
        // Test default parameters
        delay.setParameters(100.0, 0.3, 0.5);
        
        std::cout << "✅ Delay Construction OK\n";
    }
    
    void testDelayProcessing() {
        std::cout << "🧪 Test 7: Delay Processing...\n";
        
        AudioFX::DelayEffect delay;
        delay.setSampleRate(TEST_SAMPLE_RATE, 1);
        delay.setParameters(100.0, 0.3, 0.5);
        
        // Create a test signal
        std::vector<float> testInput(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            testInput[i] = 0.5f * std::sin(2.0f * M_PI * 440.0f * i / TEST_SAMPLE_RATE);
        }
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        std::span<const float> inputSpan(testInput);
        std::span<float> outputSpan(output);
        
        delay.processMono(inputSpan, outputSpan);
        
        // Verify that delay processing occurred
        bool delayProcessingOccurred = false;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(output[i] - testInput[i]) > EPSILON) {
                delayProcessingOccurred = true;
                break;
            }
        }
        assert(delayProcessingOccurred);
        
        std::cout << "✅ Delay Processing OK\n";
    }
    
    void testDelayStereoProcessing() {
        std::cout << "🧪 Test 8: Delay Stereo Processing...\n";
        
        AudioFX::DelayEffect delay;
        delay.setSampleRate(TEST_SAMPLE_RATE, 2);
        delay.setParameters(100.0, 0.3, 0.8); // Mix plus élevé
        
        // Create stereo test signal
        std::vector<float> testInputL(TEST_BUFFER_SIZE);
        std::vector<float> testInputR(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            testInputL[i] = 0.5f * std::sin(2.0f * M_PI * 440.0f * i / TEST_SAMPLE_RATE);
            testInputR[i] = 0.5f * std::sin(2.0f * M_PI * 880.0f * i / TEST_SAMPLE_RATE);
        }
        
        std::vector<float> outputL(TEST_BUFFER_SIZE);
        std::vector<float> outputR(TEST_BUFFER_SIZE);
        
        std::span<const float> inputLSpan(testInputL);
        std::span<const float> inputRSpan(testInputR);
        std::span<float> outputLSpan(outputL);
        std::span<float> outputRSpan(outputR);
        
        delay.processStereoModern(inputLSpan, inputRSpan, outputLSpan, outputRSpan);
        
        // Verify stereo delay processing occurred
        bool stereoDelayProcessingOccurred = false;
        size_t delayDifferencesFound = 0;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(outputL[i] - testInputL[i]) > EPSILON ||
                std::abs(outputR[i] - testInputR[i]) > EPSILON) {
                stereoDelayProcessingOccurred = true;
                delayDifferencesFound++;
                if (delayDifferencesFound <= 5) {
                    std::cout << "  Delay Diff L[" << i << "]: " << outputL[i] << " vs " << testInputL[i] << std::endl;
                    std::cout << "  Delay Diff R[" << i << "]: " << outputR[i] << " vs " << testInputR[i] << std::endl;
                }
            }
        }
        std::cout << "  Delay Differences found: " << delayDifferencesFound << "/100" << std::endl;
        assert(stereoDelayProcessingOccurred);
        
        std::cout << "✅ Delay Stereo Processing OK\n";
    }
    
    void testEffectChainConstruction() {
        std::cout << "🧪 Test 9: EffectChain Construction...\n";
        
        AudioFX::EffectChain chain;
        chain.setSampleRate(TEST_SAMPLE_RATE, 2);
        
        // Add effects to chain
        auto* compressor = chain.emplaceEffect<AudioFX::CompressorEffect>();
        auto* delay = chain.emplaceEffect<AudioFX::DelayEffect>();
        
        assert(compressor != nullptr);
        assert(delay != nullptr);
        
        // Configure effects
        compressor->setParameters(-20.0, 4.0, 10.0, 100.0, 0.0);
        delay->setParameters(100.0, 0.3, 0.5);
        
        std::cout << "✅ EffectChain Construction OK\n";
    }
    
    void testEffectChainProcessing() {
        std::cout << "🧪 Test 10: EffectChain Processing...\n";
        
        AudioFX::EffectChain chain;
        chain.setSampleRate(TEST_SAMPLE_RATE, 1);
        
        // Add effects to chain
        auto* compressor = chain.emplaceEffect<AudioFX::CompressorEffect>();
        auto* delay = chain.emplaceEffect<AudioFX::DelayEffect>();
        
        compressor->setParameters(-20.0, 4.0, 10.0, 100.0, 0.0);
        delay->setParameters(100.0, 0.3, 0.5);
        
        // Create test signal
        std::vector<float> testInput(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            testInput[i] = 0.8f * std::sin(2.0f * M_PI * 440.0f * i / TEST_SAMPLE_RATE);
        }
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        std::span<const float> inputSpan(testInput);
        std::span<float> outputSpan(output);
        
        chain.processMono(inputSpan, outputSpan);
        
        // Verify chain processing occurred
        bool chainProcessingOccurred = false;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(output[i] - testInput[i]) > EPSILON) {
                chainProcessingOccurred = true;
                break;
            }
        }
        assert(chainProcessingOccurred);
        
        std::cout << "✅ EffectChain Processing OK\n";
    }
    
    void testEffectChainStereoProcessing() {
        std::cout << "🧪 Test 11: EffectChain Stereo Processing...\n";
        
        AudioFX::EffectChain chain;
        chain.setSampleRate(TEST_SAMPLE_RATE, 2);
        
        // Add effects to chain
        auto* compressor = chain.emplaceEffect<AudioFX::CompressorEffect>();
        auto* delay = chain.emplaceEffect<AudioFX::DelayEffect>();
        
        compressor->setParameters(-20.0, 4.0, 10.0, 100.0, 0.0);
        delay->setParameters(100.0, 0.3, 0.5);
        
        // Create stereo test signal
        std::vector<float> testInputL(TEST_BUFFER_SIZE);
        std::vector<float> testInputR(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            testInputL[i] = 0.8f * std::sin(2.0f * M_PI * 440.0f * i / TEST_SAMPLE_RATE);
            testInputR[i] = 0.8f * std::sin(2.0f * M_PI * 880.0f * i / TEST_SAMPLE_RATE);
        }
        
        std::vector<float> outputL(TEST_BUFFER_SIZE);
        std::vector<float> outputR(TEST_BUFFER_SIZE);
        
        std::span<const float> inputLSpan(testInputL);
        std::span<const float> inputRSpan(testInputR);
        std::span<float> outputLSpan(outputL);
        std::span<float> outputRSpan(outputR);
        
        chain.processStereo(inputLSpan, inputRSpan, outputLSpan, outputRSpan);
        
        // Verify stereo chain processing occurred
        bool stereoChainProcessingOccurred = false;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(outputL[i] - testInputL[i]) > EPSILON ||
                std::abs(outputR[i] - testInputR[i]) > EPSILON) {
                stereoChainProcessingOccurred = true;
                break;
            }
        }
        assert(stereoChainProcessingOccurred);
        
        std::cout << "✅ EffectChain Stereo Processing OK\n";
    }
    
    void testPerformance() {
        std::cout << "🧪 Test 12: Performance Test...\n";
        
        AudioFX::EffectChain chain;
        chain.setSampleRate(TEST_SAMPLE_RATE, 2);
        
        // Add multiple effects
        auto* compressor = chain.emplaceEffect<AudioFX::CompressorEffect>();
        auto* delay = chain.emplaceEffect<AudioFX::DelayEffect>();
        
        compressor->setParameters(-20.0, 4.0, 10.0, 100.0, 0.0);
        delay->setParameters(100.0, 0.3, 0.5);
        
        // Performance test
        auto start = std::chrono::high_resolution_clock::now();
        
        for (int i = 0; i < 50; ++i) {
            std::span<const float> inputLSpan(m_inputBufferL);
            std::span<const float> inputRSpan(m_inputBufferR);
            std::span<float> outputLSpan(m_outputBufferL);
            std::span<float> outputRSpan(m_outputBufferR);
            
            chain.processStereo(inputLSpan, inputRSpan, outputLSpan, outputRSpan);
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        
        // Verify reasonable performance
        assert(duration.count() < 1000000); // Less than 1 second
        
        std::cout << "✅ Performance Test OK (" << duration.count() << " microseconds)\n";
    }
    
    void testStability() {
        std::cout << "🧪 Test 13: Stability Test...\n";
        
        AudioFX::CompressorEffect compressor;
        AudioFX::DelayEffect delay;
        
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);
        delay.setSampleRate(TEST_SAMPLE_RATE, 2);
        
        // Configure extreme settings
        compressor.setParameters(-60.0, 20.0, 1.0, 1000.0, 24.0);
        delay.setParameters(1000.0, 0.9, 0.9);
        
        // Process with extreme settings
        std::span<const float> inputSpan(m_inputBuffer);
        std::span<float> outputSpan(m_outputBuffer);
        
        // Should not crash or produce NaN/Inf values
        compressor.processMono(inputSpan, outputSpan);
        delay.processMono(inputSpan, outputSpan);
        
        // Check for NaN or Inf values
        bool hasInvalidValues = false;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            if (std::isnan(m_outputBuffer[i]) || std::isinf(m_outputBuffer[i])) {
                hasInvalidValues = true;
                break;
            }
        }
        assert(!hasInvalidValues);
        
        std::cout << "✅ Stability Test OK\n";
    }
    
    void testParameterValidation() {
        std::cout << "🧪 Test 14: Parameter Validation...\n";
        
        AudioFX::CompressorEffect compressor;
        AudioFX::DelayEffect delay;
        
        // Test parameter clamping
        compressor.setParameters(-100.0, 100.0, -10.0, -10.0, 100.0);
        delay.setParameters(-100.0, 2.0, 2.0);
        
        // Should not crash with invalid parameters
        std::span<const float> inputSpan(m_inputBuffer);
        std::span<float> outputSpan(m_outputBuffer);
        
        compressor.processMono(inputSpan, outputSpan);
        delay.processMono(inputSpan, outputSpan);
        
        // Check for valid output
        bool hasValidOutput = true;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::isnan(m_outputBuffer[i]) || std::isinf(m_outputBuffer[i])) {
                hasValidOutput = false;
                break;
            }
        }
        assert(hasValidOutput);
        
        std::cout << "✅ Parameter Validation OK\n";
    }
    
    void testIntegration() {
        std::cout << "🧪 Test 15: Integration Test...\n";
        
        AudioFX::EffectChain chain;
        chain.setSampleRate(TEST_SAMPLE_RATE, 2);
        
        // Create a complex chain
        auto* compressor1 = chain.emplaceEffect<AudioFX::CompressorEffect>();
        auto* delay1 = chain.emplaceEffect<AudioFX::DelayEffect>();
        auto* compressor2 = chain.emplaceEffect<AudioFX::CompressorEffect>();
        auto* delay2 = chain.emplaceEffect<AudioFX::DelayEffect>();
        
        // Configure different settings
        compressor1->setParameters(-20.0, 4.0, 10.0, 100.0, 0.0);
        delay1->setParameters(100.0, 0.3, 0.5);
        compressor2->setParameters(-30.0, 2.0, 5.0, 50.0, 3.0);
        delay2->setParameters(200.0, 0.2, 0.3);
        
        // Process complex chain
        std::span<const float> inputLSpan(m_inputBufferL);
        std::span<const float> inputRSpan(m_inputBufferR);
        std::span<float> outputLSpan(m_outputBufferL);
        std::span<float> outputRSpan(m_outputBufferR);
        
        chain.processStereo(inputLSpan, inputRSpan, outputLSpan, outputRSpan);
        
        // Verify complex processing occurred
        bool complexProcessingOccurred = false;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(m_outputBufferL[i] - m_inputBufferL[i]) > EPSILON ||
                std::abs(m_outputBufferR[i] - m_inputBufferR[i]) > EPSILON) {
                complexProcessingOccurred = true;
                break;
            }
        }
        assert(complexProcessingOccurred);
        
        std::cout << "✅ Integration Test OK\n";
    }
    
    void runAllTests() {
        std::cout << "🎯 TESTS UNITAIRES - MODULE EFFECTS (QUALITÉ PRODUCTION)\n";
        std::cout << "========================================================\n\n";
        
        try {
            testEffectBaseConstruction();
            testEffectBaseProcessing();
            testCompressorConstruction();
            testCompressorProcessing();
            testCompressorStereoProcessing();
            testDelayConstruction();
            testDelayProcessing();
            testDelayStereoProcessing();
            testEffectChainConstruction();
            testEffectChainProcessing();
            testEffectChainStereoProcessing();
            testPerformance();
            testStability();
            testParameterValidation();
            testIntegration();
            
            std::cout << "\n🎉 TOUS LES TESTS EFFECTS PASSÉS AVEC SUCCÈS !\n";
            std::cout << "✅ Module Effects prêt pour la production\n";
            
        } catch (const std::exception& e) {
            std::cerr << "\n❌ ERREUR DANS LES TESTS: " << e.what() << std::endl;
            throw;
        } catch (...) {
            std::cerr << "\n❌ ERREUR INCONNUE DANS LES TESTS" << std::endl;
            throw;
        }
    }
};

int main() {
    EffectsTest test;
    test.runAllTests();
    return 0;
}
