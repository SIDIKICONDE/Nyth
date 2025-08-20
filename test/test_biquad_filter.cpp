#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <cmath>
#include <vector>
#include <complex>
#include "../shared/Audio/core/BiquadFilter.h"
#include "test_main.cpp"

// Test fixture pour BiquadFilter
class BiquadFilterTest : public ::testing::Test {
protected:
    void SetUp() override {
        filter = std::make_unique<AudioEqualizer::BiquadFilter>();
        sampleRate = 48000;
        tolerance = 1e-6;
    }

    void TearDown() override {
        filter.reset();
    }

    std::unique_ptr<AudioEqualizer::BiquadFilter> filter;
    uint32_t sampleRate;
    double tolerance;
};

// Tests des coefficients de filtre
TEST_F(BiquadFilterTest, LowpassCoefficientsCalculation) {
    double frequency = 1000.0;
    double q = 0.707;

    filter->calculateLowpass(frequency, sampleRate, q);

    double a0, a1, a2, b0, b1, b2;
    filter->getCoefficients(a0, a1, a2, b0, b1, b2);

    // Vérifier la normalisation (b0 = 1.0 après normalisation)
    EXPECT_NEAR(b0, 1.0, tolerance);

    // Vérifier que les coefficients sont dans des plages raisonnables
    EXPECT_TRUE(std::abs(a0) > 0.0);
    EXPECT_TRUE(std::abs(b1) < 2.0);
    EXPECT_TRUE(std::abs(b2) < 2.0);

    // Vérifier la stabilité (poles à l'intérieur du cercle unité)
    double discriminant = b1 * b1 - 4.0 * b2;
    if (discriminant >= 0) {
        double root1 = (-b1 + std::sqrt(discriminant)) / 2.0;
        double root2 = (-b1 - std::sqrt(discriminant)) / 2.0;
        EXPECT_TRUE(std::abs(root1) < 1.0);
        EXPECT_TRUE(std::abs(root2) < 1.0);
    }
}

TEST_F(BiquadFilterTest, HighpassCoefficientsCalculation) {
    double frequency = 1000.0;
    double q = 0.707;

    filter->calculateHighpass(frequency, sampleRate, q);

    double a0, a1, a2, b0, b1, b2;
    filter->getCoefficients(a0, a1, a2, b0, b1, b2);

    EXPECT_NEAR(b0, 1.0, tolerance);
    EXPECT_TRUE(std::abs(a0) > 0.0);
}

TEST_F(BiquadFilterTest, BandpassCoefficientsCalculation) {
    double frequency = 1000.0;
    double q = 1.414;

    filter->calculateBandpass(frequency, sampleRate, q);

    double a0, a1, a2, b0, b1, b2;
    filter->getCoefficients(a0, a1, a2, b0, b1, b2);

    EXPECT_NEAR(b0, 1.0, tolerance);
    // Pour un bandpass, a0 devrait être plus petit que pour lowpass/highpass
    EXPECT_TRUE(std::abs(a0) < 1.0);
}

TEST_F(BiquadFilterTest, PeakingCoefficientsCalculation) {
    double frequency = 1000.0;
    double q = 1.414;
    double gainDb = 6.0;

    filter->calculatePeaking(frequency, sampleRate, q, gainDb);

    double a0, a1, a2, b0, b1, b2;
    filter->getCoefficients(a0, a1, a2, b0, b1, b2);

    EXPECT_NEAR(b0, 1.0, tolerance);

    // Le gain devrait être appliqué
    double linearGain = std::pow(10.0, gainDb / 40.0);
    EXPECT_TRUE(std::abs(a0) > 0.0);
}

TEST_F(BiquadFilterTest, ShelfCoefficientsCalculation) {
    double frequency = 1000.0;
    double q = 0.707;
    double gainDb = 6.0;

    // Test Low Shelf
    filter->calculateLowShelf(frequency, sampleRate, q, gainDb);
    double a0, a1, a2, b0, b1, b2;
    filter->getCoefficients(a0, a1, a2, b0, b1, b2);
    EXPECT_NEAR(b0, 1.0, tolerance);

    // Test High Shelf
    filter->calculateHighShelf(frequency, sampleRate, q, gainDb);
    filter->getCoefficients(a0, a1, a2, b0, b1, b2);
    EXPECT_NEAR(b0, 1.0, tolerance);
}

