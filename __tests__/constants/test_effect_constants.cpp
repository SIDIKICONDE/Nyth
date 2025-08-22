#include "../../shared/Audio/effects/EffectConstants.hpp"
#include <cassert>
#include <cmath>
#include <iostream>

using namespace AudioFX;

int main() {
    std::cout << "🧪 Testing EffectConstants.hpp...\n";

    // Test constantes audio de base
    assert(MINIMUM_SAMPLE_RATE == 8000);
    assert(DEFAULT_SAMPLE_RATE == 48000);
    assert(MIN_SAMPLE_RATE == 1);
    assert(DEFAULT_SAMPLE_RATE > MINIMUM_SAMPLE_RATE);
    std::cout << "✅ Basic audio constants OK\n";

    // Test canaux audio
    assert(MONO_CHANNELS == 1);
    assert(STEREO_CHANNELS == 2);
    assert(DEFAULT_CHANNELS == STEREO_CHANNELS);
    assert(STEREO_CHANNELS > MONO_CHANNELS);
    std::cout << "✅ Audio channels OK\n";

    // Test états par défaut
    assert(DEFAULT_ENABLED_STATE == true);
    assert(DEFAULT_ENABLED == true);
    assert(ZERO_SAMPLES == 0);
    std::cout << "✅ Default states OK\n";

    // Test constantes de buffer
    assert(DEFAULT_BUFFER_SIZE == 1024);
    assert(BUFFER_INIT_VALUE == 0.0f);
    assert(FIRST_EFFECT_INDEX == 0);
    assert(CHAIN_START_INDEX == 1);
    assert(CHAIN_START_INDEX > FIRST_EFFECT_INDEX);
    assert(REFERENCE_SAMPLE_RATE == 48000);
    std::cout << "✅ Buffer constants OK\n";

    // Test constantes Compressor
    assert(MIN_RATIO == 1.0);
    assert(MIN_TIME_MS == 0.1);
    assert(EPSILON_DB == 1e-12);
    assert(DB_CONVERSION_FACTOR == 20.0);
    assert(POWER_CONVERSION_BASE == 10.0);
    assert(STEREO_AVERAGE_FACTOR == 0.5);
    assert(UNROLL_BLOCK_SIZE == 4);
    assert(PREFETCH_DISTANCE == 16);
    assert(MS_TO_SECONDS_COMPRESSOR == 1000.0);
    assert(GAIN_ATTACK_FACTOR == 0.5);
    assert(MIN_GAIN_ATTACK_MS == 1.0);
    assert(MIN_GAIN_RELEASE_MS == 5.0);
    std::cout << "✅ Compressor constants OK\n";

    // Test valeurs par défaut Compressor
    assert(DEFAULT_THRESHOLD_DB == -18.0);
    assert(DEFAULT_RATIO == 3.0);
    assert(DEFAULT_ATTACK_MS == 10.0);
    assert(DEFAULT_RELEASE_MS == 80.0);
    assert(DEFAULT_MAKEUP_DB == 0.0);
    assert(DEFAULT_ENVELOPE == 0.0);
    assert(DEFAULT_GAIN == 1.0);
    
    // Test cohérence des valeurs par défaut
    assert(DEFAULT_RATIO >= MIN_RATIO);
    assert(DEFAULT_ATTACK_MS >= MIN_TIME_MS);
    assert(DEFAULT_RELEASE_MS >= MIN_TIME_MS);
    assert(DEFAULT_RELEASE_MS > DEFAULT_ATTACK_MS); // Release plus lent qu'attack
    std::cout << "✅ Compressor defaults OK\n";

    // Test coefficients par défaut
    assert(DEFAULT_ATTACK_COEFF == 0.9);
    assert(DEFAULT_RELEASE_COEFF == 0.99);
    assert(DEFAULT_GAIN_ATTACK_COEFF == 0.8);
    assert(DEFAULT_GAIN_RELEASE_COEFF == 0.98);
    
    // Test cohérence des coefficients (0 < coeff < 1)
    assert(DEFAULT_ATTACK_COEFF > 0.0 && DEFAULT_ATTACK_COEFF < 1.0);
    assert(DEFAULT_RELEASE_COEFF > 0.0 && DEFAULT_RELEASE_COEFF < 1.0);
    assert(DEFAULT_RELEASE_COEFF > DEFAULT_ATTACK_COEFF); // Release plus lent
    std::cout << "✅ Compressor coefficients OK\n";

    // Test constantes Delay
    assert(MIN_DELAY_VALUE == 0.0);
    assert(MAX_FEEDBACK == 0.95);
    assert(MIN_FEEDBACK == 0.0);
    assert(MIN_MIX == 0.0);
    assert(MAX_MIX == 1.0);
    assert(MIX_THRESHOLD == 0.0001);
    assert(MIX_INVERT_FACTOR == 1.0);
    assert(MS_TO_SECONDS_DELAY == 0.001);
    assert(MIN_DELAY_SAMPLES == 1);
    assert(MAX_DELAY_SECONDS == 4);
    assert(DEFAULT_INDEX == 0);
    
    // Test cohérence des ranges Delay
    assert(MAX_FEEDBACK < 1.0); // Évite l'instabilité
    assert(MIN_MIX <= MAX_MIX);
    std::cout << "✅ Delay constants OK\n";

    // Test valeurs par défaut Delay
    assert(DEFAULT_DELAY_MS == 150.0);
    assert(DEFAULT_FEEDBACK == 0.3);
    assert(DEFAULT_MIX == 0.25);
    
    // Test cohérence des valeurs par défaut Delay
    assert(DEFAULT_DELAY_MS >= MIN_DELAY_VALUE);
    assert(DEFAULT_FEEDBACK >= MIN_FEEDBACK && DEFAULT_FEEDBACK <= MAX_FEEDBACK);
    assert(DEFAULT_MIX >= MIN_MIX && DEFAULT_MIX <= MAX_MIX);
    std::cout << "✅ Delay defaults OK\n";

    // Test constantes utilitaires
    assert(std::abs(MAX_FLOAT - 3.40282347e+38) < 1e30);
    assert(std::abs(MIN_FLOAT - (-3.40282347e+38)) < 1e30);
    assert(std::abs(MIN_FLOAT) == MAX_FLOAT);
    std::cout << "✅ Utility constants OK\n";

    // Test conversion temporelle
    double conversionTest = 1000.0 * MS_TO_SECONDS_DELAY;
    assert(std::abs(conversionTest - 1.0) < 1e-9); // 1000ms * 0.001 = 1s
    std::cout << "✅ Time conversion OK\n";

    std::cout << "🎉 EffectConstants.hpp - ALL TESTS PASSED!\n\n";
    return 0;
}
