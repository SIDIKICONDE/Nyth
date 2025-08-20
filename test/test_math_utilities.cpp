#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <cmath>
#include <vector>
#include <complex>
#include <numeric>
#include <algorithm>
#include "test_main.cpp"

// Tests des utilitaires mathématiques pour valider les algorithmes audio
class MathUtilitiesTest : public ::testing::Test {
protected:
    void SetUp() override {
        tolerance = 1e-10;
        sampleRate = 48000.0;
        frequency = 1000.0;
        numSamples = 1024;
    }

    double tolerance;
    double sampleRate;
    double frequency;
    size_t numSamples;
};

// Tests des fonctions trigonométriques et conversions
TEST_F(MathUtilitiesTest, DbToLinearConversion) {
    // Test de la conversion dB vers linéaire
    std::vector<double> dbValues = {-60.0, -40.0, -20.0, -6.0, 0.0, 6.0, 20.0};
    std::vector<double> expectedLinear = {
        0.001,      // -60dB
        0.01,       // -40dB
        0.1,        // -20dB
        0.501187,   // -6dB
        1.0,        // 0dB
        1.99526,    // 6dB
        10.0        // 20dB
    };

    for (size_t i = 0; i < dbValues.size(); ++i) {
        double linear = std::pow(10.0, dbValues[i] / 20.0);
        EXPECT_NEAR(linear, expectedLinear[i], tolerance) << "dB to linear conversion failed for " << dbValues[i] << " dB";
    }
}

TEST_F(MathUtilitiesTest, LinearToDbConversion) {
    // Test de la conversion linéaire vers dB
    std::vector<double> linearValues = {0.001, 0.01, 0.1, 0.5, 1.0, 2.0, 10.0};
    std::vector<double> expectedDb = {-60.0, -40.0, -20.0, -6.021, 0.0, 6.021, 20.0};

    for (size_t i = 0; i < linearValues.size(); ++i) {
        double db = 20.0 * std::log10(std::max(linearValues[i], 1e-10));
        EXPECT_NEAR(db, expectedDb[i], 0.1) << "Linear to dB conversion failed for " << linearValues[i];
    }
}

TEST_F(MathUtilitiesTest, RoundTripConversion) {
    // Test de l'aller-retour dB -> linéaire -> dB
    std::vector<double> originalDb = {-40.0, -20.0, -6.0, 0.0, 6.0, 12.0};

    for (double db : originalDb) {
        double linear = std::pow(10.0, db / 20.0);
        double roundTripDb = 20.0 * std::log10(linear);
        EXPECT_NEAR(db, roundTripDb, tolerance) << "Round-trip conversion failed for " << db << " dB";
    }
}

// Tests des fonctions de calcul RMS et peak
TEST_F(MathUtilitiesTest, RMSLevelCalculation) {
    // Test avec un signal constant
    std::vector<float> constantSignal(numSamples, 0.5f);
    double expectedRMS = 0.5;
    double calculatedRMS = MathTestUtilities::computeRMS(constantSignal);
    EXPECT_NEAR(calculatedRMS, expectedRMS, tolerance);

    // Test avec un signal sinusoïdal (RMS = amplitude / sqrt(2))
    auto sineSignal = TestSignalGenerator::generateSineWave(frequency, sampleRate, numSamples, 0.5f);
    double expectedSineRMS = 0.5 / std::sqrt(2.0);
    double calculatedSineRMS = MathTestUtilities::computeRMS(sineSignal);
    EXPECT_NEAR(calculatedSineRMS, expectedSineRMS, 0.01);

    // Test avec un signal nul
    std::vector<float> zeroSignal(numSamples, 0.0f);
    double zeroRMS = MathTestUtilities::computeRMS(zeroSignal);
    EXPECT_NEAR(zeroRMS, 0.0, tolerance);
}

TEST_F(MathUtilitiesTest, PeakLevelCalculation) {
    // Test avec un signal sinusoïdal
    auto sineSignal = TestSignalGenerator::generateSineWave(frequency, sampleRate, numSamples, 0.7f);
    double expectedPeak = 0.7;
    double calculatedPeak = MathTestUtilities::computePeak(sineSignal);
    EXPECT_NEAR(calculatedPeak, expectedPeak, 0.001);

    // Test avec un signal avec pics
    std::vector<float> peakSignal(numSamples, 0.1f);
    peakSignal[100] = 0.9f;
    peakSignal[500] = -0.8f;
    double expectedPeakSignal = 0.9;
    double calculatedPeakSignal = MathTestUtilities::computePeak(peakSignal);
    EXPECT_NEAR(calculatedPeakSignal, expectedPeakSignal, tolerance);
}

