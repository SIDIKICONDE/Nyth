#include "../../shared/Audio/core/CoreConstants.hpp"
#include <cassert>
#include <cmath>
#include <iostream>

using namespace AudioEqualizer;

int main() {
    std::cout << "🧪 Testing CoreConstants.hpp...\n";

    // Test constantes mathématiques
    assert(std::abs(PI - 3.14159265358979323846) < 1e-10);
    assert(std::abs(TWO_PI - (2.0 * PI)) < 1e-10);
    std::cout << "✅ Mathematical constants OK\n";

    // Test sample rates
    assert(DEFAULT_SAMPLE_RATE == 48000);
    assert(SAMPLE_RATE_44100 == 44100);
    assert(SAMPLE_RATE_48000 == 48000);
    std::cout << "✅ Sample rates OK\n";

    // Test equalizer bands
    assert(NUM_BANDS == 10);
    assert(MAX_BANDS == 31);
    assert(MAX_BANDS > NUM_BANDS);
    std::cout << "✅ Equalizer bands OK\n";

    // Test Q factor ranges
    assert(MIN_Q == 0.1);
    assert(MAX_Q == 10.0);
    assert(DEFAULT_Q == 0.707);
    assert(DEFAULT_Q >= MIN_Q && DEFAULT_Q <= MAX_Q);
    std::cout << "✅ Q factor ranges OK\n";

    // Test gain ranges
    assert(MIN_GAIN_DB == -24.0);
    assert(MAX_GAIN_DB == 24.0);
    assert(DEFAULT_GAIN_DB == 0.0);
    assert(DEFAULT_GAIN_DB >= MIN_GAIN_DB && DEFAULT_GAIN_DB <= MAX_GAIN_DB);
    std::cout << "✅ Gain ranges OK\n";

    // Test EqualizerConstants namespace
    using namespace EqualizerConstants;
    assert(DEFAULT_MASTER_GAIN == 1.0);
    assert(ZERO_GAIN == 0.0);
    assert(ACTIVE_GAIN_THRESHOLD == 0.01);
    assert(OPTIMAL_BLOCK_SIZE == 2048);
    std::cout << "✅ EqualizerConstants namespace OK\n";

    // Test BiquadConstants namespace  
    using namespace BiquadConstants;
    assert(DEFAULT_A0 == 1.0);
    assert(DEFAULT_COEFFICIENT == 0.0);
    assert(UNITY_COEFFICIENT == 1.0);
    assert(PROCESSING_BLOCK_SIZE == 64);
    assert(UNROLL_FACTOR_BIQUAD == 4);
    std::cout << "✅ BiquadConstants namespace OK\n";

    // Test fréquences par défaut
    assert(sizeof(DEFAULT_FREQUENCIES)/sizeof(DEFAULT_FREQUENCIES[0]) == NUM_BANDS);
    assert(DEFAULT_FREQUENCIES[0] == 31.25);  // Sub-bass
    assert(DEFAULT_FREQUENCIES[9] == 16000.0); // Air
    // Vérifier que les fréquences sont croissantes
    for (size_t i = 1; i < NUM_BANDS; i++) {
        assert(DEFAULT_FREQUENCIES[i] > DEFAULT_FREQUENCIES[i-1]);
    }
    std::cout << "✅ Default frequencies OK\n";

    // Test constantes de performance
    assert(EPSILON == 1e-10);
    assert(DENORMAL_THRESHOLD == 1e-15);
    assert(DENORMAL_THRESHOLD < EPSILON);
    std::cout << "✅ Performance constants OK\n";

    // Test presets gains
    using namespace PresetGains;
    assert(ROCK.size() == NUM_BANDS);
    assert(POP.size() == NUM_BANDS);
    assert(JAZZ.size() == NUM_BANDS);
    assert(CLASSICAL.size() == NUM_BANDS);
    std::cout << "✅ Preset gains arrays OK\n";

    // Test consteval functions
    static_assert(compute_pi() == PI);
    static_assert(compute_two_pi() == TWO_PI);
    static_assert(compute_max_channels() == 32);
    static_assert(compute_max_bands() == MAX_BANDS);
    std::cout << "✅ Consteval functions OK\n";

    std::cout << "🎉 CoreConstants.hpp - ALL TESTS PASSED!\n\n";
    return 0;
}
