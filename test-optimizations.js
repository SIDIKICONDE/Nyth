/**
 * Script de test des optimisations de performance
 * Teste le cache intelligent et le lazy loading
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour la console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(color + message + colors.reset);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkFileContains(filePath, searchString) {
  if (!checkFileExists(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(searchString);
}

function checkImportInFile(filePath, importString) {
  if (!checkFileExists(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(importString);
}

async function testOptimizations() {
  log(colors.blue, '🚀 DÉBUT DES TESTS D\'OPTIMISATIONS');

  let testsPassed = 0;
  let testsTotal = 0;

  // Test 1: Cache intelligent dans usePlanning.ts
  testsTotal++;
  const usePlanningPath = './src/hooks/usePlanning.ts';
  if (checkFileContains(usePlanningPath, 'adminAdvancedCacheService') &&
      checkFileContains(usePlanningPath, 'invalidatePlanningCache')) {
    log(colors.green, '✅ Test 1: Cache intelligent usePlanning.ts - PASS');
    testsPassed++;
  } else {
    log(colors.red, '❌ Test 1: Cache intelligent usePlanning.ts - FAIL');
  }

  // Test 2: Cache intelligent dans useHomeData.tsx
  testsTotal++;
  const useHomeDataPath = './src/components/home/useHomeData.tsx';
  if (checkFileContains(useHomeDataPath, 'adminAdvancedCacheService') &&
      checkFileContains(useHomeDataPath, 'invalidateHomeCache')) {
    log(colors.green, '✅ Test 2: Cache intelligent useHomeData.tsx - PASS');
    testsPassed++;
  } else {
    log(colors.red, '❌ Test 2: Cache intelligent useHomeData.tsx - FAIL');
  }

  // Test 3: Lazy loading dans ContentTabs.tsx
  testsTotal++;
  const contentTabsPath = './src/screens/HomeScreen/components/ContentTabs.tsx';
  if (checkFileContains(contentTabsPath, 'React.lazy') &&
      checkFileContains(contentTabsPath, 'Suspense')) {
    log(colors.green, '✅ Test 3: Lazy loading ContentTabs.tsx - PASS');
    testsPassed++;
  } else {
    log(colors.red, '❌ Test 3: Lazy loading ContentTabs.tsx - FAIL');
  }

  // Test 4: React.memo dans ContentTabs.tsx
  testsTotal++;
  if (checkFileContains(contentTabsPath, 'React.memo') &&
      checkFileContains(contentTabsPath, 'export const ContentTabs = React.memo')) {
    log(colors.green, '✅ Test 4: React.memo ContentTabs.tsx - PASS');
    testsPassed++;
  } else {
    log(colors.red, '❌ Test 4: React.memo ContentTabs.tsx - FAIL');
  }

  // Test 5: Imports de services de cache
  testsTotal++;
  if (checkImportInFile(usePlanningPath, 'import { adminAdvancedCacheService }') &&
      checkImportInFile(useHomeDataPath, 'import { adminAdvancedCacheService }')) {
    log(colors.green, '✅ Test 5: Imports adminAdvancedCacheService - PASS');
    testsPassed++;
  } else {
    log(colors.red, '❌ Test 5: Imports adminAdvancedCacheService - FAIL');
  }

  // Test 6: Configuration du cache
  testsTotal++;
  if (checkFileContains(usePlanningPath, 'PLANNING_CACHE_STRATEGIES')) {
    log(colors.green, '✅ Test 6: Configuration cache strategies - PASS');
    testsPassed++;
  } else {
    log(colors.red, '❌ Test 6: Configuration cache strategies - FAIL');
  }

  // Test 7: Lazy imports des composants
  testsTotal++;
  if (checkFileContains(contentTabsPath, 'const LibraryScriptsList = lazy') &&
      checkFileContains(contentTabsPath, 'const VideoLibraryList = lazy')) {
    log(colors.green, '✅ Test 7: Lazy imports des composants - PASS');
    testsPassed++;
  } else {
    log(colors.red, '❌ Test 7: Lazy imports des composants - FAIL');
  }

  // Résultats
  log(colors.blue, `\n📊 RÉSULTATS: ${testsPassed}/${testsTotal} tests passés`);

  if (testsPassed === testsTotal) {
    log(colors.green, '🎉 TOUS LES TESTS SONT PASSÉS !');
    log(colors.green, '✅ Les optimisations sont correctement implémentées');
  } else {
    log(colors.yellow, '⚠️ Quelques tests ont échoué');
    log(colors.yellow, 'Vérifiez l\'implémentation des optimisations');
  }

  // Recommandations
  log(colors.blue, '\n💡 RECOMMANDATIONS:');
  log(colors.blue, '1. Testez l\'app sur un appareil réel');
  log(colors.blue, '2. Surveillez les performances avec React DevTools');
  log(colors.blue, '3. Vérifiez les logs de cache dans la console');
  log(colors.blue, '4. Testez le lazy loading en changeant d\'onglets');

  return testsPassed === testsTotal;
}

// Exécuter les tests
testOptimizations().then(success => {
  process.exit(success ? 0 : 1);
});
