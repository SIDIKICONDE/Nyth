# Correction de la redirection Apple Sign-In sur iOS

## Problème identifié
Après la connexion avec Apple sur iOS, la redirection vers l'application ne se faisait pas correctement.

## Modifications apportées

### 1. AppDelegate.swift
- **Fichier**: `ios/Nyth/AppDelegate.swift`
- **Modification**: Ajout de la gestion des URL schemes pour Apple Sign-In dans la méthode `application(_:open:options:)`
- La méthode gère maintenant à la fois Google Sign-In et les autres URL schemes (y compris Apple Sign-In)

```swift
// URL handler for Google Sign-In and other deep links
func application(
  _ app: UIApplication,
  open url: URL,
  options: [UIApplication.OpenURLOptionsKey : Any] = [:]
) -> Bool {
  // Handle Google Sign-In
  if GIDSignIn.sharedInstance.handle(url) {
    return true
  }
  
  // Handle other URL schemes (including Apple Sign-In callbacks)
  // This will allow React Native to handle the URL
  if let delegate = reactNativeDelegate {
    return delegate.application?(app, open: url, options: options) ?? false
  }
  
  return false
}
```

### 2. Info.plist
- **Fichier**: `ios/Nyth/Info.plist`
- **Modification**: Ajout d'un URL scheme pour le bundle identifier
- Cela permet à l'application de recevoir les callbacks d'Apple Sign-In

```xml
<key>CFBundleURLTypes</key>
<array>
    <!-- Google Sign-In URL Scheme existant -->
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.717804580146-mkee7kbuipfcfddhbieeo9hfi0h1814l</string>
        </array>
    </dict>
    <!-- Nouveau URL Scheme pour Apple Sign-In -->
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.nyth.bundle</string>
        </array>
    </dict>
</array>
```

### 3. Entitlements
- **Fichiers créés/modifiés**:
  - `ios/Nyth/Nyth.entitlements` (nouveau fichier pour Debug)
  - `ios/Nyth/NythRelease.entitlements` (existant, déjà configuré)
- **Contenu**: Les deux fichiers contiennent l'entitlement Apple Sign-In

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.applesignin</key>
    <array>
        <string>Default</string>
    </array>
</dict>
</plist>
```

### 4. Projet Xcode
- **Fichier**: `ios/Nyth.xcodeproj/project.pbxproj`
- **Modifications**:
  - Ajout du fichier `Nyth.entitlements` au projet
  - Configuration de l'entitlement pour la configuration Debug
  - La configuration Release utilise déjà `NythRelease.entitlements`

## Actions requises après ces modifications

1. **Nettoyer le build cache**:
   ```bash
   cd ios
   rm -rf build/
   rm -rf ~/Library/Developer/Xcode/DerivedData/
   ```

2. **Réinstaller les pods** (si pod est disponible):
   ```bash
   cd ios
   pod install
   ```

3. **Rebuild l'application**:
   ```bash
   cd ios
   npx react-native run-ios
   # ou dans Xcode : Product > Clean Build Folder, puis Build
   ```

## Vérification

Pour vérifier que tout fonctionne correctement :

1. Lancez l'application sur un appareil iOS ou simulateur
2. Allez sur l'écran de connexion
3. Cliquez sur "Se connecter avec Apple"
4. Complétez le processus d'authentification Apple
5. L'application devrait maintenant recevoir correctement la redirection et finaliser la connexion

## Notes importantes

- Les URL schemes sont essentiels pour permettre à iOS de rediriger vers l'application après l'authentification
- L'entitlement Apple Sign-In doit être configuré dans le profil de provisioning sur Apple Developer Portal
- Le bundle identifier (`com.nyth.bundle`) doit correspondre à celui configuré dans Apple Developer Portal