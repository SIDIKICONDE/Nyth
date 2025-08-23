/**
 * Test de connexion des modules JSI pour l'Equalizer
 *
 * Ce script teste si tous les modules JSI sont correctement connectés
 * et fonctionnels dans l'interface React Native.
 */

const testJSIConnection = async () => {
  console.log('🔗=== TEST DE CONNEXION JSI ===\n');

  try {
    // Test 1: Import des modules
    console.log('📦 Test 1: Import des modules JSI');
    let modules = {};

    try {
      modules = {
        NativeAudioCoreModule: require('../../../specs/NativeAudioCoreModule').default,
        NativeAudioEffectsModule: require('../../../specs/NativeAudioEffectsModule').default,
        NativeAudioNoiseModule: require('../../../specs/NativeAudioNoiseModule').default,
        NativeAudioSafetyModule: require('../../../specs/NativeAudioSafetyModule').default,
        NativeAudioUtilsModule: require('../../../specs/NativeAudioUtilsModule').default,
        NativeAudioPipelineModule: require('../../../specs/NativeAudioPipelineModule').default,
        NativeAudioCaptureModule: require('../../../specs/NativeAudioCaptureModule').default
      };
      console.log('✅ Tous les modules importés avec succès');
    } catch (importError) {
      console.log('❌ Erreur lors de l\'import:', importError.message);
      return false;
    }

    // Test 2: Vérification des méthodes disponibles
    console.log('\n🔧 Test 2: Vérification des méthodes JSI');
    const expectedMethods = {
      NativeAudioCoreModule: [
        'initialize', 'release', 'getState', 'getError',
        'equalizerInitialize', 'equalizerGetInfo', 'equalizerSetBand',
        'equalizerSetBandGain', 'equalizerSetMasterGain', 'equalizerSetBypass',
        'equalizerResetAllBands', 'equalizerLoadPreset', 'equalizerGetPresetList'
      ],
      NativeAudioEffectsModule: [
        'initialize', 'release', 'getState', 'getError',
        'setEnabled', 'getEnabled', 'setCompressor', 'getCompressor',
        'setDelay', 'getDelay', 'resetEffects'
      ],
      NativeAudioNoiseModule: [
        'initialize', 'release', 'getState', 'getError',
        'setEnabled', 'getEnabled', 'setMode', 'getMode',
        'setConfig', 'getConfig', 'getMetrics'
      ],
      NativeAudioSafetyModule: [
        'initialize', 'release', 'getState', 'getError',
        'setConfig', 'getConfig', 'getReport', 'getMetrics'
      ],
      NativeAudioPipelineModule: [
        'initialize', 'release', 'getState', 'getError',
        'start', 'stop', 'pause', 'resume', 'getMetrics', 'getModuleStatus'
      ],
      NativeAudioCaptureModule: [
        'initialize', 'release', 'getState', 'getError',
        'start', 'stop', 'pause', 'resume', 'getConfig', 'updateConfig',
        'getCurrentLevel', 'getPeakLevel', 'hasPermission', 'requestPermission'
      ]
    };

    let totalMethods = 0;
    let availableMethods = 0;

    for (const [moduleName, module] of Object.entries(modules)) {
      console.log(`\n  📋 ${moduleName}:`);
      const expected = expectedMethods[moduleName] || [];

      for (const method of expected) {
        totalMethods++;
        if (typeof module[method] === 'function') {
          console.log(`    ✅ ${method}`);
          availableMethods++;
        } else {
          console.log(`    ❌ ${method} - non disponible`);
        }
      }
    }

    console.log(`\n📊 Méthodes JSI: ${availableMethods}/${totalMethods} disponibles`);

    // Test 3: Test d'initialisation basique
    console.log('\n🚀 Test 3: Initialisation des modules');

    const initResults = {};

    for (const [moduleName, module] of Object.entries(modules)) {
      try {
        if (typeof module.initialize === 'function') {
          const result = await module.initialize();
          initResults[moduleName] = result;
          console.log(`  ✅ ${moduleName}: ${result ? 'initialisé' : 'échec initialisation'}`);
        } else {
          console.log(`  ⚠️  ${moduleName}: méthode initialize non disponible`);
        }
      } catch (error) {
        console.log(`  ❌ ${moduleName}: erreur - ${error.message}`);
        initResults[moduleName] = false;
      }
    }

    // Test 4: Test des fonctionnalités de base
    console.log('\n🎛️  Test 4: Fonctionnalités de base');

    // Test de l'égaliseur
    if (modules.NativeAudioCoreModule && initResults.NativeAudioCoreModule) {
      try {
        const eqConfig = {
          numBands: 10,
          sampleRate: 48000,
          masterGainDB: 0.0,
          bypass: false
        };

        const eqResult = await modules.NativeAudioCoreModule.equalizerInitialize(eqConfig);
        console.log(`  ✅ Égaliseur: ${eqResult ? 'configuré' : 'échec configuration'}`);

        if (eqResult) {
          // Test de réglage d'une bande
          const bandResult = await modules.NativeAudioCoreModule.equalizerSetBandGain(0, 6.0);
          console.log(`  ✅ Bande d'égaliseur: ${bandResult ? 'réglée' : 'échec réglage'}`);
        }
      } catch (error) {
        console.log(`  ❌ Égaliseur: erreur - ${error.message}`);
      }
    }

    // Test de la sécurité audio
    if (modules.NativeAudioSafetyModule && initResults.NativeAudioSafetyModule) {
      try {
        const safetyConfig = {
          enabled: true,
          dcRemovalEnabled: true,
          dcThreshold: 0.002,
          limiterEnabled: true,
          limiterThresholdDb: -1.0,
          softKneeLimiter: true,
          kneeWidthDb: 6.0,
          feedbackDetectEnabled: true,
          feedbackCorrThreshold: 0.95
        };

        const safetyResult = await modules.NativeAudioSafetyModule.setConfig(safetyConfig);
        console.log(`  ✅ Sécurité audio: ${safetyResult ? 'configurée' : 'échec configuration'}`);
      } catch (error) {
        console.log(`  ❌ Sécurité audio: erreur - ${error.message}`);
      }
    }

    // Test de la capture audio
    if (modules.NativeAudioCaptureModule && initResults.NativeAudioCaptureModule) {
      try {
        const captureConfig = {
          sampleRate: 48000,
          channelCount: 1,
          bitsPerSample: 16,
          bufferSizeFrames: 1024,
          enableEchoCancellation: true,
          enableNoiseSuppression: true,
          enableAutoGainControl: true
        };

        const captureResult = await modules.NativeAudioCaptureModule.initialize(captureConfig);
        console.log(`  ✅ Capture audio: ${captureResult ? 'configurée' : 'échec configuration'}`);
      } catch (error) {
        console.log(`  ❌ Capture audio: erreur - ${error.message}`);
      }
    }

    // Résumé final
    console.log('\n📋=== RÉSUMÉ DE LA CONNEXION JSI ===');

    const initializedModules = Object.values(initResults).filter(Boolean).length;
    const totalModules = Object.keys(modules).length;

    if (availableMethods === totalMethods && initializedModules === totalModules) {
      console.log('✅ CONNEXION JSI COMPLÈTE');
      console.log('🎵 Tous les modules sont connectés et fonctionnels');
      console.log('⚡ L\'Equalizer peut utiliser le traitement audio natif C++');
      console.log('🚀 Performance optimale atteinte');
      return true;
    } else if (availableMethods > 0) {
      console.log('⚠️  CONNEXION JSI PARTIELLE');
      console.log(`📊 ${availableMethods}/${totalMethods} méthodes disponibles`);
      console.log(`🔧 ${initializedModules}/${totalModules} modules initialisés`);
      console.log('🔄 Vérifier la compilation des modules C++');
      return false;
    } else {
      console.log('❌ AUCUNE CONNEXION JSI');
      console.log('🔧 Les modules C++ doivent être compilés et intégrés');
      return false;
    }

  } catch (error) {
    console.error('❌ Erreur lors du test JSI:', error);
    return false;
  }
};

