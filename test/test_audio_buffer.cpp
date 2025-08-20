#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <cmath>
#include <vector>
#include <memory>
#include <algorithm>
#include "../shared/Audio/utils/AudioBuffer.h"
#include "test_main.cpp"

// Test fixture pour AudioBuffer
class AudioBufferTest : public ::testing::Test {
protected:
    void SetUp() override {
        numChannels = 2;
        numSamples = 1024;
        tolerance = 1e-6;
        buffer = std::make_unique<AudioEqualizer::AudioBuffer>(numChannels, numSamples);
    }

    void TearDown() override {
        buffer.reset();
    }

    std::unique_ptr<AudioEqualizer::AudioBuffer> buffer;
    size_t numChannels;
    size_t numSamples;
    double tolerance;
};

TEST_F(AudioBufferTest, Initialization) {
    EXPECT_EQ(buffer->getNumChannels(), numChannels);
    EXPECT_EQ(buffer->getNumSamples(), numSamples);

    // Vérifier que tous les canaux sont accessibles
    for (size_t ch = 0; ch < numChannels; ++ch) {
        EXPECT_NE(buffer->getChannel(ch), nullptr);
    }

    // Vérifier que les canaux hors limites retournent null
    EXPECT_EQ(buffer->getChannel(numChannels), nullptr);
}

TEST_F(AudioBufferTest, MemoryAllocation) {
    // Vérifier que la mémoire est correctement allouée
    for (size_t ch = 0; ch < numChannels; ++ch) {
        const float* channel = buffer->getChannel(ch);
        ASSERT_NE(channel, nullptr);

        // Vérifier que la mémoire est accessible
        for (size_t i = 0; i < numSamples; ++i) {
            EXPECT_TRUE(std::isfinite(channel[i]));
        }
    }
}

TEST_F(AudioBufferTest, ClearOperations) {
    // Remplir le buffer avec des données
    for (size_t ch = 0; ch < numChannels; ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            channel[i] = static_cast<float>(i + ch);
        }
    }

    // Vérifier que les données sont présentes
    for (size_t ch = 0; ch < numChannels; ++ch) {
        const float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            EXPECT_NEAR(channel[i], static_cast<float>(i + ch), tolerance);
        }
    }

    // Effacer tout le buffer
    buffer->clear();

    // Vérifier que tout est à zéro
    for (size_t ch = 0; ch < numChannels; ++ch) {
        const float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            EXPECT_NEAR(channel[i], 0.0f, tolerance);
        }
    }
}

TEST_F(AudioBufferTest, ChannelClear) {
    // Remplir le buffer
    for (size_t ch = 0; ch < numChannels; ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            channel[i] = 1.0f;
        }
    }

    // Effacer seulement le canal 0
    buffer->clear(0);

    // Vérifier que le canal 0 est effacé
    const float* channel0 = buffer->getChannel(0);
    for (size_t i = 0; i < numSamples; ++i) {
        EXPECT_NEAR(channel0[i], 0.0f, tolerance);
    }

    // Vérifier que le canal 1 n'est pas effacé
    const float* channel1 = buffer->getChannel(1);
    for (size_t i = 0; i < numSamples; ++i) {
        EXPECT_NEAR(channel1[i], 1.0f, tolerance);
    }
}

TEST_F(AudioBufferTest, PartialClear) {
    size_t startSample = 100;
    size_t numSamplesToClear = 200;

    // Remplir le buffer
    for (size_t ch = 0; ch < numChannels; ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            channel[i] = 1.0f;
        }
    }

    // Effacer une partie
    buffer->clear(startSample, numSamplesToClear);

    for (size_t ch = 0; ch < numChannels; ++ch) {
        const float* channel = buffer->getChannel(ch);

        // Vérifier que la partie effacée est à zéro
        for (size_t i = startSample; i < startSample + numSamplesToClear && i < numSamples; ++i) {
            EXPECT_NEAR(channel[i], 0.0f, tolerance);
        }

        // Vérifier que les autres parties ne sont pas effacées
        for (size_t i = 0; i < startSample; ++i) {
            EXPECT_NEAR(channel[i], 1.0f, tolerance);
        }
        for (size_t i = startSample + numSamplesToClear; i < numSamples; ++i) {
            EXPECT_NEAR(channel[i], 1.0f, tolerance);
        }
    }
}

