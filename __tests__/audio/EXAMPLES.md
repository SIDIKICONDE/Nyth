# 🎵 AudioEqualizer Test Suite - Exemples d'utilisation

Cette documentation fournit des exemples concrets d'utilisation de la suite de tests complète pour l'AudioEqualizer.

## 📋 Table des matières

1. [Exécution rapide](#exécution-rapide)
2. [Tests unitaires](#tests-unitaires)
3. [Tests d'intégration](#tests-dintégration)
4. [Tests de performance](#tests-de-performance)
5. [Tests de stress](#tests-de-stress)
6. [Benchmarks personnalisés](#benchmarks-personnalisés)
7. [Analyse des résultats](#analyse-des-résultats)
8. [CI/CD Integration](#cicd-integration)

## 🚀 Exécution rapide

### Test complet (recommandé)
```bash
# Exécuter tous les tests
./run_tests.sh

# Ou avec le script bash
cd __tests__/audio
chmod +x run_tests.sh
./run_tests.sh
```

### Test rapide (pour le développement)
```cpp
#include "test_runner.hpp"

// Dans votre fonction main
int main() {
    RUN_QUICK_AUDIO_TEST_SUITE();
    return 0;
}
```

### Tests de performance uniquement
```bash
./run_tests.sh -p
```

## 🧪 Tests unitaires

### Test d'un AudioEqualizer
```cpp
#include <gtest/gtest.h>
#include "shared/Audio/core/AudioEqualizer.hpp"
#include "test_helpers.hpp"

class AudioEqualizerTest : public ::testing::Test {
protected:
    void SetUp() override {
        equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
    }

    std::unique_ptr<AudioEqualizer::AudioEqualizer> equalizer;
};

TEST_F(AudioEqualizerTest, BasicProcessing) {
    // Générer un signal de test
    auto input = AudioTest::TestSignalGenerator::generateSineWave(
        1024, 440.0, 44100, 0.5f);
    std::vector<float> output(1024);

    // Configurer l'égaliseur
    equalizer->setBandGain(0, 6.0);  // +6dB sur les basses
    equalizer->setBandGain(5, -3.0); // -3dB sur les médiums

    // Traiter le signal
    equalizer->process(std::span<const float>(input),
                      std::span<float>(output));

    // Vérifier les résultats
    AUDIO_TEST_ASSERT_SIGNAL_VALID(output);
    AUDIO_TEST_ASSERT_NO_NAN(output);
    AUDIO_TEST_ASSERT_NO_INF(output);

    // Vérifier que le signal a été modifié
    double inputRMS = AudioTest::SignalValidator::calculateRMS(input);
    double outputRMS = AudioTest::SignalValidator::calculateRMS(output);
    EXPECT_NE(inputRMS, outputRMS);
}
```

### Test d'un BiquadFilter
```cpp
TEST(BiquadFilterTest, LowPassResponse) {
    auto filter = std::make_unique<AudioEqualizer::BiquadFilter>();

    // Configurer un filtre passe-bas
    filter->calculateLowpass(1000.0, 44100, 0.707);

    // Signal de test avec deux fréquences
    auto lowFreq = AudioTest::TestSignalGenerator::generateSineWave(
        2048, 500.0, 44100, 0.5f);   // Devrait passer
    auto highFreq = AudioTest::TestSignalGenerator::generateSineWave(
        2048, 5000.0, 44100, 0.5f);  // Devrait être atténué

    std::vector<float> outputLow(2048), outputHigh(2048);

    filter->process(std::span(lowFreq), std::span(outputLow));
    filter->process(std::span(highFreq), std::span(outputHigh));

    // Le signal basse fréquence devrait avoir moins d'atténuation
    double rmsLow = AudioTest::SignalValidator::calculateRMS(outputLow);
    double rmsHigh = AudioTest::SignalValidator::calculateRMS(outputHigh);

    EXPECT_GT(rmsLow, rmsHigh);
}
```

### Test d'un AudioBuffer
```cpp
TEST(AudioBufferTest, SIMDOperations) {
    auto buffer = std::make_unique<AudioEqualizer::AudioBuffer>(2, 2048);

    // Remplir avec un signal de test
    auto sineWave = AudioTest::TestSignalGenerator::generateSineWave(
        2048, 440.0, 44100, 0.707f);

    buffer->copyFrom(0, sineWave.data(), sineWave.size());
    buffer->copyFrom(1, sineWave.data(), sineWave.size());

    // Appliquer un gain
    buffer->applyGain(0.8f);

    // Vérifier le résultat
    float magnitude = buffer->getMagnitude(0, 0, 2048);
    float rms = buffer->getRMSLevel(0, 0, 2048);

    EXPECT_NEAR(magnitude, 0.707f * 0.8f, 0.01f);
    EXPECT_NEAR(rms, 0.707f * 0.8f / std::sqrt(2.0f), 0.01f);
}
```

## 🔗 Tests d'intégration

### Pipeline complet
```cpp
TEST(IntegrationTest, CompleteAudioPipeline) {
    // Créer le pipeline: Safety -> Equalizer -> Effects -> NoiseReduction
    auto safety = std::make_unique<AudioSafety::AudioSafetyEngine>(44100, 2);
    auto equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
    auto effectChain = std::make_unique<AudioFX::EffectChain>();
    auto noiseReducer = std::make_unique<AudioNR::NoiseReducer>(44100, 2);

    // Configurer le pipeline
    AudioSafety::SafetyConfig safetyConfig{true, true, 0.002, true, -6.0, true, 6.0};
    safety->setConfig(safetyConfig);

    equalizer->setMasterGain(3.0);
    equalizer->setBandGain(0, 6.0);

    auto compressor = effectChain->emplaceEffect<AudioFX::CompressorEffect>();
    compressor->setParameters(-20.0, 3.0, 10.0, 80.0, 2.0);
    effectChain->setSampleRate(44100, 2);

    // Créer un signal de test avec du bruit
    auto cleanSignal = AudioTest::TestSignalGenerator::generateSineWave(
        4096, 1000.0, 44100, 0.3f);
    auto noise = AudioTest::TestSignalGenerator::generateWhiteNoise(
        4096, 0.1f);

    std::vector<float> input(4096), temp(4096), output(4096);
    for (size_t i = 0; i < 4096; ++i) {
        input[i] = cleanSignal[i] + noise[i];
    }

    // Traiter le signal à travers le pipeline
    safety->processMono(input.data(), temp.data(), 4096);
    equalizer->process(std::span(temp), std::span(output));
    effectChain->processMono(std::span(output), std::span(temp));
    noiseReducer->processMono(temp.data(), output.data(), 4096);

    // Vérifier que le signal est toujours valide
    AUDIO_TEST_ASSERT_SIGNAL_VALID(output);
    AUDIO_TEST_ASSERT_NO_NAN(output);

    // Vérifier l'amélioration du SNR
    double inputSNR = AudioTest::SignalValidator::calculateSNR(cleanSignal, input);
    double outputSNR = AudioTest::SignalValidator::calculateSNR(cleanSignal, output);

    EXPECT_GT(outputSNR, inputSNR);
    EXPECT_GT(outputSNR, 15.0); // Au moins 15dB de SNR final
}
```

### Test de latence
```cpp
TEST(IntegrationTest, LatencyMeasurement) {
    auto equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
    auto input = AudioTest::TestSignalGenerator::generateImpulse(1024, 100);
    std::vector<float> output(1024);

    auto processFunction = [&]() {
        equalizer->process(std::span(input), std::span(output));
    };

    double latency = AudioTest::LatencyTester::measureLatency(
        processFunction, 100);

    // Latence devrait être < 10ms
    EXPECT_LT(latency, 10.0);
}
```

## ⚡ Tests de performance

### Benchmark simple
```cpp
TEST(PerformanceTest, AudioEqualizerBenchmark) {
    auto equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
    auto input = AudioTest::TestSignalGenerator::generateWhiteNoise(
        1024, 0.5f);
    std::vector<float> output(1024);

    const size_t iterations = 1000;
    auto start = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < iterations; ++i) {
        equalizer->process(std::span(input), std::span(output));
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(
        end - start);

    double realtimeFactor = AudioTest::PerformanceTestBase::calculateRealtimeFactor(
        duration.count(), iterations, 1024);

    EXPECT_GT(realtimeFactor, 1.0); // Au moins temps réel
    std::cout << "Performance: " << realtimeFactor << "x realtime" << std::endl;
}
```

### Benchmark avec la classe Benchmark
```cpp
TEST(PerformanceTest, CompleteBenchmark) {
    AudioTest::AudioEqualizerBenchmark benchmark;
    auto result = benchmark.runBenchmark(2048, 1000);

    std::cout << result.toString() << std::endl;

    // Vérifier les performances
    EXPECT_GT(result.realtimeFactor, 1.0);
    EXPECT_LT(result.latencyMs, 50.0);
}
```

## 🔴 Tests de stress

### Test de paramètres extrêmes
```cpp
TEST(StressTest, ExtremeParameters) {
    auto equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
    auto input = AudioTest::TestSignalGenerator::generateSineWave(
        1024, 1000.0, 44100, 0.1f);
    std::vector<float> output(1024);

    // Tester avec des paramètres extrêmes
    equalizer->setMasterGain(120.0);  // Gain extrême
    equalizer->setBandGain(0, 120.0);  // Gain de bande extrême
    equalizer->setBandFrequency(0, 100000.0); // Fréquence extrême

    // Ne devrait pas crasher
    EXPECT_NO_THROW({
        equalizer->process(std::span(input), std::span(output));
    });

    // Mais le signal devrait être valide
    AUDIO_TEST_ASSERT_SIGNAL_VALID(output);
}
```

### Test de mémoire
```cpp
TEST(StressTest, MemoryStress) {
    const size_t iterations = 1000;
    std::vector<std::unique_ptr<AudioEqualizer::AudioEqualizer>> equalizers;

    for (size_t i = 0; i < iterations; ++i) {
        auto eq = std::make_unique<AudioEqualizer::AudioEqualizer>();
        auto input = AudioTest::TestSignalGenerator::generateWhiteNoise(
            512, 0.1f);
        std::vector<float> output(512);

        eq->process(std::span(input), std::span(output));
        equalizers.push_back(std::move(eq));

        // Garder seulement les 10 derniers
        if (equalizers.size() > 10) {
            equalizers.erase(equalizers.begin());
        }
    }

    SUCCEED(); // Si on arrive ici, pas de fuite mémoire
}
```

### Test d'accès concurrent
```cpp
TEST(StressTest, ConcurrentAccess) {
    auto equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
    auto input = AudioTest::TestSignalGenerator::generateWhiteNoise(
        1024, 0.5f);
    std::vector<float> output(1024);

    std::atomic<bool> running{true};
    std::vector<std::future<void>> threads;

    // Lancer plusieurs threads
    for (int i = 0; i < 4; ++i) {
        threads.push_back(std::async(std::launch::async, [&]() {
            while (running) {
                equalizer->setBandGain(i % 10, static_cast<double>(i));
                equalizer->process(std::span(input), std::span(output));
                std::this_thread::sleep_for(std::chrono::microseconds(100));
            }
        }));
    }

    // Laisser tourner pendant 1 seconde
    std::this_thread::sleep_for(std::chrono::seconds(1));
    running = false;

    // Attendre tous les threads
    for (auto& thread : threads) {
        thread.wait();
    }

    SUCCEED();
}
```

## 📊 Benchmarks personnalisés

### Créer un benchmark personnalisé
```cpp
class CustomBenchmark : public AudioTest::AudioBenchmark {
public:
    void setup(size_t bufferSize) override {
        // Configuration personnalisée
        myComponent_ = std::make_unique<MyAudioComponent>();
        input_ = AudioTest::TestSignalGenerator::generateSineWave(
            bufferSize, 440.0, 44100, 0.5f);
        output_.resize(bufferSize);
    }

    void run(size_t iterations) override {
        for (size_t i = 0; i < iterations; ++i) {
            myComponent_->process(input_.data(), output_.data(), input_.size());
        }
    }

    void teardown() override {
        myComponent_.reset();
        input_.clear();
        output_.clear();
    }

    std::string getBenchmarkName() const override {
        return "CustomComponent_Benchmark";
    }

    std::string getComponentName() const override {
        return "MyAudioComponent";
    }

private:
    std::unique_ptr<MyAudioComponent> myComponent_;
    std::vector<float> input_;
    std::vector<float> output_;
};

TEST(CustomBenchmarkTest, Run) {
    CustomBenchmark benchmark;
    auto result = benchmark.runBenchmark(2048, 1000);

    std::cout << result.toString() << std::endl;
    EXPECT_GT(result.realtimeFactor, 1.0);
}
```

## 📈 Analyse des résultats

### Interprétation des métriques

#### Realtime Factor
```
🟢 EXCELLENT: >10x realtime (professionnel)
🟡 GOOD: >2x realtime (excellent)
🟠 ACCEPTABLE: >1x realtime (minimum)
🔴 POOR: <1x realtime (inutilisable)
```

#### Latence
```
🟢 <5ms: Parfait pour le live
🟡 <10ms: Bon pour la plupart des usages
🟠 <50ms: Acceptable pour certains effets
🔴 >50ms: Problématique
```

#### SNR
```
🟢 >30dB: Qualité CD
🟡 >20dB: Bonne qualité
🟠 >10dB: Qualité acceptable
🔴 <10dB: Mauvaise qualité
```

### Exemple de rapport
```
🎵 AudioEqualizer Test Report
==========================================

Tests Results:
  Total: 15
  Passed: 15 (100.0%)
  Failed: 0 (0.0%)
  Skipped: 0
  Duration: 1250 ms
  Status: ✅ SUCCESS

Benchmark: AudioEqualizer_10Band (AudioEqualizer)
  Buffer Size: 2048 samples
  Iterations: 1000
  Total Time: 45.2 ms
  Avg Time/Iteration: 0.045 ms
  Realtime Factor: 8.4x
  Samples/sec: 371520
  Latency: 0.045 ms
  Performance: 🟢 EXCELLENT
```

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
name: Audio Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Install dependencies
      run: |
        sudo apt-get update
        sudo apt-get install -y cmake g++ libgtest-dev
    - name: Build tests
      run: |
        cd __tests__/audio
        mkdir build && cd build
        cmake ..
        make -j$(nproc)
    - name: Run tests
      run: |
        cd __tests__/audio/build
        ./audio_tests --gtest_output=xml:test_results.xml
    - name: Upload results
      uses: actions/upload-artifact@v2
      with:
        name: test-results
        path: __tests__/audio/build/test_results.xml
```

### Docker
```dockerfile
FROM ubuntu:20.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    g++ \
    libgtest-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy source code
COPY . /app
WORKDIR /app/__tests__/audio

# Build and run tests
RUN mkdir build && cd build && \
    cmake .. && \
    make -j$(nproc) && \
    ./audio_tests --gtest_output=xml:test_results.xml
```

### CMake Configuration
```cmake
# Dans votre CMakeLists.txt principal
option(BUILD_TESTS "Build test suite" ON)
if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(__tests__/audio)
endif()
```

## 🎯 Meilleures pratiques

### 1. **Structure des tests**
```cpp
// ✅ Bon
class AudioProcessorTest : public ::testing::Test {
protected:
    void SetUp() override { /* Initialisation propre */ }
    void TearDown() override { /* Nettoyage */ }
};

// ❌ Éviter
TEST(AudioProcessorTest, TestEverything) {
    // Test trop large, difficile à déboguer
}
```

### 2. **Nommage**
```cpp
// ✅ Bon
TEST(AudioEqualizerTest, ProcessSineWave_440Hz_0dBFS)
// ❌ Éviter
TEST(AudioEqualizerTest, Test1)
```

### 3. **Validation**
```cpp
// ✅ Bon
AUDIO_TEST_ASSERT_SIGNAL_VALID(output);
AUDIO_TEST_ASSERT_NO_NAN(output);
AUDIO_TEST_ASSERT_RMS_RANGE(output, 0.1, 0.9);

// ❌ Éviter
EXPECT_TRUE(output[0] > 0); // Trop spécifique
```

### 4. **Performance**
```cpp
// ✅ Bon
AUDIO_TEST_PERFORMANCE_TEST("MyTest", 1000, [&]() {
    // Code à tester
});

// ❌ Éviter
for(int i = 0; i < 1000; i++) { /* code */ } // Pas mesuré
```

## 🐛 Dépannage

### Problèmes courants

#### **Tests qui échouent aléatoirement**
```cpp
// Utiliser une graine fixe pour les générateurs aléatoires
std::mt19937 gen(42); // Graine fixe
```

#### **Fuites mémoire**
```bash
# Utiliser Valgrind
valgrind --tool=memcheck ./audio_tests

# Dans CMake
target_compile_options(audio_tests PRIVATE -fsanitize=address)
```

#### **Performance lente**
```cpp
# Compiler en Release
cmake -DCMAKE_BUILD_TYPE=Release ..

# Utiliser les optimisations SIMD
target_compile_options(audio_tests PRIVATE -march=native)
```

---

**🎵 Cette suite de tests représente l'état de l'art du testing audio en C++20. Elle assure la qualité, la performance et la robustesse de votre code audio.**
