#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <cmath>
#include <vector>
#include <thread>
#include <chrono>
#include "../shared/Audio/core/AudioEqualizer.h"
#include "../shared/Audio/utils/Constants.h"
#include "test_main.cpp"

// Mock pour simuler un environnement multithread
class MockAudioCallback {
public:
    MOCK_METHOD(void, onAudioProcessed, (const float*, size_t), ());
};

// Test fixture pour AudioEqualizer
class AudioEqualizerTest : public ::testing::Test {
protected:
    void SetUp() override {
        sampleRate = 48000;
        numBands = 10;
        equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>(numBands, sampleRate);
        tolerance = 1e-6;
    }

    void TearDown() override {
        equalizer.reset();
    }

    std::unique_ptr<AudioEqualizer::AudioEqualizer> equalizer;
    uint32_t sampleRate;
    size_t numBands;
    double tolerance;
    MockAudioCallback mockCallback;
};

// Tests d'initialisation
TEST_F(AudioEqualizerTest, Initialization) {
    EXPECT_EQ(equalizer->getNumBands(), numBands);
    EXPECT_EQ(equalizer->getSampleRate(), sampleRate);
    EXPECT_FALSE(equalizer->isBypassed());

    // Vérifier les fréquences par défaut
    for (size_t i = 0; i < numBands; ++i) {
        double expectedFreq = AudioEqualizer::DEFAULT_FREQUENCIES[i];
        EXPECT_NEAR(equalizer->getBandFrequency(i), expectedFreq, tolerance);
        EXPECT_NEAR(equalizer->getBandGain(i), 0.0, tolerance);
        EXPECT_NEAR(equalizer->getBandQ(i), AudioEqualizer::DEFAULT_Q, tolerance);
    }
}

TEST_F(AudioEqualizerTest, BandConfiguration) {
    size_t testBand = 5;

    // Test modification de fréquence
    double newFreq = 2500.0;
    equalizer->setBandFrequency(testBand, newFreq);
    EXPECT_NEAR(equalizer->getBandFrequency(testBand), newFreq, tolerance);

    // Test modification de gain
    double newGain = 6.0;
    equalizer->setBandGain(testBand, newGain);
    EXPECT_NEAR(equalizer->getBandGain(testBand), newGain, tolerance);

    // Test modification de Q
    double newQ = 2.0;
    equalizer->setBandQ(testBand, newQ);
    EXPECT_NEAR(equalizer->getBandQ(testBand), newQ, tolerance);

    // Test modification de type
    AudioEqualizer::FilterType newType = AudioEqualizer::FilterType::HIGHPASS;
    equalizer->setBandType(testBand, newType);
    EXPECT_EQ(equalizer->getBandType(testBand), newType);
}

TEST_F(AudioEqualizerTest, GainLimits) {
    size_t testBand = 0;

    // Test limites de gain (clipping automatique)
    equalizer->setBandGain(testBand, 30.0); // Au-delà de MAX_GAIN_DB
    EXPECT_NEAR(equalizer->getBandGain(testBand), AudioEqualizer::MAX_GAIN_DB, tolerance);

    equalizer->setBandGain(testBand, -30.0); // En-dessous de MIN_GAIN_DB
    EXPECT_NEAR(equalizer->getBandGain(testBand), AudioEqualizer::MIN_GAIN_DB, tolerance);
}

TEST_F(AudioEqualizerTest, FrequencyLimits) {
    size_t testBand = 0;

    // Test limites de fréquence
    equalizer->setBandFrequency(testBand, 5.0); // Trop bas
    EXPECT_NEAR(equalizer->getBandFrequency(testBand), 20.0, tolerance);

    equalizer->setBandFrequency(testBand, sampleRate / 1.5); // Trop haut
    EXPECT_NEAR(equalizer->getBandFrequency(testBand), sampleRate / 2.0, tolerance);
}

TEST_F(AudioEqualizerTest, MasterGainControl) {
    double testGain = 3.0;
    equalizer->setMasterGain(testGain);
    EXPECT_NEAR(equalizer->getMasterGain(), testGain, tolerance);

    // Test clipping du master gain
    equalizer->setMasterGain(30.0);
    EXPECT_NEAR(equalizer->getMasterGain(), AudioEqualizer::MAX_GAIN_DB, tolerance);
}

