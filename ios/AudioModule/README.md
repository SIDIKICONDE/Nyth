# Module AudioRecorder iOS

Module natif iOS pour la capture audio, conçu pour être intégré dans un TurboModule React Native.

## 🎯 Fonctionnalités

- ✅ Enregistrement audio haute qualité avec AVAudioEngine
- ✅ Gestion complète d'AVAudioSession
- ✅ Support des permissions microphone
- ✅ Pause/reprise de l'enregistrement
- ✅ Monitoring du niveau audio en temps réel
- ✅ Gestion des erreurs robuste
- ✅ Architecture prête pour TurboModule
- ✅ Support des callbacks via delegate pattern
- ✅ API Promise-based pour React Native

## 📋 Prérequis

- iOS 13.0+
- Swift 5.0+
- Xcode 12.0+

## 🏗️ Architecture

Le module est composé de trois fichiers principaux :

1. **`AudioRecorder.swift`** : Classe principale gérant l'enregistrement audio
2. **`AudioRecorder+TurboModule.swift`** : Extension pour l'intégration React Native
3. **`AudioRecorderExample.swift`** : Exemples d'utilisation

### Classes et Protocoles

```swift
// Classe principale
public class AudioRecorder: NSObject

// Protocole pour les callbacks
public protocol AudioRecorderDelegate: AnyObject

// Énumération des erreurs
public enum AudioRecorderError: Int, LocalizedError
```

## 🚀 Utilisation

### Initialisation

```swift
let audioRecorder = AudioRecorder()
audioRecorder.delegate = self
```

### Configuration de la session audio

```swift
do {
    try audioRecorder.configureAudioSession()
} catch {
    print("Erreur de configuration: \(error)")
}
```

### Permissions microphone

```swift
audioRecorder.requestMicrophonePermission { granted in
    if granted {
        // Permission accordée
    } else {
        // Permission refusée
    }
}
```

### Démarrer l'enregistrement

```swift
// Avec URL personnalisée
let url = URL(fileURLWithPath: "path/to/file.m4a")
try audioRecorder.startRecording(toFileURL: url)

// Avec URL par défaut
try audioRecorder.startRecording()
```

### Contrôle de l'enregistrement

```swift
// Pause
audioRecorder.pauseRecording()

// Reprise
try audioRecorder.resumeRecording()

// Arrêt
audioRecorder.stopRecording()
```

### État de l'enregistrement

```swift
let isRecording = audioRecorder.isRecording
let isPaused = audioRecorder.isPaused
```

## 🔌 Intégration TurboModule

### Méthodes compatibles React Native

```swift
// Démarrer avec options
audioRecorder.startRecordingWithOptions(options, resolver: resolve, rejecter: reject)

// Arrêter
audioRecorder.stopRecordingWithResolver(resolve, rejecter: reject)

// Pause
audioRecorder.pauseRecordingWithResolver(resolve, rejecter: reject)

// Reprise
audioRecorder.resumeRecordingWithResolver(resolve, rejecter: reject)

// Statut
let status = audioRecorder.getRecordingStatus()

// Configuration avancée
audioRecorder.configureAudioOptions(options, resolver: resolve, rejecter: reject)
```

### Format des options

```javascript
// Options de démarrage
{
  fileName: "recording.m4a",     // Nom du fichier (optionnel)
  sampleRate: 44100,            // Taux d'échantillonnage (optionnel)
  channels: 1,                  // Nombre de canaux (optionnel)
  quality: "high"               // Qualité (optionnel)
}

// Options de configuration audio
{
  category: "playAndRecord",    // Catégorie AVAudioSession
  mode: "voiceChat",           // Mode AVAudioSession
  sampleRate: 48000,           // Taux d'échantillonnage préféré
  ioBufferDuration: 0.005      // Durée du buffer I/O
}
```

## 📊 Événements (pour EventEmitter)

