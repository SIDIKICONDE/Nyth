#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include "../../shared/Audio/core/BiquadFilter.hpp"
#include "../../shared/Audio/core/CoreConstants.hpp"
#include <cmath>
#include <iostream>
#include <vector>


using namespace AudioFX;

int main() {
    std::cout << "🎵 TEST SIMPLE AUDIO CORE" << std::endl;
    std::cout << "=========================" << std::endl;

    try {
        // Test 1: Vérification des constantes
        std::cout << "1. Vérification des constantes..." << std::endl;
        assert(NUM_BANDS == 10);
        assert(DEFAULT_SAMPLE_RATE == 48000);
        assert(MIN_GAIN_DB == -24.0);
        assert(MAX_GAIN_DB == 24.0);
        assert(DEFAULT_Q == 0.707);
        std::cout << "   ✅ Constantes OK" << std::endl;

        // Test 2: Construction AudioEqualizer
        std::cout << "2. Test AudioEqualizer..." << std::endl;
        AudioEqualizer eq;
        assert(eq.getNumBands() == NUM_BANDS);
        assert(eq.getSampleRate() == DEFAULT_SAMPLE_RATE);
        std::cout << "   ✅ AudioEqualizer OK" << std::endl;

        // Test 3: Configuration des bandes
        std::cout << "3. Test configuration des bandes..." << std::endl;
        eq.setBandGain(0, 6.0);
        eq.setBandGain(1, -3.0);
        assert(std::abs(eq.getBandGain(0) - 6.0) < 1e-6);
        assert(std::abs(eq.getBandGain(1) - (-3.0)) < 1e-6);
        std::cout << "   ✅ Configuration des bandes OK" << std::endl;

        // Test 4: Construction BiquadFilter
        std::cout << "4. Test BiquadFilter..." << std::endl;
        BiquadFilter filter;
        double a0, a1, a2, b0, b1, b2;
        filter.getCoefficients(a0, a1, a2, b0, b1, b2);
        assert(std::isfinite(a0) && std::isfinite(a1) && std::isfinite(a2));
        assert(std::isfinite(b0) && std::isfinite(b1) && std::isfinite(b2));
        std::cout << "   ✅ BiquadFilter OK" << std::endl;

        // Test 5: Calcul de filtres
        std::cout << "5. Test calcul de filtres..." << std::endl;
        filter.calculateLowpass(1000.0, 48000, 0.707);
        filter.getCoefficients(a0, a1, a2, b0, b1, b2);
        assert(std::isfinite(a0) && std::isfinite(a1) && std::isfinite(a2));
        assert(std::isfinite(b1) && std::isfinite(b2));

        filter.calculateHighpass(1000.0, 48000, 0.707);
        filter.getCoefficients(a0, a1, a2, b0, b1, b2);
        assert(std::isfinite(a0) && std::isfinite(a1) && std::isfinite(a2));
        assert(std::isfinite(b1) && std::isfinite(b2));

        filter.calculatePeaking(1000.0, 48000, 1.0, 6.0);
        filter.getCoefficients(a0, a1, a2, b0, b1, b2);
        assert(std::isfinite(a0) && std::isfinite(a1) && std::isfinite(a2));
        assert(std::isfinite(b1) && std::isfinite(b2));
        std::cout << "   ✅ Calcul de filtres OK" << std::endl;

        // Test 6: Traitement audio simple
        std::cout << "6. Test traitement audio..." << std::endl;
        std::vector<float> input(512);
        std::vector<float> output(512);

        // Remplir avec des valeurs simples
        for (size_t i = 0; i < 512; ++i) {
            input[i] = (i % 2 == 0) ? 0.5f : -0.5f;
        }

        // Test AudioEqualizer
        eq.process(input, output);
        assert(output.size() == input.size());
        for (size_t i = 0; i < output.size(); ++i) {
            assert(std::isfinite(output[i]));
        }

        // Test BiquadFilter
        filter.process(input, output);
        assert(output.size() == input.size());
        for (size_t i = 0; i < output.size(); ++i) {
            assert(std::isfinite(output[i]));
        }
        std::cout << "   ✅ Traitement audio OK" << std::endl;

        // Test 7: Presets
        std::cout << "7. Test presets..." << std::endl;
        auto rockPreset = EQPresetFactory::createRockPreset();
        eq.loadPreset(rockPreset);

        bool hasNonZeroGain = false;
        for (size_t i = 0; i < eq.getNumBands(); ++i) {
            if (std::abs(eq.getBandGain(i)) > 1e-6) {
                hasNonZeroGain = true;
                break;
            }
        }
        assert(hasNonZeroGain);
        std::cout << "   ✅ Presets OK" << std::endl;

        // Test 8: Contrôles master
        std::cout << "8. Test contrôles master..." << std::endl;
        eq.setMasterGain(6.0);
        assert(std::abs(eq.getMasterGain() - 6.0) < 1e-6);

        eq.setBypass(true);
        assert(eq.isBypassed());

        eq.setBypass(false);
        assert(!eq.isBypassed());
        std::cout << "   ✅ Contrôles master OK" << std::endl;

        std::cout << std::endl;
        std::cout << "🎉 TOUS LES TESTS SONT PASSÉS !" << std::endl;
        std::cout << "===============================" << std::endl;
        std::cout << "✅ AudioEqualizer: Fonctionnel" << std::endl;
        std::cout << "✅ BiquadFilter: Fonctionnel" << std::endl;
        std::cout << "✅ Traitement audio: Fonctionnel" << std::endl;
        std::cout << "✅ Presets: Fonctionnels" << std::endl;
        std::cout << "✅ Contrôles: Fonctionnels" << std::endl;

        return 0;

    } catch (const std::exception& e) {
        std::cerr << "❌ ERREUR: " << e.what() << std::endl;
        return 1;
    } catch (...) {
        std::cerr << "❌ ERREUR INCONNUE" << std::endl;
        return 1;
    }
}
