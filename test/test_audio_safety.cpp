#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <cmath>
#include <vector>
#include <memory>
#include "../shared/Audio/safety/AudioSafety.h"
#include "test_main.cpp"

// Test fixture pour AudioSafetyEngine
class AudioSafetyTest : public ::testing::Test {
protected:
    void SetUp() override {
        sampleRate = 48000;
        numChannels = 2;
        tolerance = 1e-6;

        AudioSafety::SafetyConfig config{};
        config.enabled = true;
        config.dcRemovalEnabled = true;
        config.limiterEnabled = true;
        config.limiterThresholdDb = -1.0;
        config.feedbackDetectEnabled = true;
        config.feedbackCorrThreshold = 0.95;

        safetyEngine = std::make_unique<AudioSafety::AudioSafetyEngine>(sampleRate, numChannels);
        safetyEngine->setConfig(config);
    }

    void TearDown() override {
        safetyEngine.reset();
    }

    std::unique_ptr<AudioSafety::AudioSafetyEngine> safetyEngine;
    uint32_t sampleRate;
    int numChannels;
    double tolerance;
};

TEST_F(AudioSafetyTest, Initialization) {
    EXPECT_TRUE(safetyEngine->isEnabled());
    EXPECT_EQ(safetyEngine->getSampleRate(), sampleRate);

    auto config = safetyEngine->getConfig();
    EXPECT_TRUE(config.enabled);
    EXPECT_TRUE(config.dcRemovalEnabled);
    EXPECT_TRUE(config.limiterEnabled);
}

TEST_F(AudioSafetyTest, ConfigurationValidation) {
    AudioSafety::SafetyConfig config{};

    // Test paramètres valides
    config.limiterThresholdDb = -6.0;
    config.kneeWidthDb = 4.0;
    config.dcThreshold = 0.01;
    config.feedbackCorrThreshold = 0.8;

    EXPECT_NO_THROW(safetyEngine->setConfig(config));

    // Test paramètres invalides
    config.limiterThresholdDb = 5.0; // Trop haut
    EXPECT_THROW(safetyEngine->setConfig(config), std::invalid_argument);

    config.limiterThresholdDb = -25.0; // Trop bas
    EXPECT_THROW(safetyEngine->setConfig(config), std::invalid_argument);

    config.kneeWidthDb = 30.0; // Trop large
    EXPECT_THROW(safetyEngine->setConfig(config), std::invalid_argument);

    config.feedbackCorrThreshold = 1.5; // Trop haut
    EXPECT_THROW(safetyEngine->setConfig(config), std::invalid_argument);
}

TEST_F(AudioSafetyTest, DCOffsetRemoval) {
    size_t numSamples = 1024;

    // Créer un signal avec offset DC
    std::vector<float> input(numSamples, 0.0f);
    float dcOffset = 0.1f;
    for (size_t i = 0; i < numSamples; ++i) {
        input[i] = 0.3f + dcOffset; // Signal constant avec offset
    }

    std::vector<float> output(numSamples);
    safetyEngine->processMono(input.data(), output.data(), numSamples);

    auto report = safetyEngine->getLastReport();

    // L'offset DC devrait être réduit
    EXPECT_NEAR(report.dcOffset, 0.0, 0.01);

    // Le signal devrait être centré autour de zéro
    double sum = 0.0;
    for (float sample : output) {
        sum += sample;
    }
    double avg = sum / numSamples;
    EXPECT_NEAR(avg, 0.0, 0.01);
}

