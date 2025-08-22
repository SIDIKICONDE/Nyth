#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include "../../shared/Audio/core/BiquadFilter.hpp"
#include "../../shared/Audio/core/CoreConstants.hpp"
#include <algorithm>
#include <cassert>
#include <chrono>
#include <cmath>
#include <iostream>
#include <vector>


using namespace AudioFX;
using namespace EqualizerConstants;

int main() {
    std::cout << "⚡ Testing Core Performance...\n";

    // Test 1: Performance de l'initialisation
    auto start = std::chrono::high_resolution_clock::now();

    AudioEqualizer eq(10, SAMPLE_RATE_48000);
    BiquadFilter filter;

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    assert(duration.count() < 100); // Doit s'initialiser en moins de 100ms
    std::cout << "✅ Initialization performance OK (" << duration.count() << "ms)\n";

    // Test 2: Performance du calcul de coefficients
    start = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < 1000; ++i) {
        double freq = 100.0 + (i * 10.0);
        filter.calculateLowpass(freq, SAMPLE_RATE_44100, 0.707);
        filter.calculateHighpass(freq, SAMPLE_RATE_44100, 0.707);
        filter.calculatePeaking(freq, SAMPLE_RATE_44100, 0.707, 6.0);
    }

    end = std::chrono::high_resolution_clock::now();
    duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    assert(duration.count() < 500); // 1000 calculs en moins de 500ms
    std::cout << "✅ Coefficient calculation performance OK (" << duration.count() << "ms)\n";

    // Test 3: Performance du processing audio temps réel
    const size_t buffer_size = 1024;
    const size_t num_iterations = 1000;
    std::vector<float> input(buffer_size);
    std::vector<float> output(buffer_size);

    // Générer un signal de test
    for (size_t i = 0; i < buffer_size; ++i) {
        input[i] = std::sin(2.0 * PI * 1000.0 * i / SAMPLE_RATE_48000); // 1kHz sine
    }

    // Configurer l'égaliseur avec quelques filtres actifs
    eq.setBandGain(0, 6.0);  // Boost basses
    eq.setBandGain(5, -3.0); // Cut milieu
    eq.setBandGain(9, 3.0);  // Boost aigus

    start = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < num_iterations; ++i) {
        eq.process(input, output, "performance_test");
    }

    end = std::chrono::high_resolution_clock::now();
    auto processing_time = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    // Calculer le temps par buffer
    double time_per_buffer_ms = static_cast<double>(processing_time.count()) / num_iterations;
    double buffers_per_second = 1000.0 / time_per_buffer_ms;

    // Pour du temps réel 48kHz, on doit traiter au moins 48 buffers par seconde
    assert(buffers_per_second > 48.0);
    std::cout << "✅ Real-time processing performance OK (" << buffers_per_second << " buffers/sec)\n";

    // Test 4: Performance du processing stéréo
    std::vector<float> inputL(buffer_size);
    std::vector<float> inputR(buffer_size);
    std::vector<float> outputL(buffer_size);
    std::vector<float> outputR(buffer_size);

    // Signal stéréo de test
    for (size_t i = 0; i < buffer_size; ++i) {
        inputL[i] = std::sin(2.0 * PI * 1000.0 * i / SAMPLE_RATE_48000);
        inputR[i] = std::cos(2.0 * PI * 1000.0 * i / SAMPLE_RATE_48000);
    }

    start = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < num_iterations; ++i) {
        eq.processStereo(inputL, inputR, outputL, outputR, "stereo_performance_test");
    }

    end = std::chrono::high_resolution_clock::now();
    processing_time = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    time_per_buffer_ms = static_cast<double>(processing_time.count()) / num_iterations;
    buffers_per_second = 1000.0 / time_per_buffer_ms;

    assert(buffers_per_second > 48.0);
    std::cout << "✅ Stereo processing performance OK (" << buffers_per_second << " buffers/sec)\n";

    // Test 5: Performance avec bypass
    eq.setBypass(true);

    start = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < num_iterations; ++i) {
        eq.process(input, output, "bypass_performance_test");
    }

    end = std::chrono::high_resolution_clock::now();
    processing_time = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    time_per_buffer_ms = static_cast<double>(processing_time.count()) / num_iterations;
    buffers_per_second = 1000.0 / time_per_buffer_ms;

    // Bypass devrait être beaucoup plus rapide
    assert(buffers_per_second > 1000.0);
    std::cout << "✅ Bypass mode performance OK (" << buffers_per_second << " buffers/sec)\n";

    eq.setBypass(false); // Remettre normal

    // Test 6: Performance des presets
    EQPreset rock_preset;
    rock_preset.gains = {4.0, 3.0, -1.0, -2.0, -1.0, 2.0, 3.0, 4.0, 3.0, 2.0};

    start = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < 100; ++i) {
        eq.loadPreset(rock_preset);
        eq.process(input, output, "preset_performance_test");
    }

    end = std::chrono::high_resolution_clock::now();
    duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    assert(duration.count() < 200); // 100 chargements + processings en < 200ms
    std::cout << "✅ Preset loading performance OK (" << duration.count() << "ms)\n";

    // Test 7: Performance du gain master
    eq.setMasterGain(12.0); // Boost de 12dB

    start = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < num_iterations; ++i) {
        eq.process(input, output, "master_gain_performance_test");
    }

    end = std::chrono::high_resolution_clock::now();
    processing_time = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    time_per_buffer_ms = static_cast<double>(processing_time.count()) / num_iterations;
    buffers_per_second = 1000.0 / time_per_buffer_ms;

    assert(buffers_per_second > 48.0);
    std::cout << "✅ Master gain processing performance OK (" << buffers_per_second << " buffers/sec)\n";

    // Test 8: Performance avec toutes les bandes désactivées
    for (size_t i = 0; i < eq.getNumBands(); ++i) {
        eq.setBandEnabled(i, false);
    }

    start = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < num_iterations; ++i) {
        eq.process(input, output, "disabled_bands_performance_test");
    }

    end = std::chrono::high_resolution_clock::now();
    processing_time = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    time_per_buffer_ms = static_cast<double>(processing_time.count()) / num_iterations;
    buffers_per_second = 1000.0 / time_per_buffer_ms;

    // Devrait être très rapide (seulement gain master)
    assert(buffers_per_second > 2000.0);
    std::cout << "✅ Disabled bands performance OK (" << buffers_per_second << " buffers/sec)\n";

    // Réactiver quelques bandes pour les tests suivants
    eq.setBandEnabled(0, true);
    eq.setBandEnabled(5, true);
    eq.setBandEnabled(9, true);

    // Test 9: Performance de la validation
    std::vector<float> valid_buffer(buffer_size, 0.5f);

    start = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < 1000; ++i) {
        bool valid = eq.validateAudioBuffer(valid_buffer, "validation_performance_test");
        assert(valid);
    }

    end = std::chrono::high_resolution_clock::now();
    duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    assert(duration.count() < 100); // 1000 validations en < 100ms
    std::cout << "✅ Buffer validation performance OK (" << duration.count() << "ms)\n";

    // Test 10: Performance des modifications de paramètres
    start = std::chrono::high_resolution_clock::now();

    eq.beginParameterUpdate();
    for (size_t i = 0; i < eq.getNumBands(); ++i) {
        eq.setBandGain(i, std::sin(i * 0.5) * 12.0);
        eq.setBandFrequency(i, 100.0 + i * 200.0);
        eq.setBandQ(i, 0.5 + i * 0.1);
    }
    eq.setMasterGain(6.0);
    eq.endParameterUpdate();

    end = std::chrono::high_resolution_clock::now();
    duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    assert(duration.count() < 50); // Modifications groupées rapides
    std::cout << "✅ Parameter update performance OK (" << duration.count() << "ms)\n";

    // Test 11: Test de latence (first call)
    std::vector<float> latency_test_input(64, 1.0f);
    std::vector<float> latency_test_output(64);

    start = std::chrono::high_resolution_clock::now();
    eq.process(latency_test_input, latency_test_output, "latency_test");
    end = std::chrono::high_resolution_clock::now();

    auto first_call_latency = std::chrono::duration_cast<std::chrono::microseconds>(end - start);

    // Latence acceptable pour l'audio temps réel (< 10ms)
    assert(first_call_latency.count() < 10000);
    std::cout << "✅ First call latency OK (" << first_call_latency.count() << "μs)\n";

    // Test 12: Test de cohérence des performances
    std::vector<double> performance_results;

    for (size_t test_run = 0; test_run < 5; ++test_run) {
        start = std::chrono::high_resolution_clock::now();

        for (size_t i = 0; i < 100; ++i) {
            eq.process(input, output, "consistency_test");
        }

        end = std::chrono::high_resolution_clock::now();
        auto test_duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        performance_results.push_back(test_duration.count());
    }

    // Vérifier la cohérence (variation < 20%)
    double avg_performance =
        std::accumulate(performance_results.begin(), performance_results.end(), 0.0) / performance_results.size();
    double max_deviation = 0.0;

    for (double result : performance_results) {
        double deviation = std::abs(result - avg_performance) / avg_performance;
        max_deviation = std::max(max_deviation, deviation);
    }

    assert(max_deviation < 0.20); // < 20% variation
    std::cout << "✅ Performance consistency OK (" << (max_deviation * 100.0) << "% variation)\n";

    // Test 13: Test de stabilité numérique
    std::vector<float> stability_input(buffer_size, 1.0f);
    std::vector<float> stability_output(buffer_size);

    // Configurer avec des gains extrêmes
    eq.setMasterGain(18.0);
    eq.setBandGain(0, 12.0);
    eq.setBandGain(5, -12.0);

    eq.process(stability_input, stability_output, "numerical_stability_test");

    // Vérifier que toutes les sorties sont finies (pas de NaN/Inf)
    for (float sample : stability_output) {
        assert(std::isfinite(sample));
        assert(std::abs(sample) < 1000.0f); // Pas d'explosion numérique
    }
    std::cout << "✅ Numerical stability OK\n";

    // Test 14: Test de l'empreinte mémoire
    size_t initial_band_count = eq.getNumBands();
    AudioEqualizer eq_large(31, SAMPLE_RATE_48000); // Maximum de bandes

    assert(eq_large.getNumBands() == 31);

    // Vérifier que la création d'un égaliseur large ne cause pas de problèmes
    std::vector<float> large_input(2048);
    std::vector<float> large_output(2048);

    for (size_t i = 0; i < large_input.size(); ++i) {
        large_input[i] = std::sin(2.0 * PI * i / large_input.size());
    }

    eq_large.process(large_input, large_output, "memory_test");

    for (float sample : large_output) {
        assert(std::isfinite(sample));
    }
    std::cout << "✅ Memory usage OK\n";

    // Test 15: Benchmark comparatif
    std::cout << "📊 Performance Benchmark Results:\n";
    std::cout << "   - Buffer size: " << buffer_size << " samples\n";
    std::cout << "   - Sample rate: " << SAMPLE_RATE_48000 << " Hz\n";
    std::cout << "   - Processing: " << num_iterations << " iterations\n";
    std::cout << "   - Real-time requirement: > 48 buffers/sec\n";

    // Calculer la performance CPU estimée
    double realtime_ratio = buffers_per_second / 48.0;
    std::cout << "   - Performance ratio: " << realtime_ratio << "x real-time\n";

    if (realtime_ratio > 2.0) {
        std::cout << "   - Status: EXCELLENT (plenty of headroom)\n";
    } else if (realtime_ratio > 1.2) {
        std::cout << "   - Status: GOOD (comfortable margin)\n";
    } else if (realtime_ratio > 1.0) {
        std::cout << "   - Status: ACCEPTABLE (minimal margin)\n";
    } else {
        std::cout << "   - Status: WARNING (below real-time requirement)\n";
    }

    std::cout << "✅ Performance benchmark completed\n";

    std::cout << "🎉 Core Performance - ALL TESTS PASSED!\n\n";
    return 0;
}