// Tests des fonctions FFT
TEST_F(MathUtilitiesTest, FFTMagnitude) {
    // Créer un signal sinusoïdal pur
    size_t fftSize = 1024;
    double testFreq = 1000.0;
    auto sineSignal = TestSignalGenerator::generateSineWave(testFreq, sampleRate, fftSize, 1.0f);

    // Calculer la FFT (version simple pour test)
    std::vector<std::complex<double>> fftResult(fftSize);
    for (size_t k = 0; k < fftSize; ++k) {
        std::complex<double> sum = 0.0;
        for (size_t n = 0; n < fftSize; ++n) {
            double angle = -2.0 * M_PI * k * n / fftSize;
            sum += sineSignal[n] * std::exp(std::complex<double>(0.0, angle));
        }
        fftResult[k] = sum;
    }

    // Calculer les magnitudes
    std::vector<double> magnitudes(fftSize/2 + 1);
    for (size_t k = 0; k <= fftSize/2; ++k) {
        magnitudes[k] = std::abs(fftResult[k]);
    }

    // Trouver le pic de fréquence
    auto maxIt = std::max_element(magnitudes.begin(), magnitudes.end());
    size_t peakBin = std::distance(magnitudes.begin(), maxIt);

    // Calculer la fréquence correspondante
    double binFreq = static_cast<double>(peakBin) * sampleRate / fftSize;
    EXPECT_NEAR(binFreq, testFreq, sampleRate / fftSize) << "FFT peak not at expected frequency";
}

TEST_F(MathUtilitiesTest, WindowingFunctions) {
    size_t windowSize = 256;

    // Créer un signal de test
    std::vector<float> signal(windowSize);
    for (size_t i = 0; i < windowSize; ++i) {
        signal[i] = 1.0f;
    }

    // Appliquer une fenêtre de Hann
    auto windowed = MathTestUtilities::applyWindow(signal, "hann");

    // Vérifier les propriétés de la fenêtre
    EXPECT_NEAR(windowed[0], 0.0, 0.001) << "Hann window should start at 0";
    EXPECT_NEAR(windowed[windowSize-1], 0.0, 0.001) << "Hann window should end at 0";
    EXPECT_NEAR(windowed[windowSize/2], 1.0, 0.001) << "Hann window should peak at 1";

    // Vérifier que l'énergie est préservée (approximativement)
    double originalEnergy = std::inner_product(signal.begin(), signal.end(), signal.begin(), 0.0);
    double windowedEnergy = std::inner_product(windowed.begin(), windowed.end(), windowed.begin(), 0.0);

    // L'énergie devrait être réduite d'environ 50% avec une fenêtre de Hann
    EXPECT_TRUE(windowedEnergy < originalEnergy);
    EXPECT_TRUE(windowedEnergy > originalEnergy * 0.3);
}

// Tests des filtres numériques
TEST_F(MathUtilitiesTest, BiquadFilterCoefficients) {
    // Test des coefficients d'un filtre lowpass
    double cutoffFreq = 1000.0;
    double q = 0.707;
    double omega = 2.0 * M_PI * cutoffFreq / sampleRate;
    double sinOmega = std::sin(omega);
    double cosOmega = std::cos(omega);
    double alpha = sinOmega / (2.0 * q);

    // Coefficients attendus pour un filtre lowpass Butterworth
    double b0 = 1.0;
    double b1 = -2.0 * cosOmega;
    double b2 = 1.0;
    double a0 = 1.0 + alpha;
    double a1 = -2.0 * cosOmega;
    double a2 = 1.0 - alpha;

    // Normaliser
    double inv_a0 = 1.0 / a0;
    a0 *= inv_a0;
    a1 *= inv_a0;
    a2 *= inv_a0;

    // Vérifier que les coefficients sont dans des plages valides
    EXPECT_TRUE(std::abs(a0) <= 1.0);
    EXPECT_TRUE(std::abs(a1) <= 2.0);
    EXPECT_TRUE(std::abs(a2) <= 1.0);
    EXPECT_TRUE(std::abs(b1) <= 2.0);
    EXPECT_TRUE(std::abs(b2) <= 1.0);

    // Vérifier la stabilité (poles dans le cercle unité)
    double discriminant = a1 * a1 - 4.0 * a2;
    if (discriminant > 0) {
        double root1 = (-a1 + std::sqrt(discriminant)) / 2.0;
        double root2 = (-a1 - std::sqrt(discriminant)) / 2.0;
        EXPECT_TRUE(std::abs(root1) < 1.0);
        EXPECT_TRUE(std::abs(root2) < 1.0);
    }
}

