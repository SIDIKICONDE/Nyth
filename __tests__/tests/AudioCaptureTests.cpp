#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include "../shared/Audio/capture/AudioCapture.hpp"
#include "../shared/Audio/capture/AudioCaptureException.hpp"
#include "../shared/Audio/capture/AudioCaptureMetrics.hpp"
#include "../shared/Audio/capture/AudioCaptureSIMD.hpp"
#include "../shared/Audio/capture/AudioCaptureUtils.hpp"
#include "../shared/Audio/capture/AudioFileWriter.hpp"
#include <thread>
#include <chrono>
#include <random>
#include <numeric>
#include <cmath>

using namespace Nyth::Audio;
using namespace testing;
using namespace std::chrono_literals;

// ============================================================================
// Tests de Configuration et Validation
// ============================================================================

class AudioCaptureConfigTest : public Test {
protected:
    AudioCaptureConfig config;
};

TEST_F(AudioCaptureConfigTest, DefaultConfigIsValid) {
    EXPECT_NO_THROW(AudioConfigValidator::validateConfig(config));
    EXPECT_EQ(config.sampleRate, 44100);
    EXPECT_EQ(config.channelCount, 1);
    EXPECT_EQ(config.bitsPerSample, 16);
}

TEST_F(AudioCaptureConfigTest, ValidSampleRates) {
    const int validRates[] = {8000, 11025, 16000, 22050, 44100, 48000, 88200, 96000};
    
    for (int rate : validRates) {
        config.sampleRate = rate;
        EXPECT_NO_THROW(AudioConfigValidator::validateSampleRate(rate))
            << "Sample rate " << rate << " should be valid";
    }
}

TEST_F(AudioCaptureConfigTest, InvalidSampleRateThrows) {
    config.sampleRate = 12345; // Invalid rate
    EXPECT_THROW(AudioConfigValidator::validateConfig(config), 
                 InvalidConfigurationException);
}

TEST_F(AudioCaptureConfigTest, InvalidChannelCountThrows) {
    config.channelCount = 0;
    EXPECT_THROW(AudioConfigValidator::validateConfig(config), 
                 InvalidConfigurationException);
    
    config.channelCount = 9; // > 8
    EXPECT_THROW(AudioConfigValidator::validateConfig(config), 
                 InvalidConfigurationException);
}

TEST_F(AudioCaptureConfigTest, InvalidBitsPerSampleThrows) {
    config.bitsPerSample = 12; // Not 8, 16, 24, or 32
    EXPECT_THROW(AudioConfigValidator::validateConfig(config), 
                 InvalidConfigurationException);
}

TEST_F(AudioCaptureConfigTest, BufferSizeMustBePowerOfTwo) {
    config.bufferSizeFrames = 1000; // Not power of 2
    EXPECT_THROW(AudioConfigValidator::validateConfig(config), 
                 InvalidConfigurationException);
    
    config.bufferSizeFrames = 1024; // Power of 2
    EXPECT_NO_THROW(AudioConfigValidator::validateConfig(config));
}

// ============================================================================
// Tests des Exceptions
// ============================================================================

TEST(AudioExceptionTest, ExceptionContainsCorrectInfo) {
    AudioException ex(AudioErrorType::DeviceNotFound, "Test device error", 404);
    
    EXPECT_EQ(ex.getType(), AudioErrorType::DeviceNotFound);
    EXPECT_STREQ(ex.what(), "Test device error");
    EXPECT_EQ(ex.getErrorCode(), 404);
    EXPECT_FALSE(ex.getFullDescription().empty());
}

TEST(AudioExceptionTest, SpecificExceptionTypes) {
    DeviceNotFoundException deviceEx("device123");
    EXPECT_EQ(deviceEx.getType(), AudioErrorType::DeviceNotFound);
    EXPECT_THAT(deviceEx.what(), HasSubstr("device123"));
    
    PermissionDeniedException permEx;
    EXPECT_EQ(permEx.getType(), AudioErrorType::PermissionDenied);
    
    BufferOverflowException bufferEx(1024, 2048);
    EXPECT_EQ(bufferEx.getType(), AudioErrorType::BufferOverflow);
    EXPECT_THAT(bufferEx.what(), HasSubstr("2048"));
    EXPECT_THAT(bufferEx.what(), HasSubstr("1024"));
}

// ============================================================================
// Tests des Utilitaires Audio
// ============================================================================

