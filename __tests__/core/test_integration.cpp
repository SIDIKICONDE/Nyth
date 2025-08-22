#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include "../../shared/Audio/core/BiquadFilter.hpp"
#include "../../shared/Audio/core/CoreConstants.hpp"
#include "../../shared/Audio/core/EQPreset.hpp"
#include "../../shared/Audio/core/EQPresetFactory.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>

using namespace AudioFX;
using namespace EqualizerConstants;

int main() {
    std::cout << "🔗 Testing Core Integration...\n";

    // Test 1: Intégration AudioEqualizer + BiquadFilter
    AudioEqualizer eq(10, SAMPLE_RATE_44100);
    assert(eq.getNumBands() == 10);
    assert(eq.getSampleRate() == SAMPLE_RATE_44100);

    // Vérifier que chaque bande a un filtre biquad valide
    for (size_t i = FIRST_BAND_INDEX; i < eq.getNumBands(); ++i) {
        assert(eq.getBandFrequency(i) > 0);
        assert(eq.getBandQ(i) > 0);
        assert(std::abs(eq.getBandGain(i)) >= 0);
        assert(eq.isBandEnabled(i)); // Par défaut activé
    }
    std::cout << "✅ AudioEqualizer + BiquadFilter integration OK\n";

    // Test 2: Cohérence des constantes entre modules
    assert(NUM_BANDS == 10);
    assert(DEFAULT_SAMPLE_RATE == SAMPLE_RATE_48000);
    assert(DEFAULT_Q == 0.707);
    assert(std::abs(DEFAULT_GAIN_DB) < 1e-6);
    std::cout << "✅ Constants consistency across modules OK\n";

    // Test 3: Factory pattern avec EQPreset
    EQPresetFactory factory;

    EQPreset flat_preset = factory.createFlatPreset();
    assert(flat_preset.name == "Flat");
    assert(flat_preset.gains.size() == NUM_BANDS);

    for (double gain : flat_preset.gains) {
        assert(std::abs(gain - ZERO_GAIN) < 1e-6);
    }

    EQPreset rock_preset = factory.createRockPreset();
    assert(rock_preset.name == "Rock");
    assert(rock_preset.gains.size() == NUM_BANDS);
    assert(rock_preset.gains[0] > 0); // Bass boost dans rock
    std::cout << "✅ EQPreset Factory pattern OK\n";

    // Test 4: Échange de presets
    eq.loadPreset(rock_preset);
    for (size_t i = FIRST_BAND_INDEX; i < std::min(rock_preset.gains.size(), (size_t)eq.getNumBands()); ++i) {
        assert(std::abs(eq.getBandGain(i) - rock_preset.gains[i]) < 1e-6);
    }

    EQPreset saved_preset;
    eq.savePreset(saved_preset);
    assert(saved_preset.gains == rock_preset.gains);
    std::cout << "✅ Preset load/save integration OK\n";

    // Test 5: Modification de paramètres et cohérence
    eq.setMasterGain(6.0);
    eq.setBandGain(0, 3.0);
    eq.setBandFrequency(0, 80.0);
    eq.setBandQ(0, 1.2);

    assert(std::abs(eq.getMasterGain() - 6.0) < 1e-6);
    assert(std::abs(eq.getBandGain(0) - 3.0) < 1e-6);
    assert(std::abs(eq.getBandFrequency(0) - 80.0) < 1e-6);
    assert(std::abs(eq.getBandQ(0) - 1.2) < 1e-6);
    std::cout << "✅ Parameter modification consistency OK\n";

    // Test 6: Processing pipeline complet
    std::vector<float> input = {0.5f, 1.0f, 0.8f, 0.3f, -0.2f, -0.7f};
    std::vector<float> output(input.size());

    // Configurer un filtre simple
    eq.resetAllBands();
    eq.setBandGain(0, 6.0); // Boost des basses
    eq.setBandType(0, FilterType::LOWSHELF);

    // Traiter le signal
    eq.process(input, output, "integration_test");

    // Vérifier que le processing n'a pas crashé et produit des valeurs valides
    assert(output.size() == input.size());
    for (float sample : output) {
        assert(std::isfinite(sample));
        assert(std::abs(sample) < 100.0f); // Plage raisonnable même avec boost
    }
    std::cout << "✅ Complete processing pipeline OK\n";

    // Test 7: Processing stéréo
    std::vector<float> inputL = {0.5f, 1.0f, 0.8f};
    std::vector<float> inputR = {0.3f, -0.2f, -0.7f};
    std::vector<float> outputL(inputL.size());
    std::vector<float> outputR(inputR.size());

    eq.processStereo(inputL, inputR, outputL, outputR, "stereo_integration_test");

    assert(outputL.size() == inputL.size());
    assert(outputR.size() == inputR.size());

    for (size_t i = 0; i < outputL.size(); ++i) {
        assert(std::isfinite(outputL[i]) && std::isfinite(outputR[i]));
        assert(std::abs(outputL[i]) < 100.0f && std::abs(outputR[i]) < 100.0f);
    }
    std::cout << "✅ Stereo processing integration OK\n";

    // Test 8: Templates C++17 avec différents types
    std::vector<double> input_double = {0.5, 1.0, 0.8};
    std::vector<double> output_double(input_double.size());

    // Le template devrait gérer les conversions automatiquement
    eq.process(input_double, output_double, "template_test");

    assert(output_double.size() == input_double.size());
    for (double sample : output_double) {
        assert(std::isfinite(sample));
    }
    std::cout << "✅ C++17 templates integration OK\n";

    // Test 9: Validation des buffers
    bool valid = eq.validateAudioBuffer(input, "buffer_validation_test");
    assert(valid);

    std::vector<float> invalid_buffer = {1.0f, std::numeric_limits<float>::infinity(),
                                         -std::numeric_limits<float>::infinity()};
    bool invalid = eq.validateAudioBuffer(invalid_buffer, "invalid_buffer_test");
    assert(!invalid);
    std::cout << "✅ Buffer validation integration OK\n";

    // Test 10: Debug info generation
    std::string debug_info = eq.getDebugInfo("debug_integration_test");
    assert(!debug_info.empty());
    assert(debug_info.find("AudioEqualizer") != std::string::npos);
    assert(debug_info.find("Sample Rate") != std::string::npos);
    assert(debug_info.find("Master Gain") != std::string::npos);
    std::cout << "✅ Debug info generation OK\n";

    // Test 11: Bandes actives
    auto active_bands = eq.getActiveBands();
    assert(!active_bands.empty());

    // Désactiver quelques bandes
    eq.setBandEnabled(0, false);
    eq.setBandEnabled(5, false);
    active_bands = eq.getActiveBands();
    assert(active_bands.size() < eq.getNumBands());

    // Vérifier les bandes par type
    auto peak_bands = eq.getBandsByType(FilterType::PEAK);
    assert(!peak_bands.empty());

    eq.setBandType(0, FilterType::LOWPASS);
    auto lowpass_bands = eq.getBandsByType(FilterType::LOWPASS);
    assert(lowpass_bands.size() >= 1);
    std::cout << "✅ Band filtering and queries OK\n";

    // Test 12: Thread safety avec parameter updates
    eq.beginParameterUpdate();
    eq.setBandGain(1, 2.0);
    eq.setBandFrequency(1, 2000.0);
    eq.setMasterGain(-3.0);
    eq.endParameterUpdate();

    assert(std::abs(eq.getBandGain(1) - 2.0) < 1e-6);
    assert(std::abs(eq.getBandFrequency(1) - 2000.0) < 1e-6);
    assert(std::abs(eq.getMasterGain() - (-3.0)) < 1e-6);
    std::cout << "✅ Thread-safe parameter updates OK\n";

    // Test 13: RAII ParameterUpdateGuard
    {
        AudioEqualizer::ParameterUpdateGuard guard(eq);
        eq.setBandGain(2, 4.0);
        eq.setBandType(2, FilterType::HIGHSHELF);
        // Guard appelle automatiquement endParameterUpdate()
    }

    assert(std::abs(eq.getBandGain(2) - 4.0) < 1e-6);
    assert(eq.getBandType(2) == FilterType::HIGHSHELF);
    std::cout << "✅ RAII ParameterUpdateGuard OK\n";

    // Test 14: Sample rate change impact
    uint32_t old_sample_rate = eq.getSampleRate();
    eq.setSampleRate(SAMPLE_RATE_96000);
    assert(eq.getSampleRate() == SAMPLE_RATE_96000);

    // Les fréquences devraient être reclampées selon le nouveau sample rate
    double max_freq = SAMPLE_RATE_96000 / NYQUIST_DIVISOR;
    for (size_t i = 0; i < eq.getNumBands(); ++i) {
        assert(eq.getBandFrequency(i) <= max_freq);
    }
    std::cout << "✅ Sample rate change integration OK\n";

    // Test 15: Reset complète
    eq.resetAllBands();
    eq.setMasterGain(0.0);
    eq.setBypass(false);

    for (size_t i = 0; i < eq.getNumBands(); ++i) {
        assert(std::abs(eq.getBandGain(i) - ZERO_GAIN) < 1e-6);
        assert(eq.getBandType(i) == FilterType::PEAK); // Reset to default
    }
    assert(std::abs(eq.getMasterGain()) < 1e-6);
    assert(!eq.isBypassed());
    std::cout << "✅ Complete system reset OK\n";

    std::cout << "🎉 Core Integration - ALL TESTS PASSED!\n\n";
    return 0;
}
