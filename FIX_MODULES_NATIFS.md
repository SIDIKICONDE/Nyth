# Correction de l'initialisation des modules natifs (Lamis)

## Problème identifié

Les modules natifs audio de l'application (appelés "Lamis" dans votre question) ne s'initialisaient pas correctement car :

1. **Code C++ commenté** : Le fichier `OnLoad.cpp` avait tout le code d'initialisation commenté
2. **Configuration CMake manquante** : Le build.gradle n'avait pas la configuration pour compiler les modules C++
3. **Package non enregistré** : Les modules n'étaient pas enregistrés côté Android

## Corrections appliquées

### 1. ✅ Fichier `OnLoad.cpp` décommenté et corrigé
**Chemin**: `/workspace/android/app/src/main/jni/OnLoad.cpp`

- Décommenté tout le code d'initialisation
- Supprimé la référence au module `NativeAudioEqualizerModule` qui n'existait pas
- Activé l'enregistrement des modules C++ via `cxxModuleProvider`
- Activé la fonction `JNI_OnLoad` pour l'initialisation au chargement

### 2. ✅ Configuration CMake ajoutée dans `build.gradle`
**Chemin**: `/workspace/android/app/build.gradle`

```gradle
externalNativeBuild {
    cmake {
        path "src/main/jni/CMakeLists.txt"
        version "3.18.1"
    }
}
```

### 3. ✅ Création du package `NativeAudioModulesPackage`
**Chemin**: `/workspace/android/app/src/main/java/com/nyth/app/NativeAudioModulesPackage.kt`

- Créé un package Kotlin pour déclarer les modules natifs
- Enregistre les 9 modules audio et caméra disponibles

### 4. ✅ Enregistrement du package dans `MainApplication.kt`
**Chemin**: `/workspace/android/app/src/main/java/com/nyth/app/MainApplication.kt`

```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        // Ajout du package pour les modules natifs audio
        add(NativeAudioModulesPackage())
    }
```

### 5. ✅ Correction du fichier `CMakeLists.txt`
**Chemin**: `/workspace/android/app/src/main/jni/CMakeLists.txt`

- Supprimé les références au module `AudioEqualizer` inexistant
- Conservé tous les autres modules fonctionnels

## Modules natifs disponibles après correction

1. **NativeAudioCaptureModule** - Capture audio en temps réel
2. **NativeAudioCoreModule** - Fonctionnalités audio de base
3. **NativeAudioEffectsModule** - Effets audio
4. **NativeAudioNoiseModule** - Réduction de bruit
5. **NativeAudioPipelineModule** - Pipeline de traitement audio
6. **NativeAudioSafetyModule** - Sécurité audio (protection auditive)
7. **NativeAudioSpectrumModule** - Analyse spectrale
8. **NativeAudioUtilsModule** - Utilitaires audio
9. **NativeCameraFiltersModule** - Filtres caméra

## Fichiers de test créés

### 1. Script de test JavaScript
**Chemin**: `/workspace/test-native-modules.js`
- Vérifie la présence de tous les modules
- Teste l'initialisation du module de capture audio

### 2. Composant React Native de test
**Chemin**: `/workspace/src/screens/TestNativeModules.tsx`
- Interface visuelle pour tester les modules
- Affiche l'état de chaque module
- Permet de tester l'initialisation

### 3. Script de recompilation
**Chemin**: `/workspace/rebuild-android.sh`
- Automatise le processus de recompilation
- Nettoie les caches et rebuild l'application
- Vérifie la présence des bibliothèques natives

## Instructions pour compiler et tester

### 1. Recompiler l'application Android

```bash
# Option 1: Utiliser le script automatisé
./rebuild-android.sh

# Option 2: Commandes manuelles
cd android
./gradlew clean
./gradlew assembleDebug
cd ..
npx react-native run-android
```

### 2. Tester les modules dans l'application

Ajoutez dans votre `App.tsx` :

```tsx
import TestNativeModules from './src/screens/TestNativeModules';

// Dans votre composant App
function App() {
  return (
    <View>
      <TestNativeModules />
    </View>
  );
}
```

### 3. Vérifier les logs

```bash
# Voir les logs Android
adb logcat | grep -i "native"

# Voir spécifiquement les logs React Native
npx react-native log-android
```

## Dépannage

### Si les modules ne sont toujours pas disponibles :

1. **Vérifier le NDK** :
   ```bash
   # Dans android/local.properties
   ndk.dir=/path/to/Android/Sdk/ndk/[version]
   ```

2. **Vérifier les erreurs de compilation C++** :
   ```bash
   cd android
   ./gradlew :app:externalNativeBuildDebug --info
   ```

3. **Nettoyer complètement et reconstruire** :
   ```bash
   cd android
   rm -rf .gradle build app/build
   rm -rf ~/.gradle/caches/
   ./gradlew clean
   ./gradlew assembleDebug
   ```

4. **Vérifier la présence de la bibliothèque native** :
   ```bash
   find android/app/build -name "*.so" | grep appmodules
   ```

## Résultat attendu

Après recompilation, tous les modules natifs devraient être accessibles depuis JavaScript via :

```javascript
import { NativeModules } from 'react-native';

// Exemple d'utilisation
const { NativeAudioCaptureModule } = NativeModules;

// Initialiser le module
NativeAudioCaptureModule.initialize({
  sampleRate: 44100,
  channelCount: 1,
  bitsPerSample: 16,
  bufferSizeFrames: 1024
});
```

## Notes importantes

- Les modules C++ nécessitent une recompilation complète après modification
- Le cache Metro doit être nettoyé après les changements
- Pour iOS, des étapes supplémentaires peuvent être nécessaires (pod install)
- Les modules utilisent la nouvelle architecture TurboModules de React Native