TEST_F(AudioSafetyTest, LimiterFunctionality) {
    size_t numSamples = 512;

    // Créer un signal qui dépasse le seuil du limiteur
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 1.2f); // > 0dBFS
    std::vector<float> output(numSamples);

    safetyEngine->processMono(input.data(), output.data(), numSamples);
    auto report = safetyEngine->getLastReport();

    // Le limiteur devrait s'activer
    EXPECT_TRUE(report.overloadActive);

    // Les échantillons devraient être limités
    double maxOutput = MathTestUtilities::computePeak(output);
    EXPECT_TRUE(maxOutput <= 1.0f);

    // Le niveau RMS devrait être réduit
    double inputRMS = MathTestUtilities::computeRMS(input);
    double outputRMS = MathTestUtilities::computeRMS(output);
    EXPECT_TRUE(outputRMS <= inputRMS);
}

TEST_F(AudioSafetyTest, StereoProcessing) {
    size_t numSamples = 512;

    // Créer des signaux stéréo avec différents niveaux
    auto inputL = TestSignalGenerator::generateSineWave(440.0, sampleRate, numSamples, 0.8f);
    auto inputR = TestSignalGenerator::generateSineWave(880.0, sampleRate, numSamples, 1.1f); // Clip

    std::vector<float> outputL(numSamples), outputR(numSamples);
    safetyEngine->processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), numSamples);

    auto report = safetyEngine->getLastReport();

    // Les deux canaux devraient être traités
    double peakL = MathTestUtilities::computePeak(outputL);
    double peakR = MathTestUtilities::computePeak(outputR);

    EXPECT_TRUE(peakL <= 1.0f);
    EXPECT_TRUE(peakR <= 1.0f);

    // Le canal droit devrait être plus limité
    EXPECT_TRUE(peakR <= peakL);
}

TEST_F(AudioSafetyTest, ClippingDetection) {
    size_t numSamples = 256;

    // Créer un signal avec clipping
    std::vector<float> input(numSamples, 0.0f);
    for (size_t i = 0; i < 10; ++i) {
        input[i] = 1.5f; // Au-delà de 0dBFS
    }

    std::vector<float> output(numSamples);
    safetyEngine->processMono(input.data(), output.data(), numSamples);

    auto report = safetyEngine->getLastReport();

    // Des échantillons devraient être détectés comme clipés
    EXPECT_TRUE(report.clippedSamples > 0);

    // Les échantillons de sortie devraient être dans les limites
    for (float sample : output) {
        EXPECT_TRUE(sample >= -1.0f && sample <= 1.0f);
    }
}

TEST_F(AudioSafetyTest, NaNInfHandling) {
    size_t numSamples = 128;

    // Créer un signal avec NaN et Inf
    std::vector<float> input(numSamples, 0.3f);
    input[10] = std::numeric_limits<float>::quiet_NaN();
    input[20] = std::numeric_limits<float>::infinity();
    input[30] = -std::numeric_limits<float>::infinity();

    std::vector<float> output(numSamples);
    safetyEngine->processMono(input.data(), output.data(), numSamples);

    auto report = safetyEngine->getLastReport();

    // NaN devrait être détecté
    EXPECT_TRUE(report.hasNaN);

    // Tous les échantillons de sortie devraient être finis et dans les limites
    for (float sample : output) {
        EXPECT_TRUE(std::isfinite(sample));
        EXPECT_TRUE(sample >= -1.0f && sample <= 1.0f);
    }
}

TEST_F(AudioSafetyTest, FeedbackDetection) {
    size_t numSamples = 1024;

    // Créer un signal avec forte corrélation (simulant du feedback)
    std::vector<float> input(numSamples, 0.0f);
    int lag = 128; // Lag typique pour le feedback

    // Créer une corrélation artificielle
    for (size_t i = lag; i < numSamples; ++i) {
        input[i] = 0.5f * input[i - lag] + 0.1f * (rand() % 100) / 100.0f;
    }

    std::vector<float> output(numSamples);
    safetyEngine->processMono(input.data(), output.data(), numSamples);

    auto report = safetyEngine->getLastReport();

    // Le score de feedback devrait être élevé
    EXPECT_TRUE(report.feedbackScore > 0.5);
}

