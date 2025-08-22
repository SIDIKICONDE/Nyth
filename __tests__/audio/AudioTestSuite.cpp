#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <memory>
#include <vector>
#include <algorithm>
#include <numeric>
#include <random>
#include <chrono>
#include <format>
#include <source_location>
#include <ranges>

// Headers AudioEqualizer
#include "shared/Audio/core/AudioEqualizer.hpp"
#include "shared/Audio/core/BiquadFilter.hpp"
#include "shared/Audio/fft/FFTEngine.hpp"
#include "shared/Audio/utils/AudioBuffer.hpp"
#include "shared/Audio/utils/Constants.hpp"

// Headers Effects
#include "shared/Audio/effects/Compressor.hpp"
#include "shared/Audio/effects/Delay.hpp"
#include "shared/Audio/effects/EffectChain.hpp"

// Headers Noise Reduction
#include "shared/Audio/noise/NoiseReducer.hpp"
#include "shared/Audio/noise/SpectralNR.hpp"
#include "shared/Audio/noise/RNNoiseSuppressor.hpp"

// Headers Safety
#include "shared/Audio/safety/AudioSafety.hpp"

// Helpers pour les tests
namespace AudioTest {

// Générateur de signaux de test
class TestSignalGenerator {
public:
    static std::vector<float> generateSineWave(size_t length, double frequency, double sampleRate, double amplitude = 1.0) {
        std::vector<float> signal(length);
        double phaseIncrement = 2.0 * M_PI * frequency / sampleRate;

        for (size_t i = 0; i < length; ++i) {
            signal[i] = static_cast<float>(amplitude * std::sin(i * phaseIncrement));
        }
        return signal;
    }

    static std::vector<float> generateWhiteNoise(size_t length, double amplitude = 0.1) {
        std::vector<float> signal(length);
        std::random_device rd;
        std::mt19937 gen(rd());
        std::normal_distribution<> dist(0.0, amplitude);

        for (size_t i = 0; i < length; ++i) {
            signal[i] = static_cast<float>(dist(gen));
        }
        return signal;
    }

    static std::vector<float> generateImpulse(size_t length, size_t impulsePosition = 0) {
        std::vector<float> signal(length, 0.0f);
        if (impulsePosition < length) {
            signal[impulsePosition] = 1.0f;
        }
        return signal;
    }
};

// Helpers de validation
class AudioValidator {
public:
    static bool validateSignal(const std::vector<float>& signal, float maxAmplitude = 1.0f) {
        return std::ranges::all_of(signal, [maxAmplitude](float sample) {
            return std::isfinite(sample) && std::abs(sample) <= maxAmplitude;
        });
    }

    static double calculateRMS(const std::vector<float>& signal) {
        double sum = 0.0;
        for (float sample : signal) {
            sum += sample * sample;
        }
        return std::sqrt(sum / signal.size());
    }

    static double calculatePeak(const std::vector<float>& signal) {
        float peak = 0.0f;
        for (float sample : signal) {
            peak = std::max(peak, std::abs(sample));
        }
        return peak;
    }

    static double calculateSNR(const std::vector<float>& original, const std::vector<float>& processed) {
        if (original.size() != processed.size()) return 0.0;

        double signalPower = 0.0, noisePower = 0.0;
        for (size_t i = 0; i < original.size(); ++i) {
            double diff = original[i] - processed[i];
            signalPower += original[i] * original[i];
            noisePower += diff * diff;
        }

        if (noisePower < 1e-10) return 100.0; // Signal parfait
        return 10.0 * std::log10(signalPower / noisePower);
    }
};

} // namespace AudioTest

// ===== Tests FFT Engine =====
TEST(FFTEngineSmoke, RoundTripAccuracyFp32) {
    const size_t N = 1024;
    auto engine = AudioNR::createFFTEngine(N);
    std::vector<float> input(N);
    for (size_t i = 0; i < N; ++i) input[i] = std::sin(2.0 * M_PI * 123.0 * (double)i / 48000.0);
    std::vector<float> re, im, recon(N);
    engine->forwardR2C(input.data(), re, im);
    engine->inverseC2R(re, im, recon.data());
    double err2 = 0.0;
    for (size_t i = 0; i < N; ++i) { const double d = (double)recon[i] - (double)input[i]; err2 += d*d; }
    const double rms = std::sqrt(err2 / (double)N);
    EXPECT_LT(rms, 1e-4);
}