class AudioUtilsTest : public Test {
protected:
    std::vector<float> generateSineWave(size_t samples, float frequency = 440.0f, 
                                        float sampleRate = 44100.0f) {
        std::vector<float> wave(samples);
        for (size_t i = 0; i < samples; ++i) {
            wave[i] = std::sin(2.0f * M_PI * frequency * i / sampleRate);
        }
        return wave;
    }
    
    std::vector<float> generateNoise(size_t samples) {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
        
        std::vector<float> noise(samples);
        for (size_t i = 0; i < samples; ++i) {
            noise[i] = dist(gen);
        }
        return noise;
    }
};

TEST_F(AudioUtilsTest, Int16ToFloatConversion) {
    std::vector<int16_t> int16Data = {0, 16384, -16384, 32767, -32768};
    std::vector<float> floatData(int16Data.size());
    
    AudioFormatConverter::int16ToFloat(int16Data.data(), floatData.data(), int16Data.size());
    
    EXPECT_NEAR(floatData[0], 0.0f, 0.0001f);
    EXPECT_NEAR(floatData[1], 0.5f, 0.0001f);
    EXPECT_NEAR(floatData[2], -0.5f, 0.0001f);
    EXPECT_NEAR(floatData[3], 1.0f, 0.0001f);
    EXPECT_NEAR(floatData[4], -1.0f, 0.0001f);
}

TEST_F(AudioUtilsTest, FloatToInt16Conversion) {
    std::vector<float> floatData = {0.0f, 0.5f, -0.5f, 1.0f, -1.0f, 1.5f, -1.5f};
    std::vector<int16_t> int16Data(floatData.size());
    
    AudioFormatConverter::floatToInt16(floatData.data(), int16Data.data(), floatData.size());
    
    EXPECT_EQ(int16Data[0], 0);
    EXPECT_NEAR(int16Data[1], 16383, 1);
    EXPECT_NEAR(int16Data[2], -16383, 1);
    EXPECT_EQ(int16Data[3], 32767);
    EXPECT_EQ(int16Data[4], -32768);
    EXPECT_EQ(int16Data[5], 32767); // Clipped
    EXPECT_EQ(int16Data[6], -32768); // Clipped
}

TEST_F(AudioUtilsTest, MonoToStereoConversion) {
    std::vector<float> mono = {0.1f, 0.2f, 0.3f, 0.4f};
    std::vector<float> stereo(mono.size() * 2);
    
    AudioFormatConverter::monoToStereo(mono.data(), stereo.data(), mono.size());
    
    for (size_t i = 0; i < mono.size(); ++i) {
        EXPECT_FLOAT_EQ(stereo[i * 2], mono[i]);     // Left
        EXPECT_FLOAT_EQ(stereo[i * 2 + 1], mono[i]); // Right
    }
}

TEST_F(AudioUtilsTest, StereoToMonoConversion) {
    std::vector<float> stereo = {0.2f, 0.4f, 0.6f, 0.8f}; // L, R, L, R
    std::vector<float> mono(stereo.size() / 2);
    
    AudioFormatConverter::stereoToMono(stereo.data(), mono.data(), mono.size());
    
    EXPECT_FLOAT_EQ(mono[0], 0.3f); // (0.2 + 0.4) / 2
    EXPECT_FLOAT_EQ(mono[1], 0.7f); // (0.6 + 0.8) / 2
}

// ============================================================================
// Tests d'Analyse Audio
// ============================================================================

TEST_F(AudioUtilsTest, RMSCalculation) {
    // Test avec signal constant
    std::vector<float> constant(1000, 0.5f);
    float rms = AudioAnalyzer::calculateRMS(constant.data(), constant.size());
    EXPECT_NEAR(rms, 0.5f, 0.001f);
    
    // Test avec silence
    std::vector<float> silence(1000, 0.0f);
    rms = AudioAnalyzer::calculateRMS(silence.data(), silence.size());
    EXPECT_FLOAT_EQ(rms, 0.0f);
    
    // Test avec onde sinusoïdale
    auto sine = generateSineWave(44100);
    rms = AudioAnalyzer::calculateRMS(sine.data(), sine.size());
    EXPECT_NEAR(rms, 0.707f, 0.01f); // RMS d'une sinusoïde = amplitude / sqrt(2)
}

