# Module de Capture Audio iOS

Ce module implémente la capture audio native pour iOS en utilisant AVAudioEngine et AVAudioSession. Il est conçu pour être facilement intégrable dans un TurboModule JSI React Native.

## Architecture

Le module est composé de plusieurs fichiers Swift :

### 1. **AudioCaptureProtocol.swift**
- Définit les protocoles et interfaces principales
- `AudioCaptureProtocol` : Interface principale pour la capture audio
- `AudioCaptureDelegate` : Callbacks pour recevoir les données audio et événements
- `AudioCaptureConfiguration` : Configuration de la capture

### 2. **AudioCaptureEngine.swift**
- Implémentation concrète utilisant AVAudioEngine
- Gère l'enregistrement audio en temps réel
- Supporte plusieurs formats audio (Float32, Int16, Int32)
- Mesure du niveau audio en temps réel

### 3. **AudioCaptureManager.swift**
- Manager singleton pour faciliter l'intégration
- Interface simplifiée pour TurboModule JSI
- Gestion du buffer audio
- Conversion des données pour JavaScript

### 4. **AudioSessionManager.swift**
- Gestion centralisée d'AVAudioSession
- Configuration pour l'enregistrement
- Gestion des interruptions et changements de route audio

### 5. **AudioCaptureError.swift**
- Définition des erreurs personnalisées
- Messages d'erreur localisés

## Utilisation

### Configuration de base

```swift
// Importer le module
import AudioCapture

// Configurer la capture audio
let manager = AudioCaptureManager.shared

do {
    // Configuration simple
    try manager.configure(
        sampleRate: 44100,
        channels: 1,
        format: "float32"
    )
    
    // Ou configuration avancée
    let config = AudioCaptureConfiguration()
    config.sampleRate = 48000
    config.channelCount = 2
    config.format = .pcmFloat32
    config.bufferSize = 2048
    config.enableLevelMeasurement = true
    
    let engine = AudioCaptureEngine()
    try engine.configure(with: config)
} catch {
    print("Erreur de configuration: \(error)")
}
```

### Gestion des permissions

```swift
// Vérifier la permission
if manager.hasPermission() {
    // Permission accordée
} else {
    // Demander la permission
    manager.requestPermission { granted in
        if granted {
            // Permission accordée
        } else {
            // Permission refusée
        }
    }
}
```

### Démarrer/Arrêter l'enregistrement

```swift
// Avec le manager (recommandé pour TurboModule)
do {
    try manager.startRecording()
} catch {
    print("Erreur au démarrage: \(error)")
}

// Arrêter
manager.stopRecording()

// Vérifier l'état
if manager.isRecording {
    // Enregistrement en cours
}
```

### Recevoir les données audio

```swift
// Configuration des callbacks pour TurboModule
manager.onAudioData = { data in
    // Données audio brutes reçues
    // Format: Data contenant des échantillons PCM
}

manager.onStateChange = { state in
    // État: "recording" ou "stopped"
}

manager.onError = { code, message in
    // Gestion des erreurs
}

manager.onAudioLevel = { level in
    // Niveau audio normalisé (0.0 - 1.0)
}

// Ou utiliser le delegate pour plus de contrôle
class MyAudioHandler: AudioCaptureDelegate {
    func audioCapture(didReceiveAudioData data: Data) {
        // Traiter les données audio
    }
    
    func audioCaptureDidStart() {
        // Enregistrement démarré
    }
    
    func audioCaptureDidStop() {
        // Enregistrement arrêté
    }
    
    func audioCapture(didFailWithError error: Error) {
        // Gérer l'erreur
    }
    
    func audioCapture(didUpdateAudioLevel level: Float) {
        // Niveau audio mis à jour
    }
}
```

## Intégration avec TurboModule JSI

Le module est conçu pour être facilement intégrable avec un TurboModule JSI :

### 1. Créer le bridge Objective-C++

