#include <benchmark/benchmark.h>
#include "../shared/Audio/capture/AudioCaptureUtils.hpp"
#include "../shared/Audio/capture/AudioCaptureSIMD.hpp"
#include "../shared/Audio/capture/AudioCaptureMetrics.hpp"
#include <random>
#include <vector>
#include <iostream>

using namespace Nyth::Audio;

// ============================================================================
// Générateurs de données de test
// ============================================================================

class AudioBenchmarkFixture : public benchmark::Fixture {
protected:
    std::vector<float> floatData;
    std::vector<int16_t> int16Data;
    std::vector<float> stereoData;
    std::random_device rd;
    std::mt19937 gen{rd()};
    
    void SetUp(const ::benchmark::State& state) override {
        size_t size = state.range(0);
        
        // Générer des données float aléatoires
        std::uniform_real_distribution<float> floatDist(-1.0f, 1.0f);
        floatData.resize(size);
        for (size_t i = 0; i < size; ++i) {
            floatData[i] = floatDist(gen);
        }
        
        // Générer des données int16 aléatoires
        std::uniform_int_distribution<int16_t> int16Dist(-32768, 32767);
        int16Data.resize(size);
        for (size_t i = 0; i < size; ++i) {
            int16Data[i] = int16Dist(gen);
        }
        
        // Générer des données stéréo
        stereoData.resize(size * 2);
        for (size_t i = 0; i < size * 2; ++i) {
            stereoData[i] = floatDist(gen);
        }
    }
};

// ============================================================================
// Benchmarks de conversion de format
// ============================================================================

// Conversion int16 -> float (scalaire)
static void BM_Int16ToFloat_Scalar(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<int16_t> input(size);
    std::vector<float> output(size);
    
    // Initialiser avec des données aléatoires
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<int16_t> dist(-32768, 32767);
    for (size_t i = 0; i < size; ++i) {
        input[i] = dist(gen);
    }
    
    for (auto _ : state) {
        AudioFormatConverter::int16ToFloat(input.data(), output.data(), size);
        benchmark::DoNotOptimize(output.data());
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(int16_t));
    state.SetItemsProcessed(state.iterations() * size);
}