TEST_F(AudioUtilsTest, PeakDetection) {
    std::vector<float> data = {0.1f, -0.5f, 0.3f, -0.8f, 0.9f, -0.2f};
    float peak = AudioAnalyzer::calculatePeak(data.data(), data.size());
    EXPECT_FLOAT_EQ(peak, 0.9f);
}

TEST_F(AudioUtilsTest, SilenceDetection) {
    std::vector<float> silence(1000, 0.0f);
    EXPECT_TRUE(AudioAnalyzer::isSilent(silence.data(), silence.size()));
    
    std::vector<float> quiet(1000, 0.0005f);
    EXPECT_TRUE(AudioAnalyzer::isSilent(quiet.data(), quiet.size(), 0.001f));
    EXPECT_FALSE(AudioAnalyzer::isSilent(quiet.data(), quiet.size(), 0.0001f));
    
    auto noise = generateNoise(1000);
    EXPECT_FALSE(AudioAnalyzer::isSilent(noise.data(), noise.size()));
}

TEST_F(AudioUtilsTest, ClippingDetection) {
    std::vector<float> clean = {0.1f, 0.5f, 0.8f, -0.7f, 0.3f};
    EXPECT_FALSE(AudioAnalyzer::hasClipping(clean.data(), clean.size()));
    
    std::vector<float> clipped = {0.1f, 0.99f, 0.8f, -1.0f, 0.3f};
    EXPECT_TRUE(AudioAnalyzer::hasClipping(clipped.data(), clipped.size()));
    EXPECT_EQ(AudioAnalyzer::countClippedSamples(clipped.data(), clipped.size()), 2);
}

TEST_F(AudioUtilsTest, Normalization) {
    std::vector<float> data = {0.1f, 0.2f, 0.5f, -0.3f, 0.4f};
    AudioAnalyzer::normalize(data.data(), data.size(), 0.95f);
    
    float peak = AudioAnalyzer::calculatePeak(data.data(), data.size());
    EXPECT_NEAR(peak, 0.95f, 0.001f);
}

// ============================================================================
// Tests du Buffer Circulaire
// ============================================================================

TEST(CircularBufferTest, BasicOperations) {
    CircularBuffer<float> buffer(100);
    
    EXPECT_TRUE(buffer.empty());
    EXPECT_EQ(buffer.available(), 0);
    EXPECT_EQ(buffer.capacity(), 100);
    
    float writeData[] = {1.0f, 2.0f, 3.0f, 4.0f, 5.0f};
    size_t written = buffer.write(writeData, 5);
    EXPECT_EQ(written, 5);
    EXPECT_EQ(buffer.available(), 5);
    EXPECT_FALSE(buffer.empty());
    
    float readData[3];
    size_t read = buffer.read(readData, 3);
    EXPECT_EQ(read, 3);
    EXPECT_EQ(buffer.available(), 2);
    EXPECT_FLOAT_EQ(readData[0], 1.0f);
    EXPECT_FLOAT_EQ(readData[1], 2.0f);
    EXPECT_FLOAT_EQ(readData[2], 3.0f);
}

TEST(CircularBufferTest, Wraparound) {
    CircularBuffer<float> buffer(5);
    
    float data1[] = {1.0f, 2.0f, 3.0f, 4.0f};
    buffer.write(data1, 4);
    
    float readData[2];
    buffer.read(readData, 2);
    
    float data2[] = {5.0f, 6.0f, 7.0f};
    size_t written = buffer.write(data2, 3);
    EXPECT_EQ(written, 3);
    EXPECT_EQ(buffer.available(), 5);
    
    float allData[5];
    buffer.peek(allData, 5);
    EXPECT_FLOAT_EQ(allData[0], 3.0f);
    EXPECT_FLOAT_EQ(allData[4], 7.0f);
}

TEST(CircularBufferTest, ThreadSafety) {
    CircularBuffer<int> buffer(1000);
    std::atomic<bool> stop{false};
    std::atomic<int> totalWritten{0};
    std::atomic<int> totalRead{0};
    
    // Thread d'écriture
    std::thread writer([&]() {
        int value = 0;
        while (!stop) {
            int data[10];
            for (int i = 0; i < 10; ++i) {
                data[i] = value++;
            }
            size_t written = buffer.write(data, 10);
            totalWritten += written;
            std::this_thread::sleep_for(1ms);
        }
    });
    
    // Thread de lecture
    std::thread reader([&]() {
        while (!stop) {
            int data[5];
            size_t read = buffer.read(data, 5);
            totalRead += read;
            std::this_thread::sleep_for(2ms);
        }
    });
    
    std::this_thread::sleep_for(100ms);
    stop = true;
    
    writer.join();
    reader.join();
    
    // Vérifier la cohérence
    EXPECT_GE(totalWritten.load(), totalRead.load());
    EXPECT_EQ(buffer.available(), totalWritten.load() - totalRead.load());
}