TEST_F(AudioBufferTest, CopyFromBuffer) {
    // Créer un buffer source
    AudioEqualizer::AudioBuffer source(numChannels, numSamples);

    // Remplir le buffer source
    for (size_t ch = 0; ch < numChannels; ++ch) {
        float* channel = source.getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            channel[i] = static_cast<float>(i * 0.1 + ch);
        }
    }

    // Copier vers notre buffer
    buffer->copyFrom(source);

    // Vérifier que la copie est correcte
    for (size_t ch = 0; ch < numChannels; ++ch) {
        const float* sourceChannel = source.getChannel(ch);
        const float* destChannel = buffer->getChannel(ch);

        for (size_t i = 0; i < numSamples; ++i) {
            EXPECT_NEAR(destChannel[i], sourceChannel[i], tolerance);
        }
    }
}

TEST_F(AudioBufferTest, CopyFromArray) {
    size_t testChannel = 0;
    size_t numSamplesToCopy = 512;

    // Créer des données source
    std::vector<float> sourceData(numSamplesToCopy);
    for (size_t i = 0; i < numSamplesToCopy; ++i) {
        sourceData[i] = static_cast<float>(i * 0.5);
    }

    // Copier dans le buffer
    buffer->copyFrom(testChannel, sourceData.data(), numSamplesToCopy);

    // Vérifier la copie
    const float* channel = buffer->getChannel(testChannel);
    for (size_t i = 0; i < numSamplesToCopy; ++i) {
        EXPECT_NEAR(channel[i], sourceData[i], tolerance);
    }

    // Vérifier que le reste du canal est inchangé (à zéro)
    for (size_t i = numSamplesToCopy; i < numSamples; ++i) {
        EXPECT_NEAR(channel[i], 0.0f, tolerance);
    }
}

TEST_F(AudioBufferTest, PartialCopy) {
    size_t destChannel = 0;
    size_t destStart = 100;
    size_t sourceChannel = 1;
    size_t sourceStart = 50;
    size_t numSamplesToCopy = 200;

    // Créer un buffer source
    AudioEqualizer::AudioBuffer source(numChannels, numSamples);

    // Remplir le canal source
    float* sourceCh = source.getChannel(sourceChannel);
    for (size_t i = 0; i < numSamples; ++i) {
        sourceCh[i] = static_cast<float>(i + 10);
    }

    // Copier partiellement
    buffer->copyFrom(destChannel, destStart, source, sourceChannel, sourceStart, numSamplesToCopy);

    // Vérifier la copie
    const float* destCh = buffer->getChannel(destChannel);
    const float* srcCh = source.getChannel(sourceChannel);

    for (size_t i = 0; i < numSamplesToCopy; ++i) {
        size_t destIdx = destStart + i;
        size_t srcIdx = sourceStart + i;
        if (destIdx < numSamples && srcIdx < numSamples) {
            EXPECT_NEAR(destCh[destIdx], srcCh[srcIdx], tolerance);
        }
    }
}

TEST_F(AudioBufferTest, GainApplication) {
    float testGain = 2.0f;

    // Remplir le buffer
    for (size_t ch = 0; ch < numChannels; ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            channel[i] = 0.5f;
        }
    }

    // Appliquer le gain
    buffer->applyGain(testGain);

    // Vérifier que le gain est appliqué
    for (size_t ch = 0; ch < numChannels; ++ch) {
        const float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            EXPECT_NEAR(channel[i], 1.0f, tolerance); // 0.5 * 2.0 = 1.0
        }
    }
}