TEST_F(AudioSafetyTest, BypassMode) {
    // Désactiver la sécurité
    auto config = safetyEngine->getConfig();
    config.enabled = false;
    safetyEngine->setConfig(config);

    size_t numSamples = 256;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.8f);
    std::vector<float> output(numSamples);

    safetyEngine->processMono(input.data(), output.data(), numSamples);

    // En mode bypass, sortie = entrée (sauf pour les NaN/Inf qui sont quand même traités)
    EXPECT_TRUE(MathTestUtilities::isApproximatelyEqual(input, output, tolerance));
}

TEST_F(AudioSafetyTest, SoftKneeLimiter) {
    // Activer le soft knee
    auto config = safetyEngine->getConfig();
    config.softKneeLimiter = true;
    config.kneeWidthDb = 6.0;
    safetyEngine->setConfig(config);

    size_t numSamples = 512;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.9f);
    std::vector<float> output(numSamples);

    safetyEngine->processMono(input.data(), output.data(), numSamples);

    // Le limiteur soft knee devrait être plus doux
    double inputPeak = MathTestUtilities::computePeak(input);
    double outputPeak = MathTestUtilities::computePeak(output);

    // Le pic devrait être légèrement réduit mais pas brutalement limité
    EXPECT_TRUE(outputPeak < inputPeak);
    EXPECT_TRUE(outputPeak > inputPeak * 0.8); // Pas de réduction excessive
}

TEST_F(AudioSafetyTest, SampleRateChange) {
    uint32_t newSampleRate = 44100;
    EXPECT_NO_THROW(safetyEngine->setSampleRate(newSampleRate));
    EXPECT_EQ(safetyEngine->getSampleRate(), newSampleRate);

    size_t numSamples = 256;
    auto input = TestSignalGenerator::generateSineWave(1000.0, newSampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    EXPECT_NO_THROW(safetyEngine->processMono(input.data(), output.data(), numSamples));
}

TEST_F(AudioSafetyTest, ExtremeSignals) {
    size_t numSamples = 128;

    // Test avec signal très faible
    std::vector<float> lowSignal(numSamples, 1e-6f);
    std::vector<float> output1(numSamples);
    safetyEngine->processMono(lowSignal.data(), output1.data(), numSamples);

    auto report1 = safetyEngine->getLastReport();
    EXPECT_FALSE(report1.overloadActive);
    EXPECT_FALSE(report1.hasNaN);

    // Test avec signal très fort
    std::vector<float> highSignal(numSamples, 10.0f); // Bien au-dessus de 0dBFS
    std::vector<float> output2(numSamples);
    safetyEngine->processMono(highSignal.data(), output2.data(), numSamples);

    auto report2 = safetyEngine->getLastReport();
    EXPECT_TRUE(report2.overloadActive);
    EXPECT_TRUE(report2.clippedSamples > 0);

    // Vérifier que la sortie est toujours dans les limites
    for (float sample : output2) {
        EXPECT_TRUE(sample >= -1.0f && sample <= 1.0f);
    }
}

TEST_F(AudioSafetyTest, FeedbackDetectionAccuracy) {
    size_t numSamples = 2048;

    // Test avec signal sans feedback (bruit blanc)
    auto noiseSignal = TestSignalGenerator::generateNoise(numSamples, 0.3f);
    std::vector<float> output1(numSamples);
    safetyEngine->processMono(noiseSignal.data(), output1.data(), numSamples);

    auto report1 = safetyEngine->getLastReport();
    EXPECT_TRUE(report1.feedbackScore < 0.3); // Score bas pour le bruit

    // Test avec signal sinusoïdal (pas de feedback)
    auto sineSignal = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output2(numSamples);
    safetyEngine->processMono(sineSignal.data(), output2.data(), numSamples);

    auto report2 = safetyEngine->getLastReport();
    EXPECT_TRUE(report2.feedbackScore < 0.5); // Score bas pour le sinus
}

TEST_F(AudioSafetyTest, PerformanceBenchmark) {
    size_t numSamples = 8192; // 8k samples
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.8f);
    std::vector<float> output(numSamples);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        safetyEngine->processMono(input.data(), output.data(), numSamples);
    }, 100);

    PerformanceBenchmark::logBenchmark("AudioSafetyEngine", duration, 100);

    // Vérifier que c'est temps réel (< 5ms pour 8k samples)
    double msPerBuffer = duration.count() / 100.0 / 1000000.0;
    EXPECT_TRUE(msPerBuffer < 5.0) << "AudioSafety too slow: " << msPerBuffer << "ms";
}