TEST_F(MathUtilitiesTest, FilterResponse) {
    // Test de la réponse en fréquence d'un filtre lowpass simple
    double cutoffFreq = 1000.0;
    double q = 0.707;

    // Calculer les coefficients
    double omega = 2.0 * M_PI * cutoffFreq / sampleRate;
    double sinOmega = std::sin(omega);
    double cosOmega = std::cos(omega);
    double alpha = sinOmega / (2.0 * q);

    double a0 = 1.0 + alpha;
    double a1 = -2.0 * cosOmega;
    double a2 = 1.0 - alpha;
    double b0 = 1.0;
    double b1 = -2.0 * cosOmega;
    double b2 = 1.0;

    // Normaliser
    double inv_a0 = 1.0 / a0;
    a0 *= inv_a0;
    a1 *= inv_a0;
    a2 *= inv_a0;

    // Tester la réponse à différentes fréquences
    std::vector<double> testFreqs = {100.0, 1000.0, 5000.0, 10000.0};

    for (double testFreq : testFreqs) {
        double w = 2.0 * M_PI * testFreq / sampleRate;

        // Calculer la réponse en fréquence H(z) = (b0 + b1*z^-1 + b2*z^-2) / (a0 + a1*z^-1 + a2*z^-2)
        std::complex<double> z_inv = std::exp(std::complex<double>(0.0, -w));
        std::complex<double> numerator = b0 + b1 * z_inv + b2 * z_inv * z_inv;
        std::complex<double> denominator = a0 + a1 * z_inv + a2 * z_inv * z_inv;
        std::complex<double> response = numerator / denominator;

        double magnitude = std::abs(response);
        double magnitudeDb = 20.0 * std::log10(magnitude);

        // À la fréquence de coupure, l'atténuation devrait être d'environ -3dB
        if (std::abs(testFreq - cutoffFreq) < 100.0) {
            EXPECT_NEAR(magnitudeDb, -3.0, 1.0) << "Magnitude at cutoff frequency " << testFreq << "Hz";
        }

        // En dessous de la fréquence de coupure, l'atténuation devrait être faible
        if (testFreq < cutoffFreq / 2.0) {
            EXPECT_TRUE(magnitudeDb > -6.0) << "Magnitude below cutoff at " << testFreq << "Hz";
        }

        // Au-dessus de la fréquence de coupure, l'atténuation devrait être significative
        if (testFreq > cutoffFreq * 2.0) {
            EXPECT_TRUE(magnitudeDb < -10.0) << "Magnitude above cutoff at " << testFreq << "Hz";
        }
    }
}

// Tests des enveloppes et détecteurs de niveau
TEST_F(MathUtilitiesTest, EnvelopeFollower) {
    // Simuler un détecteur d'enveloppe RMS simple
    double attackCoeff = 0.1;
    double releaseCoeff = 0.01;
    double envelope = 0.0;

    size_t testLength = 1000;
    std::vector<float> signal(testLength);

    // Créer un signal avec une attaque puis un decay
    for (size_t i = 0; i < testLength; ++i) {
        if (i < 100) {
            signal[i] = 0.8f; // Niveau élevé
        } else if (i < 200) {
            signal[i] = 0.8f * (200 - i) / 100.0f; // Decay
        } else {
            signal[i] = 0.1f; // Niveau bas
        }
    }

    std::vector<double> envelopeHistory;
    for (size_t i = 0; i < testLength; ++i) {
        double absSignal = std::abs(signal[i]);
        double coeff = (absSignal > envelope) ? attackCoeff : releaseCoeff;
        envelope = coeff * envelope + (1.0 - coeff) * absSignal;
        envelopeHistory.push_back(envelope);
    }

    // L'enveloppe devrait suivre les variations du signal
    EXPECT_TRUE(envelopeHistory[50] > 0.5); // Pendant la partie élevée
    EXPECT_TRUE(envelopeHistory[150] > envelopeHistory[250]); // Decay progressif
    EXPECT_TRUE(envelopeHistory.back() < 0.2); // Niveau bas à la fin
}

