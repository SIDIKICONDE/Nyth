#!/usr/bin/env node

/**
 * Script de vérification de la configuration Google Sign-In
 * Vérifie la cohérence entre tous les fichiers de configuration
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILES = {
  env: '.env',
  googleServiceInfo: 'ios/GoogleService-Info.plist',
  infoPlist: 'ios/Nyth/Info.plist'
};

function readEnvFile() {
  try {
    const envContent = fs.readFileSync(CONFIG_FILES.env, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        envVars[key] = valueParts.join('=');
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Erreur lecture .env:', error.message);
    return {};
  }
}

function extractFromPlist(filePath, key) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const keyRegex = new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`);
    const match = content.match(keyRegex);
    return match ? match[1] : null;
  } catch (error) {
    console.error(`❌ Erreur lecture ${filePath}:`, error.message);
    return null;
  }
}

function checkGoogleConfiguration() {
  console.log('🔍 Vérification de la configuration Google Sign-In...\n');
  
  // Lire les configurations
  const envVars = readEnvFile();
  const googleServiceClientId = extractFromPlist(CONFIG_FILES.googleServiceInfo, 'CLIENT_ID');
  const googleServiceAndroidId = extractFromPlist(CONFIG_FILES.googleServiceInfo, 'ANDROID_CLIENT_ID');
  const infoPlistClientId = extractFromPlist(CONFIG_FILES.infoPlist, 'GIDClientID');
  const bundleId = extractFromPlist(CONFIG_FILES.googleServiceInfo, 'BUNDLE_ID');
  
  // Afficher les configurations trouvées
  console.log('📋 Configurations trouvées:');
  console.log(`  .env GOOGLE_WEB_CLIENT_ID: ${envVars.GOOGLE_WEB_CLIENT_ID || '❌ Manquant'}`);
  console.log(`  .env GOOGLE_IOS_CLIENT_ID: ${envVars.GOOGLE_IOS_CLIENT_ID || '❌ Manquant'}`);
  console.log(`  .env GOOGLE_ANDROID_CLIENT_ID: ${envVars.GOOGLE_ANDROID_CLIENT_ID || '❌ Manquant'}`);
  console.log(`  GoogleService-Info.plist CLIENT_ID: ${googleServiceClientId || '❌ Manquant'}`);
  console.log(`  GoogleService-Info.plist ANDROID_CLIENT_ID: ${googleServiceAndroidId || '❌ Manquant'}`);
  console.log(`  Info.plist GIDClientID: ${infoPlistClientId || '❌ Manquant'}`);
  console.log(`  Bundle ID: ${bundleId || '❌ Manquant'}`);
  console.log();
  
  // Vérifications
  let errors = [];
  let warnings = [];
  
  // Vérifier que les IDs iOS correspondent
  if (envVars.GOOGLE_WEB_CLIENT_ID !== googleServiceClientId) {
    errors.push('GOOGLE_WEB_CLIENT_ID (.env) ≠ CLIENT_ID (GoogleService-Info.plist)');
  }
  
  if (envVars.GOOGLE_IOS_CLIENT_ID !== googleServiceClientId) {
    warnings.push('GOOGLE_IOS_CLIENT_ID (.env) ≠ CLIENT_ID (GoogleService-Info.plist)');
  }
  
  if (infoPlistClientId !== googleServiceClientId) {
    errors.push('GIDClientID (Info.plist) ≠ CLIENT_ID (GoogleService-Info.plist)');
  }
  
  // Vérifier l'ID Android
  if (envVars.GOOGLE_ANDROID_CLIENT_ID && envVars.GOOGLE_ANDROID_CLIENT_ID !== googleServiceAndroidId) {
    errors.push('GOOGLE_ANDROID_CLIENT_ID (.env) ≠ ANDROID_CLIENT_ID (GoogleService-Info.plist)');
  }
  
  // Vérifier les variables manquantes
  if (!envVars.GOOGLE_WEB_CLIENT_ID) {
    errors.push('GOOGLE_WEB_CLIENT_ID manquant dans .env');
  }
  
  if (!googleServiceClientId) {
    errors.push('CLIENT_ID manquant dans GoogleService-Info.plist');
  }
  
  if (!infoPlistClientId) {
    errors.push('GIDClientID manquant dans Info.plist');
  }
  
  // Afficher les résultats
  console.log('📊 Résultats de la vérification:');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Configuration Google parfaite !');
  } else {
    if (errors.length > 0) {
      console.log('❌ Erreurs critiques:');
      errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  Avertissements:');
      warnings.forEach(warning => console.log(`   • ${warning}`));
    }
  }
  
  console.log();
  
  // Suggestions de correction
  if (errors.length > 0) {
    console.log('🔧 Suggestions de correction:');
    console.log('1. Utiliser les mêmes Client IDs dans tous les fichiers');
    console.log('2. Télécharger un nouveau GoogleService-Info.plist depuis Firebase');
    console.log('3. Vérifier la configuration dans Google Cloud Console');
    console.log('4. Exécuter: make check-env pour vérifier la configuration générale');
  }
  
  return errors.length === 0;
}

// Exécuter la vérification
if (require.main === module) {
  const isValid = checkGoogleConfiguration();
  process.exit(isValid ? 0 : 1);
}

module.exports = { checkGoogleConfiguration };