TEST_F(AudioSafetyTest, StereoPerformanceBenchmark) {
    size_t numSamples = 4096; // 4k samples per channel
    auto inputL = TestSignalGenerator::generateSineWave(440.0, sampleRate, numSamples, 0.7f);
    auto inputR = TestSignalGenerator::generateSineWave(880.0, sampleRate, numSamples, 0.6f);
    std::vector<float> outputL(numSamples), outputR(numSamples);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        safetyEngine->processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), numSamples);
    }, 100);

    PerformanceBenchmark::logBenchmark("AudioSafetyEngine Stereo", duration, 100);

    double msPerBuffer = duration.count() / 100.0 / 1000000.0;
    EXPECT_TRUE(msPerBuffer < 3.0) << "AudioSafety stereo too slow: " << msPerBuffer << "ms";
}

// Tests de robustesse
TEST_F(AudioSafetyTest, InvalidInputs) {
    // Test avec pointeurs null
    EXPECT_THROW(safetyEngine->processMono(nullptr, nullptr, 0), std::invalid_argument);

    // Test avec tailles invalides
    size_t numSamples = 512;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    // Ces appels ne devraient pas crasher mais pourraient produire des warnings
    EXPECT_NO_THROW(safetyEngine->processMono(input.data(), output.data(), 0)); // Taille 0
}

TEST_F(AudioSafetyTest, ParameterBoundaries) {
    AudioSafety::SafetyConfig config{};

    // Test limites valides
    config.dcThreshold = 0.0; // Minimum
    config.dcThreshold = 0.05; // Maximum
    config.feedbackCorrThreshold = 0.0; // Minimum
    config.feedbackCorrThreshold = 1.0; // Maximum
    config.kneeWidthDb = 0.0; // Minimum
    config.kneeWidthDb = 24.0; // Maximum

    EXPECT_NO_THROW(safetyEngine->setConfig(config));

    // Test valeurs légèrement hors limites (devraient être clampées)
    config.dcThreshold = -0.01;
    config.feedbackCorrThreshold = 1.1;
    config.kneeWidthDb = 25.0;

    // Ces valeurs devraient être acceptées ou clampées
    EXPECT_NO_THROW(safetyEngine->setConfig(config));
}

// Test de stabilité du système
TEST_F(AudioSafetyTest, SystemStability) {
    size_t numSamples = 1024;

    // Test avec des signaux problématiques
    std::vector<float> problematicSignal(numSamples);

    // Signal avec fortes variations
    for (size_t i = 0; i < numSamples; ++i) {
        problematicSignal[i] = (i % 2 == 0) ? 0.9f : -0.9f;
    }

    std::vector<float> output(numSamples);
    EXPECT_NO_THROW(safetyEngine->processMono(problematicSignal.data(), output.data(), numSamples));

    auto report = safetyEngine->getLastReport();

    // Le système devrait rester stable
    EXPECT_FALSE(report.hasNaN);
    EXPECT_TRUE(report.clippedSamples >= 0);

    // Tous les échantillons de sortie devraient être valides
    for (float sample : output) {
        EXPECT_TRUE(std::isfinite(sample));
        EXPECT_TRUE(sample >= -1.0f && sample <= 1.0f);
    }
}