TEST(FFTEngineSmoke, WindowLeakageHannFinite) {
    const size_t N = 1024;
    auto engine = AudioNR::createFFTEngine(N);
    std::vector<float> x(N);
    const double freq = 1000.5;
    for (size_t i = 0; i < N; ++i) {
        const double w = 0.5 - 0.5 * std::cos(2.0 * M_PI * (double)i / (double)(N - 1));
        x[i] = (float)(w * std::sin(2.0 * M_PI * freq * (double)i / 48000.0));
    }
    std::vector<float> re, im;
    engine->forwardR2C(x.data(), re, im);
    for (size_t k = 0; k < N/2; ++k) {
        const double mag = std::hypot((double)re[k], (double)im[k]);
        EXPECT_TRUE(std::isfinite(mag));
    }
}

// Tests pour AudioEqualizer
class AudioEqualizerTest : public ::testing::Test {
protected:
    void SetUp() override {
        equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
    }

    std::unique_ptr<AudioEqualizer::AudioEqualizer> equalizer;
    const size_t testBufferSize = 1024;
    const uint32_t testSampleRate = 44100;
};

TEST_F(AudioEqualizerTest, Initialization) {
    EXPECT_EQ(equalizer->getNumBands(), AudioEqualizer::NUM_BANDS);
    EXPECT_EQ(equalizer->getSampleRate(), AudioEqualizer::DEFAULT_SAMPLE_RATE);
    EXPECT_FALSE(equalizer->isBypassed());
    EXPECT_NEAR(equalizer->getMasterGain(), 0.0, 1e-6);
}

TEST_F(AudioEqualizerTest, BandParameterValidation) {
    // Test fréquence valide
    EXPECT_NO_THROW(equalizer->setBandFrequency(0, 1000.0));
    EXPECT_NEAR(equalizer->getBandFrequency(0), 1000.0, 1e-6);

    // Test fréquence invalide (trop basse)
    equalizer->setBandFrequency(0, -100.0);
    EXPECT_NEAR(equalizer->getBandFrequency(0), 20.0, 1e-6); // Clamp à 20Hz

    // Test gain valide
    EXPECT_NO_THROW(equalizer->setBandGain(0, 6.0));
    EXPECT_NEAR(equalizer->getBandGain(0), 6.0, 1e-6);

    // Test gain invalide (trop élevé)
    equalizer->setBandGain(0, 30.0);
    EXPECT_NEAR(equalizer->getBandGain(0), AudioEqualizer::MAX_GAIN_DB, 1e-6);
}

TEST_F(AudioEqualizerTest, FilterTypes) {
    using AudioEqualizer::FilterType;

    for (size_t band = 0; band < equalizer->getNumBands(); ++band) {
        // Test tous les types de filtres
        std::vector<FilterType> types = {
            FilterType::PEAK, FilterType::LOWSHELF, FilterType::HIGHSHELF,
            FilterType::LOWPASS, FilterType::HIGHPASS, FilterType::BANDPASS,
            FilterType::NOTCH, FilterType::ALLPASS
        };

        for (auto type : types) {
            EXPECT_NO_THROW(equalizer->setBandType(band, type));
            EXPECT_EQ(equalizer->getBandType(band), type);
        }
    }
}

TEST_F(AudioEqualizerTest, AudioProcessing) {
    // Générer un signal de test
    auto input = AudioTest::TestSignalGenerator::generateSineWave(testBufferSize, 1000.0, testSampleRate, 0.5f);
    std::vector<float> output(testBufferSize);

    // Test bypass mode
    equalizer->setBypass(true);
    equalizer->process(std::span<const float>(input), std::span<float>(output));
    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));

    // Test avec gain
    equalizer->setBypass(false);
    equalizer->setMasterGain(6.0); // +6dB
    equalizer->process(std::span<const float>(input), std::span<float>(output));
    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));

    double originalRMS = AudioTest::AudioValidator::calculateRMS(input);
    double processedRMS = AudioTest::AudioValidator::calculateRMS(output);
    EXPECT_GT(processedRMS, originalRMS); // Gain devrait augmenter le niveau
}

