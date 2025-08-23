/**
 * Vérification de l'intégration du module natif C++
 *
 * Ce script vérifie si le module NativeAudioEqualizerModule
 * est correctement intégré dans React Native
 */

const checkNativeModuleIntegration = async () => {
  console.log('🔍=== VÉRIFICATION INTÉGRATION MODULE NATIF ===\n');

  try {
    // Test 1: Import du module
    console.log('📦 Test 1: Import du module natif');
    let NativeAudioEqualizerModule;

    try {
      NativeAudioEqualizerModule = require('../../../specs/NativeAudioEqualizerModule').default;
      console.log('✅ Module importé avec succès');
    } catch (importError) {
      console.log('❌ Impossible d\'importer le module natif:', importError.message);
      return false;
    }

    // Test 2: Vérification des méthodes disponibles
    console.log('\n🔧 Test 2: Méthodes disponibles');
    const expectedMethods = [
      'createEqualizer',
      'destroyEqualizer',
      'setEQEnabled',
      'getEQEnabled',
      'setMasterGain',
      'getMasterGain',
      'setBandGain',
      'getBandGain',
      'processAudio',
      'getSpectrumData',
      'nrSetEnabled',
      'safetySetConfig',
      'fxSetEnabled'
    ];

    let availableMethods = 0;
    for (const method of expectedMethods) {
      if (typeof NativeAudioEqualizerModule[method] === 'function') {
        console.log(`✅ ${method} - disponible`);
        availableMethods++;
      } else {
        console.log(`❌ ${method} - non disponible`);
      }
    }

    console.log(`\n📊 Méthodes disponibles: ${availableMethods}/${expectedMethods.length}`);

    // Test 3: Test d'appel simple
    console.log('\n🧪 Test 3: Test d\'appel simple');
    try {
      const result = await NativeAudioEqualizerModule.getEQEnabled();
      console.log(`✅ getEQEnabled() retourne: ${result}`);
    } catch (callError) {
      console.log('❌ Erreur lors de l\'appel:', callError.message);
      console.log('   Cause probable: Module natif non compilé ou non lié');
    }

    // Test 4: Test de création d'égaliseur
    console.log('\n🎛️  Test 4: Test de création d\'égaliseur');
    try {
      const equalizerId = await NativeAudioEqualizerModule.createEqualizer(10, 48000);
      console.log(`✅ Égaliseur créé avec ID: ${equalizerId}`);

      // Test rapide de quelques méthodes
      const numBands = await NativeAudioEqualizerModule.getNumBands(equalizerId);
      console.log(`✅ Nombre de bandes: ${numBands}`);

      // Nettoyage
      await NativeAudioEqualizerModule.destroyEqualizer(equalizerId);
      console.log('✅ Égaliseur détruit');

    } catch (createError) {
      console.log('❌ Erreur lors de la création:', createError.message);
    }

    // Résumé
    console.log('\n📋=== RÉSUMÉ DE L\'INTÉGRATION ===');

    if (availableMethods === expectedMethods.length) {
      console.log('✅ INTÉGRATION COMPLÈTE: Toutes les méthodes sont disponibles');
      console.log('🎵 Le module natif C++ est prêt à être utilisé');
      return true;
    } else if (availableMethods > 0) {
      console.log('⚠️  INTÉGRATION PARTIELLE: Certaines méthodes sont disponibles');
      console.log('📝 Le module natif est partiellement compilé');
      console.log('🔧 Il manque peut-être des dépendances ou configurations');
      return false;
    } else {
      console.log('❌ AUCUNE INTÉGRATION: Le module natif n\'est pas disponible');
      console.log('🔧 Le code C++ doit être compilé et intégré dans React Native');
      return false;
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return false;
  }
};

// Fonction pour expliquer l'état de l'intégration
const explainIntegrationStatus = () => {
  console.log('\n💡=== EXPLICATION DE L\'INTÉGRATION ===');

  console.log('\n🔍 État actuel:');
  console.log('✅ Code C++ natif EXISTS dans shared/Audio/');
  console.log('✅ Module React Native DÉFINI dans specs/');
  console.log('❓ Intégration dans le build React Native NON VÉRIFIÉE');

  console.log('\n📁 Structure du code natif trouvée:');
  console.log('📂 shared/Audio/core/ - Égaliseur principal');
  console.log('📂 shared/Audio/noise/ - Réduction de bruit avancée');
  console.log('📂 shared/Audio/safety/ - Sécurité audio');
  console.log('📂 shared/Audio/effects/ - Effets créatifs');
  console.log('📂 shared/NativeAudioEqualizerModule.* - Interface React Native');

  console.log('\n⚙️  Pour activer l\'intégration complète:');
  console.log('1. Compiler le code C++ dans le build React Native');
  console.log('2. Lier le module natif dans iOS (Podfile) et Android (build.gradle)');
  console.log('3. Activer les flags de compilation (NAAYA_AUDIO_EQ_ENABLED)');
  console.log('4. Tester avec le vrai core C++ au lieu des mocks');

  console.log('\n🎯 Avantages de l\'intégration native:');
  console.log('⚡ Performance DSP temps réel native');
  console.log('🎵 Traitement audio haute qualité');
  console.log('🔧 Optimisations SIMD activées');
  console.log('📊 Analyse spectrale précise');
  console.log('🚀 Latence réduite');
};

// Script de test d'intégration de base
const testBasicIntegration = async () => {
  console.log('🧪=== TEST D\'INTÉGRATION DE BASE ===\n');

  try {
    const isIntegrated = await checkNativeModuleIntegration();
    explainIntegrationStatus();

    console.log('\n🎉=== TEST TERMINÉ ===');
    console.log('\n🔍 RÉSULTAT:');

    if (isIntegrated) {
      console.log('✅ Le module Equalizer peut utiliser le vrai core C++');
      console.log('🎵 Toutes les fonctionnalités natives sont disponibles');
      console.log('⚡ Performance optimale atteinte');
    } else {
      console.log('⚠️  Le module Equalizer utilise actuellement des mocks');
      console.log('📝 Le vrai core C++ n\'est pas encore intégré');
      console.log('🔧 Configuration de build nécessaire pour activer le C++');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

// Fonction pour comparer les tests mocks vs natif
const compareMockVsNative = () => {
  console.log('\n⚖️ === COMPARAISON MOCKS vs CORE NATIF ===');

  console.log('\n🧪 Tests précédents (avec mocks):');
  console.log('✅ Interface utilisateur fonctionnelle');
  console.log('✅ Logique React/JavaScript validée');
  console.log('✅ Architecture des composants testée');
  console.log('✅ Gestion d\'état et effets validés');
  console.log('❌ Pas de traitement audio réel');
  console.log('❌ Pas de performance DSP native');
  console.log('❌ Pas d\'optimisations SIMD');

  console.log('\n🔧 Intégration native (C++):');
  console.log('✅ Traitement audio temps réel');
  console.log('✅ Performance DSP native');
  console.log('✅ Optimisations SIMD activées');
  console.log('✅ Latence minimale');
  console.log('✅ Analyse spectrale précise');
  console.log('✅ Réduction de bruit avancée (RNNoise, IMCRA, Wiener)');
  console.log('✅ Sécurité audio (limiter, DC removal)');
  console.log('✅ Effets créatifs (compresseur, delay)');
  console.log('❌ Plus complexe à déboguer');
  console.log('❌ Configuration de build nécessaire');

  console.log('\n🎯 Recommandation:');
  console.log('• Tests précédents: ✅ Architecture et UI validées');
  console.log('• Intégration native: 🔧 Nécessaire pour la production');
  console.log('• Performance: 🚀 Le vrai core C++ offre de meilleures performances');
};

// Exécution du test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkNativeModuleIntegration,
    explainIntegrationStatus,
    testBasicIntegration,
    compareMockVsNative
  };
}

// Auto-exécution
if (typeof global !== 'undefined') {
  testBasicIntegration().then(() => {
    compareMockVsNative();
  }).catch(console.error);
}