// Tests de presets
TEST_F(AudioEqualizerTest, PresetFlat) {
    auto preset = AudioEqualizer::EQPresetFactory::createFlatPreset();
    equalizer->loadPreset(preset);

    for (size_t i = 0; i < numBands; ++i) {
        EXPECT_NEAR(equalizer->getBandGain(i), 0.0, tolerance);
    }
}

TEST_F(AudioEqualizerTest, PresetRock) {
    auto preset = AudioEqualizer::EQPresetFactory::createRockPreset();
    equalizer->loadPreset(preset);

    // Vérifier quelques valeurs caractéristiques du preset Rock
    EXPECT_NEAR(equalizer->getBandGain(0), 4.0, tolerance);  // Bass boost
    EXPECT_NEAR(equalizer->getBandGain(1), 3.0, tolerance);
    EXPECT_NEAR(equalizer->getBandGain(2), -1.0, tolerance); // Mid cut
}

TEST_F(AudioEqualizerTest, PresetJazz) {
    auto preset = AudioEqualizer::EQPresetFactory::createJazzPreset();
    equalizer->loadPreset(preset);

    // Vérifier quelques valeurs caractéristiques du preset Jazz
    EXPECT_NEAR(equalizer->getBandGain(4), -2.0, tolerance); // Mid scoop
    EXPECT_NEAR(equalizer->getBandGain(5), -2.0, tolerance);
    EXPECT_NEAR(equalizer->getBandGain(8), 2.0, tolerance);  // High boost
}

TEST_F(AudioEqualizerTest, PresetRoundTrip) {
    // Modifier quelques bandes
    equalizer->setBandGain(0, 3.0);
    equalizer->setBandGain(5, -2.0);
    equalizer->setBandGain(9, 4.0);

    // Sauvegarder dans un preset
    AudioEqualizer::EQPreset savedPreset;
    equalizer->savePreset(savedPreset);

    // Charger un autre preset
    equalizer->loadPreset(AudioEqualizer::EQPresetFactory::createFlatPreset());

    // Vérifier que les valeurs ont changé
    EXPECT_NEAR(equalizer->getBandGain(0), 0.0, tolerance);

    // Recharger le preset sauvegardé
    equalizer->loadPreset(savedPreset);

    // Vérifier que les valeurs sont restaurées
    EXPECT_NEAR(equalizer->getBandGain(0), 3.0, tolerance);
    EXPECT_NEAR(equalizer->getBandGain(5), -2.0, tolerance);
    EXPECT_NEAR(equalizer->getBandGain(9), 4.0, tolerance);
}

// Tests de traitement audio
TEST_F(AudioEqualizerTest, BypassMode) {
    equalizer->setBypass(true);
    EXPECT_TRUE(equalizer->isBypassed());

    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    equalizer->process(input.data(), output.data(), numSamples);

    // En mode bypass, sortie devrait être identique à l'entrée
    EXPECT_TRUE(MathTestUtilities::isApproximatelyEqual(input, output, tolerance));
}

TEST_F(AudioEqualizerTest, BasicEqualization) {
    // Appliquer un boost de 6dB sur les basses
    equalizer->setBandGain(0, 6.0); // Bande des 31.25 Hz

    size_t numSamples = 2048;
    auto input = TestSignalGenerator::generateSineWave(100.0, sampleRate, numSamples, 0.1f);
    std::vector<float> output(numSamples);

    equalizer->process(input.data(), output.data(), numSamples);

    // Calculer le gain effectif
    double inputRMS = MathTestUtilities::computeRMS(input);
    double outputRMS = MathTestUtilities::computeRMS(output);
    double gainDb = 20.0 * std::log10(outputRMS / inputRMS);

    // Le gain devrait être positif (boost)
    EXPECT_TRUE(gainDb > 2.0);
}

