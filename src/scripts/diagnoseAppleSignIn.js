#!/usr/bin/env node

/**
 * Script de diagnostic pour Apple Sign-In
 * 
 * Usage: node src/scripts/diagnoseAppleSignIn.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC APPLE SIGN-IN\n');
console.log('='.repeat(50));

// 1. Vérifier les dépendances
console.log('\n📦 1. VÉRIFICATION DES DÉPENDANCES');
console.log('-'.repeat(30));

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const appleAuth = packageJson.dependencies['@invertase/react-native-apple-authentication'];
  
  if (appleAuth) {
    console.log('✅ Package Apple Auth installé:', appleAuth);
  } else {
    console.log('❌ Package Apple Auth MANQUANT');
  }
} catch (error) {
  console.log('❌ Erreur lecture package.json:', error.message);
}

// 2. Vérifier les pods iOS
console.log('\n🍎 2. VÉRIFICATION PODS iOS');
console.log('-'.repeat(30));

try {
  const podfileLock = fs.readFileSync('ios/Podfile.lock', 'utf8');
  
  if (podfileLock.includes('RNAppleAuthentication')) {
    const match = podfileLock.match(/RNAppleAuthentication \(([\d.]+)\)/);
    console.log('✅ Pod RNAppleAuthentication installé:', match ? match[1] : 'version inconnue');
  } else {
    console.log('❌ Pod RNAppleAuthentication MANQUANT');
  }
} catch (error) {
  console.log('❌ Erreur lecture Podfile.lock:', error.message);
}

// 3. Vérifier les entitlements
console.log('\n🔐 3. VÉRIFICATION ENTITLEMENTS');
console.log('-'.repeat(30));

try {
  const entitlements = fs.readFileSync('ios/Nyth/NythRelease.entitlements', 'utf8');
  
  if (entitlements.includes('com.apple.developer.applesignin')) {
    console.log('✅ Entitlement Apple Sign-In présent');
  } else {
    console.log('❌ Entitlement Apple Sign-In MANQUANT');
  }
} catch (error) {
  console.log('❌ Erreur lecture entitlements:', error.message);
}

// 4. Vérifier Info.plist
console.log('\n📄 4. VÉRIFICATION INFO.PLIST');
console.log('-'.repeat(30));

try {
  const infoPlist = fs.readFileSync('ios/Nyth/Info.plist', 'utf8');
  
  // Vérifier Bundle ID
  const bundleIdMatch = infoPlist.match(/<key>CFBundleIdentifier<\/key>\s*<string>(.+?)<\/string>/);
  if (bundleIdMatch) {
    console.log('✅ Bundle ID trouvé:', bundleIdMatch[1]);
  }
  
} catch (error) {
  console.log('❌ Erreur lecture Info.plist:', error.message);
}

// 5. Vérifier Firebase config
console.log('\n🔥 5. VÉRIFICATION FIREBASE CONFIG');
console.log('-'.repeat(30));

try {
  const firebaseConfig = fs.readFileSync('ios/GoogleService-Info.plist', 'utf8');
  
  const projectIdMatch = firebaseConfig.match(/<key>PROJECT_ID<\/key>\s*<string>(.+?)<\/string>/);
  const bundleIdMatch = firebaseConfig.match(/<key>BUNDLE_ID<\/key>\s*<string>(.+?)<\/string>/);
  
  if (projectIdMatch) {
    console.log('✅ Projet Firebase:', projectIdMatch[1]);
  }
  
  if (bundleIdMatch) {
    console.log('✅ Bundle ID Firebase:', bundleIdMatch[1]);
  }
  
} catch (error) {
  console.log('❌ Erreur lecture GoogleService-Info.plist:', error.message);
}

// 6. Recommandations
console.log('\n💡 6. RECOMMANDATIONS');
console.log('-'.repeat(30));
console.log('1. ✅ Vérifier que Apple Sign-In est ACTIVÉ dans Firebase Console');
console.log('   👉 https://console.firebase.google.com > Authentication > Sign-in method');
console.log('');
console.log('2. ✅ Vérifier la configuration Apple Developer Console');
console.log('   👉 https://developer.apple.com > Certificates, Identifiers & Profiles');
console.log('');
console.log('3. ✅ Tester sur un appareil iOS réel (pas simulateur)');
console.log('');
console.log('4. ✅ Vérifier les logs Xcode pour erreurs spécifiques');

console.log('\n' + '='.repeat(50));
console.log('🎯 DIAGNOSTIC TERMINÉ');
console.log('='.repeat(50));
