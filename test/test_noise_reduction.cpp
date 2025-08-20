#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <cmath>
#include <vector>
#include <memory>
#include "../shared/Audio/noise/NoiseReducer.h"
#include "../shared/Audio/noise/SpectralNR.h"
#include "test_main.cpp"

// Test fixture pour NoiseReducer
class NoiseReducerTest : public ::testing::Test {
protected:
    void SetUp() override {
        sampleRate = 48000;
        numChannels = 2;
        tolerance = 1e-6;

        AudioNR::NoiseReducerConfig config{};
        config.enabled = true;
        config.thresholdDb = -40.0;
        config.ratio = 3.0;
        config.attackMs = 10.0;
        config.releaseMs = 50.0;
        config.floorDb = -15.0;
        config.highPassHz = 100.0;
        config.enableHighPass = true;

        noiseReducer = std::make_unique<AudioNR::NoiseReducer>(sampleRate, numChannels);
        noiseReducer->setConfig(config);
    }

    void TearDown() override {
        noiseReducer.reset();
    }

    std::unique_ptr<AudioNR::NoiseReducer> noiseReducer;
    uint32_t sampleRate;
    int numChannels;
    double tolerance;
};

TEST_F(NoiseReducerTest, Initialization) {
    EXPECT_EQ(noiseReducer->getSampleRate(), sampleRate);

    // Configuration par défaut
    auto config = noiseReducer->getConfig();
    EXPECT_TRUE(config.enabled);
    EXPECT_NEAR(config.thresholdDb, -40.0, tolerance);
    EXPECT_NEAR(config.ratio, 3.0, tolerance);
}

TEST_F(NoiseReducerTest, ConfigurationValidation) {
    AudioNR::NoiseReducerConfig config{};

    // Test paramètres valides
    config.thresholdDb = -30.0;
    config.ratio = 5.0;
    config.attackMs = 5.0;
    config.releaseMs = 100.0;
    config.floorDb = -10.0;
    config.highPassHz = 200.0;

    EXPECT_NO_THROW(noiseReducer->setConfig(config));

    // Test paramètres invalides
    config.thresholdDb = 10.0; // Trop haut
    EXPECT_THROW(noiseReducer->setConfig(config), std::invalid_argument);

    config.thresholdDb = -90.0; // Trop bas
    EXPECT_THROW(noiseReducer->setConfig(config), std::invalid_argument);

    config.ratio = 25.0; // Trop haut
    EXPECT_THROW(noiseReducer->setConfig(config), std::invalid_argument);
}

TEST_F(NoiseReducerTest, BasicNoiseReduction) {
    size_t numSamples = 2048;

    // Créer un signal avec du bruit
    auto signal = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.3f);
    auto noise = TestSignalGenerator::generateNoise(numSamples, 0.1f);

    // Combiner signal et bruit
    std::vector<float> input(numSamples);
    for (size_t i = 0; i < numSamples; ++i) {
        input[i] = signal[i] + noise[i];
    }

    std::vector<float> output(numSamples);
    noiseReducer->processMono(input.data(), output.data(), numSamples);

    // Calculer les métriques
    double inputRMS = MathTestUtilities::computeRMS(input);
    double outputRMS = MathTestUtilities::computeRMS(output);

    // Le signal de sortie devrait avoir un niveau similaire ou légèrement plus bas
    EXPECT_TRUE(outputRMS < inputRMS * 1.5); // Pas de boost excessif
    EXPECT_TRUE(outputRMS > inputRMS * 0.1); // Pas de réduction excessive
}

TEST_F(NoiseReducerTest, StereoProcessing) {
    size_t numSamples = 1024;

    auto inputL = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.4f);
    auto inputR = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.3f);

    // Ajouter du bruit
    auto noiseL = TestSignalGenerator::generateNoise(numSamples, 0.05f);
    auto noiseR = TestSignalGenerator::generateNoise(numSamples, 0.05f);

    std::vector<float> signalL(numSamples), signalR(numSamples);
    for (size_t i = 0; i < numSamples; ++i) {
        signalL[i] = inputL[i] + noiseL[i];
        signalR[i] = inputR[i] + noiseR[i];
    }

    std::vector<float> outputL(numSamples), outputR(numSamples);
    noiseReducer->processStereo(signalL.data(), signalR.data(), outputL.data(), outputR.data(), numSamples);

    // Les deux canaux devraient être traités
    double rmsL = MathTestUtilities::computeRMS(outputL);
    double rmsR = MathTestUtilities::computeRMS(outputR);

    EXPECT_TRUE(rmsL > 0.0);
    EXPECT_TRUE(rmsR > 0.0);
}