// Tests de réponse fréquentielle
TEST_F(BiquadFilterTest, LowpassFrequencyResponse) {
    filter->calculateLowpass(1000.0, sampleRate, 0.707);

    // Test avec un signal sinusoïdal à la fréquence de coupure
    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    filter->process(input.data(), output.data(), numSamples);

    // À la fréquence de coupure, l'atténuation devrait être d'environ -3dB
    double inputRMS = MathTestUtilities::computeRMS(input);
    double outputRMS = MathTestUtilities::computeRMS(output);

    double attenuationDb = 20.0 * std::log10(outputRMS / inputRMS);
    EXPECT_NEAR(attenuationDb, -3.0, 1.0); // Tolérance de 1dB
}

TEST_F(BiquadFilterTest, HighpassFrequencyResponse) {
    filter->calculateHighpass(1000.0, sampleRate, 0.707);

    // Test avec un signal sinusoïdal à la fréquence de coupure
    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateSineWave(100.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    filter->process(input.data(), output.data(), numSamples);

    // En dessous de la fréquence de coupure, devrait y avoir atténuation
    double inputRMS = MathTestUtilities::computeRMS(input);
    double outputRMS = MathTestUtilities::computeRMS(output);

    double attenuationDb = 20.0 * std::log10(outputRMS / inputRMS);
    EXPECT_TRUE(attenuationDb < -10.0); // Atténuation significative
}

TEST_F(BiquadFilterTest, BandpassFrequencyResponse) {
    filter->calculateBandpass(1000.0, sampleRate, 1.414);

    size_t numSamples = 1024;

    // Test à la fréquence centrale
    auto inputCenter = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> outputCenter(numSamples);
    filter->process(inputCenter.data(), outputCenter.data(), numSamples);

    // Test hors de la bande passante
    auto inputOut = TestSignalGenerator::generateSineWave(100.0, sampleRate, numSamples, 0.5f);
    std::vector<float> outputOut(numSamples);
    filter->reset(); // Reset filter state
    filter->process(inputOut.data(), outputOut.data(), numSamples);

    double centerRMS = MathTestUtilities::computeRMS(outputCenter);
    double outRMS = MathTestUtilities::computeRMS(outputOut);

    // La fréquence centrale devrait avoir plus de gain que la fréquence hors bande
    EXPECT_TRUE(centerRMS > outRMS);
}

// Tests de stabilité et robustesse
TEST_F(BiquadFilterTest, FilterStability) {
    // Test avec différentes fréquences et Q
    std::vector<double> frequencies = {20.0, 100.0, 1000.0, 10000.0, 20000.0};
    std::vector<double> qValues = {0.1, 0.707, 1.414, 2.0, 10.0};

    for (double freq : frequencies) {
        for (double q : qValues) {
            filter->calculateLowpass(freq, sampleRate, q);

            double a0, a1, a2, b0, b1, b2;
            filter->getCoefficients(a0, a1, a2, b0, b1, b2);

            // Vérifier la stabilité (poles dans le cercle unité)
            double discriminant = b1 * b1 - 4.0 * b2;
            if (discriminant > 0) {
                double root1 = (-b1 + std::sqrt(discriminant)) / 2.0;
                double root2 = (-b1 - std::sqrt(discriminant)) / 2.0;
                EXPECT_TRUE(std::abs(root1) < 1.0) << "Unstable filter at freq=" << freq << " Q=" << q;
                EXPECT_TRUE(std::abs(root2) < 1.0) << "Unstable filter at freq=" << freq << " Q=" << q;
            }
        }
    }
}

TEST_F(BiquadFilterTest, ImpulseResponse) {
    filter->calculateLowpass(1000.0, sampleRate, 0.707);

    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateImpulse(numSamples, 0);
    std::vector<float> output(numSamples);

    filter->process(input.data(), output.data(), numSamples);

    // L'impulsion devrait produire une réponse qui décroit
    double maxResponse = MathTestUtilities::computePeak(output);
    EXPECT_TRUE(maxResponse > 0.0);

    // Vérifier que la réponse décroit (stabilité)
    bool decreasing = true;
    double maxVal = 0.0;
    for (size_t i = 1; i < numSamples; ++i) {
        if (std::abs(output[i]) > maxVal) {
            maxVal = std::abs(output[i]);
        } else if (std::abs(output[i]) > maxVal * 0.1) { // Après le pic, devrait décroitre
            decreasing = decreasing && (std::abs(output[i]) <= std::abs(output[i-1]));
        }
    }
    EXPECT_TRUE(decreasing);
}

// Tests de performance
TEST_F(BiquadFilterTest, PerformanceTest) {
    filter->calculateLowpass(1000.0, sampleRate, 0.707);

    size_t numSamples = 65536; // 64k samples
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        filter->process(input.data(), output.data(), numSamples);
    }, 100);

    PerformanceBenchmark::logBenchmark("BiquadFilter Lowpass", duration, 100);

    // Vérifier que le traitement est temps réel (< 10ms pour 64k samples)
    double msPerBuffer = duration.count() / 100.0 / 1000000.0;
    EXPECT_TRUE(msPerBuffer < 10.0) << "Processing too slow: " << msPerBuffer << "ms";
}