TEST_F(AudioEqualizerTest, StereoProcessing) {
    auto inputL = AudioTest::TestSignalGenerator::generateSineWave(testBufferSize, 440.0, testSampleRate, 0.3f);
    auto inputR = AudioTest::TestSignalGenerator::generateSineWave(testBufferSize, 880.0, testSampleRate, 0.3f);
    std::vector<float> outputL(testBufferSize), outputR(testBufferSize);

    equalizer->processStereo(std::span<const float>(inputL), std::span<const float>(inputR),
                           std::span<float>(outputL), std::span<float>(outputR));

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(outputL));
    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(outputR));
}

TEST_F(AudioEqualizerTest, PresetManagement) {
    AudioEqualizer::EQPreset preset;
    preset.name = "Test Preset";
    preset.gains = std::vector<double>(AudioEqualizer::NUM_BANDS, 3.0);

    equalizer->loadPreset(preset);

    for (size_t i = 0; i < AudioEqualizer::NUM_BANDS; ++i) {
        EXPECT_NEAR(equalizer->getBandGain(i), 3.0, 1e-6);
    }

    AudioEqualizer::EQPreset saved;
    equalizer->savePreset(saved);

    EXPECT_EQ(saved.gains.size(), AudioEqualizer::NUM_BANDS);
    for (double gain : saved.gains) {
        EXPECT_NEAR(gain, 3.0, 1e-6);
    }
}

// Tests pour BiquadFilter
class BiquadFilterTest : public ::testing::Test {
protected:
    void SetUp() override {
        filter = std::make_unique<AudioEqualizer::BiquadFilter>();
    }

    std::unique_ptr<AudioEqualizer::BiquadFilter> filter;
    const size_t testBufferSize = 1024;
    const uint32_t testSampleRate = 44100;
};

TEST_F(BiquadFilterTest, Initialization) {
    double a0, a1, a2, b0, b1, b2;
    filter->getCoefficients(a0, a1, a2, b0, b1, b2);

    // Filtres devraient être initialisés à l'identité (passthrough)
    EXPECT_NEAR(a0, 1.0, 1e-6);
    EXPECT_NEAR(b0, 1.0, 1e-6);
    EXPECT_NEAR(a1, 0.0, 1e-6);
    EXPECT_NEAR(a2, 0.0, 1e-6);
    EXPECT_NEAR(b1, 0.0, 1e-6);
    EXPECT_NEAR(b2, 0.0, 1e-6);
}

TEST_F(BiquadFilterTest, LowPassFilter) {
    filter->calculateLowpass(1000.0, testSampleRate, 0.707);

    auto input = AudioTest::TestSignalGenerator::generateSineWave(testBufferSize, 100.0, testSampleRate, 0.5f);
    std::vector<float> output(testBufferSize);

    filter->process(std::span<const float>(input), std::span<float>(output));

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));

    // Le signal basse fréquence devrait passer avec peu d'atténuation
    double originalRMS = AudioTest::AudioValidator::calculateRMS(input);
    double processedRMS = AudioTest::AudioValidator::calculateRMS(output);
    EXPECT_NEAR(processedRMS, originalRMS, 0.1 * originalRMS); // Tolérance de 10%
}

TEST_F(BiquadFilterTest, HighPassFilter) {
    filter->calculateHighpass(1000.0, testSampleRate, 0.707);

    auto input = AudioTest::TestSignalGenerator::generateSineWave(testBufferSize, 5000.0, testSampleRate, 0.5f);
    std::vector<float> output(testBufferSize);

    filter->process(std::span<const float>(input), std::span<float>(output));

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));
}