```objc
// AudioCaptureTurboModule.mm
#import <React/RCTBridgeModule.h>
#import "AudioCapture-Swift.h"

@interface AudioCaptureTurboModule : NSObject <RCTBridgeModule>
@end

@implementation AudioCaptureTurboModule

RCT_EXPORT_MODULE();

// Configuration
RCT_EXPORT_METHOD(configure:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        AudioCaptureManager *manager = [AudioCaptureManager shared];
        
        double sampleRate = [config[@"sampleRate"] doubleValue] ?: 44100;
        NSInteger channels = [config[@"channels"] integerValue] ?: 1;
        NSString *format = config[@"format"] ?: @"float32";
        
        [manager configureWithSampleRate:sampleRate 
                               channels:channels 
                                 format:format 
                                  error:nil];
        resolve(@YES);
    } @catch (NSError *error) {
        reject(@"CONFIG_ERROR", error.localizedDescription, error);
    }
}

// Démarrer l'enregistrement
RCT_EXPORT_METHOD(startRecording:(RCTPromiseResolveBlock)resolve
                         rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [[AudioCaptureManager shared] startRecording];
        resolve(@YES);
    } @catch (NSError *error) {
        reject(@"START_ERROR", error.localizedDescription, error);
    }
}

// Callbacks JSI
- (void)setupCallbacks {
    AudioCaptureManager *manager = [AudioCaptureManager shared];
    
    manager.onAudioData = ^(NSData *data) {
        // Envoyer à JavaScript via JSI
        // this->invokeCallback("onAudioData", data);
    };
    
    manager.onStateChange = ^(NSString *state) {
        // this->invokeCallback("onStateChange", state);
    };
}

@end
```

### 2. Utilisation en JavaScript

```javascript
import { NativeModules } from 'react-native';

const AudioCapture = NativeModules.AudioCaptureTurboModule;

// Configuration
await AudioCapture.configure({
  sampleRate: 44100,
  channels: 1,
  format: 'float32'
});

// Permissions
const hasPermission = await AudioCapture.hasPermission();
if (!hasPermission) {
  const granted = await AudioCapture.requestPermission();
}

// Enregistrement
await AudioCapture.startRecording();

// Écouter les données
AudioCapture.addListener('onAudioData', (data) => {
  // Traiter les données audio
});

AudioCapture.addListener('onStateChange', (state) => {
  console.log('État:', state);
});

// Arrêter
AudioCapture.stopRecording();
```

## Formats audio supportés

- **PCM Float32** : Format par défaut, haute qualité
- **PCM Int16** : Format compact, compatible avec la plupart des APIs
- **PCM Int32** : Format haute précision

## Taux d'échantillonnage supportés

- 8000 Hz (Téléphonie)
- 16000 Hz (VoIP, reconnaissance vocale)
- 22050 Hz (Qualité radio)
- 44100 Hz (Qualité CD)
- 48000 Hz (Audio professionnel)

## Gestion des erreurs

Le module définit plusieurs types d'erreurs :

- `microphonePermissionDenied` : Permission refusée
- `audioEngineNotInitialized` : Moteur non initialisé
- `audioFormatNotSupported` : Format non supporté
- `sessionConfigurationFailed` : Erreur de configuration
- `engineStartFailed` : Erreur au démarrage
- `invalidConfiguration` : Configuration invalide

## Performances

- Utilise des queues dédiées pour le traitement audio
- Buffer circulaire pour éviter les allocations
- Mesure du niveau audio optimisée avec Accelerate framework
- Support du multithreading pour éviter de bloquer l'UI

## Notes importantes

1. **Permissions** : Ajouter `NSMicrophoneUsageDescription` dans Info.plist
2. **Background** : Pour l'enregistrement en arrière-plan, configurer les capabilities
3. **Interruptions** : Le module gère automatiquement les interruptions (appels, etc.)
4. **Formats** : Les données sont toujours entrelacées pour le multicanal
5. **Thread Safety** : Toutes les méthodes publiques sont thread-safe