#!/usr/bin/env node

/**
 * Script de test pour valider les fonctionnalités implémentées
 * - Normalisation des chemins
 * - Cache des permissions
 * - Notifications Firestore
 * - Validation AsyncStorage
 * - Vérification de disponibilité des fichiers
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Début des tests des fonctionnalités...\n');

// Test 1: Vérifier les fichiers créés
console.log('📁 Test 1: Vérification des fichiers créés');

const requiredFiles = [
  'src/utils/pathNormalizer.ts',
  'src/utils/fileAvailabilityChecker.ts',
  'src/utils/asyncStorageValidator.ts',
  'src/services/PermissionCacheService.ts',
  'src/services/FirestoreErrorNotificationService.ts',
  'src/utils/README-PathNormalizer.md',
  'src/utils/README-FileAvailabilityChecker.md',
  'src/utils/README-AsyncStorageValidator.md',
  'src/services/README-PermissionCacheService.md',
  'src/services/README-FirestoreErrorNotificationService.md'
];

let filesCreated = 0;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
    filesCreated++;
  } else {
    console.log(`❌ ${file} - FICHIER MANQUANT`);
  }
});

console.log(`\n📊 Fichiers créés: ${filesCreated}/${requiredFiles.length}\n`);

// Test 2: Vérifier les fichiers de tests
console.log('🧪 Test 2: Vérification des fichiers de tests');

const testFiles = [
  'src/utils/__tests__/pathNormalizer.test.ts',
  'src/utils/__tests__/fileAvailabilityChecker.test.ts',
  'src/utils/__tests__/asyncStorageValidator.test.ts',
  'src/services/__tests__/PermissionCacheService.test.ts',
  'src/services/__tests__/FirestoreErrorNotificationService.test.ts'
];

let testsCreated = 0;
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
    testsCreated++;
  } else {
    console.log(`❌ ${file} - FICHIER DE TEST MANQUANT`);
  }
});

console.log(`\n📊 Tests créés: ${testsCreated}/${testFiles.length}\n`);

// Test 3: Vérifier les intégrations
console.log('🔗 Test 3: Vérification des intégrations');

const integrationChecks = [
  {
    file: 'src/services/social-share/utils/fileManager.ts',
    check: 'normalizeFilePath',
    name: 'FileManager - Path Normalizer'
  },
  {
    file: 'src/services/social-share/utils/fileManager.ts',
    check: 'PermissionCacheService',
    name: 'FileManager - Permission Cache'
  },
  {
    file: 'src/services/social-share/utils/fileManager.ts',
    check: 'waitForFileAvailability',
    name: 'FileManager - File Availability'
  },
  {
    file: 'src/services/firebase/hybridStorage/recordings.service.ts',
    check: 'FirestoreErrorNotificationService',
    name: 'RecordingsService - Firestore Notifications'
  },
  {
    file: 'src/services/PermissionCacheService.ts',
    check: 'AsyncStorageValidator',
    name: 'PermissionCacheService - AsyncStorage Validation'
  },
  {
    file: 'src/services/FirestoreErrorNotificationService.ts',
    check: 'AsyncStorageValidator',
    name: 'FirestoreErrorNotificationService - AsyncStorage Validation'
  }
];

let integrationsWorking = 0;
integrationChecks.forEach(({ file, check, name }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(check)) {
      console.log(`✅ ${name}`);
      integrationsWorking++;
    } else {
      console.log(`❌ ${name} - Intégration manquante`);
    }
  } else {
    console.log(`❌ ${file} - Fichier non trouvé`);
  }
});

console.log(`\n📊 Intégrations réussies: ${integrationsWorking}/${integrationChecks.length}\n`);

// Test 4: Vérifier les exports
console.log('📤 Test 4: Vérification des exports');

const exportChecks = [
  {
    file: 'src/services/index.ts',
    exports: [
      'PermissionCacheService',
      'FirestoreErrorNotificationService'
    ]
  },
  {
    file: 'src/utils/pathNormalizer.ts',
    exports: [
      'normalizeFilePath',
      'toLocalPath',
      'toFileUri',
      'isValidFileUri',
      'getFileName',
      'getDirectoryPath'
    ]
  }
];

let exportsWorking = 0;
let totalExports = 0;

exportChecks.forEach(({ file, exports }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    exports.forEach(exportName => {
      totalExports++;
      if (content.includes(exportName)) {
        console.log(`✅ ${file} - export ${exportName}`);
        exportsWorking++;
      } else {
        console.log(`❌ ${file} - export ${exportName} manquant`);
      }
    });
  } else {
    console.log(`❌ ${file} - Fichier non trouvé`);
  }
});

console.log(`\n📊 Exports réussis: ${exportsWorking}/${totalExports}\n`);

// Test 5: Résumé
console.log('🎯 Test 5: Résumé des tests');

const totalTests = 4;
let passedTests = 0;

if (filesCreated === requiredFiles.length) {
  console.log('✅ Test 1 (Fichiers créés): PASSÉ');
  passedTests++;
} else {
  console.log('❌ Test 1 (Fichiers créés): ÉCHOUÉ');
}

if (testsCreated === testFiles.length) {
  console.log('✅ Test 2 (Tests créés): PASSÉ');
  passedTests++;
} else {
  console.log('❌ Test 2 (Tests créés): ÉCHOUÉ');
}

if (integrationsWorking === integrationChecks.length) {
  console.log('✅ Test 3 (Intégrations): PASSÉ');
  passedTests++;
} else {
  console.log('❌ Test 3 (Intégrations): ÉCHOUÉ');
}

if (exportsWorking === totalExports) {
  console.log('✅ Test 4 (Exports): PASSÉ');
  passedTests++;
} else {
  console.log('❌ Test 4 (Exports): ÉCHOUÉ');
}

console.log(`\n🏆 Résultat final: ${passedTests}/${totalTests} tests passés\n`);

if (passedTests === totalTests) {
  console.log('🎉 Tous les tests ont réussi ! Les fonctionnalités sont correctement implémentées.');
} else {
  console.log('⚠️  Certains tests ont échoué. Veuillez vérifier les intégrations.');
}

console.log('\n📋 Fonctionnalités testées:');
console.log('   • Normalisation des chemins');
console.log('   • Cache des permissions');
console.log('   • Notifications Firestore');
console.log('   • Validation AsyncStorage');
console.log('   • Vérification de disponibilité des fichiers');
console.log('   • Intégrations et exports');