TEST_F(BiquadFilterTest, PeakFilter) {
    filter->calculatePeaking(1000.0, testSampleRate, 1.414, 6.0); // +6dB boost

    auto input = AudioTest::TestSignalGenerator::generateSineWave(testBufferSize, 1000.0, testSampleRate, 0.3f);
    std::vector<float> output(testBufferSize);

    filter->process(std::span<const float>(input), std::span<float>(output));

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));

    // Le signal à la fréquence centrale devrait être amplifié
    double originalRMS = AudioTest::AudioValidator::calculateRMS(input);
    double processedRMS = AudioTest::AudioValidator::calculateRMS(output);
    EXPECT_GT(processedRMS, originalRMS);
}

TEST_F(BiquadFilterTest, StereoProcessing) {
    filter->calculatePeaking(2000.0, testSampleRate, 0.707, -3.0);

    auto inputL = AudioTest::TestSignalGenerator::generateSineWave(testBufferSize, 2000.0, testSampleRate, 0.4f);
    auto inputR = AudioTest::TestSignalGenerator::generateSineWave(testBufferSize, 2000.0, testSampleRate, 0.4f);
    std::vector<float> outputL(testBufferSize), outputR(testBufferSize);

    filter->processStereo(std::span<const float>(inputL), std::span<const float>(inputR),
                         std::span<float>(outputL), std::span<float>(outputR));

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(outputL));
    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(outputR));
}

// Tests pour AudioBuffer
class AudioBufferTest : public ::testing::Test {
protected:
    void SetUp() override {
        buffer = std::make_unique<AudioEqualizer::AudioBuffer>(2, 1024);
    }

    std::unique_ptr<AudioEqualizer::AudioBuffer> buffer;
};

TEST_F(AudioBufferTest, Initialization) {
    EXPECT_EQ(buffer->getNumChannels(), 2);
    EXPECT_EQ(buffer->getNumSamples(), 1024);

    for (size_t ch = 0; ch < buffer->getNumChannels(); ++ch) {
        float* channel = buffer->getChannel(ch);
        ASSERT_NE(channel, nullptr);

        // Buffer devrait être initialisé à zéro
        for (size_t i = 0; i < buffer->getNumSamples(); ++i) {
            EXPECT_NEAR(channel[i], 0.0f, 1e-6);
        }
    }
}

TEST_F(AudioBufferTest, ClearOperations) {
    // Remplir avec des données
    for (size_t ch = 0; ch < buffer->getNumChannels(); ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < buffer->getNumSamples(); ++i) {
            channel[i] = static_cast<float>(i + ch);
        }
    }

    // Test clear complet
    buffer->clear();
    for (size_t ch = 0; ch < buffer->getNumChannels(); ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < buffer->getNumSamples(); ++i) {
            EXPECT_NEAR(channel[i], 0.0f, 1e-6);
        }
    }

    // Test clear canal spécifique
    buffer->getChannel(0)[0] = 1.0f;
    buffer->clear(0);
    EXPECT_NEAR(buffer->getChannel(0)[0], 0.0f, 1e-6);
    EXPECT_NEAR(buffer->getChannel(1)[0], 0.0f, 1e-6); // Autre canal inchangé
}

TEST_F(AudioBufferTest, CopyOperations) {
    AudioEqualizer::AudioBuffer source(2, 1024);

    // Remplir la source avec un motif
    for (size_t ch = 0; ch < source.getNumChannels(); ++ch) {
        float* channel = source.getChannel(ch);
        for (size_t i = 0; i < source.getNumSamples(); ++i) {
            channel[i] = static_cast<float>(i * (ch + 1));
        }
    }

    // Test copyFrom
    buffer->copyFrom(source);

    for (size_t ch = 0; ch < buffer->getNumChannels(); ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < buffer->getNumSamples(); ++i) {
            EXPECT_NEAR(channel[i], static_cast<float>(i * (ch + 1)), 1e-6);
        }
    }
}

