#include <iostream>
#include <vector>
#include "shared/Audio/core/components/AudioEqualizer/AudioEqualizer.hpp"

using namespace Nyth::Audio::FX;

int main() {
    std::cout << "🎵 AudioEqualizer Demo" << std::endl;
    std::cout << "======================" << std::endl;

    try {
        // Créer un equaliseur avec 5 bandes et 44100 Hz
        AudioEqualizer eq(5, 44100.0f);

        std::cout << "✅ AudioEqualizer créé avec succès!" << std::endl;

        // Tester quelques fonctions de base
        std::cout << "\n🎛️  Test des fonctionnalités de base:" << std::endl;

        // Tester le gain maître
        eq.setMasterGain(2.0f);
        std::cout << "   - Gain maître configuré à 2.0 dB" << std::endl;

        // Tester l'état activé/désactivé
        eq.setBypass(true);
        std::cout << "   - Égaliseur en bypass (désactivé)" << std::endl;

        eq.setBypass(false);
        std::cout << "   - Égaliseur réactivé" << std::endl;

        std::cout << "\n🎉 Démonstration terminée avec succès!" << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "❌ Erreur: " << e.what() << std::endl;
        return 1;
    } catch (...) {
        std::cerr << "❌ Erreur inconnue lors de l'initialisation" << std::endl;
        return 1;
    }

    return 0;
}
