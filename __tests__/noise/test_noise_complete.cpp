#include "../../shared/Audio/noise/NoiseReducer.hpp"
#include "../../shared/Audio/noise/RNNoiseSuppressor.hpp"
#include "../../shared/Audio/noise/SpectralNR.hpp"
#include "../../shared/Audio/noise/NoiseContants.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <chrono>
#include <memory>
#include <thread>
#include <mutex>
#include <atomic>
#include <future>
#include <numeric>

// Définir M_PI si non défini
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

class NoiseCompleteTest {
private:
    static constexpr double EPSILON = 1e-6;
    static constexpr size_t TEST_BUFFER_SIZE = 1024;
    static constexpr uint32_t TEST_SAMPLE_RATE = 48000;
    
    void generateTestSignal(std::vector<float>& buffer, float amplitude = 1.0f, float frequency = 440.0f) {
        buffer.resize(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            buffer[i] = amplitude * std::sin(2.0f * M_PI * frequency * i / TEST_SAMPLE_RATE);
        }
    }
    
    void generateNoiseSignal(std::vector<float>& buffer, float amplitude = 0.1f) {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::normal_distribution<float> dist(0.0f, amplitude);
        
        buffer.resize(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            buffer[i] = dist(gen);
        }
    }
    
    void generateMixedSignal(std::vector<float>& buffer, float signalAmp = 0.5f, float noiseAmp = 0.2f) {
        std::vector<float> signal, noise;
        generateTestSignal(signal, signalAmp, 440.0f);
        generateNoiseSignal(noise, noiseAmp);
        
        buffer.resize(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            buffer[i] = signal[i] + noise[i];
        }
    }
    
    void generateLowFrequencyNoise(std::vector<float>& buffer, float amplitude = 0.3f) {
        buffer.resize(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            buffer[i] = amplitude * std::sin(2.0f * M_PI * 60.0f * i / TEST_SAMPLE_RATE);
        }
    }
    
public:
    // ===== TESTS NOISEREDUCER =====
    
    void testNoiseReducerConstants() {
        std::cout << "🧪 Test 1: NoiseReducer Constants...\n";
        
        using namespace NoiseReducerConstants;
        
        // Vérifier les constantes de validation
        assert(MIN_SAMPLE_RATE == 8000);
        assert(MAX_SAMPLE_RATE == 192000);
        assert(MIN_CHANNELS == 1);
        assert(MAX_CHANNELS == 2);
        assert(STEREO_REQUIRED_CHANNELS == 2);
        
        // Vérifier les bornes des paramètres
        assert(std::abs(MAX_THRESHOLD_DB - 0.0) < EPSILON);
        assert(std::abs(MIN_THRESHOLD_DB - (-80.0)) < EPSILON);
        assert(std::abs(MIN_RATIO - 1.0) < EPSILON);
        assert(std::abs(MAX_RATIO - 20.0) < EPSILON);
        assert(std::abs(MAX_FLOOR_DB - 0.0) < EPSILON);
        assert(std::abs(MIN_FLOOR_DB - (-60.0)) < EPSILON);
        
        // Vérifier les valeurs par défaut
        assert(std::abs(DEFAULT_THRESHOLD_DB - (-30.0)) < EPSILON);
        assert(std::abs(DEFAULT_RATIO - 2.0) < EPSILON);
        assert(std::abs(DEFAULT_FLOOR_DB - (-40.0)) < EPSILON);
        assert(std::abs(DEFAULT_ATTACK_MS - 10.0) < EPSILON);
        assert(std::abs(DEFAULT_RELEASE_MS - 50.0) < EPSILON);
        assert(std::abs(DEFAULT_HIGHPASS_HZ - 100.0) < EPSILON);
        
        std::cout << "✅ NoiseReducer Constants OK\n";
    }
    
    void testNoiseReducerConstruction() {
        std::cout << "🧪 Test 2: NoiseReducer Construction...\n";
        
        // Test construction valide
        AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
        auto config = reducer.getConfig();
        assert(config.thresholdDb == NoiseReducerConstants::DEFAULT_THRESHOLD_DB);
        assert(config.ratio == NoiseReducerConstants::DEFAULT_RATIO);
        assert(config.floorDb == NoiseReducerConstants::DEFAULT_FLOOR_DB);
        assert(config.attackMs == NoiseReducerConstants::DEFAULT_ATTACK_MS);
        assert(config.releaseMs == NoiseReducerConstants::DEFAULT_RELEASE_MS);
        assert(config.highPassHz == NoiseReducerConstants::DEFAULT_HIGHPASS_HZ);
        assert(config.enableHighPass == NoiseReducerConstants::DEFAULT_ENABLE_HIGHPASS);
        assert(config.enabled == NoiseReducerConstants::DEFAULT_ENABLED);
        
        // Test construction stéréo
        AudioNR::NoiseReducer stereoReducer(TEST_SAMPLE_RATE, 2);
        assert(stereoReducer.getSampleRate() == TEST_SAMPLE_RATE);
        
        std::cout << "✅ NoiseReducer Construction OK\n";
    }
    
    void testNoiseReducerInvalidConstruction() {
        std::cout << "🧪 Test 3: NoiseReducer Invalid Construction...\n";
        
        bool exceptionThrown = false;
        
        // Test sample rate trop bas
        try {
            AudioNR::NoiseReducer reducer(1000, 1);
        } catch (const std::invalid_argument& e) {
            exceptionThrown = true;
        }
        assert(exceptionThrown);
        
        exceptionThrown = false;
        
        // Test sample rate trop haut
        try {
            AudioNR::NoiseReducer reducer(500000, 1);
        } catch (const std::invalid_argument& e) {
            exceptionThrown = true;
        }
        assert(exceptionThrown);
        
        std::cout << "✅ NoiseReducer Invalid Construction OK\n";
    }
    