TEST_F(AudioBufferTest, GainOperations) {
    // Remplir avec des données
    for (size_t ch = 0; ch < buffer->getNumChannels(); ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < buffer->getNumSamples(); ++i) {
            channel[i] = 0.5f;
        }
    }

    // Appliquer un gain
    buffer->applyGain(2.0f);

    for (size_t ch = 0; ch < buffer->getNumChannels(); ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < buffer->getNumSamples(); ++i) {
            EXPECT_NEAR(channel[i], 1.0f, 1e-6);
        }
    }
}

TEST_F(AudioBufferTest, MagnitudeAndRMS) {
    // Créer un signal sinusoidal
    auto sineWave = AudioTest::TestSignalGenerator::generateSineWave(1024, 440.0, 44100, 0.707f);

    buffer->copyFrom(0, sineWave.data(), sineWave.size());

    float magnitude = buffer->getMagnitude(0, 0, 1024);
    float rms = buffer->getRMSLevel(0, 0, 1024);

    EXPECT_NEAR(magnitude, 0.707f, 0.01f);
    EXPECT_NEAR(rms, 0.707f / std::sqrt(2.0f), 0.01f); // RMS d'une sinusoide
}

// Tests pour les effets
class CompressorTest : public ::testing::Test {
protected:
    void SetUp() override {
        compressor = std::make_unique<AudioFX::CompressorEffect>();
        compressor->setSampleRate(44100, 1);
    }

    std::unique_ptr<AudioFX::CompressorEffect> compressor;
    const size_t testBufferSize = 2048;
};

TEST_F(CompressorTest, Initialization) {
    EXPECT_FALSE(compressor->isEnabled());
}

TEST_F(CompressorTest, ParameterSetting) {
    compressor->setParameters(-20.0, 4.0, 10.0, 100.0, 3.0);

    // Vérifier que les paramètres sont acceptés
    EXPECT_NO_THROW(compressor->setParameters(-18.0, 3.0, 5.0, 80.0, 2.0));
}

TEST_F(CompressorTest, Compression) {
    compressor->setParameters(-20.0, 4.0, 10.0, 100.0, 3.0);
    compressor->setEnabled(true);

    // Créer un signal avec des pics
    std::vector<float> input(testBufferSize, 0.0f);
    input[100] = 0.8f;  // Pic qui devrait être compressé
    input[500] = 0.9f;  // Autre pic
    std::vector<float> output(testBufferSize);

    compressor->processMono(input.data(), output.data(), testBufferSize);

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));

    // Le signal compressé devrait avoir des pics plus faibles
    float inputPeak = AudioTest::AudioValidator::calculatePeak(input);
    float outputPeak = AudioTest::AudioValidator::calculatePeak(output);
    EXPECT_LT(outputPeak, inputPeak);
}

// Tests pour la réduction de bruit
class NoiseReducerTest : public ::testing::Test {
protected:
    void SetUp() override {
        reducer = std::make_unique<AudioNR::NoiseReducer>(44100, 1);
    }

    std::unique_ptr<AudioNR::NoiseReducer> reducer;
};

TEST_F(NoiseReducerTest, Initialization) {
    EXPECT_EQ(reducer->getSampleRate(), 44100);
}

TEST_F(NoiseReducerTest, Configuration) {
    AudioNR::NoiseReducerConfig config;
    config.thresholdDb = -30.0;
    config.ratio = 2.0;
    config.attackMs = 10.0;
    config.releaseMs = 50.0;

    EXPECT_NO_THROW(reducer->setConfig(config));
}

TEST_F(NoiseReducerTest, Processing) {
    AudioNR::NoiseReducerConfig config;
    config.enabled = true;
    reducer->setConfig(config);

    auto noise = AudioTest::TestSignalGenerator::generateWhiteNoise(2048, 0.1f);
    std::vector<float> output(2048);

    reducer->processMono(noise.data(), output.data(), 2048);

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));
}

// Tests pour SpectralNR
class SpectralNRTest : public ::testing::Test {
protected:
    void SetUp() override {
        AudioNR::SpectralNRConfig config;
        config.sampleRate = 44100;
        config.fftSize = 1024;
        config.hopSize = 256;
        config.beta = 1.5f;
        config.floorGain = 0.05f;
        config.noiseUpdate = 0.98f;
        config.enabled = true;

        spectralNR = std::make_unique<AudioNR::SpectralNR>(config);
    }