// ============================================================================
// Tests SIMD
// ============================================================================

class AudioSIMDTest : public AudioUtilsTest {};

TEST_F(AudioSIMDTest, SIMDConversionMatchesScalar) {
    const size_t testSize = 1000;
    std::vector<int16_t> int16Data(testSize);
    std::vector<float> floatScalar(testSize);
    std::vector<float> floatSIMD(testSize);
    
    // Générer des données de test
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<int16_t> dist(-32768, 32767);
    for (size_t i = 0; i < testSize; ++i) {
        int16Data[i] = dist(gen);
    }
    
    // Conversion scalaire
    AudioFormatConverter::int16ToFloat(int16Data.data(), floatScalar.data(), testSize);
    
    // Conversion SIMD
    SIMD::AudioFormatConverterSIMD::int16ToFloat_Optimized(
        int16Data.data(), floatSIMD.data(), testSize);
    
    // Comparer les résultats
    for (size_t i = 0; i < testSize; ++i) {
        EXPECT_NEAR(floatScalar[i], floatSIMD[i], 0.00001f)
            << "Mismatch at index " << i;
    }
}

TEST_F(AudioSIMDTest, SIMDRMSMatchesScalar) {
    auto sine = generateSineWave(10000);
    
    float rmsScalar = AudioAnalyzer::calculateRMS(sine.data(), sine.size());
    float rmsSIMD = SIMD::AudioAnalyzerSIMD::calculateRMS_Optimized(sine.data(), sine.size());
    
    EXPECT_NEAR(rmsScalar, rmsSIMD, 0.0001f);
}

TEST_F(AudioSIMDTest, SIMDPeakMatchesScalar) {
    auto noise = generateNoise(10000);
    
    float peakScalar = AudioAnalyzer::calculatePeak(noise.data(), noise.size());
    float peakSIMD = SIMD::AudioAnalyzerSIMD::calculatePeak_Optimized(noise.data(), noise.size());
    
    EXPECT_FLOAT_EQ(peakScalar, peakSIMD);
}

TEST_F(AudioSIMDTest, SIMDClippingDetectionMatchesScalar) {
    std::vector<float> data(1000);
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<float> dist(-1.2f, 1.2f);
    
    for (size_t i = 0; i < data.size(); ++i) {
        data[i] = dist(gen);
    }
    
    size_t clippedScalar = AudioAnalyzer::countClippedSamples(data.data(), data.size());
    size_t clippedSIMD = SIMD::AudioAnalyzerSIMD::countClippedSamples_Optimized(
        data.data(), data.size());
    
    EXPECT_EQ(clippedScalar, clippedSIMD);
}

// ============================================================================
// Tests de Métriques et Monitoring
// ============================================================================

TEST(AudioMetricsTest, RealtimeMetricsUpdate) {
    AudioMetricsCollector collector;
    collector.startCollection();
    
    // Simuler des mises à jour
    collector.updateLatency(5.2f);
    collector.updateLatency(4.8f);
    collector.updateLatency(5.5f);
    
    auto metrics = collector.getRealtimeMetrics();
    EXPECT_FLOAT_EQ(metrics.inputLatencyMs, 5.5f);
    
    collector.reportXRun();
    collector.reportXRun();
    EXPECT_EQ(collector.getRealtimeMetrics().xruns, 2);
    
    collector.reportDroppedFrames(10);
    EXPECT_EQ(collector.getRealtimeMetrics().droppedFrames, 10);
}

TEST(AudioMetricsTest, DetailedStatistics) {
    AudioMetricsCollector collector;
    collector.startCollection();
    
    // Ajouter plusieurs échantillons de latence
    for (int i = 0; i < 100; ++i) {
        float latency = 4.0f + (i % 10) * 0.5f;
        collector.updateLatency(latency);
        std::this_thread::sleep_for(1ms);
    }
    
    auto stats = collector.getDetailedStatistics();
    EXPECT_GE(stats.minLatencyMs, 4.0f);
    EXPECT_LE(stats.maxLatencyMs, 9.0f);
    EXPECT_GT(stats.avgLatencyMs, 0.0f);
    EXPECT_GT(stats.p95LatencyMs, stats.p50LatencyMs);
}