// Tests des algorithmes de compression
TEST_F(MathUtilitiesTest, CompressorStaticCurve) {
    double thresholdDb = -18.0;
    double ratio = 3.0;
    double thresholdLinear = std::pow(10.0, thresholdDb / 20.0);

    // Tester la courbe statique du compresseur
    std::vector<double> inputLevels = {-40.0, -20.0, -18.0, -12.0, -6.0, 0.0};

    for (double inputDb : inputLevels) {
        double inputLinear = std::pow(10.0, inputDb / 20.0);
        double outputLinear;

        if (inputLinear > thresholdLinear) {
            // Compression
            double inputDb = 20.0 * std::log10(inputLinear);
            double outputDb = thresholdDb + (inputDb - thresholdDb) / ratio;
            outputLinear = std::pow(10.0, outputDb / 20.0);
        } else {
            outputLinear = inputLinear;
        }

        double outputDb = 20.0 * std::log10(outputLinear);

        // Vérifier que le niveau de sortie ne dépasse pas l'entrée
        EXPECT_TRUE(outputDb <= inputDb);

        // Vérifier la compression au-dessus du seuil
        if (inputDb > thresholdDb) {
            double compressionRatio = (inputDb - thresholdDb) / (outputDb - thresholdDb);
            EXPECT_NEAR(compressionRatio, ratio, 0.1) << "Compression ratio incorrect at " << inputDb << " dB";
        }
    }
}

// Tests des algorithmes de réduction de bruit
TEST_F(MathUtilitiesTest, NoiseGateCurve) {
    double thresholdDb = -40.0;
    double ratio = 4.0;
    double floorDb = -20.0;

    double thresholdLinear = std::pow(10.0, thresholdDb / 20.0);
    double floorLinear = std::pow(10.0, floorDb / 20.0);

    // Tester différentes amplitudes de signal
    std::vector<double> testLevels = {-60.0, -50.0, -40.0, -30.0, -20.0, -10.0};

    for (double inputDb : testLevels) {
        double inputLinear = std::pow(10.0, inputDb / 20.0);
        double outputLinear;

        if (inputLinear < thresholdLinear) {
            // Expansion
            double ratio_linear = 1.0 / ratio;
            double expanded = std::pow(inputLinear / thresholdLinear, ratio_linear) * thresholdLinear;

            // Appliquer le floor
            if (expanded < floorLinear) {
                expanded = floorLinear;
            }
            outputLinear = expanded;
        } else {
            outputLinear = inputLinear;
        }

        double outputDb = 20.0 * std::log10(outputLinear);

        // Le niveau de sortie ne devrait pas dépasser l'entrée
        EXPECT_TRUE(outputDb <= inputDb);

        // Vérifier l'expansion en dessous du seuil
        if (inputDb < thresholdDb) {
            EXPECT_TRUE(outputDb < inputDb) << "Expansion should reduce level below threshold";
        }
    }
}

// Tests des calculs de latence et timing
TEST_F(MathUtilitiesTest, LatencyCalculations) {
    // Test des calculs de latence pour différents algorithmes

    // Latence d'un filtre FIR simple
    size_t filterLength = 256;
    double filterLatencyMs = (filterLength / 2.0) / sampleRate * 1000.0;
    EXPECT_TRUE(filterLatencyMs > 0.0);

    // Latence d'un overlap-add
    size_t hopSize = 128;
    size_t fftSize = 512;
    double overlapAddLatencyMs = ((fftSize - hopSize) / sampleRate) * 1000.0;
    EXPECT_TRUE(overlapAddLatencyMs > 0.0);

    // Latence d'une chaîne d'effets
    std::vector<double> effectLatencies = {0.5, 1.0, 2.0}; // ms
    double totalLatency = std::accumulate(effectLatencies.begin(), effectLatencies.end(), 0.0);
    EXPECT_NEAR(totalLatency, 3.5, tolerance);
}

// Tests des fonctions utilitaires SIMD
TEST_F(MathUtilitiesTest, SIMDAlignment) {
    // Tester l'alignement mémoire pour SIMD
    size_t alignment = 16; // 128-bit alignment
    size_t bufferSize = 1024;

    // Allouer un buffer aligné
    void* rawMemory = nullptr;
    if (posix_memalign(&rawMemory, alignment, bufferSize * sizeof(float)) == 0) {
        float* alignedBuffer = static_cast<float*>(rawMemory);

        // Vérifier l'alignement
        uintptr_t address = reinterpret_cast<uintptr_t>(alignedBuffer);
        EXPECT_EQ(address % alignment, 0) << "Buffer not properly aligned";

        // Tester l'utilisation du buffer
        for (size_t i = 0; i < bufferSize; ++i) {
            alignedBuffer[i] = static_cast<float>(i % 256) / 255.0f;
        }

        // Vérifier l'intégrité des données
        for (size_t i = 0; i < bufferSize; ++i) {
            float expected = static_cast<float>(i % 256) / 255.0f;
            EXPECT_NEAR(alignedBuffer[i], expected, tolerance);
        }

        free(rawMemory);
    }
}