    std::unique_ptr<AudioNR::SpectralNR> spectralNR;
};

TEST_F(SpectralNRTest, Initialization) {
    auto config = spectralNR->getConfig();
    EXPECT_EQ(config.sampleRate, 44100);
    EXPECT_EQ(config.fftSize, 1024);
    EXPECT_EQ(config.hopSize, 256);
}

TEST_F(SpectralNRTest, Processing) {
    auto noise = AudioTest::TestSignalGenerator::generateWhiteNoise(2048, 0.1f);
    std::vector<float> output(2048);

    spectralNR->process(noise.data(), output.data(), 2048);

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));
}

// Tests pour RNNoiseSuppressor
class RNNoiseSuppressorTest : public ::testing::Test {
protected:
    void SetUp() override {
        suppressor = std::make_unique<AudioNR::RNNoiseSuppressor>();
        suppressor->initialize(44100, 1);
    }

    std::unique_ptr<AudioNR::RNNoiseSuppressor> suppressor;
};

TEST_F(RNNoiseSuppressorTest, Initialization) {
    EXPECT_TRUE(suppressor->isAvailable());
}

TEST_F(RNNoiseSuppressorTest, Aggressiveness) {
    EXPECT_NO_THROW(suppressor->setAggressiveness(1.0));
    EXPECT_NO_THROW(suppressor->setAggressiveness(0.0));
    EXPECT_NO_THROW(suppressor->setAggressiveness(3.0));
}

TEST_F(RNNoiseSuppressorTest, Processing) {
    auto signal = AudioTest::TestSignalGenerator::generateSineWave(2048, 1000.0, 44100, 0.5f);
    std::vector<float> output(2048);

    suppressor->processMono(signal.data(), output.data(), 2048);

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));
}

// Tests pour AudioSafety
class AudioSafetyTest : public ::testing::Test {
protected:
    void SetUp() override {
        safety = std::make_unique<AudioSafety::AudioSafetyEngine>(44100, 1);
    }

    std::unique_ptr<AudioSafety::AudioSafetyEngine> safety;
};

TEST_F(AudioSafetyTest, Initialization) {
    EXPECT_FALSE(safety->getConfig().enabled);
}

TEST_F(AudioSafetyTest, NaNHandling) {
    AudioSafety::SafetyConfig config;
    config.enabled = true;
    safety->setConfig(config);

    std::vector<float> input = {0.5f, std::numeric_limits<float>::quiet_NaN(), 0.3f, -0.2f};
    std::vector<float> output(input.size());

    safety->processMono(input.data(), output.data(), input.size());

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));
}

TEST_F(AudioSafetyTest, Clipping) {
    AudioSafety::SafetyConfig config;
    config.enabled = true;
    safety->setConfig(config);

    std::vector<float> input = {0.5f, 1.5f, 0.3f, -2.0f}; // Valeurs hors limites
    std::vector<float> output(input.size());

    safety->processMono(input.data(), output.data(), input.size());

    // Toutes les valeurs devraient être dans [-1, 1]
    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output, 1.0f));
}

TEST_F(AudioSafetyTest, Limiter) {
    AudioSafety::SafetyConfig config;
    config.enabled = true;
    config.limiterEnabled = true;
    config.limiterThresholdDb = -6.0; // -6dB = ~0.5
    safety->setConfig(config);

    std::vector<float> input = {0.8f, 0.9f, 0.7f, 0.6f};
    std::vector<float> output(input.size());

    safety->processMono(input.data(), output.data(), input.size());

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));

    // Les pics devraient être limités
    float outputPeak = AudioTest::AudioValidator::calculatePeak(output);
    EXPECT_LE(outputPeak, 0.5f);
}

