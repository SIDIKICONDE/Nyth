/**
 * Script de test pour vérifier l'initialisation des modules natifs
 * 
 * Usage: node test-native-modules.js
 */

import { NativeModules } from 'react-native';

// Liste des modules natifs attendus
const expectedModules = [
  'NativeAudioCaptureModule',
  'NativeAudioCoreModule',
  'NativeAudioEffectsModule',
  'NativeAudioNoiseModule',
  'NativeAudioPipelineModule',
  'NativeAudioSafetyModule',
  'NativeAudioSpectrumModule',
  'NativeAudioUtilsModule',
  'NativeCameraFiltersModule'
];

console.log('=== Test d\'initialisation des modules natifs ===\n');

// Vérifier la présence de chaque module
let allModulesFound = true;
const missingModules = [];
const foundModules = [];

expectedModules.forEach(moduleName => {
  if (NativeModules[moduleName]) {
    console.log(`✅ ${moduleName}: TROUVÉ`);
    foundModules.push(moduleName);
    
    // Afficher les méthodes disponibles
    const methods = Object.keys(NativeModules[moduleName]).filter(
      key => typeof NativeModules[moduleName][key] === 'function'
    );
    
    if (methods.length > 0) {
      console.log(`   Méthodes disponibles: ${methods.slice(0, 5).join(', ')}${methods.length > 5 ? '...' : ''}`);
    }
  } else {
    console.log(`❌ ${moduleName}: NON TROUVÉ`);
    missingModules.push(moduleName);
    allModulesFound = false;
  }
});

console.log('\n=== Résumé ===');
console.log(`Modules trouvés: ${foundModules.length}/${expectedModules.length}`);

if (allModulesFound) {
  console.log('\n✅ SUCCÈS: Tous les modules natifs sont correctement initialisés!');
} else {
  console.log('\n❌ ERREUR: Les modules suivants ne sont pas initialisés:');
  missingModules.forEach(module => console.log(`   - ${module}`));
  
  console.log('\n📝 Vérifications à effectuer:');
  console.log('1. Assurez-vous que l\'application a été recompilée après les modifications');
  console.log('2. Pour Android: npx react-native run-android');
  console.log('3. Pour iOS: cd ios && pod install && cd .. && npx react-native run-ios');
  console.log('4. Vérifiez les logs de compilation pour des erreurs C++');
}

// Test d'initialisation d'un module si disponible
if (NativeModules.NativeAudioCaptureModule) {
  console.log('\n=== Test d\'initialisation de NativeAudioCaptureModule ===');
  
  try {
    // Vérifier si le module a une méthode initialize
    if (typeof NativeModules.NativeAudioCaptureModule.initialize === 'function') {
      console.log('Tentative d\'initialisation du module de capture audio...');
      
      const config = {
        sampleRate: 44100,
        channelCount: 1,
        bitsPerSample: 16,
        bufferSizeFrames: 1024
      };
      
      NativeModules.NativeAudioCaptureModule.initialize(config)
        .then(result => {
          console.log('✅ Module de capture audio initialisé avec succès!');
        })
        .catch(error => {
          console.log('⚠️ Erreur lors de l\'initialisation:', error.message);
        });
    } else {
      console.log('⚠️ La méthode initialize n\'est pas disponible');
    }
  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
  }
}

export default function testNativeModules() {
  return {
    foundModules,
    missingModules,
    allModulesFound
  };
}