Le module génère les événements suivants :

- `recordingStarted` : Enregistrement démarré
- `recordingStopped` : Enregistrement arrêté (avec `filePath` et `duration`)
- `recordingPaused` : Enregistrement en pause
- `recordingResumed` : Enregistrement repris
- `audioLevel` : Niveau audio mis à jour (avec `level` en dB)
- `error` : Erreur survenue (avec `code` et `message`)

## 🛡️ Gestion des erreurs

Les erreurs possibles :

- `setupFailed` : Échec de configuration de l'engine audio
- `sessionConfigurationFailed` : Échec de configuration de la session
- `permissionDenied` : Permission microphone refusée
- `alreadyRecording` : Déjà en train d'enregistrer
- `notRecording` : Pas d'enregistrement en cours
- `invalidFormat` : Format audio invalide
- `fileCreationFailed` : Échec de création du fichier
- `inputNodeUnavailable` : Nœud d'entrée indisponible
- `engineUnavailable` : Engine audio indisponible
- `engineStartFailed` : Échec du démarrage de l'engine
- `writeFailed` : Échec d'écriture des données

## 📝 Info.plist

Ajouter la clé suivante dans Info.plist :

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Cette application a besoin d'accéder au microphone pour enregistrer de l'audio</string>
```

## 🔧 Personnalisation

### Format audio personnalisé

Le module utilise par défaut :
- Sample Rate : 44100 Hz
- Canaux : 1 (mono)
- Format : M4A avec AAC

Pour personnaliser, modifiez la structure `AudioConfiguration` dans `AudioRecorder.swift`.

### Monitoring avancé

Le delegate `audioRecorder(_:didUpdateAudioLevel:)` fournit le niveau audio en décibels. Pour une visualisation :

```swift
func audioRecorder(_ recorder: AudioRecorder, didUpdateAudioLevel level: Float) {
    // level est en dB (-160 à 0)
    let normalizedLevel = (level + 160) / 160  // Convertit en 0-1
    updateLevelMeter(normalizedLevel)
}
```

## 🏃‍♂️ Exemple d'intégration complète

Voir `AudioRecorderExample.swift` pour un exemple complet d'intégration dans une application iOS avec interface utilisateur.

## 📦 Intégration dans un TurboModule

Pour intégrer ce module dans un TurboModule React Native :

1. Créer une classe Objective-C++ qui wrappe `AudioRecorder`
2. Exposer les méthodes via le protocole TurboModule
3. Utiliser les méthodes de l'extension `AudioRecorder+TurboModule`
4. Implémenter l'EventEmitter pour les callbacks

Exemple de spec TurboModule :

```typescript
export interface Spec extends TurboModule {
  startRecording(options: RecordingOptions): Promise<RecordingResult>;
  stopRecording(): Promise<RecordingResult>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  getRecordingStatus(): RecordingStatus;
  configureAudioOptions(options: AudioOptions): Promise<void>;
  
  // Event listeners
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}
```

## 🧪 Tests

Pour tester le module :

1. Créer une application iOS de test
2. Importer les fichiers du module
3. Utiliser `AudioRecorderExample` comme point de départ
4. Tester sur un appareil réel (le simulateur ne supporte pas l'enregistrement audio)

## 📱 Compatibilité

- ✅ iPhone (tous modèles)
- ✅ iPad (tous modèles)
- ✅ iPod Touch
- ✅ Support des écouteurs Bluetooth
- ✅ Support d'AirPods
- ❌ Simulateur iOS (pas de support microphone)

## 🔍 Debugging

Pour activer les logs détaillés, ajoutez dans `AudioRecorder.swift` :

```swift
private let debugMode = true

private func log(_ message: String) {
    if debugMode {
        print("[AudioRecorder] \(message)")
    }
}
```

## 📄 License

Ce module est conçu pour être intégré dans des projets React Native. Adaptez la license selon vos besoins.