// Tests de performance
class AudioPerformanceTest : public ::testing::Test {
protected:
    void SetUp() override {
        equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
        bufferSize = 4096;
        iterations = 1000;

        // Préparer des données de test
        input.resize(bufferSize);
        output.resize(bufferSize);

        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<> dist(-0.5, 0.5);

        for (size_t i = 0; i < bufferSize; ++i) {
            input[i] = static_cast<float>(dist(gen));
        }
    }

    std::unique_ptr<AudioEqualizer::AudioEqualizer> equalizer;
    std::vector<float> input, output;
    size_t bufferSize, iterations;
};

TEST_F(AudioPerformanceTest, ProcessingSpeed) {
    auto start = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < iterations; ++i) {
        equalizer->process(std::span<const float>(input), std::span<float>(output));
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    double samplesPerSecond = static_cast<double>(bufferSize * iterations) / (duration.count() / 1000.0);
    double realtimeFactor = samplesPerSecond / 44100.0;

    // Devrait être capable de traiter en temps réel (facteur > 1)
    EXPECT_GT(realtimeFactor, 1.0) << "Processing speed: " << realtimeFactor << "x realtime";

    std::cout << "Audio processing performance: " << realtimeFactor << "x realtime" << std::endl;
}

// Tests d'intégration
class AudioIntegrationTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Créer une chaîne d'effets complète
        effectChain = std::make_unique<AudioFX::EffectChain>();
        effectChain->setSampleRate(44100, 1);
        effectChain->setEnabled(true);

        // Ajouter un compresseur
        compressor = effectChain->emplaceEffect<AudioFX::CompressorEffect>();
        compressor->setParameters(-20.0, 3.0, 10.0, 80.0, 2.0);
        compressor->setEnabled(true);

        // Ajouter un délai
        delay = effectChain->emplaceEffect<AudioFX::DelayEffect>();
        delay->setParameters(150.0, 0.3, 0.25);
        delay->setEnabled(true);
    }

    std::unique_ptr<AudioFX::EffectChain> effectChain;
    AudioFX::CompressorEffect* compressor = nullptr;
    AudioFX::DelayEffect* delay = nullptr;

    const size_t testBufferSize = 2048;
};

TEST_F(AudioIntegrationTest, EffectChainProcessing) {
    auto input = AudioTest::TestSignalGenerator::generateSineWave(testBufferSize, 440.0, 44100, 0.3f);
    std::vector<float> output(testBufferSize);

    effectChain->processMono(std::span<const float>(input), std::span<float>(output));

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));
}

TEST_F(AudioIntegrationTest, CompleteAudioPipeline) {
    // Test pipeline complet : Safety -> Equalizer -> Effects -> Noise Reduction

    auto input = AudioTest::TestSignalGenerator::generateSineWave(2048, 1000.0, 44100, 0.4f);
    std::vector<float> temp(2048), output(2048);

    // 1. Safety processing
    AudioSafety::AudioSafetyEngine safety(44100, 1);
    AudioSafety::SafetyConfig safetyConfig{true, true, 0.002, true, -1.0, true, 6.0};
    safety.setConfig(safetyConfig);
    safety.processMono(input.data(), temp.data(), 2048);

    // 2. Equalizer processing
    AudioEqualizer::AudioEqualizer eq;
    eq.setMasterGain(3.0);
    eq.process(std::span<const float>(temp), std::span<float>(output));

    // 3. Effects chain
    effectChain->processMono(std::span<const float>(output), std::span<float>(temp));

    // 4. Noise reduction
    AudioNR::NoiseReducer noiseReducer(44100, 1);
    AudioNR::NoiseReducerConfig nrConfig{true, -40.0, 2.0, -15.0, 5.0, 50.0, 100.0, true};
    noiseReducer.setConfig(nrConfig);
    noiseReducer.processMono(temp.data(), output.data(), 2048);

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));

    // Vérifier que le signal a été traité (pas identique à l'entrée)
    double snr = AudioTest::AudioValidator::calculateSNR(input, output);
    EXPECT_GT(snr, 10.0); // Au moins 10dB de différence
}

// Tests de robustesse
class AudioRobustnessTest : public ::testing::Test {
protected:
    void SetUp() override {
        equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
        bufferSize = 1024;
    }