TEST_F(AudioBufferTest, ChannelGainApplication) {
    size_t testChannel = 0;
    float testGain = 1.5f;

    // Remplir le buffer
    for (size_t ch = 0; ch < numChannels; ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            channel[i] = 0.4f;
        }
    }

    // Appliquer le gain à un canal spécifique
    buffer->applyGain(testChannel, testGain);

    // Vérifier le canal modifié
    const float* modifiedChannel = buffer->getChannel(testChannel);
    for (size_t i = 0; i < numSamples; ++i) {
        EXPECT_NEAR(modifiedChannel[i], 0.6f, tolerance); // 0.4 * 1.5 = 0.6
    }

    // Vérifier que l'autre canal n'est pas modifié
    const float* otherChannel = buffer->getChannel(1);
    for (size_t i = 0; i < numSamples; ++i) {
        EXPECT_NEAR(otherChannel[i], 0.4f, tolerance);
    }
}

TEST_F(AudioBufferTest, PartialGainApplication) {
    size_t testChannel = 0;
    size_t startSample = 200;
    size_t numSamplesToProcess = 100;
    float testGain = 3.0f;

    // Remplir le buffer
    float* channel = buffer->getChannel(testChannel);
    for (size_t i = 0; i < numSamples; ++i) {
        channel[i] = 0.2f;
    }

    // Appliquer le gain partiellement
    buffer->applyGain(testChannel, startSample, numSamplesToProcess, testGain);

    // Vérifier la partie modifiée
    for (size_t i = startSample; i < startSample + numSamplesToProcess && i < numSamples; ++i) {
        EXPECT_NEAR(channel[i], 0.6f, tolerance); // 0.2 * 3.0 = 0.6
    }

    // Vérifier que les autres parties ne sont pas modifiées
    for (size_t i = 0; i < startSample; ++i) {
        EXPECT_NEAR(channel[i], 0.2f, tolerance);
    }
    for (size_t i = startSample + numSamplesToProcess; i < numSamples; ++i) {
        EXPECT_NEAR(channel[i], 0.2f, tolerance);
    }
}

TEST_F(AudioBufferTest, GainRamp) {
    size_t testChannel = 0;
    size_t startSample = 0;
    size_t numSamplesToRamp = 100;
    float startGain = 1.0f;
    float endGain = 2.0f;

    // Remplir le buffer avec une valeur constante
    float* channel = buffer->getChannel(testChannel);
    for (size_t i = 0; i < numSamples; ++i) {
        channel[i] = 1.0f;
    }

    // Appliquer le gain ramp
    buffer->applyGainRamp(testChannel, startSample, numSamplesToRamp, startGain, endGain);

    // Vérifier le ramp
    for (size_t i = 0; i < numSamplesToRamp; ++i) {
        float expectedGain = startGain + (endGain - startGain) * static_cast<float>(i) / static_cast<float>(numSamplesToRamp - 1);
        float expectedValue = 1.0f * expectedGain;
        EXPECT_NEAR(channel[startSample + i], expectedValue, 0.01f);
    }

    // Vérifier que le reste n'est pas modifié
    for (size_t i = startSample + numSamplesToRamp; i < numSamples; ++i) {
        EXPECT_NEAR(channel[i], 1.0f, tolerance);
    }
}

TEST_F(AudioBufferTest, AddFromBuffer) {
    // Créer un buffer source
    AudioEqualizer::AudioBuffer source(numChannels, numSamples);

    // Remplir les buffers
    for (size_t ch = 0; ch < numChannels; ++ch) {
        float* destChannel = buffer->getChannel(ch);
        float* srcChannel = source.getChannel(ch);

        for (size_t i = 0; i < numSamples; ++i) {
            destChannel[i] = 0.5f;
            srcChannel[i] = 0.3f;
        }
    }

    float mixGain = 1.0f;
    buffer->addFrom(source, mixGain);

    // Vérifier l'addition
    for (size_t ch = 0; ch < numChannels; ++ch) {
        const float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            EXPECT_NEAR(channel[i], 0.8f, tolerance); // 0.5 + 0.3 = 0.8
        }
    }
}

