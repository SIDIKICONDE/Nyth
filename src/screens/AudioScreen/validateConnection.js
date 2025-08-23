/**
 * 🔍 VALIDATION DE CONNEXION - AudioScreen
 *
 * Script de validation pour vérifier que tous les composants
 * de l'AudioScreen sont bien connectés et fonctionnels.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const AUDIO_SCREEN_DIR = path.join(__dirname);
const EXPECTED_COMPONENTS = [
  'AudioScreen.tsx',
  'types.ts',
  'index.ts',
  'README_CONNECTION.md',
  'AudioScreenConnector.tsx',
];

const EXPECTED_HOOKS = [
  'useAudioFolders.ts',
  'useAudioScreenState.ts',
  'useAudioCapture.ts',
];

const EXPECTED_COMPONENTS_DIR = [
  'AudioScreenHeader.tsx',
  'AudioFolderCard.tsx',
  'AudioFAB.tsx',
  'EmptyState.tsx',
  'AudioFolderActions.tsx',
  'AudioSearchBar.tsx',
  'AudioLevelIndicator.tsx',
  'AudioFolderDetail.tsx',
  'AudioSettings.tsx',
  'AudioStats.tsx',
  'RippleButton.tsx',
  'UltraModernUI.tsx',
  'MicroInteractionsDemo.tsx',
];

let testResults = [];
let currentTest = '';

function logTest(message, status = 'INFO') {
  const timestamp = new Date().toISOString().slice(11, 19);
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`${emoji} [${timestamp}] ${message}`);
  testResults.push({ test: currentTest, message, status, timestamp });
}

function startTest(name) {
  currentTest = name;
  logTest(`=== DÉBUT TEST: ${name} ===`, 'INFO');
}

function passTest(message = '') {
  logTest(message || `Test réussi: ${currentTest}`, 'PASS');
}

function failTest(message = '') {
  logTest(message || `Test échoué: ${currentTest}`, 'FAIL');
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function checkExports(filePath, expectedExports) {
  const content = readFileContent(filePath);
  if (!content) return false;

  return expectedExports.every(exportName =>
    content.includes(exportName)
  );
}

// Tests de validation
function validateFileStructure() {
  console.log('🏗️ === VALIDATION STRUCTURE FICHIERS ===\n');

  // Test 1: Fichiers principaux
  startTest('Fichiers principaux AudioScreen');
  let mainFilesFound = 0;

  for (const file of EXPECTED_COMPONENTS) {
    const filePath = path.join(AUDIO_SCREEN_DIR, file);
    if (fileExists(filePath)) {
      console.log(`✅ ${file} trouvé`);
      mainFilesFound++;
    } else {
      console.log(`❌ ${file} manquant`);
    }
  }

  if (mainFilesFound >= EXPECTED_COMPONENTS.length * 0.8) {
    passTest(`${mainFilesFound}/${EXPECTED_COMPONENTS.length} fichiers principaux trouvés`);
  } else {
    failTest('Fichiers principaux manquants');
  }

  // Test 2: Dossier hooks
  startTest('Dossier et fichiers hooks');
  const hooksDir = path.join(AUDIO_SCREEN_DIR, 'hooks');
  const hooksIndex = path.join(hooksDir, 'index.ts');

  if (fileExists(hooksDir)) {
    let hooksFound = 0;
    for (const hook of EXPECTED_HOOKS) {
      const hookPath = path.join(hooksDir, hook);
      if (fileExists(hookPath)) {
        console.log(`✅ Hook ${hook} trouvé`);
        hooksFound++;
      } else {
        console.log(`❌ Hook ${hook} manquant`);
      }
    }

    if (fileExists(hooksIndex)) {
      console.log(`✅ index.ts hooks trouvé`);
      const expectedHookExports = EXPECTED_HOOKS.map(h => h.replace('.ts', ''));
      if (checkExports(hooksIndex, expectedHookExports)) {
        console.log(`✅ Exports hooks valides`);
      } else {
        console.log(`❌ Exports hooks invalides`);
      }
    }

    if (hooksFound >= EXPECTED_HOOKS.length) {
      passTest(`${hooksFound}/${EXPECTED_HOOKS.length} hooks trouvés`);
    } else {
      failTest('Hooks manquants');
    }
  } else {
    failTest('Dossier hooks manquant');
  }

  // Test 3: Dossier components
  startTest('Dossier et fichiers composants');
  const componentsDir = path.join(AUDIO_SCREEN_DIR, 'components');
  const componentsIndex = path.join(componentsDir, 'index.ts');

  if (fileExists(componentsDir)) {
    let componentsFound = 0;
    for (const component of EXPECTED_COMPONENTS_DIR) {
      const componentPath = path.join(componentsDir, component);
      if (fileExists(componentPath)) {
        console.log(`✅ Composant ${component} trouvé`);
        componentsFound++;
      } else {
        console.log(`❌ Composant ${component} manquant`);
      }
    }

    if (fileExists(componentsIndex)) {
      console.log(`✅ index.ts composants trouvé`);
      const expectedComponentExports = EXPECTED_COMPONENTS_DIR.map(c => c.replace('.tsx', ''));
      if (checkExports(componentsIndex, expectedComponentExports)) {
        console.log(`✅ Exports composants valides`);
      } else {
        console.log(`❌ Exports composants invalides`);
      }
    }

    if (componentsFound >= EXPECTED_COMPONENTS_DIR.length * 0.8) {
      passTest(`${componentsFound}/${EXPECTED_COMPONENTS_DIR.length} composants trouvés`);
    } else {
      failTest('Composants manquants');
    }
  } else {
    failTest('Dossier components manquant');
  }

  // Test 4: Exports principaux
  startTest('Exports principaux index.ts');
  const mainIndex = path.join(AUDIO_SCREEN_DIR, 'index.ts');

  if (fileExists(mainIndex)) {
    const expectedMainExports = [
      'AudioScreen',
      'AudioFolder',
      'AudioRecording',
      'useAudioFolders',
      'useAudioScreenState',
      'useAudioCapture',
    ];

    const content = readFileContent(mainIndex);
    let exportsFound = 0;

    for (const exportName of expectedMainExports) {
      if (content && content.includes(exportName)) {
        console.log(`✅ Export ${exportName} trouvé`);
        exportsFound++;
      } else {
        console.log(`❌ Export ${exportName} manquant`);
      }
    }

    if (exportsFound >= expectedMainExports.length * 0.8) {
      passTest(`${exportsFound}/${expectedMainExports.length} exports principaux trouvés`);
    } else {
      failTest('Exports principaux manquants');
    }
  } else {
    failTest('Fichier index.ts principal manquant');
  }

  // Test 5: Validation des imports dans AudioScreen.tsx
  startTest('Imports dans AudioScreen.tsx');
  const audioScreenPath = path.join(AUDIO_SCREEN_DIR, 'AudioScreen.tsx');

  if (fileExists(audioScreenPath)) {
    const content = readFileContent(audioScreenPath);
    const expectedImports = [
      'useAudioFolders',
      'useAudioScreenState',
      'useAudioCapture',
      'AudioScreenHeader',
      'AudioFolderCard',
      'AudioFAB',
      'EmptyState',
      'AudioSearchBar',
      'AudioLevelIndicator',
      'RippleButton',
    ];

    let importsFound = 0;
    for (const importName of expectedImports) {
      if (content && content.includes(importName)) {
        console.log(`✅ Import ${importName} trouvé`);
        importsFound++;
      } else {
        console.log(`❌ Import ${importName} manquant`);
      }
    }

    if (importsFound >= expectedImports.length * 0.8) {
      passTest(`${importsFound}/${expectedImports.length} imports trouvés`);
    } else {
      failTest('Imports manquants');
    }
  } else {
    failTest('AudioScreen.tsx manquant');
  }
}

function validateFunctionality() {
  console.log('\n⚙️ === VALIDATION FONCTIONNALITÉ ===\n');

  // Test 6: Validation du connecteur
  startTest('AudioScreenConnector.tsx');
  const connectorPath = path.join(AUDIO_SCREEN_DIR, 'AudioScreenConnector.tsx');

  if (fileExists(connectorPath)) {
    const content = readFileContent(connectorPath);
    const features = [
      'NavigationContainer',
      'AudioScreen',
      'UltraModernUI',
      'RippleButton',
      'AudioFAB',
      'useMicroInteractions',
      'useAudioFolders',
      'useAudioCapture',
    ];

    let featuresFound = 0;
    for (const feature of features) {
      if (content && content.includes(feature)) {
        console.log(`✅ Fonctionnalité ${feature} trouvée`);
        featuresFound++;
      } else {
        console.log(`❌ Fonctionnalité ${feature} manquante`);
      }
    }

    if (featuresFound >= features.length * 0.8) {
      passTest(`${featuresFound}/${features.length} fonctionnalités connectées`);
    } else {
      failTest('Fonctionnalités manquantes');
    }
  } else {
    failTest('AudioScreenConnector.tsx manquant');
  }

  // Test 7: Validation des types
  startTest('Types TypeScript');
  const typesPath = path.join(AUDIO_SCREEN_DIR, 'types.ts');

  if (fileExists(typesPath)) {
    const content = readFileContent(typesPath);
    const expectedTypes = [
      'AudioFolder',
      'AudioRecording',
      'AudioScreenState',
      'AudioFolderStats',
    ];

    let typesFound = 0;
    for (const type of expectedTypes) {
      if (content && content.includes(`interface ${type}`) || content.includes(`type ${type}`)) {
        console.log(`✅ Type ${type} trouvé`);
        typesFound++;
      } else {
        console.log(`❌ Type ${type} manquant`);
      }
    }

    if (typesFound >= expectedTypes.length) {
      passTest(`${typesFound}/${expectedTypes.length} types trouvés`);
    } else {
      failTest('Types manquants');
    }
  } else {
    failTest('types.ts manquant');
  }

  // Test 8: Validation de la documentation
  startTest('Documentation de connexion');
  const readmePath = path.join(AUDIO_SCREEN_DIR, 'README_CONNECTION.md');

  if (fileExists(readmePath)) {
    const content = readFileContent(readmePath);
    const docSections = [
      'Connexions Actives',
      'Utilisation Rapide',
      'Interface Ultra-Moderne',
      'Micro-Interactions',
      'FULLY CONNECTED',
    ];

    let sectionsFound = 0;
    for (const section of docSections) {
      if (content && content.includes(section)) {
        console.log(`✅ Section "${section}" trouvée`);
        sectionsFound++;
      } else {
        console.log(`❌ Section "${section}" manquante`);
      }
    }

    if (sectionsFound >= docSections.length) {
      passTest(`${sectionsFound}/${docSections.length} sections documentées`);
    } else {
      failTest('Documentation incomplète');
    }
  } else {
    failTest('README_CONNECTION.md manquant');
  }
}

function runConnectionTests() {
  console.log('🔗 === VALIDATION CONNEXION AUDIOSCREEN ===\n');

  validateFileStructure();
  validateFunctionality();

  // Résumé final
  console.log('\n📊 === RÉSUMÉ VALIDATION CONNEXION ===');
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const total = passed + failed;

  console.log(`✅ Tests réussis: ${passed}/${total}`);
  console.log(`❌ Tests échoués: ${failed}/${total}`);
  console.log(`📈 Taux de succès: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Tests échoués:');
    testResults.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`  • ${result.message}`);
    });
  }

  // Évaluation de la connexion
  console.log('\n🎯 === ÉVALUATION DE LA CONNEXION ===');
  if (passed >= total * 0.9) {
    console.log('✅ CONNEXION PARFAITE - AudioScreen est complètement connecté');
    console.log('🚀 Prêt pour utilisation en production');
    return { status: 'PERFECTLY_CONNECTED', score: (passed / total) * 100 };
  } else if (passed >= total * 0.8) {
    console.log('✅ CONNEXION EXCELLENTE - AudioScreen est bien connecté');
    console.log('⚡ Quelques optimisations possibles');
    return { status: 'EXCELLENTLY_CONNECTED', score: (passed / total) * 100 };
  } else if (passed >= total * 0.7) {
    console.log('⚠️ CONNEXION BONNE - AudioScreen est connecté mais nécessite des ajustements');
    console.log('🔧 Vérifier les dépendances manquantes');
    return { status: 'WELL_CONNECTED', score: (passed / total) * 100 };
  } else {
    console.log('❌ CONNEXION INSUFFISANTE - Problèmes majeurs détectés');
    console.log('🛠️ Intervention immédiate requise');
    return { status: 'INSUFFICIENTLY_CONNECTED', score: (passed / total) * 100 };
  }
}

// Exécution si appelé directement
if (require.main === module) {
  try {
    const result = runConnectionTests();
    process.exit(result.status.includes('CONNECTED') ? 0 : 1);
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
    process.exit(1);
  }
}

module.exports = { runConnectionTests };
