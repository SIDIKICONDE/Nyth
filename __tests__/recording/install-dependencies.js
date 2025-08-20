#!/usr/bin/env node

/**
 * Script d'installation des dépendances pour les tests d'enregistrement vidéo
 * Remplace expo-media-library par les alternatives React Native
 */

const { execSync } = require('child_process');

console.log('🚀 Installation des dépendances pour les tests d\'enregistrement vidéo...\n');

try {
  // Installation des dépendances de test
  console.log('📦 Installation des dépendances de test...');
  execSync('npm install --save-dev @testing-library/react-native @testing-library/jest-native', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Installation des dépendances React Native (remplacement d'expo-media-library)
  console.log('📦 Installation des dépendances React Native...');
  execSync('npm install @react-native-camera-roll/camera-roll react-native-permissions react-native-fs --legacy-peer-deps', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ Toutes les dépendances ont été installées avec succès !');
  console.log('\n🎯 Dépendances installées :');
  console.log('   - @testing-library/react-native');
  console.log('   - @testing-library/jest-native');
  console.log('   - @react-native-camera-roll/camera-roll (remplace expo-media-library)');
  console.log('   - react-native-permissions');
  console.log('   - react-native-fs');

  console.log('\n📋 Prochaines étapes :');
  console.log('   1. Lier les dépendances React Native si nécessaire');
  console.log('   2. Exécuter les tests avec : npm test -- __tests__/recording/');
  console.log('   3. Ou utiliser : node __tests__/recording/test-runner.js');

} catch (error) {
  console.error('\n❌ Erreur lors de l\'installation des dépendances :', error.message);
  console.log('\n🔧 Solutions possibles :');
  console.log('   - Vérifiez votre connexion internet');
  console.log('   - Assurez-vous d\'avoir les permissions d\'installation');
  console.log('   - Essayez d\'installer les dépendances manuellement');

  process.exit(1);
}