TEST_F(AudioBufferTest, AddFromArray) {
    size_t destChannel = 0;
    size_t numSamplesToAdd = 300;
    float mixGain = 0.5f;

    // Remplir le buffer destination
    float* destChannelPtr = buffer->getChannel(destChannel);
    for (size_t i = 0; i < numSamples; ++i) {
        destChannelPtr[i] = 0.4f;
    }

    // Créer des données source
    std::vector<float> sourceData(numSamplesToAdd, 0.2f);

    // Ajouter
    buffer->addFrom(destChannel, sourceData.data(), numSamplesToAdd, mixGain);

    // Vérifier l'addition
    for (size_t i = 0; i < numSamplesToAdd; ++i) {
        EXPECT_NEAR(destChannelPtr[i], 0.5f, tolerance); // 0.4 + 0.2 * 0.5 = 0.5
    }

    // Vérifier que le reste n'est pas modifié
    for (size_t i = numSamplesToAdd; i < numSamples; ++i) {
        EXPECT_NEAR(destChannelPtr[i], 0.4f, tolerance);
    }
}

TEST_F(AudioBufferTest, MagnitudeCalculation) {
    size_t testChannel = 0;

    // Remplir avec un signal sinusoïdal
    float* channel = buffer->getChannel(testChannel);
    for (size_t i = 0; i < numSamples; ++i) {
        channel[i] = std::sin(2.0f * M_PI * i / numSamples) * 0.8f;
    }

    // Calculer la magnitude
    float magnitude = buffer->getMagnitude(testChannel, 0, numSamples);

    // La magnitude devrait être proche de l'amplitude
    EXPECT_NEAR(magnitude, 0.8f, 0.05f);
}

TEST_F(AudioBufferTest, RMSLevelCalculation) {
    size_t testChannel = 0;
    float testAmplitude = 0.5f;

    // Remplir avec un signal constant
    float* channel = buffer->getChannel(testChannel);
    for (size_t i = 0; i < numSamples; ++i) {
        channel[i] = testAmplitude;
    }

    // Calculer le RMS
    float rms = buffer->getRMSLevel(testChannel, 0, numSamples);

    // Pour un signal constant, RMS = amplitude
    EXPECT_NEAR(rms, testAmplitude, tolerance);
}

TEST_F(AudioBufferTest, PointerAccess) {
    // Tester l'accès aux pointeurs de canaux
    float** writePointers = buffer->getArrayOfWritePointers();
    const float* const* readPointers = buffer->getArrayOfReadPointers();

    ASSERT_NE(writePointers, nullptr);
    ASSERT_NE(readPointers, nullptr);

    for (size_t ch = 0; ch < numChannels; ++ch) {
        ASSERT_NE(writePointers[ch], nullptr);
        ASSERT_NE(readPointers[ch], nullptr);

        // Les pointeurs devraient pointer vers la même mémoire
        EXPECT_EQ(writePointers[ch], readPointers[ch]);

        // Tester l'écriture via le pointeur
        writePointers[ch][0] = 1.0f;
        EXPECT_NEAR(readPointers[ch][0], 1.0f, tolerance);
    }
}

// Tests de performance
TEST_F(AudioBufferTest, PerformanceBenchmark) {
    size_t testNumSamples = 65536; // 64k samples
    AudioEqualizer::AudioBuffer largeBuffer(numChannels, testNumSamples);

    // Remplir le buffer
    for (size_t ch = 0; ch < numChannels; ++ch) {
        float* channel = largeBuffer.getChannel(ch);
        for (size_t i = 0; i < testNumSamples; ++i) {
            channel[i] = 0.5f;
        }
    }

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        largeBuffer.applyGain(2.0f);
    }, 100);

    PerformanceBenchmark::logBenchmark("AudioBuffer applyGain", duration, 100);

    // Vérifier que c'est temps réel (< 10ms pour 64k samples)
    double msPerOperation = duration.count() / 100.0 / 1000000.0;
    EXPECT_TRUE(msPerOperation < 10.0) << "AudioBuffer too slow: " << msPerOperation << "ms";
}

TEST_F(AudioBufferTest, SIMDOperations) {
    // Remplir le buffer avec des données de test
    for (size_t ch = 0; ch < numChannels; ++ch) {
        float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            channel[i] = 0.1f * (i % 10); // Pattern répétitif
        }
    }

    // Appliquer des opérations SIMD
    buffer->applyGain(2.0f);

    // Vérifier que les opérations SIMD fonctionnent correctement
    for (size_t ch = 0; ch < numChannels; ++ch) {
        const float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            float expected = 0.1f * (i % 10) * 2.0f;
            EXPECT_NEAR(channel[i], expected, tolerance);
        }
    }
}