TEST_F(AudioEqualizerTest, MultibandEqualization) {
    // Configurer une courbe d'égalisation complexe
    equalizer->setBandGain(0, 4.0);   // Bass boost
    equalizer->setBandGain(2, -3.0);  // Low mid cut
    equalizer->setBandGain(5, -2.0);  // Mid cut
    equalizer->setBandGain(8, 3.0);   // High boost

    size_t numSamples = 4096;
    auto input = TestSignalGenerator::generateChirp(20.0, 20000.0, sampleRate, numSamples);
    std::vector<float> output(numSamples);

    equalizer->process(input.data(), output.data(), numSamples);

    // La sortie ne devrait pas être identique à l'entrée
    EXPECT_FALSE(MathTestUtilities::isApproximatelyEqual(input, output, 0.1));
}

TEST_F(AudioEqualizerTest, StereoProcessing) {
    // Configurer l'égaliseur
    equalizer->setBandGain(0, 3.0);

    size_t numSamples = 1024;
    auto inputL = TestSignalGenerator::generateSineWave(100.0, sampleRate, numSamples, 0.5f);
    auto inputR = TestSignalGenerator::generateSineWave(100.0, sampleRate, numSamples, 0.3f);
    std::vector<float> outputL(numSamples), outputR(numSamples);

    equalizer->processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), numSamples);

    // Les deux canaux devraient être traités
    double rmsL = MathTestUtilities::computeRMS(outputL);
    double rmsR = MathTestUtilities::computeRMS(outputR);

    EXPECT_TRUE(rmsL > 0.0);
    EXPECT_TRUE(rmsR > 0.0);

    // Le canal droit devrait avoir un niveau différent du gauche
    EXPECT_NE(rmsL, rmsR);
}

// Tests de thread safety
TEST_F(AudioEqualizerTest, ThreadSafety) {
    std::atomic<bool> stopTest{false};
    std::atomic<int> errors{0};

    // Thread de modification des paramètres
    std::thread paramThread([&]() {
        while (!stopTest.load()) {
            try {
                size_t band = rand() % numBands;
                double gain = (rand() % 240) - 120; // -12dB à +12dB
                equalizer->setBandGain(band, gain);

                double freq = 20.0 + (rand() % 19980); // 20Hz à 20kHz
                equalizer->setBandFrequency(band, freq);
            } catch (...) {
                errors++;
            }
            std::this_thread::sleep_for(std::chrono::microseconds(100));
        }
    });

    // Thread de traitement audio
    std::thread audioThread([&]() {
        size_t numSamples = 512;
        auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.1f);
        std::vector<float> output(numSamples);

        auto start = std::chrono::high_resolution_clock::now();
        while (!stopTest.load()) {
            try {
                equalizer->process(input.data(), output.data(), numSamples);
            } catch (...) {
                errors++;
            }
        }
    });

    // Laisser tourner pendant 2 secondes
    std::this_thread::sleep_for(std::chrono::seconds(2));
    stopTest.store(true);

    paramThread.join();
    audioThread.join();

    EXPECT_EQ(errors.load(), 0) << "Thread safety test failed with " << errors.load() << " errors";
}

// Tests de performance
TEST_F(AudioEqualizerTest, PerformanceBenchmark) {
    // Configurer un égaliseur représentatif
    equalizer->setBandGain(0, 3.0);
    equalizer->setBandGain(3, -2.0);
    equalizer->setBandGain(6, 2.0);
    equalizer->setBandGain(9, -1.0);

    size_t numSamples = 65536; // 64k samples
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        equalizer->process(input.data(), output.data(), numSamples);
    }, 50);

    PerformanceBenchmark::logBenchmark("AudioEqualizer 10-band", duration, 50);

    // Vérifier que c'est temps réel (< 50ms pour 64k samples)
    double msPerBuffer = duration.count() / 50.0 / 1000000.0;
    EXPECT_TRUE(msPerBuffer < 50.0) << "Processing too slow: " << msPerBuffer << "ms";
}

TEST_F(AudioEqualizerTest, StereoPerformanceBenchmark) {
    // Configurer l'égaliseur
    equalizer->setBandGain(0, 2.0);
    equalizer->setBandGain(5, -3.0);

    size_t numSamples = 32768; // 32k samples per channel
    auto inputL = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    auto inputR = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.3f);
    std::vector<float> outputL(numSamples), outputR(numSamples);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        equalizer->processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), numSamples);
    }, 50);

    PerformanceBenchmark::logBenchmark("AudioEqualizer Stereo", duration, 50);

    double msPerBuffer = duration.count() / 50.0 / 1000000.0;
    EXPECT_TRUE(msPerBuffer < 25.0) << "Stereo processing too slow: " << msPerBuffer << "ms";
}