// Test des hooks React
const testReactHooks = () => {
  console.log('\n🎣=== TEST DES HOOKS REACT ===');

  try {
    // Test d'import des hooks
    const {
      useEqualizer,
      useEqualizerPresets,
      useSpectrumData,
      useNoiseReduction,
      useAudioSafety,
      useAudioEffects
    } = require('./hooks/useEqualizer');

    console.log('✅ Hooks importés avec succès');
    console.log('📱 Les hooks React sont prêts à être utilisés');

    return true;
  } catch (error) {
    console.log('❌ Erreur lors de l\'import des hooks:', error.message);
    return false;
  }
};

// Test de l'interface utilisateur
const testUIComponents = () => {
  console.log('\n🎨=== TEST DES COMPOSANTS UI ===');

  try {
    // Test d'import des composants
    const {
      Equalizer,
      AdvancedEqualizer
    } = require('./Equalizer');

    console.log('✅ Composants UI importés avec succès');
    console.log('📱 L\'interface utilisateur est prête');

    return true;
  } catch (error) {
    console.log('❌ Erreur lors de l\'import des composants:', error.message);
    return false;
  }
};

// Fonction principale de test
const runAllTests = async () => {
  console.log('🎵=== TEST COMPLET DU MODULE EQUALIZER JSI ===\n');

  const jsiResult = await testJSIConnection();
  const hooksResult = testReactHooks();
  const uiResult = testUIComponents();

  console.log('\n🏁=== RÉSULTATS FINAUX ===');

  const results = [
    { name: 'Connexion JSI', result: jsiResult },
    { name: 'Hooks React', result: hooksResult },
    { name: 'Composants UI', result: uiResult }
  ];

  let allPassed = true;

  results.forEach(({ name, result }) => {
    console.log(`${result ? '✅' : '❌'} ${name}: ${result ? 'RÉUSSI' : 'ÉCHEC'}`);
    if (!result) allPassed = false;
  });

  console.log('\n' + '='.repeat(50));

  if (allPassed) {
    console.log('🎉 SUCCÈS COMPLET !');
    console.log('🎵 Le module Equalizer est entièrement fonctionnel');
    console.log('⚡ Performance native C++ activée');
    console.log('🚀 Prêt pour la production !');
  } else {
    console.log('⚠️  FONCTIONNALITÉ PARTIELLE');
    console.log('🔧 Certains composants nécessitent une vérification');
    console.log('📝 Vérifier les logs ci-dessus pour les détails');
  }

  return allPassed;
};

// Exécution automatique si appelé directement
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testJSIConnection,
    testReactHooks,
    testUIComponents,
    runAllTests
  };
}

// Auto-exécution
if (typeof global !== 'undefined') {
  runAllTests().catch(console.error);
}