TEST_F(NoiseReducerTest, BypassMode) {
    // Désactiver la réduction de bruit
    auto config = noiseReducer->getConfig();
    config.enabled = false;
    noiseReducer->setConfig(config);

    size_t numSamples = 512;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    noiseReducer->processMono(input.data(), output.data(), numSamples);

    // En mode bypass, sortie = entrée
    EXPECT_TRUE(MathTestUtilities::isApproximatelyEqual(input, output, tolerance));
}

TEST_F(NoiseReducerTest, HighPassFilter) {
    // Activer uniquement le filtre passe-haut
    auto config = noiseReducer->getConfig();
    config.enabled = true;
    config.thresholdDb = -60.0; // Seuil très bas pour minimiser l'expansion
    config.enableHighPass = true;
    noiseReducer->setConfig(config);

    size_t numSamples = 1024;
    auto lowFreq = TestSignalGenerator::generateSineWave(50.0, sampleRate, numSamples, 0.5f);
    auto highFreq = TestSignalGenerator::generateSineWave(2000.0, sampleRate, numSamples, 0.5f);

    std::vector<float> input(numSamples);
    for (size_t i = 0; i < numSamples; ++i) {
        input[i] = lowFreq[i] + highFreq[i];
    }

    std::vector<float> output(numSamples);
    noiseReducer->processMono(input.data(), output.data(), numSamples);

    // Les basses fréquences devraient être atténuées
    double lowFreqRMS = MathTestUtilities::computeRMS(lowFreq);
    double outputRMS = MathTestUtilities::computeRMS(output);

    // Le niveau de sortie devrait être plus bas que le niveau des basses fréquences
    EXPECT_TRUE(outputRMS < lowFreqRMS * 0.8);
}

TEST_F(NoiseReducerTest, SampleRateChange) {
    uint32_t newSampleRate = 44100;
    EXPECT_NO_THROW(noiseReducer->setSampleRate(newSampleRate));
    EXPECT_EQ(noiseReducer->getSampleRate(), newSampleRate);
}

// Tests pour SpectralNR
class SpectralNRTest : public ::testing::Test {
protected:
    void SetUp() override {
        config.fftSize = 1024;
        config.hopSize = 256;
        config.beta = 1.5;
        config.floorGain = 0.05;
        config.noiseUpdate = 0.98;
        config.enabled = true;
        config.sampleRate = 48000;

        spectralNR = std::make_unique<AudioNR::SpectralNR>(config);
        tolerance = 1e-6;
    }

    void TearDown() override {
        spectralNR.reset();
    }

    AudioNR::SpectralNRConfig config;
    std::unique_ptr<AudioNR::SpectralNR> spectralNR;
    double tolerance;
};

TEST_F(SpectralNRTest, Initialization) {
    EXPECT_EQ(spectralNR->getConfig().fftSize, config.fftSize);
    EXPECT_EQ(spectralNR->getConfig().hopSize, config.hopSize);
    EXPECT_NEAR(spectralNR->getConfig().beta, config.beta, tolerance);
}

TEST_F(SpectralNRTest, ConfigurationValidation) {
    // Test taille FFT valide
    config.fftSize = 512;
    EXPECT_NO_THROW(spectralNR->setConfig(config));

    // Test taille FFT invalide (pas une puissance de 2)
    config.fftSize = 1000;
    EXPECT_THROW(spectralNR->setConfig(config), std::invalid_argument);

    // Test hop size invalide
    config.fftSize = 1024;
    config.hopSize = 2048; // Plus grand que FFT size
    EXPECT_THROW(spectralNR->setConfig(config), std::invalid_argument);
}

