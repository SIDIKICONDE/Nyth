#include "../../shared/Audio/core/BiquadFilter.hpp"
#include "../../shared/Audio/core/CoreConstants.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>

using namespace AudioFX;
using namespace BiquadConstants;

int main() {
    std::cout << "🎛️ Testing BiquadFilter.hpp...\n";

    // Test 1: Initialisation par défaut
    BiquadFilter filter;
    double a0, a1, a2, b0, b1, b2;
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    assert(std::abs(a0 - DEFAULT_A0) < 1e-6);
    assert(std::abs(b0 - UNITY_COEFFICIENT) < 1e-6);
    assert(std::abs(b1 - DEFAULT_COEFFICIENT) < 1e-6);
    assert(std::abs(b2 - DEFAULT_COEFFICIENT) < 1e-6);
    std::cout << "✅ BiquadFilter initialization OK\n";

    // Test 2: Configuration manuelle des coefficients
    filter.setCoefficients(1.0, 0.5, 0.2, 1.0, -1.5, 0.8);
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    assert(std::abs(a0 - 1.0) < 1e-6);
    assert(std::abs(a1 - 0.5) < 1e-6);
    assert(std::abs(a2 - 0.2) < 1e-6);
    assert(std::abs(b1 - (-1.5)) < 1e-6);
    assert(std::abs(b2 - 0.8) < 1e-6);
    std::cout << "✅ Manual coefficient setting OK\n";

    // Test 3: Normalisation des coefficients
    filter.setCoefficients(2.0, 1.0, 0.5, 2.0, 1.0, 0.5); // b0 = 2.0
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    // Tous les coefficients devraient être divisés par 2.0
    assert(std::abs(a0 - 1.0) < 1e-6);
    assert(std::abs(a1 - 0.5) < 1e-6);
    assert(std::abs(a2 - 0.25) < 1e-6);
    assert(std::abs(b0 - 1.0) < 1e-6);
    assert(std::abs(b1 - 0.5) < 1e-6);
    assert(std::abs(b2 - 0.25) < 1e-6);
    std::cout << "✅ Coefficient normalization OK\n";

    // Test 4: Filtre passe-bas
    filter.calculateLowpass(1000.0, 44100.0, 0.707);
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    // Vérifier que les coefficients sont dans des plages raisonnables
    assert(a0 > 0.0 && a0 < 1.0);
    assert(a1 < 0.0 && a1 > -2.0);
    assert(a2 > 0.0 && a2 < 1.0);
    assert(b1 < 0.0 && b1 > -2.0);
    assert(b2 > 0.0 && b2 < 1.0);
    std::cout << "✅ Lowpass filter calculation OK\n";

    // Test 5: Filtre passe-haut
    filter.calculateHighpass(1000.0, 44100.0, 0.707);
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    assert(a0 > 0.0 && a0 < 1.0);
    assert(a1 < 0.0 && a1 > -2.0);
    assert(a2 < 0.0 && a2 > -1.0);
    assert(b1 < 0.0 && b1 > -2.0);
    assert(b2 > 0.0 && b2 < 1.0);
    std::cout << "✅ Highpass filter calculation OK\n";

    // Test 6: Filtre passe-bande
    filter.calculateBandpass(1000.0, 44100.0, 0.707);
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    assert(a0 > 0.0 && a0 < 0.5);  // Gain réduit pour passe-bande
    assert(std::abs(a1) < 1e-6);   // Devrait être proche de 0
    assert(a2 < 0.0 && a2 > -0.5); // Coefficient négatif
    assert(b1 < 0.0 && b1 > -2.0);
    assert(b2 > 0.0 && b2 < 1.0);
    std::cout << "✅ Bandpass filter calculation OK\n";

    // Test 7: Filtre notch
    filter.calculateNotch(1000.0, 44100.0, 0.707);
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    assert(std::abs(a0 - 1.0) < 1e-6); // Gain unité
    assert(a1 < 0.0 && a1 > -2.0);
    assert(std::abs(a2 - 1.0) < 1e-6); // Gain unité
    assert(b1 < 0.0 && b1 > -2.0);
    assert(b2 > 0.0 && b2 < 1.0);
    std::cout << "✅ Notch filter calculation OK\n";

    // Test 8: Filtre peaking
    filter.calculatePeaking(1000.0, 44100.0, 0.707, 6.0);
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    assert(a0 > 1.0); // Gain boost
    assert(a1 < 0.0 && a1 > -2.0);
    assert(a2 > 1.0); // Gain boost
    assert(b1 < 0.0 && b1 > -2.0);
    assert(b2 > 0.0 && b2 < 1.0);
    std::cout << "✅ Peaking filter calculation OK\n";

    // Test 9: Filtre shelf bas
    filter.calculateLowShelf(1000.0, 44100.0, 0.707, 6.0);
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    assert(a0 > 1.0); // Gain boost
    assert(a1 < 0.0 && a1 > -4.0);
    assert(a2 > 1.0); // Gain boost
    assert(b1 < 0.0 && b1 > -4.0);
    assert(b2 > 0.0 && b2 < 1.0);
    std::cout << "✅ Low shelf filter calculation OK\n";

    // Test 10: Filtre shelf haut
    filter.calculateHighShelf(1000.0, 44100.0, 0.707, -6.0);
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    assert(a0 < 1.0); // Gain cut
    assert(a1 > 0.0 && a1 < 4.0);
    assert(a2 < 1.0); // Gain cut
    assert(b1 > 0.0 && b1 < 4.0);
    assert(b2 > 0.0 && b2 < 1.0);
    std::cout << "✅ High shelf filter calculation OK\n";

    // Test 11: Filtre all-pass
    filter.calculateAllpass(1000.0, 44100.0, 0.707);
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);

    assert(std::abs(a0 + 1.0) < 1e-6); // Coefficient négatif
    assert(a1 < 0.0 && a1 > -2.0);
    assert(std::abs(a2 - 1.0) < 1e-6); // Coefficient positif
    assert(b1 < 0.0 && b1 > -2.0);
    assert(b2 > 0.0 && b2 < 1.0);
    std::cout << "✅ Allpass filter calculation OK\n";

    // Test 12: Processing d'échantillon unique
    filter.calculateLowpass(1000.0, 44100.0, 0.707);
    float input = 1.0f;
    float output = filter.processSample(input);
    assert(std::isfinite(output));    // Doit être un nombre fini
    assert(std::abs(output) < 10.0f); // Doit être dans une plage raisonnable
    std::cout << "✅ Single sample processing OK\n";

    // Test 13: Reset du filtre
    filter.reset();
    filter.getCoefficients(a0, a1, a2, b0, b1, b2);
    assert(std::abs(a0 - DEFAULT_A0) < 1e-6);
    assert(std::abs(b1 - DEFAULT_COEFFICIENT) < 1e-6);
    assert(std::abs(b2 - DEFAULT_COEFFICIENT) < 1e-6);
    std::cout << "✅ Filter reset OK\n";

    // Test 14: Processing de vecteurs
    std::vector<float> input_vec = {1.0f, 0.5f, -0.5f, -1.0f, 0.0f};
    std::vector<float> output_vec(input_vec.size());

    filter.calculateLowpass(1000.0, 44100.0, 0.707);
    filter.process(input_vec, output_vec, "test_location");

    for (float sample : output_vec) {
        assert(std::isfinite(sample));
        assert(std::abs(sample) < 10.0f);
    }
    std::cout << "✅ Vector processing OK\n";

    // Test 15: Processing stéréo
    std::vector<float> inputL = {1.0f, 0.5f};
    std::vector<float> inputR = {0.5f, -0.5f};
    std::vector<float> outputL(inputL.size());
    std::vector<float> outputR(inputR.size());

    filter.processStereo(inputL, inputR, outputL, outputR, "test_stereo");

    for (size_t i = 0; i < outputL.size(); ++i) {
        assert(std::isfinite(outputL[i]) && std::isfinite(outputR[i]));
        assert(std::abs(outputL[i]) < 10.0f && std::abs(outputR[i]) < 10.0f);
    }
    std::cout << "✅ Stereo processing OK\n";

    std::cout << "🎉 BiquadFilter.hpp - ALL TESTS PASSED!\n\n";
    return 0;
}