// Tests des algorithmes de génération de signaux
TEST_F(MathUtilitiesTest, SignalGeneration) {
    // Test de la génération de signaux de test

    // Signal sinusoïdal
    auto sineWave = TestSignalGenerator::generateSineWave(1000.0, sampleRate, 1024, 0.5f);

    // Vérifier l'amplitude
    double peak = MathTestUtilities::computePeak(sineWave);
    EXPECT_NEAR(peak, 0.5, 0.01);

    // Vérifier la fréquence approximative (via autocorrélation simple)
    double sum = 0.0;
    for (size_t i = 1; i < sineWave.size(); ++i) {
        sum += sineWave[i] * sineWave[i-1];
    }
    double autocorrelation = sum / (sineWave.size() - 1);
    EXPECT_TRUE(std::abs(autocorrelation) > 0.3); // Forte autocorrélation pour un sinus

    // Signal d'impulsion
    auto impulse = TestSignalGenerator::generateImpulse(1024, 100);
    double impulsePeak = MathTestUtilities::computePeak(impulse);
    EXPECT_NEAR(impulsePeak, 1.0, tolerance);

    // Compter les échantillons non-nuls
    int nonZeroCount = 0;
    for (float sample : impulse) {
        if (std::abs(sample) > 0.5f) nonZeroCount++;
    }
    EXPECT_EQ(nonZeroCount, 1);

    // Signal de bruit
    auto noise = TestSignalGenerator::generateNoise(2048, 0.1f);
    double noiseRMS = MathTestUtilities::computeRMS(noise);
    EXPECT_NEAR(noiseRMS, 0.1, 0.02); // RMS devrait être proche de l'amplitude

    // Vérifier la distribution du bruit (approximativement uniforme)
    double mean = 0.0;
    for (float sample : noise) {
        mean += sample;
    }
    mean /= noise.size();
    EXPECT_NEAR(mean, 0.0, 0.01); // Le bruit devrait être centré sur zéro
}

// Tests des fonctions de benchmarking
TEST_F(MathUtilitiesTest, BenchmarkingUtilities) {
    // Test de la fonction de benchmarking
    auto testFunction = []() {
        double sum = 0.0;
        for (int i = 0; i < 1000; ++i) {
            sum += std::sin(2.0 * M_PI * i / 1000.0);
        }
        return sum;
    };

    auto duration = PerformanceBenchmark::benchmarkFunction(testFunction, 100);

    // La durée devrait être positive
    EXPECT_TRUE(duration.count() > 0);

    // Convertir en millisecondes
    double ms = duration.count() / 1000000.0;
    EXPECT_TRUE(ms > 0.0 && ms < 1000.0); // Entre 0 et 1 seconde pour 100 itérations

    // Test avec plus d'itérations
    auto longerDuration = PerformanceBenchmark::benchmarkFunction(testFunction, 1000);
    EXPECT_TRUE(longerDuration.count() > duration.count()); // Devrait être plus long
}

// Test de validation des constantes audio
TEST_F(MathUtilitiesTest, AudioConstants) {
    // Vérifier les constantes de fréquence
    EXPECT_TRUE(AudioEqualizer::DEFAULT_FREQUENCIES[0] > 20.0); // Sub-bass
    EXPECT_TRUE(AudioEqualizer::DEFAULT_FREQUENCIES[9] < 20000.0); // Air

    // Vérifier l'espacement logarithmique
    for (size_t i = 1; i < AudioEqualizer::NUM_BANDS; ++i) {
        double ratio = AudioEqualizer::DEFAULT_FREQUENCIES[i] / AudioEqualizer::DEFAULT_FREQUENCIES[i-1];
        EXPECT_TRUE(ratio > 1.5) << "Insufficient frequency spacing between bands " << i-1 << " and " << i;
    }

    // Vérifier les limites de gain
    EXPECT_TRUE(AudioEqualizer::MIN_GAIN_DB < AudioEqualizer::MAX_GAIN_DB);
    EXPECT_TRUE(AudioEqualizer::MIN_GAIN_DB >= -60.0); // Pas trop bas
    EXPECT_TRUE(AudioEqualizer::MAX_GAIN_DB <= 60.0);  // Pas trop haut

    // Vérifier les limites Q
    EXPECT_TRUE(AudioEqualizer::MIN_Q < AudioEqualizer::MAX_Q);
    EXPECT_TRUE(AudioEqualizer::DEFAULT_Q >= AudioEqualizer::MIN_Q);
    EXPECT_TRUE(AudioEqualizer::DEFAULT_Q <= AudioEqualizer::MAX_Q);
}