TEST_F(SpectralNRTest, BasicSpectralSubtraction) {
    size_t numSamples = 4096; // Multiple du hop size

    // Créer un signal sinusoïdal avec du bruit
    auto signal = TestSignalGenerator::generateSineWave(1000.0, config.sampleRate, numSamples, 0.3f);
    auto noise = TestSignalGenerator::generateNoise(numSamples, 0.1f);

    std::vector<float> input(numSamples);
    for (size_t i = 0; i < numSamples; ++i) {
        input[i] = signal[i] + noise[i];
    }

    std::vector<float> output(numSamples);
    spectralNR->process(input.data(), output.data(), numSamples);

    // Le signal de sortie devrait être présent
    double outputRMS = MathTestUtilities::computeRMS(output);
    EXPECT_TRUE(outputRMS > 0.0);

    // Le bruit devrait être réduit (mais pas complètement éliminé)
    double inputNoiseRMS = MathTestUtilities::computeRMS(noise);
    double outputNoiseRMS = MathTestUtilities::computeRMS(output);

    // Le niveau de bruit devrait être réduit d'au moins 3dB
    double noiseReductionDb = 20.0 * std::log10(outputNoiseRMS / inputNoiseRMS);
    EXPECT_TRUE(noiseReductionDb < -3.0);
}

TEST_F(SpectralNRTest, Windowing) {
    size_t numSamples = config.fftSize;

    // Test avec une impulsion
    auto input = TestSignalGenerator::generateImpulse(numSamples, 0);
    std::vector<float> output(numSamples);

    spectralNR->process(input.data(), output.data(), numSamples);

    // Vérifier que la sortie est fenêtrée (pas de discontinuités)
    double maxOutput = MathTestUtilities::computePeak(output);
    EXPECT_TRUE(maxOutput > 0.0);

    // Vérifier que les échantillons aux extrémités sont proches de zéro (effet de la fenêtre)
    EXPECT_NEAR(output[0], 0.0, 0.1);
    EXPECT_NEAR(output[numSamples-1], 0.0, 0.1);
}

TEST_F(SpectralNRTest, OverlapAdd) {
    size_t numSamples = config.fftSize * 2; // Deux frames

    auto input = TestSignalGenerator::generateSineWave(1000.0, config.sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    spectralNR->process(input.data(), output.data(), numSamples);

    // Vérifier la continuité entre les frames (overlap-add)
    size_t hopSize = config.hopSize;
    double continuityError = 0.0;
    int errorCount = 0;

    // Vérifier la continuité au point de jonction
    for (size_t i = 0; i < hopSize; ++i) {
        size_t idx1 = config.fftSize - hopSize + i;
        size_t idx2 = config.fftSize + i;
        if (idx2 < numSamples) {
            continuityError += std::abs(output[idx1] - output[idx2]);
            errorCount++;
        }
    }

    if (errorCount > 0) {
        continuityError /= errorCount;
        EXPECT_TRUE(continuityError < 0.1); // Erreur de continuité acceptable
    }
}

TEST_F(SpectralNRTest, BypassMode) {
    config.enabled = false;
    spectralNR->setConfig(config);

    size_t numSamples = config.fftSize;
    auto input = TestSignalGenerator::generateSineWave(1000.0, config.sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    spectralNR->process(input.data(), output.data(), numSamples);

    // En mode bypass, sortie ≈ entrée (avec petite erreur due au fenêtrage)
    EXPECT_TRUE(MathTestUtilities::isApproximatelyEqual(input, output, 0.1));
}

TEST_F(SpectralNRTest, ParameterEffects) {
    size_t numSamples = config.fftSize * 2;

    // Test avec différents paramètres beta
    auto input = TestSignalGenerator::generateSineWave(1000.0, config.sampleRate, numSamples, 0.3f);
    auto noise = TestSignalGenerator::generateNoise(numSamples, 0.1f);

    std::vector<float> noisySignal(numSamples);
    for (size_t i = 0; i < numSamples; ++i) {
        noisySignal[i] = input[i] + noise[i];
    }

    // Test avec beta faible
    config.beta = 1.0;
    spectralNR->setConfig(config);
    std::vector<float> outputLowBeta(numSamples);
    spectralNR->process(noisySignal.data(), outputLowBeta.data(), numSamples);

    // Test avec beta élevé
    config.beta = 3.0;
    spectralNR->setConfig(config);
    std::vector<float> outputHighBeta(numSamples);
    spectralNR->process(noisySignal.data(), outputHighBeta.data(), numSamples);

    // Beta élevé devrait donner plus d'atténuation
    double rmsLowBeta = MathTestUtilities::computeRMS(outputLowBeta);
    double rmsHighBeta = MathTestUtilities::computeRMS(outputHighBeta);

    EXPECT_TRUE(rmsHighBeta <= rmsLowBeta);
}

// Tests de performance
TEST_F(NoiseReducerTest, PerformanceBenchmark) {
    size_t numSamples = 16384; // 16k samples
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.3f);
    auto noise = TestSignalGenerator::generateNoise(numSamples, 0.05f);

    std::vector<float> noisyInput(numSamples);
    for (size_t i = 0; i < numSamples; ++i) {
        noisyInput[i] = input[i] + noise[i];
    }

    std::vector<float> output(numSamples);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        noiseReducer->processMono(noisyInput.data(), output.data(), numSamples);
    }, 50);

    PerformanceBenchmark::logBenchmark("NoiseReducer", duration, 50);

    // Vérifier que c'est temps réel (< 15ms pour 16k samples)
    double msPerBuffer = duration.count() / 50.0 / 1000000.0;
    EXPECT_TRUE(msPerBuffer < 15.0) << "NoiseReducer too slow: " << msPerBuffer << "ms";
}

