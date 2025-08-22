#include "../../shared/Audio/safety/SafetyContants.hpp"
#include <cassert>
#include <cmath>
#include <iostream>

using namespace AudioSafety::SafetyConstants;

int main() {
    std::cout << "🧪 Testing SafetyContants.hpp...\n";

    // Test configuration par défaut
    assert(DEFAULT_ENABLED == true);
    assert(DEFAULT_DC_REMOVAL_ENABLED == true);
    assert(DEFAULT_DC_THRESHOLD == 0.002);
    assert(DEFAULT_LIMITER_ENABLED == true);
    assert(DEFAULT_LIMITER_THRESHOLD_DB == -1.0);
    assert(DEFAULT_SOFT_KNEE_LIMITER == true);
    assert(DEFAULT_KNEE_WIDTH_DB == 6.0);
    assert(DEFAULT_FEEDBACK_DETECT_ENABLED == true);
    assert(DEFAULT_FEEDBACK_CORR_THRESHOLD == 0.95);
    std::cout << "✅ Default configuration OK\n";

    // Test valeurs d'initialisation
    assert(INITIAL_PEAK == 0.0);
    assert(INITIAL_RMS == 0.0);
    assert(INITIAL_DC_OFFSET == 0.0);
    assert(INITIAL_CLIPPED_SAMPLES == 0);
    assert(INITIAL_OVERLOAD_ACTIVE == false);
    assert(INITIAL_FEEDBACK_SCORE == 0.0);
    assert(INITIAL_HAS_NAN == false);
    assert(INITIAL_FEEDBACK_LIKELY == false);
    std::cout << "✅ Initialization values OK\n";

    // Test constantes de conversion dB
    assert(DB_TO_LINEAR_BASE == 10.0);
    assert(DB_TO_LINEAR_DIVISOR == 20.0);
    assert(DEFAULT_LIMITER_THRESHOLD_LINEAR == 0.89);
    std::cout << "✅ dB conversion constants OK\n";

    // Test nouvelles constantes mathématiques
    assert(SQRT_10_APPROX == 3.16);
    assert(SQRT_10_INV_APPROX == 0.316);
    assert(LOG_BASE_10 == 10.0);
    assert(LOG_BASE_10_INV == 0.1);
    assert(UNITY_POWER == 1.0);
    assert(ZERO_POWER_EXP == 0.0);
    assert(POSITIVE_UNIT_EXP == 1.0);
    assert(NEGATIVE_UNIT_EXP == -1.0);
    assert(FRACTIONAL_THRESHOLD == 0.5);
    
    // Test cohérence des approximations
    assert(std::abs(SQRT_10_APPROX * SQRT_10_INV_APPROX - 1.0) < 0.1); // ~1.0
    assert(LOG_BASE_10 * LOG_BASE_10_INV == 1.0);
    std::cout << "✅ Mathematical conversion constants OK\n";

    // Test limites de validation
    assert(MIN_SAMPLE_RATE == 8000);
    assert(MAX_SAMPLE_RATE == 192000);
    assert(MIN_CHANNELS == 1);
    assert(MAX_CHANNELS == 2);
    assert(MIN_LIMITER_THRESHOLD_DB == -20.0);
    assert(MAX_LIMITER_THRESHOLD_DB == 0.0);
    assert(MIN_KNEE_WIDTH_DB == 0.0);
    assert(MAX_KNEE_WIDTH_DB == 24.0);
    assert(MIN_DC_THRESHOLD == 0.0);
    assert(MAX_DC_THRESHOLD == 0.05);
    assert(MIN_FEEDBACK_CORR_THRESHOLD == 0.0);
    assert(MAX_FEEDBACK_CORR_THRESHOLD == 1.0);
    
    // Test cohérence des ranges
    assert(MAX_SAMPLE_RATE > MIN_SAMPLE_RATE);
    assert(MAX_CHANNELS > MIN_CHANNELS);
    assert(MAX_LIMITER_THRESHOLD_DB > MIN_LIMITER_THRESHOLD_DB);
    assert(MAX_KNEE_WIDTH_DB > MIN_KNEE_WIDTH_DB);
    assert(MAX_DC_THRESHOLD > MIN_DC_THRESHOLD);
    assert(MAX_FEEDBACK_CORR_THRESHOLD > MIN_FEEDBACK_CORR_THRESHOLD);
    std::cout << "✅ Validation limits OK\n";

    // Test constantes mathématiques
    assert(MIN_LOG_PROTECTION == 1e-10);
    assert(STEREO_RMS_DIVISOR == 2.0);
    assert(STEREO_OFFSET_DIVISOR == 2.0);
    assert(MIN_ENERGY_THRESHOLD == 1e-9);
    assert(ZERO_SAMPLES == 0);
    assert(MIN_ENERGY_THRESHOLD > MIN_LOG_PROTECTION);
    std::cout << "✅ Mathematical constants OK\n";

    // Test constantes de clipping
    assert(CLIP_THRESHOLD_HIGH == 1.0f);
    assert(CLIP_THRESHOLD_LOW == -1.0f);
    assert(CLIP_CORRECTION_HIGH == 1.0f);
    assert(CLIP_CORRECTION_LOW == -1.0f);
    assert(NAN_REPLACEMENT == 0.0f);
    assert(std::abs(CLIP_THRESHOLD_LOW) == CLIP_THRESHOLD_HIGH);
    assert(CLIP_CORRECTION_HIGH == CLIP_THRESHOLD_HIGH);
    assert(CLIP_CORRECTION_LOW == CLIP_THRESHOLD_LOW);
    std::cout << "✅ Clipping constants OK\n";

    // Test constantes d'initialisation
    assert(INITIAL_SUM == 0.0);
    assert(INITIAL_SUM2 == 0.0);
    assert(INITIAL_CLIPPED == 0);
    std::cout << "✅ Initialization constants OK\n";

    // Test autocorrélation feedback
    assert(MIN_LAG_DIVISOR == 4);
    assert(MIN_LAG_ABSOLUTE == 32);
    assert(MAX_LAG_ABSOLUTE == 512);
    assert(LAG_MULTIPLIER == 2);
    assert(MAX_LAG_INDEX == 1);
    assert(FEEDBACK_SCORE_MIN == 0.0);
    assert(FEEDBACK_SCORE_MAX == 1.0);
    assert(MAX_LAG_ABSOLUTE > MIN_LAG_ABSOLUTE);
    assert(FEEDBACK_SCORE_MAX > FEEDBACK_SCORE_MIN);
    std::cout << "✅ Feedback autocorrelation OK\n";

    // Test soft knee limiter
    assert(CUBIC_COEFF_3 == 3.0);
    assert(CUBIC_COEFF_2 == 2.0);
    assert(MIN_KNEE_THRESHOLD == 0.0);
    assert(OVER_DB_THRESHOLD == 0.0);
    assert(GAIN_DB_DIVISOR == 20.0);
    assert(GAIN_DB_BASE == 10.0);
    
    // Test cohérence avec autres constantes
    assert(GAIN_DB_DIVISOR == DB_TO_LINEAR_DIVISOR);
    assert(GAIN_DB_BASE == DB_TO_LINEAR_BASE);
    std::cout << "✅ Soft knee limiter OK\n";

    // Test normalisation
    assert(NORMALIZATION_MIN == 0.0);
    assert(NORMALIZATION_MAX == 1.0);
    assert(NORMALIZATION_MAX > NORMALIZATION_MIN);
    std::cout << "✅ Normalization constants OK\n";

    // Test cohérence globale des valeurs par défaut
    assert(DEFAULT_LIMITER_THRESHOLD_DB >= MIN_LIMITER_THRESHOLD_DB);
    assert(DEFAULT_LIMITER_THRESHOLD_DB <= MAX_LIMITER_THRESHOLD_DB);
    assert(DEFAULT_KNEE_WIDTH_DB >= MIN_KNEE_WIDTH_DB);
    assert(DEFAULT_KNEE_WIDTH_DB <= MAX_KNEE_WIDTH_DB);
    assert(DEFAULT_DC_THRESHOLD >= MIN_DC_THRESHOLD);
    assert(DEFAULT_DC_THRESHOLD <= MAX_DC_THRESHOLD);
    assert(DEFAULT_FEEDBACK_CORR_THRESHOLD >= MIN_FEEDBACK_CORR_THRESHOLD);
    assert(DEFAULT_FEEDBACK_CORR_THRESHOLD <= MAX_FEEDBACK_CORR_THRESHOLD);
    std::cout << "✅ Global defaults consistency OK\n";

    std::cout << "🎉 SafetyContants.hpp - ALL TESTS PASSED!\n\n";
    return 0;
}
