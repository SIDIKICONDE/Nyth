#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <cmath>
#include <vector>
#include <memory>
#include "../shared/Audio/effects/Compressor.h"
#include "../shared/Audio/effects/Delay.h"
#include "../shared/Audio/effects/EffectChain.h"
#include "test_main.cpp"

// Test fixture pour les effets
class AudioEffectsTest : public ::testing::Test {
protected:
    void SetUp() override {
        sampleRate = 48000;
        numChannels = 2;
        tolerance = 1e-6;
    }

    void TearDown() override {
        // Nettoyage automatique via smart pointers
    }

    uint32_t sampleRate;
    int numChannels;
    double tolerance;
};

// Tests du compresseur
class CompressorTest : public AudioEffectsTest {
protected:
    void SetUp() override {
        AudioEffectsTest::SetUp();
        compressor = std::make_unique<AudioFX::CompressorEffect>();
        compressor->setSampleRate(sampleRate, numChannels);
        compressor->setParameters(-18.0, 3.0, 10.0, 80.0, 0.0); // Paramètres par défaut
    }

    std::unique_ptr<AudioFX::CompressorEffect> compressor;
};

TEST_F(CompressorTest, Initialization) {
    EXPECT_FALSE(compressor->isEnabled());

    compressor->setEnabled(true);
    EXPECT_TRUE(compressor->isEnabled());
}

TEST_F(CompressorTest, ParameterSetting) {
    double threshold = -12.0;
    double ratio = 4.0;
    double attack = 5.0;
    double release = 100.0;
    double makeup = 3.0;

    compressor->setParameters(threshold, ratio, attack, release, makeup);
    compressor->setEnabled(true);

    // Créer un signal de test avec compression
    size_t numSamples = 2048;
    std::vector<float> input(numSamples, 0.1f); // Signal constant

    // Ajouter quelques pics pour déclencher la compression
    for (size_t i = 0; i < 10; ++i) {
        input[i * 100] = 0.8f; // Pics au-dessus du seuil
    }

    std::vector<float> output(numSamples);
    compressor->processMono(input.data(), output.data(), numSamples);

    // Le signal compressé devrait avoir un RMS plus uniforme
    double inputRMS = MathTestUtilities::computeRMS(input);
    double outputRMS = MathTestUtilities::computeRMS(output);

    // Le compresseur devrait réduire les variations de niveau
    EXPECT_TRUE(outputRMS < inputRMS);
}

TEST_F(CompressorTest, SoftKneeBehavior) {
    compressor->setParameters(-12.0, 4.0, 10.0, 80.0, 0.0);
    compressor->setEnabled(true);

    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    compressor->processMono(input.data(), output.data(), numSamples);

    // Le signal devrait être légèrement compressé même avec soft knee
    double inputPeak = MathTestUtilities::computePeak(input);
    double outputPeak = MathTestUtilities::computePeak(output);

    EXPECT_TRUE(outputPeak <= inputPeak);
}

TEST_F(CompressorTest, StereoProcessing) {
    compressor->setParameters(-18.0, 3.0, 10.0, 80.0, 0.0);
    compressor->setEnabled(true);

    size_t numSamples = 1024;
    auto inputL = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.8f);
    auto inputR = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.6f);
    std::vector<float> outputL(numSamples), outputR(numSamples);

    compressor->processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), numSamples);

    // Les deux canaux devraient être traités
    double rmsL = MathTestUtilities::computeRMS(outputL);
    double rmsR = MathTestUtilities::computeRMS(outputR);

    EXPECT_TRUE(rmsL > 0.0);
    EXPECT_TRUE(rmsR > 0.0);
}

// Tests du delay
class DelayTest : public AudioEffectsTest {
protected:
    void SetUp() override {
        AudioEffectsTest::SetUp();
        delay = std::make_unique<AudioFX::DelayEffect>();
        delay->setSampleRate(sampleRate, numChannels);
        delay->setParameters(150.0, 0.3, 0.25); // 150ms delay, 30% feedback, 25% mix
    }

    std::unique_ptr<AudioFX::DelayEffect> delay;
};

TEST_F(DelayTest, Initialization) {
    EXPECT_FALSE(delay->isEnabled());

    delay->setEnabled(true);
    EXPECT_TRUE(delay->isEnabled());
}

TEST_F(DelayTest, BasicDelay) {
    delay->setEnabled(true);

    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateImpulse(numSamples, 100);
    std::vector<float> output(numSamples);

    delay->processMono(input.data(), output.data(), numSamples);

    // L'impulsion devrait produire un écho
    double inputPeak = MathTestUtilities::computePeak(input);
    double outputPeak = MathTestUtilities::computePeak(output);

    EXPECT_TRUE(outputPeak > inputPeak * 0.1); // Au moins 10% du niveau original
}