TEST_F(SpectralNRTest, PerformanceBenchmark) {
    size_t numSamples = 8192; // Multiple du hop size
    auto input = TestSignalGenerator::generateSineWave(1000.0, config.sampleRate, numSamples, 0.3f);
    std::vector<float> output(numSamples);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        spectralNR->process(input.data(), output.data(), numSamples);
    }, 20);

    PerformanceBenchmark::logBenchmark("SpectralNR", duration, 20);

    // Vérifier que c'est temps réel (< 50ms pour 8k samples)
    double msPerBuffer = duration.count() / 20.0 / 1000000.0;
    EXPECT_TRUE(msPerBuffer < 50.0) << "SpectralNR too slow: " << msPerBuffer << "ms";
}

// Tests de robustesse
TEST_F(NoiseReducerTest, ExtremeParameters) {
    AudioNR::NoiseReducerConfig extremeConfig{};
    extremeConfig.enabled = true;
    extremeConfig.thresholdDb = -80.0; // Seuil très bas
    extremeConfig.ratio = 1.0;         // Ratio minimal
    extremeConfig.attackMs = 100.0;    // Attack lent
    extremeConfig.releaseMs = 1000.0;  // Release très lent
    extremeConfig.floorDb = -60.0;     // Floor bas
    extremeConfig.highPassHz = 20.0;   // Passe-haut très bas

    EXPECT_NO_THROW(noiseReducer->setConfig(extremeConfig));

    size_t numSamples = 512;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.1f);
    std::vector<float> output(numSamples);

    EXPECT_NO_THROW(noiseReducer->processMono(input.data(), output.data(), numSamples));

    // Vérifier que la sortie est toujours valide
    for (float sample : output) {
        EXPECT_TRUE(std::isfinite(sample));
        EXPECT_TRUE(sample >= -1.0f && sample <= 1.0f);
    }
}

TEST_F(SpectralNRTest, ExtremeParameters) {
    // Test avec taille FFT minimale
    config.fftSize = 64;
    config.hopSize = 16;
    EXPECT_NO_THROW(spectralNR->setConfig(config));

    size_t numSamples = config.fftSize;
    auto input = TestSignalGenerator::generateSineWave(1000.0, config.sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    EXPECT_NO_THROW(spectralNR->process(input.data(), output.data(), numSamples));

    // Test avec beta extrême
    config.fftSize = 1024;
    config.hopSize = 256;
    config.beta = 5.0;
    EXPECT_NO_THROW(spectralNR->setConfig(config));

    EXPECT_NO_THROW(spectralNR->process(input.data(), output.data(), numSamples));
}