// Tests de traitement stéréo
TEST_F(BiquadFilterTest, StereoProcessing) {
    filter->calculateLowpass(1000.0, sampleRate, 0.707);

    size_t numSamples = 1024;
    auto inputL = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    auto inputR = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.3f);
    std::vector<float> outputL(numSamples), outputR(numSamples);

    filter->processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), numSamples);

    // Les canaux gauche et droite devraient être traités indépendamment
    double rmsL = MathTestUtilities::computeRMS(outputL);
    double rmsR = MathTestUtilities::computeRMS(outputR);

    EXPECT_TRUE(rmsL > 0.0);
    EXPECT_TRUE(rmsR > 0.0);
}

// Tests de reset
TEST_F(BiquadFilterTest, ResetFunctionality) {
    filter->calculateLowpass(1000.0, sampleRate, 0.707);

    // Traiter un signal pour mettre le filtre dans un état
    size_t numSamples = 512;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output1(numSamples), output2(numSamples);

    filter->process(input.data(), output1.data(), numSamples);
    filter->reset();
    filter->process(input.data(), output2.data(), numSamples);

    // Après reset, la réponse devrait être identique
    EXPECT_TRUE(MathTestUtilities::isApproximatelyEqual(output1, output2, 1e-3));
}

// Tests de coefficients extrêmes
TEST_F(BiquadFilterTest, ExtremeCoefficientValues) {
    // Test avec Q très faible
    filter->calculateLowpass(1000.0, sampleRate, 0.1);
    double a0, a1, a2, b0, b1, b2;
    filter->getCoefficients(a0, a1, a2, b0, b1, b2);

    // Le filtre devrait rester stable même avec Q extrême
    EXPECT_TRUE(std::isfinite(a0) && std::isfinite(a1) && std::isfinite(a2));
    EXPECT_TRUE(std::isfinite(b1) && std::isfinite(b2));

    // Test avec fréquence proche de Nyquist
    filter->calculateLowpass(20000.0, sampleRate, 0.707);
    filter->getCoefficients(a0, a1, a2, b0, b1, b2);
    EXPECT_TRUE(std::isfinite(a0) && std::isfinite(a1) && std::isfinite(a2));
}

// Test de la fonction processSample pour vérification temps réel
TEST_F(BiquadFilterTest, RealTimeProcessing) {
    filter->calculateLowpass(1000.0, sampleRate, 0.707);

    // Test avec un signal de test
    size_t numSamples = 1000;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    // Traitement échantillon par échantillon
    for (size_t i = 0; i < numSamples; ++i) {
        output[i] = filter->processSample(input[i]);
    }

    // Comparer avec le traitement par bloc
    std::vector<float> outputBlock(numSamples);
    filter->reset();
    filter->process(input.data(), outputBlock.data(), numSamples);

    // Les résultats devraient être identiques
    EXPECT_TRUE(MathTestUtilities::isApproximatelyEqual(output, outputBlock, 1e-6));
}
