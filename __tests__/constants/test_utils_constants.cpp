#include "../../shared/Audio/utils/utilsConstants.hpp"
#include <cassert>
#include <cmath>
#include <iostream>

using namespace AudioUtils::UtilsConstants;

int main() {
    std::cout << "🧪 Testing utilsConstants.hpp...\n";

    // Test configuration du buffer audio
    assert(MAX_CHANNELS == 2);
    assert(MAX_SAMPLES == 4096);
    assert(MIN_CHANNELS == 1);
    assert(DEFAULT_BUFFER_SIZE == 1024);
    assert(INVALID_BUFFER_SIZE == 0);
    
    // Test puissances de 2
    assert((MAX_SAMPLES & (MAX_SAMPLES - 1)) == 0); // Puissance de 2
    assert((DEFAULT_BUFFER_SIZE & (DEFAULT_BUFFER_SIZE - 1)) == 0); // Puissance de 2
    assert(MAX_CHANNELS > MIN_CHANNELS);
    std::cout << "✅ Buffer configuration OK\n";

    // Test alignement SIMD
    assert(SIMD_ALIGNMENT_BYTES == 16);
    assert(SIMD_ALIGNMENT_FLOATS == 4);
    assert(SIMD_ALIGNMENT_MASK == 3);
    assert(SIMD_BLOCK_SIZE == 4);
    
    // Test cohérence SIMD
    assert(SIMD_ALIGNMENT_BYTES / sizeof(float) == SIMD_ALIGNMENT_FLOATS);
    assert(SIMD_ALIGNMENT_FLOATS == SIMD_BLOCK_SIZE);
    assert(SIMD_ALIGNMENT_MASK == SIMD_ALIGNMENT_FLOATS - 1);
    std::cout << "✅ SIMD alignment OK\n";

    // Test valeurs d'initialisation
    assert(ZERO_FLOAT == 0.0f);
    assert(ZERO_DOUBLE == 0.0);
    assert(UNITY_GAIN == 1.0f);
    assert(ZERO_INDEX == 0);
    assert(ZERO_SAMPLES == 0);
    std::cout << "✅ Initialization values OK\n";

    // Test indices SIMD
    assert(SIMD_LANE_0 == 0);
    assert(SIMD_LANE_1 == 1);
    assert(SIMD_LANE_2 == 2);
    assert(SIMD_LANE_3 == 3);
    
    // Test séquence des lanes
    assert(SIMD_LANE_1 == SIMD_LANE_0 + 1);
    assert(SIMD_LANE_2 == SIMD_LANE_1 + 1);
    assert(SIMD_LANE_3 == SIMD_LANE_2 + 1);
    std::cout << "✅ SIMD indices OK\n";

    // Test indices pour calculs
    assert(FIRST_CHANNEL == 0);
    assert(FIRST_SAMPLE == 0);
    assert(SECOND_CHANNEL == 1);
    assert(SECOND_CHANNEL == FIRST_CHANNEL + 1);
    std::cout << "✅ Calculation indices OK\n";

    // Test limites de validation
    assert(MIN_SAMPLES_PER_BUFFER == 1);
    assert(MAX_SAMPLES_PER_BUFFER == MAX_SAMPLES);
    assert(MIN_GAIN_VALUE == 0.0f);
    assert(MAX_GAIN_VALUE == 10.0f);
    assert(MAX_GAIN_VALUE > MIN_GAIN_VALUE);
    assert(UNITY_GAIN >= MIN_GAIN_VALUE && UNITY_GAIN <= MAX_GAIN_VALUE);
    std::cout << "✅ Validation limits OK\n";

    // Test constantes mathématiques pour buffers
    assert(EPSILON_FLOAT == 1e-7f);
    assert(EPSILON_DOUBLE == 1e-15);
    assert(MIN_MAGNITUDE == 1e-9f);
    assert(MAX_DB_VALUE == 120.0f);
    assert(MIN_DB_VALUE == -120.0f);
    
    // Test ordre des epsilons
    assert(EPSILON_DOUBLE < EPSILON_FLOAT);
    assert(MIN_MAGNITUDE > EPSILON_FLOAT); // 1e-6 > 1e-7 = correct
    assert(std::abs(MIN_DB_VALUE) == MAX_DB_VALUE);
    std::cout << "✅ Mathematical constants OK\n";

    // Test constantes de conversion
    assert(DB_TO_LINEAR_FACTOR == 20.0f);
    assert(LINEAR_TO_DB_FACTOR == 20.0f);
    assert(LOG10_BASE == 10.0f);
    assert(SQRT_2 == 1.4142135623730951f);
    assert(INV_SQRT_2 == 0.7071067811865476f);
    
    // Test cohérence mathématique
    assert(std::abs(SQRT_2 * INV_SQRT_2 - 1.0f) < 1e-6f);
    assert(std::abs(SQRT_2 - std::sqrt(2.0f)) < 1e-6f);
    std::cout << "✅ Conversion constants OK\n";

    // Test constantes de performance
    assert(CACHE_LINE_SIZE == 64);
    assert(PREFETCH_DISTANCE == 64);
    assert(UNROLL_FACTOR == 4);
    assert(MIN_SIZE_FOR_SIMD == 4);
    
    // Test cohérence performance
    assert(UNROLL_FACTOR == SIMD_BLOCK_SIZE);
    assert(MIN_SIZE_FOR_SIMD == SIMD_BLOCK_SIZE);
    assert(CACHE_LINE_SIZE == PREFETCH_DISTANCE);
    std::cout << "✅ Performance constants OK\n";

    // Test constantes temporelles
    assert(SAMPLE_RATE_44100 == 44100.0);
    assert(SAMPLE_RATE_48000 == 48000.0);
    assert(SAMPLE_RATE_96000 == 96000.0);
    assert(MS_TO_SAMPLES_AT_44100 == 44.1);
    assert(MS_TO_SAMPLES_AT_48000 == 48.0);
    
    // Test ordre croissant des sample rates
    assert(SAMPLE_RATE_48000 > SAMPLE_RATE_44100);
    assert(SAMPLE_RATE_96000 > SAMPLE_RATE_48000);
    
    // Test conversion ms vers échantillons
    assert(std::abs(MS_TO_SAMPLES_AT_44100 - SAMPLE_RATE_44100/1000.0) < 0.1);
    assert(std::abs(MS_TO_SAMPLES_AT_48000 - SAMPLE_RATE_48000/1000.0) < 0.1);
    std::cout << "✅ Temporal constants OK\n";

    // Test constantes de validation C++20
    assert(MAX_STACK_BUFFER_SIZE == 8192);
    assert(SPAN_SAFETY_MARGIN == 1);
    assert(MAX_STACK_BUFFER_SIZE > MAX_SAMPLES);
    std::cout << "✅ C++20 validation constants OK\n";

    // Test des fonctions consteval (compile-time)
    using namespace AudioUtils;
    static_assert(compute_max_channels() == MAX_CHANNELS);
    static_assert(compute_max_samples() == MAX_SAMPLES);
    static_assert(compute_simd_alignment() == SIMD_ALIGNMENT_BYTES);
    static_assert(compute_default_buffer_size() == DEFAULT_BUFFER_SIZE);
    std::cout << "✅ Consteval functions OK\n";

    std::cout << "🎉 utilsConstants.hpp - ALL TESTS PASSED!\n\n";
    return 0;
}
