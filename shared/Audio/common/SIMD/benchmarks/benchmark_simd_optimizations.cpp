#include "../SIMDCore.hpp"
#include "../SIMDCore_Optimized.hpp"
#include "../SIMDMathFunctions.hpp"
#include "../SIMDMathFunctions_Optimized.hpp"
#include <iostream>
#include <iomanip>
#include <chrono>
#include <vector>
#include <random>

using namespace AudioNR::SIMD;

class SIMDOptimizationBenchmark {
private:
    std::vector<float> testData;
    std::vector<float> testData2;
    std::vector<float> result;
    std::vector<float> resultOptimized;
    size_t dataSize;
    
    using Clock = std::chrono::high_resolution_clock;
    using Duration = std::chrono::duration<double, std::milli>;
    
public:
    SIMDOptimizationBenchmark(size_t size = 100000) : dataSize(size) {
        // Initialiser les données de test
        testData.resize(dataSize);
        testData2.resize(dataSize);
        result.resize(dataSize);
        resultOptimized.resize(dataSize);
        
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
        
        for (size_t i = 0; i < dataSize; ++i) {
            testData[i] = dist(gen);
            testData2[i] = dist(gen);
        }
    }
    
    struct BenchResult {
        std::string name;
        double timeOriginal;
        double timeOptimized;
        double speedup;
        bool verified;
    };
    
    template<typename Func>
    double measureTime(Func func, int iterations = 100) {
        // Warmup
        for (int i = 0; i < 10; ++i) {
            func();
        }
        
        auto start = Clock::now();
        for (int i = 0; i < iterations; ++i) {
            func();
        }
        auto end = Clock::now();
        
        return Duration(end - start).count() / iterations;
    }
    
    bool verifyResults(const float* a, const float* b, size_t count, float tolerance = 1e-5f) {
        for (size_t i = 0; i < count; ++i) {
            if (std::abs(a[i] - b[i]) > tolerance) {
                std::cout << "Mismatch at index " << i << ": " << a[i] << " vs " << b[i] << std::endl;
                return false;
            }
        }
        return true;
    }
    
    BenchResult benchmarkAdd() {
        BenchResult result{"Vector Add", 0, 0, 0, false};
        
        // Version originale
        result.timeOriginal = measureTime([&]() {
            SIMDMath::add(this->result.data(), testData.data(), testData2.data(), dataSize);
        });
        
        // Version optimisée
        result.timeOptimized = measureTime([&]() {
            SIMDMathOptimized::add(resultOptimized.data(), testData.data(), testData2.data(), dataSize);
        });
        
        result.speedup = result.timeOriginal / result.timeOptimized;
        result.verified = verifyResults(this->result.data(), resultOptimized.data(), dataSize);
        
        return result;
    }
    
    BenchResult benchmarkMultiply() {
        BenchResult result{"Vector Multiply", 0, 0, 0, false};
        
        result.timeOriginal = measureTime([&]() {
            SIMDMath::multiply(this->result.data(), testData.data(), testData2.data(), dataSize);
        });
        
        result.timeOptimized = measureTime([&]() {
            SIMDMathOptimized::multiply(resultOptimized.data(), testData.data(), testData2.data(), dataSize);
        });
        
        result.speedup = result.timeOriginal / result.timeOptimized;
        result.verified = verifyResults(this->result.data(), resultOptimized.data(), dataSize);
        
        return result;
    }
    
    BenchResult benchmarkSum() {
        BenchResult result{"Vector Sum", 0, 0, 0, false};
        float sum1, sum2;
        
        result.timeOriginal = measureTime([&]() {
            sum1 = SIMDMath::sum(testData.data(), dataSize);
        });
        
        result.timeOptimized = measureTime([&]() {
            sum2 = SIMDMathOptimized::sum(testData.data(), dataSize);
        });
        
        result.speedup = result.timeOriginal / result.timeOptimized;
        result.verified = std::abs(sum1 - sum2) < 1e-3f;
        
        return result;
    }
    
    BenchResult benchmarkRMS() {
        BenchResult result{"RMS Calculation", 0, 0, 0, false};
        float rms1, rms2;
        
        result.timeOriginal = measureTime([&]() {
            rms1 = SIMDMath::rms(testData.data(), dataSize);
        });
        
        result.timeOptimized = measureTime([&]() {
            rms2 = SIMDMathOptimized::rms(testData.data(), dataSize);
        });
        
        result.speedup = result.timeOriginal / result.timeOptimized;
        result.verified = std::abs(rms1 - rms2) < 1e-4f;
        
        return result;
    }
    