TEST(AudioMetricsTest, MetricHistory) {
    MetricHistory<float> history(10, std::chrono::seconds(1));
    
    for (int i = 0; i < 15; ++i) {
        history.add(static_cast<float>(i));
    }
    
    auto last5 = history.getLastN(5);
    EXPECT_EQ(last5.size(), 5);
    EXPECT_FLOAT_EQ(last5[0], 10.0f);
    EXPECT_FLOAT_EQ(last5[4], 14.0f);
}

TEST(AudioMetricsTest, Profiler) {
    AudioProfiler profiler;
    
    // Profiler plusieurs fonctions
    for (int i = 0; i < 10; ++i) {
        {
            auto timer = profiler.measure("function1");
            std::this_thread::sleep_for(1ms);
        }
        
        {
            auto timer = profiler.measure("function2");
            std::this_thread::sleep_for(2ms);
        }
    }
    
    std::string report = profiler.getReport();
    EXPECT_THAT(report, HasSubstr("function1"));
    EXPECT_THAT(report, HasSubstr("function2"));
    EXPECT_THAT(report, HasSubstr("Calls: 10"));
}

// ============================================================================
// Tests du Pool de Buffers
// ============================================================================

TEST(AudioBufferPoolTest, AcquireAndRelease) {
    AudioBufferPool pool(1024, 3);
    
    EXPECT_EQ(pool.availableBuffers(), 3);
    
    float* buffer1 = pool.acquire();
    EXPECT_NE(buffer1, nullptr);
    EXPECT_EQ(pool.availableBuffers(), 2);
    
    float* buffer2 = pool.acquire();
    float* buffer3 = pool.acquire();
    EXPECT_EQ(pool.availableBuffers(), 0);
    
    float* buffer4 = pool.acquire();
    EXPECT_EQ(buffer4, nullptr); // Pool épuisé
    
    pool.release(buffer1);
    EXPECT_EQ(pool.availableBuffers(), 1);
    
    float* buffer5 = pool.acquire();
    EXPECT_EQ(buffer5, buffer1); // Réutilisation du buffer
}

// ============================================================================
// Tests du Timer Audio
// ============================================================================

TEST(AudioTimerTest, BasicTiming) {
    AudioTimer timer;
    
    EXPECT_FALSE(timer.isRunning());
    
    timer.start();
    EXPECT_TRUE(timer.isRunning());
    
    std::this_thread::sleep_for(50ms);
    
    int64_t elapsed = timer.elapsedMs();
    EXPECT_GE(elapsed, 45); // Tolérance pour les imprécisions
    EXPECT_LE(elapsed, 55);
    
    timer.stop();
    EXPECT_FALSE(timer.isRunning());
}

TEST(AudioTimerTest, FrameTimeConversion) {
    EXPECT_EQ(AudioTimer::framesToMs(44100, 44100), 1000);
    EXPECT_EQ(AudioTimer::framesToMs(48000, 48000), 1000);
    EXPECT_EQ(AudioTimer::msToFrames(1000, 44100), 44100);
    EXPECT_EQ(AudioTimer::msToFrames(100, 48000), 4800);
}

// ============================================================================
// Tests d'Intégration
// ============================================================================

class AudioCaptureIntegrationTest : public Test {
protected:
    class MockAudioCapture : public AudioCaptureBase {
    public:
        bool initialize(const AudioCaptureConfig& config) override {
            try {
                AudioConfigValidator::validateConfig(config);
                config_ = config;
                setState(CaptureState::Initialized);
                return true;
            } catch (const AudioException& e) {
                reportError(e.what());
                return false;
            }
        }
        
        bool start() override {
            if (state_ != CaptureState::Initialized && state_ != CaptureState::Stopped) {
                return false;
            }
            setState(CaptureState::Running);
            return true;
        }
        
        bool pause() override {
            if (state_ != CaptureState::Running) return false;
            setState(CaptureState::Paused);
            return true;
        }
        
        bool resume() override {
            if (state_ != CaptureState::Paused) return false;
            setState(CaptureState::Running);
            return true;
        }
        
        bool stop() override {
            if (state_ != CaptureState::Running && state_ != CaptureState::Paused) {
                return false;
            }
            setState(CaptureState::Stopped);
            return true;
        }
        