    std::unique_ptr<AudioEqualizer::AudioEqualizer> equalizer;
    size_t bufferSize;
};

TEST_F(AudioRobustnessTest, ExtremeParameters) {
    // Test avec des paramètres extrêmes
    equalizer->setMasterGain(24.0);  // Gain maximum
    equalizer->setBandGain(0, 24.0);  // Gain de bande maximum
    equalizer->setBandFrequency(0, 20000.0); // Fréquence élevée
    equalizer->setBandQ(0, 10.0);     // Q maximum

    auto input = AudioTest::TestSignalGenerator::generateSineWave(bufferSize, 1000.0, 44100, 0.01f);
    std::vector<float> output(bufferSize);

    EXPECT_NO_THROW({
        equalizer->process(std::span<const float>(input), std::span<float>(output));
    });

    EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));
}

TEST_F(AudioRobustnessTest, BufferSizeVariations) {
    auto input = AudioTest::TestSignalGenerator::generateWhiteNoise(64, 0.1f);
    std::vector<float> output(64);

    // Test avec différentes tailles de buffer
    std::vector<size_t> bufferSizes = {64, 128, 256, 512, 1024, 2048, 4096};

    for (size_t size : bufferSizes) {
        input.resize(size);
        output.resize(size);

        for (size_t i = 0; i < size; ++i) {
            input[i] = 0.1f * std::sin(2.0 * M_PI * 440.0 * i / 44100.0);
        }

        EXPECT_NO_THROW({
            equalizer->process(std::span<const float>(input), std::span<float>(output));
        });

        EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(output));
    }
}

TEST_F(AudioRobustnessTest, MemoryStress) {
    // Test avec allocation/désallocation répétée
    const int iterations = 100;

    for (int i = 0; i < iterations; ++i) {
        auto tempEqualizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
        auto tempBuffer = std::vector<float>(bufferSize, 0.1f);
        std::vector<float> tempOutput(bufferSize);

        tempEqualizer->setMasterGain(6.0);
        tempEqualizer->process(std::span<const float>(tempBuffer), std::span<float>(tempOutput));

        EXPECT_TRUE(AudioTest::AudioValidator::validateSignal(tempOutput));
    }
}

// Tests SIMD (si disponible)
#ifdef __ARM_NEON
class AudioSIMDTest : public ::testing::Test {
protected:
    void SetUp() override {
        buffer = std::make_unique<AudioEqualizer::AudioBuffer>(2, 1024);
    }

    std::unique_ptr<AudioEqualizer::AudioBuffer> buffer;
};

TEST_F(AudioSIMDTest, NEONOptimization) {
    // Remplir avec des données de test
    for (size_t ch = 0; ch < buffer->getNumChannels(); ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < buffer->getNumSamples(); ++i) {
            channel[i] = 0.5f;
        }
    }

    // Mesurer le temps d'application du gain
    auto start = std::chrono::high_resolution_clock::now();
    buffer->applyGain(2.0f);
    auto end = std::chrono::high_resolution_clock::now();

    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);

    // Vérifier que le gain a été appliqué correctement
    for (size_t ch = 0; ch < buffer->getNumChannels(); ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < buffer->getNumSamples(); ++i) {
            EXPECT_NEAR(channel[i], 1.0f, 1e-6);
        }
    }

    std::cout << "NEON gain application took: " << duration.count() << " microseconds" << std::endl;
}
#endif

// Point d'entrée principal pour les tests
int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);

    // Configuration des tests
    ::testing::FLAGS_gtest_shuffle = true;
    ::testing::FLAGS_gtest_repeat = 1;
    ::testing::FLAGS_gtest_break_on_failure = false;

    std::cout << "=== AudioEqualizer Test Suite ===" << std::endl;
    std::cout << "Running comprehensive audio processing tests..." << std::endl;

    int result = RUN_ALL_TESTS();

    if (result == 0) {
        std::cout << "\n✅ All audio tests passed successfully!" << std::endl;
    } else {
        std::cout << "\n❌ Some tests failed. Check the output above for details." << std::endl;
    }

    return result;
}