TEST_F(DelayTest, StereoDelay) {
    delay->setEnabled(true);

    size_t numSamples = 512;
    auto inputL = TestSignalGenerator::generateSineWave(440.0, sampleRate, numSamples, 0.3f);
    auto inputR = TestSignalGenerator::generateSineWave(880.0, sampleRate, numSamples, 0.2f);
    std::vector<float> outputL(numSamples), outputR(numSamples);

    delay->processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), numSamples);

    // Les deux canaux devraient avoir de l'écho
    double rmsL = MathTestUtilities::computeRMS(outputL);
    double rmsR = MathTestUtilities::computeRMS(outputR);

    EXPECT_TRUE(rmsL > 0.0);
    EXPECT_TRUE(rmsR > 0.0);
}

TEST_F(DelayTest, ParameterLimits) {
    // Test des limites de paramètres
    delay->setParameters(-10.0, 0.5, 0.5); // Delay négatif -> 0
    delay->setParameters(10.0, 1.5, 0.5);  // Feedback > 1 -> 0.95
    delay->setParameters(10.0, 0.5, -0.1); // Mix négatif -> 0

    // Le delay devrait rester stable
    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.1f);
    std::vector<float> output(numSamples);

    delay->setEnabled(true);
    EXPECT_NO_THROW(delay->processMono(input.data(), output.data(), numSamples));
}

// Tests de l'EffectChain
class EffectChainTest : public AudioEffectsTest {
protected:
    void SetUp() override {
        AudioEffectsTest::SetUp();
        chain = std::make_unique<AudioFX::EffectChain>();
        chain->setSampleRate(sampleRate, numChannels);
    }

    void TearDown() override {
        chain.reset();
    }

    std::unique_ptr<AudioFX::EffectChain> chain;
};

TEST_F(EffectChainTest, EmptyChain) {
    size_t numSamples = 512;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    chain->processMono(input.data(), output.data(), numSamples);

    // Chaîne vide = passthrough
    EXPECT_TRUE(MathTestUtilities::isApproximatelyEqual(input, output, tolerance));
}

TEST_F(EffectChainTest, CompressorInChain) {
    // Ajouter un compresseur à la chaîne
    auto* compressor = chain->emplaceEffect<AudioFX::CompressorEffect>();
    compressor->setParameters(-12.0, 4.0, 10.0, 80.0, 0.0);
    compressor->setEnabled(true);

    chain->setEnabled(true);

    size_t numSamples = 1024;
    std::vector<float> input(numSamples, 0.1f);
    // Ajouter quelques pics
    for (size_t i = 0; i < 5; ++i) {
        input[i * 200] = 0.8f;
    }
    std::vector<float> output(numSamples);

    chain->processMono(input.data(), output.data(), numSamples);

    // Le signal devrait être compressé
    double inputRMS = MathTestUtilities::computeRMS(input);
    double outputRMS = MathTestUtilities::computeRMS(output);

    EXPECT_TRUE(outputRMS < inputRMS);
}

TEST_F(EffectChainTest, MultipleEffects) {
    // Ajouter plusieurs effets
    auto* compressor = chain->emplaceEffect<AudioFX::CompressorEffect>();
    compressor->setParameters(-18.0, 3.0, 10.0, 80.0, 0.0);
    compressor->setEnabled(true);

    auto* delay = chain->emplaceEffect<AudioFX::DelayEffect>();
    delay->setParameters(100.0, 0.2, 0.15);
    delay->setEnabled(true);

    chain->setEnabled(true);

    size_t numSamples = 2048;
    auto input = TestSignalGenerator::generateChirp(100.0, 5000.0, sampleRate, numSamples);
    std::vector<float> output(numSamples);

    chain->processMono(input.data(), output.data(), numSamples);

    // Le signal devrait être modifié par la chaîne d'effets
    EXPECT_FALSE(MathTestUtilities::isApproximatelyEqual(input, output, 0.1));

    double inputRMS = MathTestUtilities::computeRMS(input);
    double outputRMS = MathTestUtilities::computeRMS(output);

    // La compression devrait réduire le niveau global
    EXPECT_TRUE(outputRMS <= inputRMS);
}

TEST_F(EffectChainTest, StereoChain) {
    // Ajouter des effets à la chaîne
    auto* compressor = chain->emplaceEffect<AudioFX::CompressorEffect>();
    compressor->setParameters(-15.0, 3.0, 10.0, 80.0, 0.0);
    compressor->setEnabled(true);

    chain->setEnabled(true);

    size_t numSamples = 1024;
    auto inputL = TestSignalGenerator::generateSineWave(440.0, sampleRate, numSamples, 0.7f);
    auto inputR = TestSignalGenerator::generateSineWave(880.0, sampleRate, numSamples, 0.5f);
    std::vector<float> outputL(numSamples), outputR(numSamples);

    chain->processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), numSamples);

    // Les deux canaux devraient être traités
    double rmsL = MathTestUtilities::computeRMS(outputL);
    double rmsR = MathTestUtilities::computeRMS(outputR);

    EXPECT_TRUE(rmsL > 0.0);
    EXPECT_TRUE(rmsR > 0.0);
}