        void release() override {
            setState(CaptureState::Uninitialized);
        }
        
        bool updateConfig(const AudioCaptureConfig& config) override {
            return initialize(config);
        }
        
        std::vector<AudioDeviceInfo> getAvailableDevices() const override {
            return {{"default", "Default Device", true, 2, {44100, 48000}}};
        }
        
        bool selectDevice(const std::string& deviceId) override {
            return deviceId == "default";
        }
        
        AudioDeviceInfo getCurrentDevice() const override {
            return {"default", "Default Device", true, 2, {44100, 48000}};
        }
        
        bool hasPermission() const override { return true; }
        
        void requestPermission(std::function<void(bool)> callback) override {
            if (callback) callback(true);
        }
        
        // Simuler la capture de données
        void simulateDataCapture(const float* data, size_t frameCount) {
            processAudioData(data, frameCount);
        }
    };
};

TEST_F(AudioCaptureIntegrationTest, StateTransitions) {
    MockAudioCapture capture;
    
    EXPECT_EQ(capture.getState(), CaptureState::Uninitialized);
    
    AudioCaptureConfig config;
    EXPECT_TRUE(capture.initialize(config));
    EXPECT_EQ(capture.getState(), CaptureState::Initialized);
    
    EXPECT_TRUE(capture.start());
    EXPECT_EQ(capture.getState(), CaptureState::Running);
    EXPECT_TRUE(capture.isCapturing());
    
    EXPECT_TRUE(capture.pause());
    EXPECT_EQ(capture.getState(), CaptureState::Paused);
    EXPECT_FALSE(capture.isCapturing());
    
    EXPECT_TRUE(capture.resume());
    EXPECT_EQ(capture.getState(), CaptureState::Running);
    
    EXPECT_TRUE(capture.stop());
    EXPECT_EQ(capture.getState(), CaptureState::Stopped);
    
    capture.release();
    EXPECT_EQ(capture.getState(), CaptureState::Uninitialized);
}

TEST_F(AudioCaptureIntegrationTest, DataCallbacks) {
    MockAudioCapture capture;
    AudioCaptureConfig config;
    capture.initialize(config);
    
    std::atomic<int> callbackCount{0};
    std::atomic<size_t> totalFrames{0};
    
    capture.setAudioDataCallback([&](const float* data, size_t frameCount, int channels) {
        callbackCount++;
        totalFrames += frameCount;
        EXPECT_EQ(channels, config.channelCount);
    });
    
    capture.start();
    
    // Simuler la capture
    std::vector<float> testData(1024);
    for (int i = 0; i < 10; ++i) {
        capture.simulateDataCapture(testData.data(), testData.size());
    }
    
    EXPECT_EQ(callbackCount.load(), 10);
    EXPECT_EQ(totalFrames.load(), 10240);
}

TEST_F(AudioCaptureIntegrationTest, ErrorHandling) {
    MockAudioCapture capture;
    
    std::string lastError;
    capture.setErrorCallback([&](const std::string& error) {
        lastError = error;
    });
    
    // Configuration invalide
    AudioCaptureConfig badConfig;
    badConfig.sampleRate = 12345; // Invalid
    
    EXPECT_FALSE(capture.initialize(badConfig));
    EXPECT_EQ(capture.getState(), CaptureState::Error);
    EXPECT_THAT(lastError, HasSubstr("Invalid sample rate"));
}

TEST_F(AudioCaptureIntegrationTest, LevelMonitoring) {
    MockAudioCapture capture;
    AudioCaptureConfig config;
    capture.initialize(config);
    capture.start();
    
    // Générer un signal avec niveau connu
    std::vector<float> testSignal(1024);
    for (size_t i = 0; i < testSignal.size(); ++i) {
        testSignal[i] = 0.5f * std::sin(2.0f * M_PI * 440.0f * i / 44100.0f);
    }
    
    capture.simulateDataCapture(testSignal.data(), testSignal.size());
    
    float currentLevel = capture.getCurrentLevel();
    float peakLevel = capture.getPeakLevel();
    
    EXPECT_GT(currentLevel, 0.0f);
    EXPECT_LE(currentLevel, 1.0f);
    EXPECT_NEAR(peakLevel, 0.5f, 0.01f);
    
    capture.resetPeakLevel();
    EXPECT_FLOAT_EQ(capture.getPeakLevel(), 0.0f);
}

// ============================================================================
// Main
// ============================================================================

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}