    BenchResult benchmarkSin() {
        BenchResult result{"Sin Vectorized", 0, 0, 0, false};
        
        result.timeOriginal = measureTime([&]() {
            SIMDMathFunctions::sin_vectorized(testData.data(), this->result.data(), dataSize);
        });
        
        result.timeOptimized = measureTime([&]() {
            SIMDMathFunctionsOptimized::sin_vectorized_fast(testData.data(), resultOptimized.data(), dataSize);
        });
        
        result.speedup = result.timeOriginal / result.timeOptimized;
        
        // Vérification avec tolérance plus élevée pour l'approximation
        result.verified = verifyResults(this->result.data(), resultOptimized.data(), 
                                      std::min(size_t(1000), dataSize), 0.001f);
        
        return result;
    }
    
    BenchResult benchmarkTanh() {
        BenchResult result{"Tanh Vectorized", 0, 0, 0, false};
        
        result.timeOriginal = measureTime([&]() {
            SIMDMathFunctions::tanh_vectorized(testData.data(), this->result.data(), dataSize);
        });
        
        result.timeOptimized = measureTime([&]() {
            SIMDMathFunctionsOptimized::tanh_vectorized_fast(testData.data(), resultOptimized.data(), dataSize);
        });
        
        result.speedup = result.timeOriginal / result.timeOptimized;
        result.verified = verifyResults(this->result.data(), resultOptimized.data(), 
                                      std::min(size_t(1000), dataSize), 0.01f);
        
        return result;
    }
    
    BenchResult benchmarkNormalize() {
        BenchResult result{"Normalize", 0, 0, 0, false};
        
        // Copier les données pour ne pas les modifier
        std::vector<float> data1 = testData;
        std::vector<float> data2 = testData;
        
        result.timeOriginal = measureTime([&]() {
            std::copy(testData.begin(), testData.end(), data1.begin());
            SIMDMathFunctions::normalize(data1.data(), dataSize, 0.7f);
        });
        
        result.timeOptimized = measureTime([&]() {
            std::copy(testData.begin(), testData.end(), data2.begin());
            SIMDMathFunctionsOptimized::normalize_optimized(data2.data(), dataSize, 0.7f);
        });
        
        result.speedup = result.timeOriginal / result.timeOptimized;
        result.verified = verifyResults(data1.data(), data2.data(), dataSize, 1e-4f);
        
        return result;
    }
    
    BenchResult benchmarkSoftClipper() {
        BenchResult result{"Soft Clipper", 0, 0, 0, false};
        
        std::vector<float> data1 = testData;
        std::vector<float> data2 = testData;
        
        result.timeOriginal = measureTime([&]() {
            std::copy(testData.begin(), testData.end(), data1.begin());
            SIMDMathFunctions::apply_soft_clipper(data1.data(), dataSize, 0.8f);
        });
        
        result.timeOptimized = measureTime([&]() {
            std::copy(testData.begin(), testData.end(), data2.begin());
            SIMDMathFunctionsOptimized::apply_soft_clipper_optimized(data2.data(), dataSize, 0.8f);
        });
        
        result.speedup = result.timeOriginal / result.timeOptimized;
        result.verified = verifyResults(data1.data(), data2.data(), dataSize);
        
        return result;
    }
    
    BenchResult benchmarkBlockProcessing() {
        BenchResult result{"Block Processing", 0, 0, 0, false};
        
        std::vector<float> data1 = testData;
        std::vector<float> data2 = testData;
        
        // Version normale : traitement direct
        result.timeOriginal = measureTime([&]() {
            std::copy(testData.begin(), testData.end(), data1.begin());
            SIMDMathFunctions::apply_soft_clipper(data1.data(), dataSize, 0.9f);
            SIMDMathFunctions::normalize(data1.data(), dataSize, 0.8f);
        });
        
        // Version optimisée : traitement par blocs avec pipeline
        SIMDBlockProcessor<512> processor;
        result.timeOptimized = measureTime([&]() {
            std::copy(testData.begin(), testData.end(), data2.begin());
            processor.processInBlocksPipelined(data2.data(), dataSize, [](float* block, size_t size) {
                SIMDMathFunctionsOptimized::apply_soft_clipper_optimized(block, size, 0.9f);
                SIMDMathFunctionsOptimized::normalize_optimized(block, size, 0.8f);
            });
        });
        
        result.speedup = result.timeOriginal / result.timeOptimized;
        result.verified = verifyResults(data1.data(), data2.data(), dataSize, 1e-4f);
        
        return result;
    }
    