TEST_F(EffectChainTest, ChainEnableDisable) {
    auto* compressor = chain->emplaceEffect<AudioFX::CompressorEffect>();
    compressor->setParameters(-12.0, 4.0, 10.0, 80.0, 0.0);
    compressor->setEnabled(true);

    size_t numSamples = 512;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.8f);
    std::vector<float> output1(numSamples), output2(numSamples);

    // Chaîne activée
    chain->setEnabled(true);
    chain->processMono(input.data(), output1.data(), numSamples);

    // Chaîne désactivée
    chain->setEnabled(false);
    chain->processMono(input.data(), output2.data(), numSamples);

    // Quand la chaîne est désactivée, sortie = entrée
    EXPECT_TRUE(MathTestUtilities::isApproximatelyEqual(input, output2, tolerance));

    // Quand activée, le signal devrait être différent
    EXPECT_FALSE(MathTestUtilities::isApproximatelyEqual(input, output1, 0.1));
}

TEST_F(EffectChainTest, ClearChain) {
    auto* compressor = chain->emplaceEffect<AudioFX::CompressorEffect>();
    compressor->setEnabled(true);

    // Vérifier que la chaîne n'est pas vide
    size_t numSamples = 512;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output1(numSamples);

    chain->setEnabled(true);
    chain->processMono(input.data(), output1.data(), numSamples);

    // Effacer la chaîne
    chain->clear();

    std::vector<float> output2(numSamples);
    chain->processMono(input.data(), output2.data(), numSamples);

    // Après clear, la chaîne devrait être vide (passthrough)
    EXPECT_TRUE(MathTestUtilities::isApproximatelyEqual(input, output2, tolerance));
}

// Tests de performance des effets
TEST_F(CompressorTest, PerformanceBenchmark) {
    compressor->setParameters(-18.0, 3.0, 10.0, 80.0, 0.0);
    compressor->setEnabled(true);

    size_t numSamples = 32768; // 32k samples
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        compressor->processMono(input.data(), output.data(), numSamples);
    }, 100);

    PerformanceBenchmark::logBenchmark("Compressor", duration, 100);

    // Vérifier que c'est temps réel (< 10ms pour 32k samples)
    double msPerBuffer = duration.count() / 100.0 / 1000000.0;
    EXPECT_TRUE(msPerBuffer < 10.0) << "Compressor too slow: " << msPerBuffer << "ms";
}

TEST_F(DelayTest, PerformanceBenchmark) {
    delay->setParameters(100.0, 0.2, 0.15);
    delay->setEnabled(true);

    size_t numSamples = 16384; // 16k samples
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.3f);
    std::vector<float> output(numSamples);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        delay->processMono(input.data(), output.data(), numSamples);
    }, 100);

    PerformanceBenchmark::logBenchmark("Delay", duration, 100);

    double msPerBuffer = duration.count() / 100.0 / 1000000.0;
    EXPECT_TRUE(msPerBuffer < 5.0) << "Delay too slow: " << msPerBuffer << "ms";
}

// Tests de robustesse
TEST_F(CompressorTest, ExtremeParameters) {
    // Test avec des paramètres extrêmes
    compressor->setParameters(0.0, 20.0, 0.1, 1000.0, 10.0);
    compressor->setEnabled(true);

    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.9f);
    std::vector<float> output(numSamples);

    // Le compresseur devrait rester stable même avec des paramètres extrêmes
    EXPECT_NO_THROW(compressor->processMono(input.data(), output.data(), numSamples));

    // Vérifier que la sortie est toujours dans les limites
    for (float sample : output) {
        EXPECT_TRUE(std::isfinite(sample));
        EXPECT_TRUE(sample >= -1.0f && sample <= 1.0f);
    }
}

TEST_F(DelayTest, ExtremeDelayTimes) {
    // Test avec des temps de delay extrêmes
    delay->setParameters(1.0, 0.1, 0.1);   // Très court
    delay->setParameters(2000.0, 0.1, 0.1); // Très long

    delay->setEnabled(true);

    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.3f);
    std::vector<float> output(numSamples);

    // Le delay devrait rester stable
    EXPECT_NO_THROW(delay->processMono(input.data(), output.data(), numSamples));
}

// Tests de changement de sample rate
TEST_F(CompressorTest, SampleRateChange) {
    compressor->setParameters(-18.0, 3.0, 10.0, 80.0, 0.0);
    compressor->setEnabled(true);

    // Changer le sample rate
    uint32_t newSampleRate = 44100;
    compressor->setSampleRate(newSampleRate, numChannels);

    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateSineWave(1000.0, newSampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    EXPECT_NO_THROW(compressor->processMono(input.data(), output.data(), numSamples));
}

TEST_F(DelayTest, SampleRateChange) {
    delay->setParameters(150.0, 0.3, 0.25);
    delay->setEnabled(true);

    // Changer le sample rate
    uint32_t newSampleRate = 44100;
    delay->setSampleRate(newSampleRate, numChannels);

    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateSineWave(1000.0, newSampleRate, numSamples, 0.3f);
    std::vector<float> output(numSamples);

    EXPECT_NO_THROW(delay->processMono(input.data(), output.data(), numSamples));
}
