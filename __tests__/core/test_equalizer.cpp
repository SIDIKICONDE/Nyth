#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include "../../shared/Audio/core/CoreConstants.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>

using namespace AudioFX;
using namespace EqualizerConstants;

int main() {
    std::cout << "🎛️ Testing AudioEqualizer.hpp...\n";

    // Test 1: Initialisation avec paramètres par défaut
    AudioEqualizer eq;
    assert(eq.getNumBands() == NUM_BANDS);
    assert(eq.getSampleRate() == DEFAULT_SAMPLE_RATE);
    assert(std::abs(eq.getMasterGain() - DEFAULT_MASTER_GAIN) < 1e-6);
    std::cout << "✅ AudioEqualizer initialization OK\n";

    // Test 2: Initialisation avec paramètres personnalisés
    AudioEqualizer eq_custom(5, SAMPLE_RATE_48000);
    assert(eq_custom.getNumBands() == 5);
    assert(eq_custom.getSampleRate() == SAMPLE_RATE_48000);
    std::cout << "✅ AudioEqualizer custom parameters OK\n";

    // Test 3: Vérification des fréquences par défaut pour 10 bandes
    AudioEqualizer eq_10band;
    for (size_t i = FIRST_BAND_INDEX; i < NUM_BANDS; ++i) {
        double expected_freq = DEFAULT_FREQUENCIES[i];
        double actual_freq = eq_10band.getBandFrequency(i);
        assert(std::abs(actual_freq - expected_freq) < 1e-6);
        assert(std::abs(eq_10band.getBandGain(i) - ZERO_GAIN) < 1e-6);
        assert(std::abs(eq_10band.getBandQ(i) - DEFAULT_Q) < 1e-6);
    }
    std::cout << "✅ Default band frequencies OK\n";

    // Test 4: Modification des paramètres de bande
    eq.setBandGain(0, 6.0);
    eq.setBandFrequency(0, 100.0);
    eq.setBandQ(0, 1.5);

    assert(std::abs(eq.getBandGain(0) - 6.0) < 1e-6);
    assert(std::abs(eq.getBandFrequency(0) - 100.0) < 1e-6);
    assert(std::abs(eq.getBandQ(0) - 1.5) < 1e-6);
    std::cout << "✅ Band parameter modification OK\n";

    // Test 5: Validation des limites de gain
    eq.setBandGain(0, MIN_GAIN_DB - 1.0); // Doit être clampé
    assert(std::abs(eq.getBandGain(0) - MIN_GAIN_DB) < 1e-6);

    eq.setBandGain(0, MAX_GAIN_DB + 1.0); // Doit être clampé
    assert(std::abs(eq.getBandGain(0) - MAX_GAIN_DB) < 1e-6);
    std::cout << "✅ Gain limits validation OK\n";

    // Test 6: Validation des limites de fréquence
    eq.setBandFrequency(0, MIN_FREQUENCY_HZ / 2.0); // Doit être clampé
    assert(std::abs(eq.getBandFrequency(0) - MIN_FREQUENCY_HZ) < 1e-6);

    double max_freq = eq.getSampleRate() / NYQUIST_DIVISOR;
    eq.setBandFrequency(0, max_freq * 2.0); // Doit être clampé
    assert(std::abs(eq.getBandFrequency(0) - max_freq) < 1e-6);
    std::cout << "✅ Frequency limits validation OK\n";

    // Test 7: Validation des limites Q
    eq.setBandQ(0, MIN_Q / 2.0); // Doit être clampé
    assert(std::abs(eq.getBandQ(0) - MIN_Q) < 1e-6);

    eq.setBandQ(0, MAX_Q * 2.0); // Doit être clampé
    assert(std::abs(eq.getBandQ(0) - MAX_Q) < 1e-6);
    std::cout << "✅ Q factor limits validation OK\n";

    // Test 8: Types de filtres
    eq.setBandType(0, FilterType::LOWPASS);
    assert(eq.getBandType(0) == FilterType::LOWPASS);

    eq.setBandType(1, FilterType::HIGHPASS);
    assert(eq.getBandType(1) == FilterType::HIGHPASS);

    eq.setBandType(2, FilterType::BANDPASS);
    assert(eq.getBandType(2) == FilterType::BANDPASS);
    std::cout << "✅ Filter types OK\n";

    // Test 9: États d'activation des bandes
    eq.setBandEnabled(0, false);
    assert(!eq.isBandEnabled(0));

    eq.setBandEnabled(0, true);
    assert(eq.isBandEnabled(0));
    std::cout << "✅ Band enable/disable OK\n";

    // Test 10: Gain master
    eq.setMasterGain(12.0);
    assert(std::abs(eq.getMasterGain() - 12.0) < 1e-6);

    eq.setMasterGain(MIN_GAIN_DB - 5.0); // Doit être clampé
    assert(std::abs(eq.getMasterGain() - MIN_GAIN_DB) < 1e-6);
    std::cout << "✅ Master gain control OK\n";

    // Test 11: Bypass
    eq.setBypass(true);
    assert(eq.isBypassed());

    eq.setBypass(false);
    assert(!eq.isBypassed());
    std::cout << "✅ Bypass functionality OK\n";

    // Test 12: Reset des bandes
    eq.setBandGain(0, 6.0);
    eq.setBandGain(1, -3.0);
    eq.resetAllBands();

    for (size_t i = FIRST_BAND_INDEX; i < eq.getNumBands(); ++i) {
        assert(std::abs(eq.getBandGain(i) - ZERO_GAIN) < 1e-6);
    }
    std::cout << "✅ Reset functionality OK\n";

    // Test 13: Changement de sample rate
    eq.setSampleRate(SAMPLE_RATE_96000);
    assert(eq.getSampleRate() == SAMPLE_RATE_96000);
    std::cout << "✅ Sample rate change OK\n";

    // Test 14: Preset loading/saving
    EQPreset preset;
    preset.gains = {2.0, 1.0, 0.0, -1.0, -2.0, 0.0, 1.0, 2.0, 1.0, 0.0};

    eq.loadPreset(preset);
    for (size_t i = FIRST_BAND_INDEX; i < std::min(preset.gains.size(), (size_t)eq.getNumBands()); ++i) {
        assert(std::abs(eq.getBandGain(i) - preset.gains[i]) < 1e-6);
    }

    EQPreset saved_preset;
    eq.savePreset(saved_preset);
    assert(saved_preset.gains.size() == eq.getNumBands());
    std::cout << "✅ Preset load/save OK\n";

    // Test 15: Processing avec buffer vide (pas de crash)
    std::vector<float> empty_input;
    std::vector<float> empty_output;
    eq.process(empty_input, empty_output);
    assert(empty_output.empty());
    std::cout << "✅ Empty buffer processing OK\n";

    std::cout << "🎉 AudioEqualizer.hpp - ALL TESTS PASSED!\n\n";
    return 0;
}
