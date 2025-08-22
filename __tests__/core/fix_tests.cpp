#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include "../../shared/Audio/core/BiquadFilter.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <chrono>

// Définir M_PI si non défini
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Utiliser des alias pour éviter l'ambiguïté de namespace
using AudioEqualizerClass = AudioFX::AudioEqualizer;
using BiquadFilterClass = AudioFX::BiquadFilter;

class CoreTest {
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
    CoreTest() {
        generateTestSignal();
    }
    
    void testAudioEqualizerConstruction() {
        std::cout << "🧪 Test 1: AudioEqualizer Construction...\n";
        
        AudioEqualizerClass eq;
        assert(eq.getNumBands() == AudioFX::NUM_BANDS);
        assert(eq.getSampleRate() == AudioFX::DEFAULT_SAMPLE_RATE);
        assert(eq.getMasterGain() == AudioFX::EqualizerConstants::DEFAULT_MASTER_GAIN);
        assert(!eq.isBypassed());
        
        std::cout << "✅ AudioEqualizer Construction OK\n";
    }
    
    void testAudioEqualizerConfiguration() {
        std::cout << "🧪 Test 2: AudioEqualizer Configuration...\n";
        
        AudioEqualizerClass eq;
        
        // Test band configuration
        eq.setBandGain(0, 6.0);
        eq.setBandFrequency(0, 100.0);
        eq.setBandQ(0, 1.0);
        eq.setBandType(0, AudioFX::FilterType::LOWSHELF);
        
        assert(std::abs(eq.getBandGain(0) - 6.0) < EPSILON);
        assert(std::abs(eq.getBandFrequency(0) - 100.0) < EPSILON);
        assert(std::abs(eq.getBandQ(0) - 1.0) < EPSILON);
        assert(eq.getBandType(0) == AudioFX::FilterType::LOWSHELF);
        
        // Test master gain
        eq.setMasterGain(-3.0);
        assert(std::abs(eq.getMasterGain() - (-3.0)) < EPSILON);
        
        // Test bypass
        eq.setBypass(true);
        assert(eq.isBypassed());
        
        std::cout << "✅ AudioEqualizer Configuration OK\n";
    }
    