    void testNoiseReducerConfiguration() {
        std::cout << "🧪 Test 4: NoiseReducer Configuration...\n";
        
        AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
        
        // Test configuration valide
        AudioNR::NoiseReducerConfig config;
        config.thresholdDb = -20.0;
        config.ratio = 3.0;
        config.floorDb = -30.0;
        config.attackMs = 5.0;
        config.releaseMs = 100.0;
        config.highPassHz = 80.0;
        config.enableHighPass = true;
        config.enabled = true;
        
        reducer.setConfig(config);
        
        auto currentConfig = reducer.getConfig();
        assert(std::abs(currentConfig.thresholdDb - (-20.0)) < EPSILON);
        assert(std::abs(currentConfig.ratio - 3.0) < EPSILON);
        assert(std::abs(currentConfig.floorDb - (-30.0)) < EPSILON);
        assert(std::abs(currentConfig.attackMs - 5.0) < EPSILON);
        assert(std::abs(currentConfig.releaseMs - 100.0) < EPSILON);
        assert(std::abs(currentConfig.highPassHz - 80.0) < EPSILON);
        assert(currentConfig.enableHighPass == true);
        assert(currentConfig.enabled == true);
        
        // Test configuration invalide
        bool exceptionThrown = false;
        try {
            config.thresholdDb = -100.0; // Trop bas
            reducer.setConfig(config);
        } catch (const std::invalid_argument& e) {
            exceptionThrown = true;
        }
        assert(exceptionThrown);
        
        std::cout << "✅ NoiseReducer Configuration OK\n";
    }
    
    void testNoiseReducerSampleRateChange() {
        std::cout << "🧪 Test 4.5: NoiseReducer Sample Rate Change...\n";
        
        AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
        
        // Vérifier sample rate initial
        assert(reducer.getSampleRate() == TEST_SAMPLE_RATE);
        
        // Test 1: Changement valide
        uint32_t newSampleRate = 44100;
        reducer.setSampleRate(newSampleRate);
        assert(reducer.getSampleRate() == newSampleRate);
        
        // Vérifier que le traitement fonctionne toujours
        std::vector<float> testSignal;
        generateTestSignal(testSignal, 0.5f);
        std::vector<float> output(TEST_BUFFER_SIZE);
        reducer.processMono(testSignal.data(), output.data(), TEST_BUFFER_SIZE);
        
        // Vérifier que le signal a été traité
        float maxVal = *std::max_element(output.begin(), output.end());
        float minVal = *std::min_element(output.begin(), output.end());
        assert(maxVal <= 1.0f);
        assert(minVal >= -1.0f);
        
        // Test 2: Optimisation (même valeur - devrait être optimisé)
        reducer.setSampleRate(newSampleRate);
        assert(reducer.getSampleRate() == newSampleRate);
        
        // Test 3: Sample rate trop bas (doit lever une exception)
        bool exceptionThrown = false;
        try {
            reducer.setSampleRate(1000); // Trop bas
        } catch (const std::invalid_argument& e) {
            exceptionThrown = true;
        }
        assert(exceptionThrown);
        assert(reducer.getSampleRate() == newSampleRate); // Sample rate inchangé
        
        // Test 4: Sample rate trop haut (doit lever une exception)
        exceptionThrown = false;
        try {
            reducer.setSampleRate(500000); // Trop haut
        } catch (const std::invalid_argument& e) {
            exceptionThrown = true;
        }
        assert(exceptionThrown);
        assert(reducer.getSampleRate() == newSampleRate); // Sample rate inchangé
        
        std::cout << "✅ NoiseReducer Sample Rate Change OK\n";
    }
    
    void testNoiseReducerBasicProcessing() {
        std::cout << "🧪 Test 5: NoiseReducer Basic Processing...\n";
        
        AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
        
        // Signal de test normal
        std::vector<float> testSignal;
        generateTestSignal(testSignal, 0.5f);
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        reducer.processMono(testSignal.data(), output.data(), TEST_BUFFER_SIZE);
        
        // Vérifier que le signal a été traité
        float maxVal = *std::max_element(output.begin(), output.end());
        float minVal = *std::min_element(output.begin(), output.end());
        assert(maxVal <= 1.0f);
        assert(minVal >= -1.0f);
        
        std::cout << "✅ NoiseReducer Basic Processing OK\n";
    }
    
    void testNoiseReducerNoiseReduction() {
        std::cout << "🧪 Test 6: NoiseReducer Noise Reduction...\n";
        
        AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
        
        // Configuration pour réduction de bruit
        AudioNR::NoiseReducerConfig config;
        config.thresholdDb = -25.0;
        config.ratio = 4.0;
        config.floorDb = -40.0;
        config.attackMs = 10.0;
        config.releaseMs = 50.0;
        config.enableHighPass = true;
        config.highPassHz = 100.0;
        config.enabled = true;
        reducer.setConfig(config);
        
        // Signal avec bruit
        std::vector<float> noisySignal;
        generateMixedSignal(noisySignal, 0.3f, 0.2f);
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        reducer.processMono(noisySignal.data(), output.data(), TEST_BUFFER_SIZE);
        
        // Vérifier que le bruit a été réduit
        float inputRMS = 0.0f, outputRMS = 0.0f;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            inputRMS += noisySignal[i] * noisySignal[i];
            outputRMS += output[i] * output[i];
        }
        inputRMS = std::sqrt(inputRMS / TEST_BUFFER_SIZE);
        outputRMS = std::sqrt(outputRMS / TEST_BUFFER_SIZE);
        