// Tests de robustesse
TEST_F(AudioBufferTest, InvalidChannelAccess) {
    // Test d'accès à des canaux invalides
    EXPECT_EQ(buffer->getChannel(numChannels), nullptr);
    EXPECT_EQ(buffer->getChannel(static_cast<size_t>(-1)), nullptr);

    // Ces opérations ne devraient pas crasher
    EXPECT_NO_THROW(buffer->clear(numChannels + 10));
    EXPECT_NO_THROW(buffer->applyGain(numChannels + 10, 1.0f));
    EXPECT_NO_THROW(buffer->getMagnitude(numChannels + 10, 0, numSamples));
    EXPECT_NO_THROW(buffer->getRMSLevel(numChannels + 10, 0, numSamples));
}

TEST_F(AudioBufferTest, InvalidSampleRange) {
    size_t testChannel = 0;

    // Test avec des indices d'échantillons invalides
    EXPECT_NO_THROW(buffer->clear(testChannel, numSamples + 100, 100));
    EXPECT_NO_THROW(buffer->applyGain(testChannel, numSamples + 100, 100, 1.0f));
    EXPECT_NO_THROW(buffer->getMagnitude(testChannel, numSamples + 100, 100));
    EXPECT_NO_THROW(buffer->getRMSLevel(testChannel, numSamples + 100, 100));

    // Test avec des tailles négatives (converties en size_t)
    EXPECT_NO_THROW(buffer->applyGainRamp(testChannel, 100, 0, 1.0f, 2.0f));
}

TEST_F(AudioBufferTest, MemoryAlignment) {
    // Vérifier que la mémoire est alignée pour SIMD
    for (size_t ch = 0; ch < numChannels; ++ch) {
        const float* channel = buffer->getChannel(ch);
        ASSERT_NE(channel, nullptr);

        // L'adresse devrait être alignée sur 16 octets (boundary pour SSE)
        uintptr_t address = reinterpret_cast<uintptr_t>(channel);
        EXPECT_EQ(address % 16, 0) << "Channel " << ch << " not 16-byte aligned";
    }
}

TEST_F(AudioBufferTest, LargeBufferHandling) {
    size_t largeSize = 1024 * 1024; // 1M samples
    AudioEqualizer::AudioBuffer largeBuffer(2, largeSize);

    // Vérifier que le buffer large est créé correctement
    EXPECT_EQ(largeBuffer.getNumChannels(), 2);
    EXPECT_EQ(largeBuffer.getNumSamples(), largeSize);

    // Test d'une opération simple sur le buffer large
    largeBuffer.clear();
    EXPECT_NO_THROW(largeBuffer.applyGain(1.0f));
}

TEST_F(AudioBufferTest, CopyFromNullPointer) {
    // Test avec pointeur null (devrait être géré gracieusement)
    EXPECT_NO_THROW(buffer->copyFrom(0, nullptr, 0));
    EXPECT_NO_THROW(buffer->addFrom(0, nullptr, 0, 1.0f));
}

// Test de cohérence des données
TEST_F(AudioBufferTest, DataConsistency) {
    // Remplir le buffer avec un pattern connu
    std::vector<float> originalData(numSamples);
    for (size_t i = 0; i < numSamples; ++i) {
        originalData[i] = static_cast<float>(std::sin(2.0 * M_PI * i / numSamples));
    }

    for (size_t ch = 0; ch < numChannels; ++ch) {
        buffer->copyFrom(ch, originalData.data(), numSamples);
    }

    // Appliquer plusieurs opérations et vérifier la cohérence
    buffer->applyGain(2.0f);
    buffer->applyGain(0.5f); // Devrait revenir à la valeur originale

    for (size_t ch = 0; ch < numChannels; ++ch) {
        const float* channel = buffer->getChannel(ch);
        for (size_t i = 0; i < numSamples; ++i) {
            EXPECT_NEAR(channel[i], originalData[i], 1e-5f);
        }
    }
}
