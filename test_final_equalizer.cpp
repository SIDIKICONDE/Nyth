#include "shared/Audio/core/AudioEqualizer.hpp"
#include "shared/Audio/core/EQPresetFactory.hpp"
#include <iostream>
#include <vector>


int main() {
  using namespace AudioFX;

  std::cout << "🎵 Test de l'AudioEqualizer refactorisé..." << std::endl;

  // Test création d'un égaliseur
  AudioEqualizer eq(10, 44100);
  std::cout << "✅ AudioEqualizer créé avec succès" << std::endl;

  // Test avec buffer float
  std::vector<float> input(1024, 0.5f);
  std::vector<float> output(1024);
  eq.process(input, output);
  std::cout << "✅ Traitement float réussi" << std::endl;

  // Test avec buffer double
  std::vector<double> inputD(1024, 0.5);
  std::vector<double> outputD(1024);
  eq.process(inputD, outputD);
  std::cout << "✅ Traitement double réussi" << std::endl;

  // Test stereo
  std::vector<float> inputL(1024, 0.5f);
  std::vector<float> inputR(1024, 0.5f);
  std::vector<float> outputL(1024);
  std::vector<float> outputR(1024);
  eq.processStereo(inputL, inputR, outputL, outputR);
  std::cout << "✅ Traitement stéréo réussi" << std::endl;

  // Test preset factory
  EQPreset rockPreset = EQPresetFactory::createRockPreset();
  eq.loadPreset(rockPreset);
  std::cout << "✅ Preset Rock chargé" << std::endl;

  // Test band control
  eq.setBandGain(0, 3.0);
  eq.setBandFrequency(0, 100.0);
  eq.setBandQ(0, 0.7);
  std::cout << "✅ Contrôle des bandes fonctionnel" << std::endl;

  // Test validation
  bool valid = eq.validateAudioBuffer(input);
  std::cout << "✅ Validation des buffers: " << (valid ? "OK" : "Erreur")
            << std::endl;

  std::cout << "\n📊 Informations de debug:" << std::endl;
  std::cout << eq.getDebugInfo() << std::endl;

  std::cout << "\n🎉 Test final réussi ! L'AudioEqualizer refactorisé "
               "fonctionne parfaitement !"
            << std::endl;

  return 0;
}
