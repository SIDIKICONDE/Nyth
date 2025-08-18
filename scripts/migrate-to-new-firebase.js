#!/usr/bin/env node

/**
 * Script de migration vers un nouveau projet Firebase
 * Met à jour tous les fichiers de configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function migrateFirebaseProject() {
  console.log('🔄 Migration vers un nouveau projet Firebase\n');
  
  // Demander les nouvelles informations
  const projectId = await askQuestion('Nouveau Project ID Firebase : ');
  const bundleId = await askQuestion('Nouveau Bundle ID (ex: com.nyth.app) : ');
  const webClientId = await askQuestion('Nouveau Web Client ID : ');
  const iosClientId = await askQuestion('Nouveau iOS Client ID : ');
  const androidClientId = await askQuestion('Nouveau Android Client ID : ');
  const apiKey = await askQuestion('Nouvelle API Key : ');
  
  rl.close();
  
  console.log('\n🔧 Mise à jour des fichiers...\n');
  
  // 1. Mettre à jour .env
  updateEnvFile(projectId, webClientId, iosClientId, androidClientId);
  
  // 2. Mettre à jour server/.env
  updateServerEnv(projectId);
  
  // 3. Créer un nouveau GoogleService-Info.plist template
  createGoogleServiceInfoTemplate(projectId, bundleId, webClientId, apiKey);
  
  // 4. Mettre à jour Info.plist
  updateInfoPlist(bundleId, webClientId);
  
  // 5. Mettre à jour les Bundle IDs dans Xcode
  updateXcodeProject(bundleId);
  
  console.log('✅ Migration terminée !\n');
  console.log('📋 Prochaines étapes :');
  console.log('1. Remplacer ios/GoogleService-Info.plist par le fichier téléchargé depuis Firebase');
  console.log('2. Remplacer android/app/google-services.json par le fichier téléchargé depuis Firebase');
  console.log('3. Exécuter : make check-google');
  console.log('4. Tester l\'authentification');
}

function updateEnvFile(projectId, webClientId, iosClientId, androidClientId) {
  const envPath = '.env';
  const envContent = `# Configuration principale de l'application Nyth
# IMPORTANT: Ne pas commiter ce fichier en production

# URL du serveur backend
SERVER_URL=http://localhost:3000

# Clé API pour l'authentification client-serveur
CLIENT_API_KEY=e9ef73ef8c7c1a7f5abe32c380cc0fd9f72ab3d49a3f6adefba5819bfb30b49b

# Contrôle du proxy (true/false)
BYPASS_PROXY=false

# Configuration Google Sign-In - NOUVEAU PROJET
GOOGLE_WEB_CLIENT_ID=${webClientId}
GOOGLE_IOS_CLIENT_ID=${iosClientId}
GOOGLE_ANDROID_CLIENT_ID=${androidClientId}

# Configuration Apple Sign-In (iOS)
APPLE_SERVICE_ID=your_apple_service_id_here

# Domaine d'authentification Firebase - NOUVEAU PROJET
FIREBASE_AUTH_DOMAIN=${projectId}.firebaseapp.com
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env mis à jour');
}

function updateServerEnv(projectId) {
  const serverEnvPath = 'server/.env';
  let content = '';
  
  try {
    content = fs.readFileSync(serverEnvPath, 'utf8');
    
    // Remplacer le Project ID
    content = content.replace(/FIREBASE_PROJECT_ID=.*/g, `FIREBASE_PROJECT_ID=${projectId}`);
    
    // Note: Il faudra mettre à jour FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 manuellement
    if (!content.includes('# ATTENTION: Mettre à jour FIREBASE_SERVICE_ACCOUNT_KEY_BASE64')) {
      content += '\n# ATTENTION: Mettre à jour FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 avec la nouvelle clé!\n';
    }
    
    fs.writeFileSync(serverEnvPath, content);
    console.log('✅ server/.env mis à jour (pensez à mettre à jour FIREBASE_SERVICE_ACCOUNT_KEY_BASE64)');
  } catch (error) {
    console.log('⚠️ Erreur mise à jour server/.env:', error.message);
  }
}

function createGoogleServiceInfoTemplate(projectId, bundleId, clientId, apiKey) {
  const template = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CLIENT_ID</key>
	<string>${clientId}</string>
	<key>REVERSED_CLIENT_ID</key>
	<string>com.googleusercontent.apps.${clientId.split('-')[0]}-${clientId.split('-')[1]}</string>
	<key>API_KEY</key>
	<string>${apiKey}</string>
	<key>GCM_SENDER_ID</key>
	<string>${clientId.split('-')[0]}</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>${bundleId}</string>
	<key>PROJECT_ID</key>
	<string>${projectId}</string>
	<key>STORAGE_BUCKET</key>
	<string>${projectId}.firebasestorage.app</string>
	<key>IS_ADS_ENABLED</key>
	<false></false>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_APPINVITE_ENABLED</key>
	<true></true>
	<key>IS_GCM_ENABLED</key>
	<true></true>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
	<key>GOOGLE_APP_ID</key>
	<string>1:${clientId.split('-')[0]}:ios:${Math.random().toString(36).substr(2, 9)}</string>
</dict>
</plist>`;

  fs.writeFileSync('ios/GoogleService-Info.plist.template', template);
  console.log('✅ Template GoogleService-Info.plist créé (remplacez par le vrai fichier Firebase)');
}

function updateInfoPlist(bundleId, clientId) {
  const infoPlistPath = 'ios/Nyth/Info.plist';
  
  try {
    let content = fs.readFileSync(infoPlistPath, 'utf8');
    
    // Mettre à jour GIDClientID
    content = content.replace(
      /<key>GIDClientID<\/key>\s*<string>[^<]*<\/string>/g,
      `<key>GIDClientID</key>\n\t<string>${clientId}</string>`
    );
    
    // Mettre à jour REVERSED_CLIENT_ID dans CFBundleURLSchemes
    const reversedClientId = `com.googleusercontent.apps.${clientId.split('-')[0]}-${clientId.split('-')[1]}`;
    content = content.replace(
      /com\.googleusercontent\.apps\.[^<]*/g,
      reversedClientId
    );
    
    fs.writeFileSync(infoPlistPath, content);
    console.log('✅ Info.plist mis à jour');
  } catch (error) {
    console.log('⚠️ Erreur mise à jour Info.plist:', error.message);
  }
}

function updateXcodeProject(bundleId) {
  const projectPath = 'ios/Nyth.xcodeproj/project.pbxproj';
  
  try {
    let content = fs.readFileSync(projectPath, 'utf8');
    
    // Remplacer PRODUCT_BUNDLE_IDENTIFIER
    content = content.replace(
      /PRODUCT_BUNDLE_IDENTIFIER = [^;]*/g,
      `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId}`
    );
    
    fs.writeFileSync(projectPath, content);
    console.log('✅ Projet Xcode mis à jour');
  } catch (error) {
    console.log('⚠️ Erreur mise à jour projet Xcode:', error.message);
  }
}

// Exécuter la migration
if (require.main === module) {
  migrateFirebaseProject().catch(console.error);
}

module.exports = { migrateFirebaseProject };