// Tests de reset et d'état
TEST_F(AudioEqualizerTest, ResetAllBands) {
    // Modifier quelques bandes
    equalizer->setBandGain(0, 5.0);
    equalizer->setBandGain(3, -3.0);
    equalizer->setBandFrequency(5, 5000.0);

    // Vérifier que les modifications sont appliquées
    EXPECT_NEAR(equalizer->getBandGain(0), 5.0, tolerance);
    EXPECT_NEAR(equalizer->getBandGain(3), -3.0, tolerance);

    // Reset
    equalizer->resetAllBands();

    // Toutes les bandes devraient être à 0 dB
    for (size_t i = 0; i < numBands; ++i) {
        EXPECT_NEAR(equalizer->getBandGain(i), 0.0, tolerance);
    }
}

TEST_F(AudioEqualizerTest, BandEnableDisable) {
    size_t testBand = 5;

    // Désactiver une bande
    equalizer->setBandEnabled(testBand, false);
    EXPECT_FALSE(equalizer->isBandEnabled(testBand));

    // Modifier le gain de la bande désactivée
    equalizer->setBandGain(testBand, 6.0);

    // Le gain devrait être ignoré pour une bande désactivée
    size_t numSamples = 1024;
    auto input = TestSignalGenerator::generateSineWave(1000.0, sampleRate, numSamples, 0.5f);
    std::vector<float> output(numSamples);

    equalizer->process(input.data(), output.data(), numSamples);

    // La sortie devrait être identique à l'entrée (bande désactivée)
    // Note: En pratique, il peut y avoir un léger effet dû à l'état du filtre,
    // mais cela devrait être minimal
    double inputRMS = MathTestUtilities::computeRMS(input);
    double outputRMS = MathTestUtilities::computeRMS(output);
    double gainDb = 20.0 * std::log10(outputRMS / inputRMS);

    EXPECT_NEAR(gainDb, 0.0, 1.0); // Tolérance de 1dB

    // Réactiver la bande
    equalizer->setBandEnabled(testBand, true);
    EXPECT_TRUE(equalizer->isBandEnabled(testBand));
}

// Tests avec différents taux d'échantillonnage
TEST_F(AudioEqualizerTest, SampleRateChanges) {
    uint32_t newSampleRate = 44100;

    // Changer le sample rate
    equalizer->setSampleRate(newSampleRate);
    EXPECT_EQ(equalizer->getSampleRate(), newSampleRate);

    // Les fréquences devraient être automatiquement ajustées si nécessaire
    for (size_t i = 0; i < numBands; ++i) {
        double freq = equalizer->getBandFrequency(i);
        EXPECT_TRUE(freq > 0.0 && freq < newSampleRate / 2.0);
    }
}

// Tests de robustesse
TEST_F(AudioEqualizerTest, InvalidBandIndex) {
    // Test avec un index de bande invalide
    EXPECT_NO_THROW(equalizer->setBandGain(numBands + 10, 0.0));
    EXPECT_NO_THROW(equalizer->getBandGain(numBands + 10));

    // Les valeurs retournées pour des indices invalides devraient être des valeurs par défaut
    EXPECT_NEAR(equalizer->getBandGain(numBands + 10), 0.0, tolerance);
}

// Tests de changement de paramètres temps réel
TEST_F(AudioEqualizerTest, ParameterUpdateThreadSafety) {
    equalizer->beginParameterUpdate();

    // Modifier plusieurs paramètres
    equalizer->setBandGain(0, 3.0);
    equalizer->setBandGain(1, 2.0);
    equalizer->setBandFrequency(2, 3000.0);

    equalizer->endParameterUpdate();

    // Vérifier que les modifications sont appliquées
    EXPECT_NEAR(equalizer->getBandGain(0), 3.0, tolerance);
    EXPECT_NEAR(equalizer->getBandGain(1), 2.0, tolerance);
    EXPECT_NEAR(equalizer->getBandFrequency(2), 3000.0, tolerance);
}