    void runAllBenchmarks() {
        std::cout << "\n=== SIMD Optimization Benchmark ===" << std::endl;
        std::cout << "Data size: " << dataSize << " floats" << std::endl;
        std::cout << "SIMD: " << SIMDDetector::getBestSIMDType() << std::endl;
        std::cout << std::string(70, '-') << std::endl;
        
        std::vector<BenchResult> results = {
            benchmarkAdd(),
            benchmarkMultiply(),
            benchmarkSum(),
            benchmarkRMS(),
            benchmarkSin(),
            benchmarkTanh(),
            benchmarkNormalize(),
            benchmarkSoftClipper(),
            benchmarkBlockProcessing()
        };
        
        // Afficher les résultats
        std::cout << std::left << std::setw(20) << "Function"
                  << std::right << std::setw(12) << "Original(ms)"
                  << std::setw(12) << "Optimized(ms)"
                  << std::setw(10) << "Speedup"
                  << std::setw(10) << "Verified" << std::endl;
        std::cout << std::string(70, '-') << std::endl;
        
        for (const auto& r : results) {
            std::cout << std::left << std::setw(20) << r.name
                      << std::right << std::setw(12) << std::fixed << std::setprecision(3) << r.timeOriginal
                      << std::setw(12) << r.timeOptimized
                      << std::setw(10) << std::setprecision(2) << r.speedup << "x"
                      << std::setw(10) << (r.verified ? "✓" : "✗") << std::endl;
        }
        
        // Calculer le speedup moyen
        double avgSpeedup = 0.0;
        for (const auto& r : results) {
            avgSpeedup += r.speedup;
        }
        avgSpeedup /= results.size();
        
        std::cout << std::string(70, '-') << std::endl;
        std::cout << "Average speedup: " << std::setprecision(2) << avgSpeedup << "x" << std::endl;
        
        // Calculer le throughput
        double elementsPerSecond = (dataSize * 1000.0) / results[0].timeOptimized;
        std::cout << "Throughput (Add): " << std::setprecision(1) 
                  << (elementsPerSecond / 1e6) << " M elements/sec" << std::endl;
    }
    
    void runMemoryBandwidthTest() {
        std::cout << "\n=== Memory Bandwidth Test ===" << std::endl;
        
        // Test avec différentes tailles pour voir l'effet du cache
        std::vector<size_t> sizes = {1024, 4096, 16384, 65536, 262144, 1048576};
        
        std::cout << std::left << std::setw(15) << "Size (floats)"
                  << std::right << std::setw(15) << "Bandwidth (GB/s)" << std::endl;
        std::cout << std::string(30, '-') << std::endl;
        
        for (size_t size : sizes) {
            std::vector<float> src(size);
            std::vector<float> dst(size);
            
            // Remplir avec des données aléatoires
            for (size_t i = 0; i < size; ++i) {
                src[i] = static_cast<float>(rand()) / RAND_MAX;
            }
            
            // Mesurer le temps de copie avec SIMD
            auto time = measureTime([&]() {
                SIMDMathOptimized::add(dst.data(), src.data(), src.data(), size);
            }, 1000);
            
            // Calculer la bande passante (2 lectures + 1 écriture)
            double bytesTransferred = size * sizeof(float) * 3;
            double bandwidth = (bytesTransferred / time) / 1e6; // MB/s -> GB/s
            
            std::cout << std::left << std::setw(15) << size
                      << std::right << std::setw(15) << std::fixed 
                      << std::setprecision(2) << bandwidth << std::endl;
        }
    }
};

int main(int argc, char* argv[]) {
    size_t dataSize = 100000;
    if (argc > 1) {
        dataSize = std::atoi(argv[1]);
    }
    
    SIMDOptimizationBenchmark benchmark(dataSize);
    benchmark.runAllBenchmarks();
    benchmark.runMemoryBandwidthTest();
    
    return 0;
}