// Conversion int16 -> float (SIMD)
static void BM_Int16ToFloat_SIMD(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<int16_t> input(size);
    std::vector<float> output(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<int16_t> dist(-32768, 32767);
    for (size_t i = 0; i < size; ++i) {
        input[i] = dist(gen);
    }
    
    for (auto _ : state) {
        SIMD::AudioFormatConverterSIMD::int16ToFloat_Optimized(
            input.data(), output.data(), size);
        benchmark::DoNotOptimize(output.data());
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(int16_t));
    state.SetItemsProcessed(state.iterations() * size);
}

// Conversion float -> int16 (scalaire)
static void BM_FloatToInt16_Scalar(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> input(size);
    std::vector<int16_t> output(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
    for (size_t i = 0; i < size; ++i) {
        input[i] = dist(gen);
    }
    
    for (auto _ : state) {
        AudioFormatConverter::floatToInt16(input.data(), output.data(), size);
        benchmark::DoNotOptimize(output.data());
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

// Conversion float -> int16 (SIMD)
static void BM_FloatToInt16_SIMD(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> input(size);
    std::vector<int16_t> output(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
    for (size_t i = 0; i < size; ++i) {
        input[i] = dist(gen);
    }
    
    for (auto _ : state) {
        SIMD::AudioFormatConverterSIMD::floatToInt16_Optimized(
            input.data(), output.data(), size);
        benchmark::DoNotOptimize(output.data());
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

// ============================================================================
// Benchmarks d'analyse audio
// ============================================================================

// Calcul RMS (scalaire)
static void BM_CalculateRMS_Scalar(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> data(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
    for (size_t i = 0; i < size; ++i) {
        data[i] = dist(gen);
    }
    
    for (auto _ : state) {
        float rms = AudioAnalyzer::calculateRMS(data.data(), size);
        benchmark::DoNotOptimize(rms);
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

// Calcul RMS (SIMD)
static void BM_CalculateRMS_SIMD(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> data(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
    for (size_t i = 0; i < size; ++i) {
        data[i] = dist(gen);
    }
    
    for (auto _ : state) {
        float rms = SIMD::AudioAnalyzerSIMD::calculateRMS_Optimized(data.data(), size);
        benchmark::DoNotOptimize(rms);
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

// Détection de peak (scalaire)
static void BM_CalculatePeak_Scalar(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> data(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
    for (size_t i = 0; i < size; ++i) {
        data[i] = dist(gen);
    }
    
    for (auto _ : state) {
        float peak = AudioAnalyzer::calculatePeak(data.data(), size);
        benchmark::DoNotOptimize(peak);
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

// Détection de peak (SIMD)
static void BM_CalculatePeak_SIMD(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> data(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
    for (size_t i = 0; i < size; ++i) {
        data[i] = dist(gen);
    }
    
    for (auto _ : state) {
        float peak = SIMD::AudioAnalyzerSIMD::calculatePeak_Optimized(data.data(), size);
        benchmark::DoNotOptimize(peak);
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

// Détection de clipping (scalaire)
static void BM_CountClipping_Scalar(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> data(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.2f, 1.2f);
    for (size_t i = 0; i < size; ++i) {
        data[i] = dist(gen);
    }
    
    for (auto _ : state) {
        size_t count = AudioAnalyzer::countClippedSamples(data.data(), size);
        benchmark::DoNotOptimize(count);
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

// Détection de clipping (SIMD)
static void BM_CountClipping_SIMD(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> data(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.2f, 1.2f);
    for (size_t i = 0; i < size; ++i) {
        data[i] = dist(gen);
    }
    
    for (auto _ : state) {
        size_t count = SIMD::AudioAnalyzerSIMD::countClippedSamples_Optimized(data.data(), size);
        benchmark::DoNotOptimize(count);
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

// ============================================================================
// Benchmarks de mixage
// ============================================================================

// Stéréo vers mono (scalaire)
static void BM_StereoToMono_Scalar(benchmark::State& state) {
    const size_t frameCount = state.range(0);
    std::vector<float> stereo(frameCount * 2);
    std::vector<float> mono(frameCount);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
    for (size_t i = 0; i < stereo.size(); ++i) {
        stereo[i] = dist(gen);
    }
    
    for (auto _ : state) {
        AudioFormatConverter::stereoToMono(stereo.data(), mono.data(), frameCount);
        benchmark::DoNotOptimize(mono.data());
    }
    
    state.SetBytesProcessed(state.iterations() * stereo.size() * sizeof(float));
    state.SetItemsProcessed(state.iterations() * frameCount);
}

// Stéréo vers mono (SIMD)
static void BM_StereoToMono_SIMD(benchmark::State& state) {
    const size_t frameCount = state.range(0);
    std::vector<float> stereo(frameCount * 2);
    std::vector<float> mono(frameCount);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
    for (size_t i = 0; i < stereo.size(); ++i) {
        stereo[i] = dist(gen);
    }
    
    for (auto _ : state) {
        SIMD::AudioMixerSIMD::stereoToMono_Optimized(stereo.data(), mono.data(), frameCount);
        benchmark::DoNotOptimize(mono.data());
    }
    
    state.SetBytesProcessed(state.iterations() * stereo.size() * sizeof(float));
    state.SetItemsProcessed(state.iterations() * frameCount);
}

// ============================================================================
// Benchmarks du buffer circulaire
// ============================================================================

BENCHMARK_DEFINE_F(AudioBenchmarkFixture, CircularBufferWrite)(benchmark::State& state) {
    const size_t bufferSize = 8192;
    const size_t writeSize = state.range(0);
    CircularBuffer<float> buffer(bufferSize);
    
    for (auto _ : state) {
        size_t written = buffer.write(floatData.data(), writeSize);
        benchmark::DoNotOptimize(written);
        
        // Lire pour faire de la place
        std::vector<float> temp(writeSize);
        buffer.read(temp.data(), writeSize);
    }
    
    state.SetBytesProcessed(state.iterations() * writeSize * sizeof(float));
    state.SetItemsProcessed(state.iterations() * writeSize);
}

BENCHMARK_DEFINE_F(AudioBenchmarkFixture, CircularBufferRead)(benchmark::State& state) {
    const size_t bufferSize = 8192;
    const size_t readSize = state.range(0);
    CircularBuffer<float> buffer(bufferSize);
    std::vector<float> output(readSize);
    
    // Pré-remplir le buffer
    buffer.write(floatData.data(), bufferSize / 2);
    
    for (auto _ : state) {
        size_t read = buffer.read(output.data(), readSize);
        benchmark::DoNotOptimize(read);
        
        // Réécrire pour maintenir des données
        buffer.write(floatData.data(), readSize);
    }
    
    state.SetBytesProcessed(state.iterations() * readSize * sizeof(float));
    state.SetItemsProcessed(state.iterations() * readSize);
}

// ============================================================================
// Benchmarks des métriques
// ============================================================================

static void BM_MetricsUpdate(benchmark::State& state) {
    AudioMetricsCollector collector;
    collector.startCollection();
    
    float latency = 5.0f;
    
    for (auto _ : state) {
        collector.updateLatency(latency);
        latency += 0.1f;
        if (latency > 10.0f) latency = 5.0f;
    }
    
    state.SetItemsProcessed(state.iterations());
}

static void BM_MetricsHistoryAdd(benchmark::State& state) {
    const size_t historySize = state.range(0);
    MetricHistory<float> history(historySize);
    
    float value = 0.0f;
    
    for (auto _ : state) {
        history.add(value);
        value += 1.0f;
    }
    
    state.SetItemsProcessed(state.iterations());
}

static void BM_ProfilerMeasure(benchmark::State& state) {
    AudioProfiler profiler;
    
    for (auto _ : state) {
        {
            auto timer = profiler.measure("test_function");
            // Simuler un travail
            volatile int sum = 0;
            for (int i = 0; i < 100; ++i) {
                sum += i;
            }
        }
    }
    
    state.SetItemsProcessed(state.iterations());
}

// ============================================================================
// Benchmarks de normalisation
// ============================================================================

static void BM_Normalize_Scalar(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> data(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-0.5f, 0.5f);
    
    for (auto _ : state) {
        // Réinitialiser les données
        for (size_t i = 0; i < size; ++i) {
            data[i] = dist(gen);
        }
        
        AudioAnalyzer::normalize(data.data(), size);
        benchmark::DoNotOptimize(data.data());
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

static void BM_Normalize_SIMD(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> data(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-0.5f, 0.5f);
    
    for (auto _ : state) {
        // Réinitialiser les données
        for (size_t i = 0; i < size; ++i) {
            data[i] = dist(gen);
        }
        
        SIMD::AudioAnalyzerSIMD::normalize_Optimized(data.data(), size);
        benchmark::DoNotOptimize(data.data());
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

// ============================================================================
// Benchmarks de détection de silence
// ============================================================================

static void BM_IsSilent_Scalar(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> data(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-0.0005f, 0.0005f);
    for (size_t i = 0; i < size; ++i) {
        data[i] = dist(gen);
    }
    
    for (auto _ : state) {
        bool silent = AudioAnalyzer::isSilent(data.data(), size);
        benchmark::DoNotOptimize(silent);
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

static void BM_IsSilent_SIMD(benchmark::State& state) {
    const size_t size = state.range(0);
    std::vector<float> data(size);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-0.0005f, 0.0005f);
    for (size_t i = 0; i < size; ++i) {
        data[i] = dist(gen);
    }
    
    for (auto _ : state) {
        bool silent = SIMD::AudioFeatureDetectorSIMD::isSilent_Optimized(data.data(), size);
        benchmark::DoNotOptimize(silent);
    }
    
    state.SetBytesProcessed(state.iterations() * size * sizeof(float));
    state.SetItemsProcessed(state.iterations() * size);
}

// ============================================================================
// Configuration des benchmarks
// ============================================================================

// Tailles typiques de buffers audio
static void AudioBufferSizes(benchmark::internal::Benchmark* b) {
    b->Arg(256)    // Petit buffer
     ->Arg(512)    
     ->Arg(1024)   // Taille standard
     ->Arg(2048)   
     ->Arg(4096)   // Grand buffer
     ->Arg(8192)   
     ->Arg(16384)  // Très grand buffer
     ->Arg(44100); // 1 seconde à 44.1kHz
}

// Enregistrement des benchmarks de conversion
BENCHMARK(BM_Int16ToFloat_Scalar)->Apply(AudioBufferSizes);
BENCHMARK(BM_Int16ToFloat_SIMD)->Apply(AudioBufferSizes);
BENCHMARK(BM_FloatToInt16_Scalar)->Apply(AudioBufferSizes);
BENCHMARK(BM_FloatToInt16_SIMD)->Apply(AudioBufferSizes);

// Enregistrement des benchmarks d'analyse
BENCHMARK(BM_CalculateRMS_Scalar)->Apply(AudioBufferSizes);
BENCHMARK(BM_CalculateRMS_SIMD)->Apply(AudioBufferSizes);
BENCHMARK(BM_CalculatePeak_Scalar)->Apply(AudioBufferSizes);
BENCHMARK(BM_CalculatePeak_SIMD)->Apply(AudioBufferSizes);
BENCHMARK(BM_CountClipping_Scalar)->Apply(AudioBufferSizes);
BENCHMARK(BM_CountClipping_SIMD)->Apply(AudioBufferSizes);

// Enregistrement des benchmarks de mixage
BENCHMARK(BM_StereoToMono_Scalar)->Apply(AudioBufferSizes);
BENCHMARK(BM_StereoToMono_SIMD)->Apply(AudioBufferSizes);

// Enregistrement des benchmarks de normalisation
BENCHMARK(BM_Normalize_Scalar)->Apply(AudioBufferSizes);
BENCHMARK(BM_Normalize_SIMD)->Apply(AudioBufferSizes);

// Enregistrement des benchmarks de détection
BENCHMARK(BM_IsSilent_Scalar)->Apply(AudioBufferSizes);
BENCHMARK(BM_IsSilent_SIMD)->Apply(AudioBufferSizes);

// Enregistrement des benchmarks de buffer circulaire
BENCHMARK_REGISTER_F(AudioBenchmarkFixture, CircularBufferWrite)
    ->RangeMultiplier(2)->Range(64, 4096);
BENCHMARK_REGISTER_F(AudioBenchmarkFixture, CircularBufferRead)
    ->RangeMultiplier(2)->Range(64, 4096);

// Enregistrement des benchmarks de métriques
BENCHMARK(BM_MetricsUpdate);
BENCHMARK(BM_MetricsHistoryAdd)->Arg(100)->Arg(1000)->Arg(10000);
BENCHMARK(BM_ProfilerMeasure);

// ============================================================================
// Rapport de comparaison personnalisé
// ============================================================================

class SpeedupReporter : public benchmark::ConsoleReporter {
public:
    bool ReportContext(const Context& context) override {
        std::cout << "\n=== Audio Capture Performance Benchmarks ===\n";
        std::cout << "CPU Frequency: " << context.cpu_info.cycles_per_second / 1e9 << " GHz\n";
        std::cout << "Cores: " << context.cpu_info.num_cpus << "\n\n";
        return ConsoleReporter::ReportContext(context);
    }
    
    void PrintRunData(const Run& run) override {
        ConsoleReporter::PrintRunData(run);
        
        // Calculer le speedup pour les benchmarks SIMD
        if (run.benchmark_name().find("_SIMD") != std::string::npos) {
            std::string scalar_name = run.benchmark_name();
            size_t pos = scalar_name.find("_SIMD");
            scalar_name.replace(pos, 5, "_Scalar");
            
            // Chercher le benchmark scalaire correspondant
            // (Dans une vraie implémentation, on stockerait les résultats)
            std::cout << "  [Speedup calculation would go here]\n";
        }
    }
};

// ============================================================================
// Main
// ============================================================================

BENCHMARK_MAIN();