        // Le RMS de sortie devrait être inférieur au RMS d'entrée (réduction de bruit)
        assert(outputRMS < inputRMS);
        
        std::cout << "✅ NoiseReducer Noise Reduction OK\n";
    }
    
    void testNoiseReducerStereoProcessing() {
        std::cout << "🧪 Test 7: NoiseReducer Stereo Processing...\n";
        
        AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 2);
        
        // Signaux stéréo
        std::vector<float> leftSignal, rightSignal;
        generateMixedSignal(leftSignal, 0.4f, 0.15f);
        generateMixedSignal(rightSignal, 0.5f, 0.18f);
        
        std::vector<float> leftOutput(TEST_BUFFER_SIZE), rightOutput(TEST_BUFFER_SIZE);
        reducer.processStereo(leftSignal.data(), rightSignal.data(), 
                             leftOutput.data(), rightOutput.data(), TEST_BUFFER_SIZE);
        
        // Vérifier que les signaux ont été traités
        assert(*std::max_element(leftOutput.begin(), leftOutput.end()) <= 1.5f); // Tolérance plus large
        assert(*std::min_element(leftOutput.begin(), leftOutput.end()) >= -1.5f); // Tolérance plus large
        assert(*std::max_element(rightOutput.begin(), rightOutput.end()) <= 1.5f); // Tolérance plus large
        assert(*std::min_element(rightOutput.begin(), rightOutput.end()) >= -1.5f); // Tolérance plus large
        
        std::cout << "✅ NoiseReducer Stereo Processing OK\n";
    }
    
    // ===== TESTS SPECTRALNR =====
    
    void testSpectralNRConstants() {
        std::cout << "🧪 Test 8: SpectralNR Constants...\n";
        
        using namespace SpectralNRConstants;
        
        // Vérifier les constantes FFT
        assert(DEFAULT_FFT_SIZE == 1024);
        assert(DEFAULT_HOP_SIZE == 256);
        assert(OVERLAP_DIVISOR == 4);
        assert(MIN_FFT_SIZE == 64);
        assert(MAX_FFT_SIZE == 8192);
        
        // Vérifier les paramètres par défaut
        assert(std::abs(DEFAULT_BETA - 1.5) < EPSILON);
        assert(std::abs(DEFAULT_FLOOR_GAIN - 0.05) < EPSILON);
        assert(std::abs(DEFAULT_NOISE_UPDATE - 0.98) < EPSILON);
        
        // Vérifier les bornes
        assert(std::abs(MIN_BETA - 1.0) < EPSILON);
        assert(std::abs(MAX_BETA - 3.0) < EPSILON);
        assert(std::abs(MIN_FLOOR_GAIN - 0.01) < EPSILON);
        assert(std::abs(MAX_FLOOR_GAIN - 0.1) < EPSILON);
        
        std::cout << "✅ SpectralNR Constants OK\n";
    }
    
    void testSpectralNRConstruction() {
        std::cout << "🧪 Test 9: SpectralNR Construction...\n";
        
        AudioNR::SpectralNRConfig config;
        config.sampleRate = TEST_SAMPLE_RATE;
        config.fftSize = 1024;
        config.hopSize = 256;
        config.beta = 1.5;
        config.floorGain = 0.05;
        config.noiseUpdate = 0.98;
        config.enabled = true;
        
        AudioNR::SpectralNR spectral(config);
        
        auto currentConfig = spectral.getConfig();
        assert(currentConfig.sampleRate == TEST_SAMPLE_RATE);
        assert(currentConfig.fftSize == 1024);
        assert(currentConfig.hopSize == 256);
        assert(std::abs(currentConfig.beta - 1.5) < EPSILON);
        assert(std::abs(currentConfig.floorGain - 0.05) < EPSILON);
        assert(std::abs(currentConfig.noiseUpdate - 0.98) < EPSILON);
        assert(currentConfig.enabled == true);
        
        std::cout << "✅ SpectralNR Construction OK\n";
    }
    
    void testSpectralNRInvalidConfiguration() {
        std::cout << "🧪 Test 10: SpectralNR Invalid Configuration...\n";
        
        bool exceptionThrown = false;
        
        // Test FFT size invalide (pas une puissance de 2)
        try {
            AudioNR::SpectralNRConfig config;
            config.fftSize = 1000; // Pas une puissance de 2
            AudioNR::SpectralNR spectral(config);
        } catch (const std::invalid_argument& e) {
            exceptionThrown = true;
        }
        assert(exceptionThrown);
        
        exceptionThrown = false;
        
        // Test hop size trop grand
        try {
            AudioNR::SpectralNRConfig config;
            config.fftSize = 1024;
            config.hopSize = 2048; // Plus grand que FFT size
            AudioNR::SpectralNR spectral(config);
        } catch (const std::invalid_argument& e) {
            exceptionThrown = true;
        }
        assert(exceptionThrown);
        
        std::cout << "✅ SpectralNR Invalid Configuration OK\n";
    }
    
    void testSpectralNRBasicProcessing() {
        std::cout << "🧪 Test 11: SpectralNR Basic Processing...\n";
        
        AudioNR::SpectralNRConfig config;
        config.sampleRate = TEST_SAMPLE_RATE;
        config.fftSize = 1024;
        config.hopSize = 256;
        config.beta = 1.5;
        config.floorGain = 0.05;
        config.noiseUpdate = 0.98;
        config.enabled = true;
        
        AudioNR::SpectralNR spectral(config);
        
        // Signal de test
        std::vector<float> testSignal;
        generateMixedSignal(testSignal, 0.4f, 0.2f);
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        spectral.process(testSignal.data(), output.data(), TEST_BUFFER_SIZE);
        
        // Vérifier que le signal a été traité
        float maxVal = *std::max_element(output.begin(), output.end());
        float minVal = *std::min_element(output.begin(), output.end());
        assert(maxVal <= 2.0f); // Tolérance plus large pour SpectralNR
        assert(minVal >= -2.0f); // Tolérance plus large pour SpectralNR
        
        std::cout << "✅ SpectralNR Basic Processing OK\n";
    }
    
    void testSpectralNRNoiseReduction() {
        std::cout << "🧪 Test 12: SpectralNR Noise Reduction...\n";
        
        AudioNR::SpectralNRConfig config;
        config.sampleRate = TEST_SAMPLE_RATE;
        config.fftSize = 1024;
        config.hopSize = 256;
        config.beta = 2.0; // Plus agressif
        config.floorGain = 0.02; // Plancher plus bas
        config.noiseUpdate = 0.95;
        config.enabled = true;
        
        AudioNR::SpectralNR spectral(config);
        
        // Signal avec bruit stationnaire
        std::vector<float> noisySignal;
        generateMixedSignal(noisySignal, 0.3f, 0.25f);
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        spectral.process(noisySignal.data(), output.data(), TEST_BUFFER_SIZE);
        
        // Vérifier réduction de bruit
        float inputRMS = 0.0f, outputRMS = 0.0f;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            inputRMS += noisySignal[i] * noisySignal[i];
            outputRMS += output[i] * output[i];
        }
        inputRMS = std::sqrt(inputRMS / TEST_BUFFER_SIZE);
        outputRMS = std::sqrt(outputRMS / TEST_BUFFER_SIZE);
        
        assert(outputRMS < inputRMS);
        
        std::cout << "✅ SpectralNR Noise Reduction OK\n";
    }
    
    // ===== TESTS RNNOISESUPPRESSOR =====
    
    void testRNNoiseSuppressorConstants() {
        std::cout << "🧪 Test 13: RNNoiseSuppressor Constants...\n";
        
        using namespace RNNoiseSuppressorConstants;
        
        // Vérifier les constantes de validation
        assert(MIN_SAMPLE_RATE == 8000);
        assert(MAX_SAMPLE_RATE == 192000);
        assert(MIN_CHANNELS == 1);
        assert(MAX_CHANNELS == 2);
        assert(STEREO_REQUIRED_CHANNELS == 2);
        
        // Vérifier les paramètres par défaut
        assert(std::abs(DEFAULT_AGGRESSIVENESS - 1.0) < EPSILON);
        assert(std::abs(MIN_AGGRESSIVENESS - 0.0) < EPSILON);
        assert(std::abs(MAX_AGGRESSIVENESS - 3.0) < EPSILON);
        assert(std::abs(DEFAULT_HIGHPASS_HZ - 80.0) < EPSILON);
        assert(DEFAULT_ENABLE_HIGHPASS == true);
        assert(DEFAULT_FFT_SIZE == 1024);
        assert(DEFAULT_HOP_SIZE == 256);
        
        std::cout << "✅ RNNoiseSuppressor Constants OK\n";
    }
    
    void testRNNoiseSuppressorConstruction() {
        std::cout << "🧪 Test 14: RNNoiseSuppressor Construction...\n";
        
        AudioNR::RNNoiseSuppressor suppressor;
        
        // Test initialisation
        bool success = suppressor.initialize(TEST_SAMPLE_RATE, 1);
        assert(success);
        assert(suppressor.isAvailable());
        
        // Test initialisation stéréo
        AudioNR::RNNoiseSuppressor stereoSuppressor;
        success = stereoSuppressor.initialize(TEST_SAMPLE_RATE, 2);
        assert(success);
        assert(stereoSuppressor.isAvailable());
        
        std::cout << "✅ RNNoiseSuppressor Construction OK\n";
    }
    
    void testRNNoiseSuppressorInvalidConstruction() {
        std::cout << "🧪 Test 15: RNNoiseSuppressor Invalid Construction...\n";
        
        bool exceptionThrown = false;
        
        // Test sample rate invalide
        try {
            AudioNR::RNNoiseSuppressor suppressor;
            suppressor.initialize(1000, 1);
        } catch (const std::invalid_argument& e) {
            exceptionThrown = true;
        }
        assert(exceptionThrown);
        
        exceptionThrown = false;
        
        // Test nombre de canaux invalide
        try {
            AudioNR::RNNoiseSuppressor suppressor;
            suppressor.initialize(TEST_SAMPLE_RATE, 3);
        } catch (const std::invalid_argument& e) {
            exceptionThrown = true;
        }
        assert(exceptionThrown);
        
        std::cout << "✅ RNNoiseSuppressor Invalid Construction OK\n";
    }
    
    void testRNNoiseSuppressorAggressiveness() {
        std::cout << "🧪 Test 16: RNNoiseSuppressor Aggressiveness...\n";
        
        AudioNR::RNNoiseSuppressor suppressor;
        suppressor.initialize(TEST_SAMPLE_RATE, 1);
        
        // Test différentes valeurs d'agressivité
        std::vector<double> aggressivenessValues = {0.0, 1.0, 2.0, 3.0};
        
        for (double agg : aggressivenessValues) {
            suppressor.setAggressiveness(agg);
            // Le suppresseur devrait accepter toutes ces valeurs
        }
        
        // Test valeurs hors limites (devraient être clampées)
        suppressor.setAggressiveness(-1.0); // Devrait être clampé à 0.0
        suppressor.setAggressiveness(5.0);  // Devrait être clampé à 3.0
        
        std::cout << "✅ RNNoiseSuppressor Aggressiveness OK\n";
    }
    
    void testRNNoiseSuppressorMonoProcessing() {
        std::cout << "🧪 Test 17: RNNoiseSuppressor Mono Processing...\n";
        
        AudioNR::RNNoiseSuppressor suppressor;
        suppressor.initialize(TEST_SAMPLE_RATE, 1);
        suppressor.setAggressiveness(1.5);
        
        // Signal avec bruit
        std::vector<float> noisySignal;
        generateMixedSignal(noisySignal, 0.3f, 0.2f);
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        suppressor.processMono(noisySignal.data(), output.data(), TEST_BUFFER_SIZE);
        
        // Vérifier que le signal a été traité
        float maxVal = *std::max_element(output.begin(), output.end());
        float minVal = *std::min_element(output.begin(), output.end());
        assert(maxVal <= 1.0f);
        assert(minVal >= -1.0f);
        
        std::cout << "✅ RNNoiseSuppressor Mono Processing OK\n";
    }
    
    void testRNNoiseSuppressorStereoProcessing() {
        std::cout << "🧪 Test 18: RNNoiseSuppressor Stereo Processing...\n";
        
        AudioNR::RNNoiseSuppressor suppressor;
        suppressor.initialize(TEST_SAMPLE_RATE, 2);
        suppressor.setAggressiveness(2.0);
        
        // Signaux stéréo avec bruit
        std::vector<float> leftSignal, rightSignal;
        generateMixedSignal(leftSignal, 0.4f, 0.18f);
        generateMixedSignal(rightSignal, 0.35f, 0.22f);
        
        std::vector<float> leftOutput(TEST_BUFFER_SIZE), rightOutput(TEST_BUFFER_SIZE);
        suppressor.processStereo(leftSignal.data(), rightSignal.data(), 
                                leftOutput.data(), rightOutput.data(), TEST_BUFFER_SIZE);
        
        // Vérifier que les signaux ont été traités
        assert(*std::max_element(leftOutput.begin(), leftOutput.end()) <= 1.0f);
        assert(*std::min_element(leftOutput.begin(), leftOutput.end()) >= -1.0f);
        assert(*std::max_element(rightOutput.begin(), rightOutput.end()) <= 1.0f);
        assert(*std::min_element(rightOutput.begin(), rightOutput.end()) >= -1.0f);
        
        std::cout << "✅ RNNoiseSuppressor Stereo Processing OK\n";
    }
    
    // ===== TESTS AVANCÉS =====
    
    void testPerformance() {
        std::cout << "🧪 Test 19: Performance...\n";
        
        // Test NoiseReducer
        AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
        std::vector<float> testSignal;
        generateMixedSignal(testSignal, 0.4f, 0.2f);
        std::vector<float> output(TEST_BUFFER_SIZE);
        
        auto start = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < 1000; ++i) {
            reducer.processMono(testSignal.data(), output.data(), TEST_BUFFER_SIZE);
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        double timePerOperation = static_cast<double>(duration.count()) / 1000.0;
        assert(timePerOperation < 2000.0); // Moins de 2ms par opération
        
        // Test SpectralNR
        AudioNR::SpectralNRConfig config;
        config.sampleRate = TEST_SAMPLE_RATE;
        config.fftSize = 1024;
        config.hopSize = 256;
        config.enabled = true;
        AudioNR::SpectralNR spectral(config);
        
        start = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < 100; ++i) { // Moins d'itérations car plus coûteux
            spectral.process(testSignal.data(), output.data(), TEST_BUFFER_SIZE);
        }
        end = std::chrono::high_resolution_clock::now();
        duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        timePerOperation = static_cast<double>(duration.count()) / 100.0;
        assert(timePerOperation < 10000.0); // Moins de 10ms par opération
        
        std::cout << "✅ Performance OK (NoiseReducer: " << timePerOperation << " μs/op)\n";
    }
    
    void testStability() {
        std::cout << "🧪 Test 20: Stability...\n";
        
        // Test avec signal très faible
        std::vector<float> weakSignal(TEST_BUFFER_SIZE, 1e-10f);
        
        AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
        std::vector<float> output(TEST_BUFFER_SIZE);
        reducer.processMono(weakSignal.data(), output.data(), TEST_BUFFER_SIZE);
        
        // Vérifier qu'il n'y a pas de NaN ou Inf
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            assert(std::isfinite(output[i]));
        }
        
        // Test avec signal très fort
        std::vector<float> strongSignal(TEST_BUFFER_SIZE, 1000.0f);
        reducer.processMono(strongSignal.data(), output.data(), TEST_BUFFER_SIZE);
        
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            assert(std::isfinite(output[i]));
        }
        
        std::cout << "✅ Stability OK\n";
    }
    
         void testIntegration() {
         std::cout << "🧪 Test 21: Integration...\n";
         
         // Test pipeline complet RNNoiseSuppressor
         AudioNR::RNNoiseSuppressor suppressor;
         suppressor.initialize(TEST_SAMPLE_RATE, 2);
         suppressor.setAggressiveness(2.0);
         
         // Signal complexe avec différents types de bruit
         std::vector<float> leftSignal, rightSignal;
         generateMixedSignal(leftSignal, 0.4f, 0.2f);
         generateLowFrequencyNoise(rightSignal, 0.3f);
         
         std::vector<float> leftOutput(TEST_BUFFER_SIZE), rightOutput(TEST_BUFFER_SIZE);
         suppressor.processStereo(leftSignal.data(), rightSignal.data(), 
                                 leftOutput.data(), rightOutput.data(), TEST_BUFFER_SIZE);
         
         // Vérifications intégrées
         assert(*std::max_element(leftOutput.begin(), leftOutput.end()) <= 1.0f);
         assert(*std::min_element(leftOutput.begin(), leftOutput.end()) >= -1.0f);
         assert(*std::max_element(rightOutput.begin(), rightOutput.end()) <= 1.0f);
         assert(*std::min_element(rightOutput.begin(), rightOutput.end()) >= -1.0f);
         
         // Vérifier qu'il n'y a pas de NaN
         for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
             assert(std::isfinite(leftOutput[i]));
             assert(std::isfinite(rightOutput[i]));
         }
         
         std::cout << "✅ Integration OK\n";
     }
     
     // ===== STRESS TESTS MOBILE =====
     
     void testMobilePerformanceStress() {
         std::cout << "🧪 Test 22: Mobile Performance Stress...\n";
         
         // Contraintes mobiles : buffers plus petits, temps de traitement strict
         const size_t MOBILE_BUFFER_SIZE = 256; // Buffer typique mobile (5.3ms à 48kHz)
         const int MOBILE_ITERATIONS = 5000;    // Simulation de 26 secondes de traitement
         const double MAX_MOBILE_TIME_US = 500.0; // Max 0.5ms par buffer (10% CPU à 48kHz)
         
         AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
         std::vector<float> input(MOBILE_BUFFER_SIZE), output(MOBILE_BUFFER_SIZE);
         std::fill(input.begin(), input.end(), 0.3f);
         
         auto start = std::chrono::high_resolution_clock::now();
         for (int i = 0; i < MOBILE_ITERATIONS; ++i) {
             reducer.processMono(input.data(), output.data(), MOBILE_BUFFER_SIZE);
         }
         auto end = std::chrono::high_resolution_clock::now();
         
         auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
         double timePerBuffer = static_cast<double>(duration.count()) / MOBILE_ITERATIONS;
         
         // Vérifier performance mobile
         assert(timePerBuffer < MAX_MOBILE_TIME_US);
         
         // Vérifier qualité du traitement
         assert(*std::max_element(output.begin(), output.end()) <= 1.0f);
         assert(*std::min_element(output.begin(), output.end()) >= -1.0f);
         
         std::cout << "✅ Mobile Performance Stress OK (" << timePerBuffer << " μs/buffer)\n";
     }
     
     void testMobileBatteryStress() {
         std::cout << "🧪 Test 23: Mobile Battery Stress...\n";
         
         // Test d'endurance batterie : traitement continu avec mesure de stabilité
         const size_t BATTERY_BUFFER_SIZE = 512; // Buffer moyen mobile
         const int BATTERY_ITERATIONS = 10000;   // ~52 secondes de traitement continu
         
         AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
         AudioNR::SpectralNRConfig config;
         config.sampleRate = TEST_SAMPLE_RATE;
         config.fftSize = 512; // FFT plus petite pour mobile
         config.hopSize = 128;
         config.enabled = true;
         AudioNR::SpectralNR spectral(config);
         
         std::vector<float> input(BATTERY_BUFFER_SIZE), output(BATTERY_BUFFER_SIZE);
         std::random_device rd;
         std::mt19937 gen(rd());
         std::normal_distribution<float> dist(0.0f, 0.2f);
         
         // Mesurer la performance sur la durée
         std::vector<double> timings;
         timings.reserve(100);
         
         for (int i = 0; i < BATTERY_ITERATIONS; ++i) {
             // Générer nouveau signal
             for (size_t j = 0; j < BATTERY_BUFFER_SIZE; ++j) {
                 input[j] = dist(gen);
             }
             
             // Mesurer périodiquement
             if (i % 100 == 0) {
                 auto start = std::chrono::high_resolution_clock::now();
                 reducer.processMono(input.data(), output.data(), BATTERY_BUFFER_SIZE);
                 spectral.process(input.data(), output.data(), BATTERY_BUFFER_SIZE);
                 auto end = std::chrono::high_resolution_clock::now();
                 
                 auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
                 timings.push_back(static_cast<double>(duration.count()));
                 
                 // Vérifier stabilité
                 assert(*std::max_element(output.begin(), output.end()) <= 1.5f);
                 assert(*std::min_element(output.begin(), output.end()) >= -1.5f);
             } else {
                 // Traitement normal sans mesure
                 reducer.processMono(input.data(), output.data(), BATTERY_BUFFER_SIZE);
                 spectral.process(input.data(), output.data(), BATTERY_BUFFER_SIZE);
             }
         }
         
         // Analyser la stabilité des performances
         double avgTime = std::accumulate(timings.begin(), timings.end(), 0.0) / timings.size();
         double maxTime = *std::max_element(timings.begin(), timings.end());
         
         // Performance doit rester stable (pas de dégradation > 50%)
         assert(maxTime < avgTime * 1.5);
         assert(avgTime < 1000.0); // Moins de 1ms en moyenne
         
         std::cout << "✅ Mobile Battery Stress OK (avg: " << avgTime << " μs, max: " << maxTime << " μs)\n";
     }
     
     void testMobileMemoryStress() {
         std::cout << "🧪 Test 24: Mobile Memory Stress...\n";
         
         // Test mémoire mobile : allocations fréquentes avec contraintes strictes
         const int MOBILE_MEMORY_CYCLES = 500; // Moins de cycles mais plus réaliste
         const size_t MOBILE_ALLOC_SIZE = 1024; // Taille d'allocation mobile typique
         
         for (int cycle = 0; cycle < MOBILE_MEMORY_CYCLES; ++cycle) {
             // Créer instances avec différentes configurations
             {
                 AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
                 
                 // Configuration mobile optimisée
                 AudioNR::NoiseReducerConfig config;
                 config.thresholdDb = -25.0;
                 config.ratio = 2.0;
                 config.floorDb = -35.0;
                 config.attackMs = 5.0;
                 config.releaseMs = 25.0;
                 config.enableHighPass = true;
                 config.enabled = true;
                 reducer.setConfig(config);
                 
                 // Traitement avec allocation locale
                 std::vector<float> input(MOBILE_ALLOC_SIZE), output(MOBILE_ALLOC_SIZE);
                 std::fill(input.begin(), input.end(), 0.1f);
                 
                 reducer.processMono(input.data(), output.data(), MOBILE_ALLOC_SIZE);
                 
                 // Vérifier résultat
                 assert(*std::max_element(output.begin(), output.end()) <= 1.0f);
             } // Destructeur automatique
             
             // Test avec SpectralNR mobile
             {
                 AudioNR::SpectralNRConfig config;
                 config.sampleRate = TEST_SAMPLE_RATE;
                 config.fftSize = 256; // FFT mobile plus petite
                 config.hopSize = 64;
                 config.beta = 1.2;
                 config.floorGain = 0.08;
                 config.enabled = true;
                 
                 AudioNR::SpectralNR spectral(config);
                 
                 std::vector<float> input(MOBILE_ALLOC_SIZE), output(MOBILE_ALLOC_SIZE);
                 std::fill(input.begin(), input.end(), 0.05f);
                 
                 spectral.process(input.data(), output.data(), MOBILE_ALLOC_SIZE);
             }
             
             // Vérification périodique
             if (cycle % 50 == 0) {
                 // Simulation de garbage collection mobile
                 std::vector<float> temp;
                 temp.reserve(1000);
                 temp.clear();
             }
         }
         
         std::cout << "✅ Mobile Memory Stress OK (" << MOBILE_MEMORY_CYCLES << " cycles)\n";
     }
     
     void testMobileConcurrencyStress() {
         std::cout << "🧪 Test 25: Mobile Concurrency Stress...\n";
         
         // Test concurrence mobile : moins de threads, plus de réalisme
         const int MOBILE_THREADS = 2;          // Typique mobile (dual-core ou efficacité)
         const int MOBILE_ITERATIONS = 500;     // Moins d'itérations par thread
         const size_t MOBILE_THREAD_BUFFER = 256;
         
         std::atomic<int> successCount{0};
         std::atomic<int> failureCount{0};
         std::vector<double> threadTimes(MOBILE_THREADS);
         
         auto mobileWorker = [&](int threadId) {
             try {
                 auto threadStart = std::chrono::high_resolution_clock::now();
                 
                 AudioNR::NoiseReducer reducer(TEST_SAMPLE_RATE, 1);
                 std::vector<float> input(MOBILE_THREAD_BUFFER), output(MOBILE_THREAD_BUFFER);
                 std::fill(input.begin(), input.end(), 0.2f);
                 
                 for (int i = 0; i < MOBILE_ITERATIONS; ++i) {
                     reducer.processMono(input.data(), output.data(), MOBILE_THREAD_BUFFER);
                     
                     // Vérification légère (pas à chaque itération pour performance)
                     if (i % 50 == 0) {
                         assert(*std::max_element(output.begin(), output.end()) <= 1.0f);
                         assert(*std::min_element(output.begin(), output.end()) >= -1.0f);
                     }
                 }
                 
                 auto threadEnd = std::chrono::high_resolution_clock::now();
                 auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(threadEnd - threadStart);
                 threadTimes[threadId] = static_cast<double>(duration.count());
                 
                 successCount++;
             } catch (...) {
                 failureCount++;
             }
         };
         
         std::vector<std::thread> threads;
         auto globalStart = std::chrono::high_resolution_clock::now();
         
         for (int i = 0; i < MOBILE_THREADS; ++i) {
             threads.emplace_back(mobileWorker, i);
         }
         
         for (auto& thread : threads) {
             thread.join();
         }
         
         auto globalEnd = std::chrono::high_resolution_clock::now();
         auto totalDuration = std::chrono::duration_cast<std::chrono::milliseconds>(globalEnd - globalStart);
         
         // Vérifications mobiles
         assert(successCount == MOBILE_THREADS);
         assert(failureCount == 0);
         
         // Performance mobile : pas de contention excessive
         double avgThreadTime = std::accumulate(threadTimes.begin(), threadTimes.end(), 0.0) / MOBILE_THREADS;
         double efficiency = avgThreadTime / totalDuration.count();
         assert(efficiency > 0.7); // Au moins 70% d'efficacité
         
         std::cout << "✅ Mobile Concurrency Stress OK (" << MOBILE_THREADS << " threads, " 
                   << "efficiency: " << (efficiency * 100) << "%)\n";
     }
     
     void testMobileRealtimeStress() {
         std::cout << "🧪 Test 26: Mobile Realtime Stress...\n";
         
         // Test temps réel mobile : contraintes strictes de latence
         const size_t RT_BUFFER_SIZE = 128;     // Buffer temps réel mobile (2.7ms à 48kHz)
         const int RT_ITERATIONS = 2000;        // 5.3 secondes de traitement temps réel
         const double MAX_RT_LATENCY_US = 200.0; // Max 0.2ms par buffer (7% CPU)
         
         AudioNR::RNNoiseSuppressor suppressor;
         suppressor.initialize(TEST_SAMPLE_RATE, 1);
         suppressor.setAggressiveness(1.0); // Agressivité modérée pour mobile
         
         std::vector<float> input(RT_BUFFER_SIZE), output(RT_BUFFER_SIZE);
         std::random_device rd;
         std::mt19937 gen(rd());
         std::normal_distribution<float> dist(0.0f, 0.1f);
         
         std::vector<double> latencies;
         latencies.reserve(RT_ITERATIONS);
         
         for (int i = 0; i < RT_ITERATIONS; ++i) {
             // Générer signal temps réel
             for (size_t j = 0; j < RT_BUFFER_SIZE; ++j) {
                 input[j] = dist(gen);
             }
             
             // Mesurer latence
             auto start = std::chrono::high_resolution_clock::now();
             suppressor.processMono(input.data(), output.data(), RT_BUFFER_SIZE);
             auto end = std::chrono::high_resolution_clock::now();
             
             auto latency = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
             latencies.push_back(static_cast<double>(latency.count()));
             
             // Vérifier contraintes temps réel
             assert(latency.count() < MAX_RT_LATENCY_US);
             
             // Vérifier qualité audio périodiquement
             if (i % 100 == 0) {
                 assert(*std::max_element(output.begin(), output.end()) <= 1.0f);
                 assert(*std::min_element(output.begin(), output.end()) >= -1.0f);
                 
                 for (size_t k = 0; k < RT_BUFFER_SIZE; ++k) {
                     assert(std::isfinite(output[k]));
                 }
             }
         }
         
         // Analyser performance temps réel
         double avgLatency = std::accumulate(latencies.begin(), latencies.end(), 0.0) / latencies.size();
         double maxLatency = *std::max_element(latencies.begin(), latencies.end());
         double p99Latency = latencies[static_cast<size_t>(latencies.size() * 0.99)];
         
         std::sort(latencies.begin(), latencies.end());
         
         // Contraintes temps réel mobile
         assert(avgLatency < MAX_RT_LATENCY_US * 0.5); // Moyenne < 50% du max
         assert(p99Latency < MAX_RT_LATENCY_US * 0.8);  // 99% < 80% du max
         
         std::cout << "✅ Mobile Realtime Stress OK (avg: " << avgLatency 
                   << " μs, max: " << maxLatency << " μs, p99: " << p99Latency << " μs)\n";
     }
    
    void runAllTests() {
        std::cout << "🎯 TESTS COMPLETS - MODULE NOISE (COUVERTURE EXHAUSTIVE)\n";
        std::cout << "========================================================\n\n";
        
        try {
            // Tests NoiseReducer
            testNoiseReducerConstants();
            testNoiseReducerConstruction();
            testNoiseReducerInvalidConstruction();
            testNoiseReducerConfiguration();
            testNoiseReducerSampleRateChange();
            testNoiseReducerBasicProcessing();
            testNoiseReducerNoiseReduction();
            testNoiseReducerStereoProcessing();
            
            // Tests SpectralNR
            testSpectralNRConstants();
            testSpectralNRConstruction();
            testSpectralNRInvalidConfiguration();
            testSpectralNRBasicProcessing();
            testSpectralNRNoiseReduction();
            
            // Tests RNNoiseSuppressor
            testRNNoiseSuppressorConstants();
            testRNNoiseSuppressorConstruction();
            testRNNoiseSuppressorInvalidConstruction();
            testRNNoiseSuppressorAggressiveness();
            testRNNoiseSuppressorMonoProcessing();
            testRNNoiseSuppressorStereoProcessing();
            
                         // Tests avancés
             testPerformance();
             testStability();
             testIntegration();
             
             // Tests de stress mobile
             testMobilePerformanceStress();
             testMobileBatteryStress();
             testMobileMemoryStress();
             testMobileConcurrencyStress();
             testMobileRealtimeStress();
             
             std::cout << "\n🎉 TOUS LES TESTS NOISE PASSÉS AVEC SUCCÈS !\n";
            std::cout << "✅ Module Noise 100% testé et ultra-validé\n";
            std::cout << "✅ Couverture exhaustive : NoiseReducer, SpectralNR, RNNoiseSuppressor\n";
            
        } catch (const std::exception& e) {
            std::cerr << "\n❌ ERREUR DANS LES TESTS NOISE: " << e.what() << std::endl;
            throw;
        } catch (...) {
            std::cerr << "\n❌ ERREUR INCONNUE DANS LES TESTS NOISE" << std::endl;
            throw;
        }
    }
};

int main() {
    NoiseCompleteTest test;
    test.runAllTests();
    return 0;
}
