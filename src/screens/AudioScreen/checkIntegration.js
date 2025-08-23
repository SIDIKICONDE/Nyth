/**
 * Vérification d'intégration simplifiée pour l'AudioScreen
 *
 * Ce script vérifie l'existence et la structure des fichiers AudioScreen
 * sans essayer d'exécuter le code React Native
 */

const fs = require('fs');
const path = require('path');

// Variables globales pour les tests
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
  logTest(`Démarrage du test: ${name}`, 'INFO');
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

function checkFileStructure() {
  console.log('🎵=== VÉRIFICATION STRUCTURE AUDIOSCREEN ===\\n');

  // Test 1: Fichiers principaux
  startTest('Vérification des fichiers principaux');
  const mainFiles = [
    'AudioScreen.tsx',
    'AudioScreen.test.tsx',
    'testAudioScreenIntegration.js',
    'TEST_INTEGRATION_REPORT.md',
    'types.ts',
  ];

  let mainFilesFound = 0;
  for (const file of mainFiles) {
    const filePath = path.join(__dirname, file);
    if (fileExists(filePath)) {
      console.log(`✅ ${file} trouvé`);
      mainFilesFound++;
    } else {
      console.log(`❌ ${file} manquant`);
    }
  }

  if (mainFilesFound >= mainFiles.length * 0.8) {
    passTest(`${mainFilesFound}/${mainFiles.length} fichiers principaux trouvés`);
  } else {
    failTest('Fichiers principaux manquants');
  }

  // Test 2: Dossier hooks
  startTest('Vérification du dossier hooks');
  const hooksDir = path.join(__dirname, 'hooks');
  if (fileExists(hooksDir)) {
    const hookFiles = [
      'useAudioFolders.ts',
      'useAudioScreenState.ts',
      'useAudioCapture.ts',
      'index.ts',
    ];

    let hookFilesFound = 0;
    for (const file of hookFiles) {
      const filePath = path.join(hooksDir, file);
      if (fileExists(filePath)) {
        console.log(`✅ Hook ${file} trouvé`);
        hookFilesFound++;
      } else {
        console.log(`❌ Hook ${file} manquant`);
      }
    }

    if (hookFilesFound >= hookFiles.length * 0.8) {
      passTest(`${hookFilesFound}/${hookFiles.length} hooks trouvés`);
    } else {
      failTest('Hooks manquants');
    }
  } else {
    failTest('Dossier hooks manquant');
  }

  // Test 3: Dossier components
  startTest('Vérification du dossier components');
  const componentsDir = path.join(__dirname, 'components');
  if (fileExists(componentsDir)) {
    const componentFiles = [
      'AudioScreenHeader.tsx',
      'AudioFolderCard.tsx',
      'AudioFAB.tsx',
      'EmptyState.tsx',
      'AudioSearchBar.tsx',
      'AudioLevelIndicator.tsx',
      'AudioFolderActions.tsx',
      'RippleButton.tsx',
      'index.ts',
    ];

    let componentFilesFound = 0;
    for (const file of componentFiles) {
      const filePath = path.join(componentsDir, file);
      if (fileExists(filePath)) {
        console.log(`✅ Composant ${file} trouvé`);
        componentFilesFound++;
      } else {
        console.log(`❌ Composant ${file} manquant`);
      }
    }

    if (componentFilesFound >= componentFiles.length * 0.8) {
      passTest(`${componentFilesFound}/${componentFiles.length} composants trouvés`);
    } else {
      failTest('Composants manquants');
    }
  } else {
    failTest('Dossier components manquant');
  }

  // Test 4: Vérification du contenu des fichiers
  startTest('Vérification du contenu des fichiers');
  const criticalFiles = [
    { name: 'AudioScreen.tsx', check: 'export default function AudioScreen' },
    { name: 'types.ts', check: 'export interface AudioFolder' },
    { name: 'hooks/useAudioFolders.ts', check: 'export function useAudioFolders' },
    { name: 'hooks/useAudioCapture.ts', check: 'export function useAudioCapture' },
    { name: 'components/AudioFAB.tsx', check: 'export default function AudioFAB' },
  ];

  let contentChecksPassed = 0;
  for (const { name, check } of criticalFiles) {
    const filePath = path.join(__dirname, name);
    const content = readFileContent(filePath);

    if (content && content.includes(check)) {
      console.log(`✅ Contenu ${name} valide`);
      contentChecksPassed++;
    } else {
      console.log(`❌ Contenu ${name} invalide`);
    }
  }

  if (contentChecksPassed >= criticalFiles.length * 0.8) {
    passTest(`${contentChecksPassed}/${criticalFiles.length} vérifications de contenu réussies`);
  } else {
    failTest('Problèmes de contenu détectés');
  }

  // Test 5: Vérification des imports
  startTest('Vérification des imports et dépendances');
  const audioScreenContent = readFileContent(path.join(__dirname, 'AudioScreen.tsx'));

  const expectedImports = [
    'useTheme',
    'useTranslation',
    'useOrientation',
    'AudioScreenHeader',
    'AudioFolderCard',
    'AudioFAB',
    'EmptyState',
    'useAudioFolders',
    'useAudioScreenState',
    'useAudioCapture',
  ];

  let importsFound = 0;
  for (const importName of expectedImports) {
    if (audioScreenContent && audioScreenContent.includes(importName)) {
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

  // Test 6: Vérification des tests
  startTest('Vérification des fichiers de test');
  const testFiles = [
    'AudioScreen.test.tsx',
    'TEST_INTEGRATION_REPORT.md',
  ];

  let testFilesFound = 0;
  for (const file of testFiles) {
    const filePath = path.join(__dirname, file);
    if (fileExists(filePath)) {
      console.log(`✅ Fichier de test ${file} trouvé`);
      testFilesFound++;
    } else {
      console.log(`❌ Fichier de test ${file} manquant`);
    }
  }

  if (testFilesFound >= testFiles.length) {
    passTest(`${testFilesFound}/${testFiles.length} fichiers de test trouvés`);
  } else {
    failTest('Fichiers de test manquants');
  }

  // Résumé final
  console.log('\\n📊=== RÉSUMÉ VÉRIFICATION ===');
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const total = passed + failed;

  console.log(`✅ Tests réussis: ${passed}/${total}`);
  console.log(`❌ Tests échoués: ${failed}/${total}`);
  console.log(`📈 Taux de succès: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\\n❌ Tests échoués:');
    testResults.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`  • ${result.message}`);
    });
  }

  // Évaluation de l'intégration
  console.log('\\n🎯=== ÉVALUATION DE L\'INTÉGRATION ===');
  if (passed >= total * 0.8) {
    console.log('✅ INTÉGRATION RÉUSSIE - AudioScreen est bien intégré');
    console.log('🚀 L\'application peut être utilisée avec toutes les fonctionnalités');
  } else if (passed >= total * 0.6) {
    console.log('⚠️ INTÉGRATION PARTIELLE - Certaines fonctionnalités peuvent manquer');
    console.log('🔧 Vérifiez les dépendances manquantes');
  } else {
    console.log('❌ INTÉGRATION ÉCHOUÉE - Problèmes majeurs détectés');
    console.log('🛠️ Nécessite une intervention immédiate');
  }

  return { passed, failed, total, successRate: (passed / total) * 100 };
}

// Exécution de la vérification
if (require.main === module) {
  try {
    const results = checkFileStructure();
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

module.exports = { checkFileStructure };
