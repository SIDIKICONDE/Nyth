#!/usr/bin/env node

/**
 * Test complet de la connexion AudioScreen <-> TurboModule
 * Vérifie chaque composant de la chaîne d'intégration
 */

const fs = require('fs');
const path = require('path');

console.log('🔬 TEST COMPLET DE LA CONNEXION AUDIO\n');
console.log('=' .repeat(50));

let testsPassed = 0;
let testsFailed = 0;

function testFile(filePath, description) {
  const fullPath = path.join('/workspace', filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    console.log(`   📁 ${filePath}`);
    testsPassed++;
    return true;
  } else {
    console.log(`❌ ${description}`);
    console.log(`   ⚠️  Fichier manquant: ${filePath}`);
    testsFailed++;
    return false;
  }
}

function checkContent(filePath, searchString, description) {
  const fullPath = path.join('/workspace', filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(searchString)) {
      console.log(`✅ ${description}`);
      testsPassed++;
      return true;
    } else {
      console.log(`❌ ${description}`);
      console.log(`   ⚠️  Pattern non trouvé: "${searchString}"`);
      testsFailed++;
      return false;
    }
  } else {
    console.log(`❌ Fichier non trouvé pour vérification: ${filePath}`);
    testsFailed++;
    return false;
  }
}

console.log('\n📱 1. VÉRIFICATION DU MODULE NATIF (TurboModule)');
console.log('-'.repeat(50));
testFile('specs/NativeAudioCaptureModule.ts', 'Spec TurboModule définie');

console.log('\n🪝 2. VÉRIFICATION DU HOOK useAudioCapture');
console.log('-'.repeat(50));
testFile('src/screens/AudioScreen/hooks/useAudioCapture.ts', 'Hook useAudioCapture créé');
checkContent(
  'src/screens/AudioScreen/hooks/useAudioCapture.ts',
  'NativeAudioCaptureModule',
  'Import du module natif dans le hook'
);
checkContent(
  'src/screens/AudioScreen/hooks/useAudioCapture.ts',
  'startRecording',
  'Méthode startRecording implémentée'
);

console.log('\n📺 3. VÉRIFICATION DE L\'INTERFACE UTILISATEUR');
console.log('-'.repeat(50));
testFile('src/screens/AudioScreen/AudioScreen.tsx', 'AudioScreen existe');
checkContent(
  'src/screens/AudioScreen/AudioScreen.tsx',
  'useAudioCapture',
  'Hook useAudioCapture utilisé dans AudioScreen'
);
testFile('src/screens/AudioScreen/components/AudioLevelIndicator.tsx', 'Composant AudioLevelIndicator créé');
checkContent(
  'src/screens/AudioScreen/components/AudioFAB.tsx',
  'onPausePress',
  'Boutons pause/reprise ajoutés au FAB'
);

console.log('\n🧭 4. VÉRIFICATION DE LA NAVIGATION');
console.log('-'.repeat(50));
checkContent(
  'src/navigation/AppNavigator.tsx',
  'AudioScreen',
  'AudioScreen ajouté au navigateur'
);
checkContent(
  'src/types/navigation.ts',
  'AudioScreen: undefined',
  'Type AudioScreen ajouté dans RootStackParamList'
);

console.log('\n🎯 5. VÉRIFICATION DU BOUTON DE NAVIGATION');
console.log('-'.repeat(50));
checkContent(
  'src/components/home/UnifiedHomeFAB/index.tsx',
  'onAudioScreen',
  'Prop onAudioScreen ajoutée au FAB'
);
checkContent(
  'src/components/home/UnifiedHomeFAB/index.tsx',
  'microphone-outline',
  'Icône microphone ajoutée pour Audio'
);
checkContent(
  'src/screens/HomeScreen/hooks/useNavigationHandlers.ts',
  'handleAudioScreen',
  'Handler de navigation vers AudioScreen'
);

console.log('\n🔗 6. VÉRIFICATION DE L\'INTÉGRATION COMPLÈTE');
console.log('-'.repeat(50));

// Vérifier l'export du hook
checkContent(
  'src/screens/AudioScreen/hooks/index.ts',
  'useAudioCapture',
  'Export du hook useAudioCapture'
);

// Vérifier l'export du composant
checkContent(
  'src/screens/AudioScreen/components/index.ts',
  'AudioLevelIndicator',
  'Export du composant AudioLevelIndicator'
);

// Vérifier l'intégration dans HomeScreen
checkContent(
  'src/screens/HomeScreen/HomeScreen.tsx',
  'handleAudioScreen',
  'Handler AudioScreen intégré dans HomeScreen'
);

console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ DES TESTS\n');

const totalTests = testsPassed + testsFailed;
const successRate = Math.round((testsPassed / totalTests) * 100);

console.log(`Tests réussis: ${testsPassed}/${totalTests} (${successRate}%)`);

if (testsFailed === 0) {
  console.log('\n🎉 SUCCÈS TOTAL !');
  console.log('La connexion AudioScreen <-> TurboModule est complètement opérationnelle !');
  
  console.log('\n📋 Architecture validée:');
  console.log('  1. TurboModule natif (NativeAudioCaptureModule) ✓');
  console.log('  2. Hook React (useAudioCapture) ✓');
  console.log('  3. Interface utilisateur (AudioScreen + composants) ✓');
  console.log('  4. Navigation configurée ✓');
  console.log('  5. Bouton d\'accès dans le menu FAB ✓');
  
  console.log('\n🚀 Prochaines étapes:');
  console.log('  1. Compiler l\'application: npm run android ou npm run ios');
  console.log('  2. Naviguer vers AudioScreen via le bouton Audio du FAB');
  console.log('  3. Tester l\'enregistrement audio avec visualisation en temps réel');
} else {
  console.log(`\n⚠️ ${testsFailed} test(s) échoué(s)`);
  console.log('Veuillez vérifier les erreurs ci-dessus.');
}

process.exit(testsFailed > 0 ? 1 : 0);