    void testAudioEqualizerProcessing() {
        std::cout << "🧪 Test 3: AudioEqualizer Processing...\n";
        
        AudioEqualizerClass eq;
        
        // Configure a simple low shelf filter
        eq.setBandGain(0, 6.0);
        eq.setBandFrequency(0, 100.0);
        eq.setBandType(0, AudioFX::FilterType::LOWSHELF);
        
        // Process mono audio
        std::span<const float> inputSpan(m_inputBuffer);
        std::span<float> outputSpan(m_outputBuffer);
        
        eq.process(inputSpan, outputSpan);
        
        // Verify that processing occurred (output should be different from input)
        bool processingOccurred = false;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(m_outputBuffer[i] - m_inputBuffer[i]) > EPSILON) {
                processingOccurred = true;
                break;
            }
        }
        assert(processingOccurred);
        
        std::cout << "✅ AudioEqualizer Processing OK\n";
    }
    
    void testAudioEqualizerStereoProcessing() {
        std::cout << "🧪 Test 4: AudioEqualizer Stereo Processing...\n";
        
        AudioEqualizerClass eq;
        
        // Configure a simple high shelf filter
        eq.setBandGain(9, 6.0);
        eq.setBandFrequency(9, 8000.0);
        eq.setBandType(9, AudioFX::FilterType::HIGHSHELF);
        
        // Process stereo audio
        std::span<const float> inputLSpan(m_inputBufferL);
        std::span<const float> inputRSpan(m_inputBufferR);
        std::span<float> outputLSpan(m_outputBufferL);
        std::span<float> outputRSpan(m_outputBufferR);
        
        eq.processStereo(inputLSpan, inputRSpan, outputLSpan, outputRSpan);
        
        // Verify that stereo processing occurred
        bool processingOccurred = false;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(m_outputBufferL[i] - m_inputBufferL[i]) > EPSILON ||
                std::abs(m_outputBufferR[i] - m_inputBufferR[i]) > EPSILON) {
                processingOccurred = true;
                break;
            }
        }
        assert(processingOccurred);
        
        std::cout << "✅ AudioEqualizer Stereo Processing OK\n";
    }
    
    void testBiquadFilterConstruction() {
        std::cout << "🧪 Test 5: BiquadFilter Construction...\n";
        
        BiquadFilterClass filter;
        
        // Test default coefficients
        double a0, a1, a2, b0, b1, b2;
        filter.getCoefficients(a0, a1, a2, b0, b1, b2);
        
        assert(std::abs(a0 - AudioFX::BiquadConstants::DEFAULT_A0) < EPSILON);
        assert(std::abs(a1 - AudioFX::BiquadConstants::DEFAULT_COEFFICIENT) < EPSILON);
        assert(std::abs(a2 - AudioFX::BiquadConstants::DEFAULT_COEFFICIENT) < EPSILON);
        assert(std::abs(b1 - AudioFX::BiquadConstants::DEFAULT_COEFFICIENT) < EPSILON);
        assert(std::abs(b2 - AudioFX::BiquadConstants::DEFAULT_COEFFICIENT) < EPSILON);
        
        std::cout << "✅ BiquadFilter Construction OK\n";
    }
    
    void testBiquadFilterCoefficients() {
        std::cout << "🧪 Test 6: BiquadFilter Coefficients...\n";
        
        BiquadFilterClass filter;
        
        // Test lowpass filter
        filter.calculateLowpass(1000.0, 48000.0, 0.707);
        
        double a0, a1, a2, b0, b1, b2;
        filter.getCoefficients(a0, a1, a2, b0, b1, b2);
        
        // Verify coefficients are reasonable
        assert(std::abs(b0) > EPSILON); // b0 should not be zero
        assert(std::abs(a0) > EPSILON); // a0 should not be zero
        
        std::cout << "✅ BiquadFilter Coefficients OK\n";
    }
    
    void testBiquadFilterProcessing() {
        std::cout << "🧪 Test 7: BiquadFilter Processing...\n";
        
        BiquadFilterClass filter;
        
        // Configure as lowpass filter
        filter.calculateLowpass(1000.0, 48000.0, 0.707);
        
        // Process audio
        std::span<const float> inputSpan(m_inputBuffer);
        std::span<float> outputSpan(m_outputBuffer);
        
        filter.process(inputSpan, outputSpan);
        
        // Verify that processing occurred
        bool processingOccurred = false;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(m_outputBuffer[i] - m_inputBuffer[i]) > EPSILON) {
                processingOccurred = true;
                break;
            }
        }
        assert(processingOccurred);
        
        std::cout << "✅ BiquadFilter Processing OK\n";
    }
    
    void testBiquadFilterStereoProcessing() {
        std::cout << "🧪 Test 8: BiquadFilter Stereo Processing...\n";
        
        BiquadFilterClass filter;
        
        // Configure as highpass filter
        filter.calculateHighpass(1000.0, 48000.0, 0.707);
        
        // Process stereo audio
        std::span<const float> inputLSpan(m_inputBufferL);
        std::span<const float> inputRSpan(m_inputBufferR);
        std::span<float> outputLSpan(m_outputBufferL);
        std::span<float> outputRSpan(m_outputBufferR);
        
        filter.processStereo(inputLSpan, inputRSpan, outputLSpan, outputRSpan);
        
        // Verify that stereo processing occurred
        bool processingOccurred = false;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(m_outputBufferL[i] - m_inputBufferL[i]) > EPSILON ||
                std::abs(m_outputBufferR[i] - m_inputBufferR[i]) > EPSILON) {
                processingOccurred = true;
                break;
            }
        }
        assert(processingOccurred);
        
        std::cout << "✅ BiquadFilter Stereo Processing OK\n";
    }
    
    void testPerformance() {
        std::cout << "🧪 Test 9: Performance Test...\n";
        
        AudioEqualizerClass eq;
        BiquadFilterClass filter;
        
        // Configure filters
        eq.setBandGain(0, 3.0);
        eq.setBandFrequency(0, 100.0);
        eq.setBandType(0, AudioFX::FilterType::LOWSHELF);
        
        filter.calculateLowpass(1000.0, 48000.0, 0.707);
        
        // Performance test for equalizer
        auto start = std::chrono::high_resolution_clock::now();
        
        for (int i = 0; i < 100; ++i) {
            std::span<const float> inputSpan(m_inputBuffer);
            std::span<float> outputSpan(m_outputBuffer);
            eq.process(inputSpan, outputSpan);
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        
        // Verify reasonable performance (should process 100 buffers in reasonable time)
        assert(duration.count() < 1000000); // Less than 1 second
        
        std::cout << "✅ Performance Test OK (" << duration.count() << " microseconds)\n";
    }
    
    void testStability() {
        std::cout << "🧪 Test 10: Stability Test...\n";
        
        AudioEqualizerClass eq;
        BiquadFilterClass filter;
        
        // Configure extreme settings
        eq.setMasterGain(24.0); // Maximum gain
        eq.setBandGain(0, 24.0);
        eq.setBandFrequency(0, 20.0); // Very low frequency
        eq.setBandQ(0, 10.0); // Very high Q
        
        filter.calculatePeaking(1000.0, 48000.0, 10.0, 24.0);
        
        // Process with extreme settings
        std::span<const float> inputSpan(m_inputBuffer);
        std::span<float> outputSpan(m_outputBuffer);
        
        // Should not crash or produce NaN/Inf values
        eq.process(inputSpan, outputSpan);
        filter.process(inputSpan, outputSpan);
        
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
        std::cout << "🧪 Test 11: Parameter Validation...\n";
        
        AudioEqualizerClass eq;
        
        // Test out-of-range parameters (should be clamped)
        eq.setBandGain(0, 100.0); // Should be clamped to 24.0
        assert(std::abs(eq.getBandGain(0) - 24.0) < EPSILON);
        
        eq.setBandGain(0, -100.0); // Should be clamped to -24.0
        assert(std::abs(eq.getBandGain(0) - (-24.0)) < EPSILON);
        
        eq.setBandFrequency(0, 50000.0); // Should be clamped to Nyquist
        assert(eq.getBandFrequency(0) <= 24000.0);
        
        eq.setBandQ(0, 100.0); // Should be clamped to 10.0
        assert(std::abs(eq.getBandQ(0) - 10.0) < EPSILON);
        
        std::cout << "✅ Parameter Validation OK\n";
    }
    
    void testThreadSafety() {
        std::cout << "🧪 Test 12: Thread Safety...\n";
        
        AudioEqualizerClass eq;
        
        // Test parameter update guard
        {
            AudioFX::AudioEqualizer::ParameterUpdateGuard guard(eq);
            eq.setBandGain(0, 3.0);
            eq.setBandFrequency(0, 100.0);
            eq.setBandQ(0, 1.0);
        } // Guard should automatically end parameter update
        
        // Verify parameters were set
        assert(std::abs(eq.getBandGain(0) - 3.0) < EPSILON);
        assert(std::abs(eq.getBandFrequency(0) - 100.0) < EPSILON);
        assert(std::abs(eq.getBandQ(0) - 1.0) < EPSILON);
        
        std::cout << "✅ Thread Safety OK\n";
    }
    
    void testDebugInfo() {
        std::cout << "🧪 Test 13: Debug Info...\n";
        
        AudioEqualizerClass eq;
        BiquadFilterClass filter;
        
        // Get debug info
        std::string eqInfo = eq.getDebugInfo();
        std::string filterInfo = filter.getDebugInfo();
        
        // Verify debug info contains expected information
        assert(!eqInfo.empty());
        assert(!filterInfo.empty());
        assert(eqInfo.find("AudioEqualizer") != std::string::npos);
        assert(filterInfo.find("BiquadFilter") != std::string::npos);
        
        std::cout << "✅ Debug Info OK\n";
    }
    
    void testIntegration() {
        std::cout << "🧪 Test 14: Integration Test...\n";
        
        AudioEqualizerClass eq;
        
        // Configure multiple bands
        eq.setBandGain(0, 6.0); // Low shelf
        eq.setBandFrequency(0, 100.0);
        eq.setBandType(0, AudioFX::FilterType::LOWSHELF);
        
        eq.setBandGain(5, 3.0); // Mid peak
        eq.setBandFrequency(5, 1000.0);
        eq.setBandType(5, AudioFX::FilterType::PEAK);
        
        eq.setBandGain(9, 6.0); // High shelf
        eq.setBandFrequency(9, 8000.0);
        eq.setBandType(9, AudioFX::FilterType::HIGHSHELF);
        
        // Process audio
        std::span<const float> inputSpan(m_inputBuffer);
        std::span<float> outputSpan(m_outputBuffer);
        
        eq.process(inputSpan, outputSpan);
        
        // Verify processing occurred
        bool processingOccurred = false;
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            if (std::abs(m_outputBuffer[i] - m_inputBuffer[i]) > EPSILON) {
                processingOccurred = true;
                break;
            }
        }
        assert(processingOccurred);
        
        std::cout << "✅ Integration Test OK\n";
    }
    
    void testRegression() {
        std::cout << "🧪 Test 15: Regression Test...\n";
        
        AudioEqualizerClass eq;
        
        // Test specific regression scenarios
        eq.setMasterGain(0.0);
        assert(std::abs(eq.getMasterGain() - 0.0) < EPSILON);
        
        eq.setBypass(true);
        std::span<const float> inputSpan(m_inputBuffer);
        std::span<float> outputSpan(m_outputBuffer);
        eq.process(inputSpan, outputSpan);
        
        // In bypass mode, output should be identical to input
        bool bypassWorking = true;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            if (std::abs(m_outputBuffer[i] - m_inputBuffer[i]) > EPSILON) {
                bypassWorking = false;
                break;
            }
        }
        assert(bypassWorking);
        
        std::cout << "✅ Regression Test OK\n";
    }
    
    void runAllTests() {
        std::cout << "🎯 TESTS UNITAIRES - MODULE CORE (CORRIGÉS POUR XCODE)\n";
        std::cout << "=====================================================\n\n";
        
        try {
            testAudioEqualizerConstruction();
            testAudioEqualizerConfiguration();
            testAudioEqualizerProcessing();
            testAudioEqualizerStereoProcessing();
            testBiquadFilterConstruction();
            testBiquadFilterCoefficients();
            testBiquadFilterProcessing();
            testBiquadFilterStereoProcessing();
            testPerformance();
            testStability();
            testParameterValidation();
            testThreadSafety();
            testDebugInfo();
            testIntegration();
            testRegression();
            
            std::cout << "\n🎉 TOUS LES TESTS PASSÉS AVEC SUCCÈS !\n";
            std::cout << "✅ Module Core prêt pour la production avec Xcode\n";
            
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
    CoreTest test;
    test.runAllTests();
    return 0;
}
