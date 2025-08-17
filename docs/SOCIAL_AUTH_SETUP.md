# Guide de Configuration des Authentifications Sociales

## 📱 Configuration iOS

### 1. Google Sign-In pour iOS

#### Étape 1: Configuration dans Firebase Console

1. Aller dans [Firebase Console](https://console.firebase.google.com)
2. Sélectionner votre projet `camprompt-ai`
3. Aller dans **Authentication** > **Sign-in method**
4. Activer **Google** et configurer avec l'email de support

#### Étape 2: Configuration Xcode

1. Ouvrir `ios/YourApp.xcworkspace` dans Xcode
2. Sélectionner votre target principal
3. Aller dans l'onglet **Info**
4. Ajouter un nouveau **URL Type** :
   - **URL Schemes**: `com.googleusercontent.apps.322730783133-rlmbr5bc8v1mqiltdfhlc988atcadloe`
   - (C'est votre GOOGLE_IOS_CLIENT_ID inversé)

#### Étape 3: Fichier Info.plist

Ajouter dans `ios/YourApp/Info.plist` :

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <!-- Google Sign-In URL Scheme -->
            <string>com.googleusercontent.apps.322730783133-rlmbr5bc8v1mqiltdfhlc988atcadloe</string>
        </array>
    </dict>
</array>

<!-- Google Sign-In Configuration -->
<key>GIDClientID</key>
<string>322730783133-rlmbr5bc8v1mqiltdfhlc988atcadloe.apps.googleusercontent.com</string>

<!-- Whitelist Google Sign-In -->
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>googlechrome</string>
    <string>safari</string>
</array>
```

#### Étape 4: AppDelegate Configuration

Dans `ios/YourApp/AppDelegate.mm`, ajouter :

```objc
#import <RNGoogleSignin/RNGoogleSignin.h>

// Dans la méthode application:openURL:options:
- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  if ([RNGoogleSignin application:app openURL:url options:options]) {
    return YES;
  }
  // Autres handlers...
  return NO;
}
```

### 2. Apple Sign-In pour iOS

#### Étape 1: Capabilities dans Xcode

1. Dans Xcode, sélectionner votre target
2. Aller dans **Signing & Capabilities**
3. Cliquer sur **+ Capability**
4. Ajouter **Sign in with Apple**

#### Étape 2: Entitlements

Vérifier que `YourApp.entitlements` contient :

```xml
<key>com.apple.developer.applesignin</key>
<array>
    <string>Default</string>
</array>
```

#### Étape 3: Installation du package

```bash
yarn add @invertase/react-native-apple-authentication
cd ios && pod install
```

## 🤖 Configuration Android

### 1. Google Sign-In pour Android

#### Étape 1: SHA-1 et SHA-256 Fingerprints

Générer les fingerprints :

```bash
# Debug
cd android
./gradlew signingReport

# Release (avec votre keystore)
keytool -list -v -keystore your-release-key.keystore
```

#### Étape 2: Ajouter dans Firebase Console

1. Dans Firebase Console > **Project Settings**
2. Sous votre app Android, ajouter les SHA-1 et SHA-256
3. Télécharger le nouveau `google-services.json`
4. Placer dans `android/app/google-services.json`

#### Étape 3: Configuration build.gradle

Dans `android/build.gradle` :

```gradle
buildscript {
    ext {
        googlePlayServicesAuthVersion = "20.7.0"
    }
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Dans `android/app/build.gradle` :

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

### 2. Apple Sign-In pour Android

Apple Sign-In sur Android nécessite une implémentation web. Il est recommandé d'utiliser uniquement sur iOS.

## 🔧 Configuration du Projet

### Variables d'Environnement (.env)

```env
# Google OAuth
GOOGLE_IOS_CLIENT_ID=322730783133-rlmbr5bc8v1mqiltdfhlc988atcadloe.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=322730783133-k9sbjni8tqmlut4c2uuual7hs5i4ci0a.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=322730783133-k9sbjni8tqmlut4c2uuual7hs5i4ci0a.apps.googleusercontent.com

# Apple OAuth
APPLE_TEAM_ID=8GNN55S9HG
APPLE_KEY_ID=S4YRBBRVP9
APPLE_SERVICE_ID=com.naya.app.service
```

### Installation des Dépendances

```bash
# Google Sign-In
yarn add @react-native-google-signin/google-signin

# Apple Sign-In (iOS uniquement)
yarn add @invertase/react-native-apple-authentication

# iOS
cd ios && pod install

# Android - Clean build
cd android && ./gradlew clean
```

## 🧪 Test de l'Intégration

### Code de Test

```typescript
import FirebaseAuthService from "@/services/firebase/authService";

// Test Google Sign-In
const testGoogleSignIn = async () => {
  try {
    const user = await FirebaseAuthService.signInWithGoogle();
    console.log("Google Sign-In Success:", user.email);
  } catch (error) {
    console.error("Google Sign-In Error:", error);
  }
};

// Test Apple Sign-In (iOS uniquement)
const testAppleSignIn = async () => {
  try {
    const user = await FirebaseAuthService.signInWithApple();
    console.log("Apple Sign-In Success:", user.email);
  } catch (error) {
    console.error("Apple Sign-In Error:", error);
  }
};
```

## ⚠️ Points Importants

### iOS

1. **Bundle ID** : Assurez-vous que le Bundle ID dans Xcode correspond à celui dans Firebase
2. **Team ID** : Vérifier que le Team ID Apple est correct
3. **Provisioning Profile** : Doit inclure la capability Sign in with Apple

### Android

1. **Package Name** : Doit correspondre exactement à celui dans Firebase
2. **SHA Certificates** : Ajouter TOUS les SHA-1 et SHA-256 (debug + release)
3. **Google Play Services** : Doit être à jour sur l'appareil de test

### Firebase Console

1. Activer les méthodes d'authentification dans Authentication > Sign-in method
2. Ajouter les domaines autorisés si nécessaire
3. Configurer les templates d'emails

## 🐛 Dépannage

### Erreur "DEVELOPER_ERROR" (Android)

- Vérifier que les SHA fingerprints sont corrects dans Firebase
- Vérifier que le package name correspond
- Re-télécharger `google-services.json`

### Erreur "12501" (Android)

- Le Web Client ID n'est pas configuré correctement
- Utiliser le Web Client ID, pas l'Android Client ID

### Erreur "Invalid bundle ID" (iOS)

- Vérifier le Bundle ID dans Xcode
- Vérifier l'URL Scheme dans Info.plist

### Apple Sign-In ne fonctionne pas

- Vérifier les Capabilities dans Xcode
- Vérifier que l'app est signée avec le bon Team ID
- Vérifier les entitlements

## 📚 Ressources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Apple Authentication for React Native](https://github.com/invertase/react-native-apple-authentication)
- [Firebase Console](https://console.firebase.google.com)
