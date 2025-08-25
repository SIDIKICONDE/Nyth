# Module AudioRecorder Android

Module natif Android pour la capture audio, conçu pour être intégré dans un TurboModule JSI React Native.

## 🎯 Fonctionnalités

- ✅ Enregistrement audio avec MediaRecorder ou AudioRecord
- ✅ Support de **10 formats audio Android** (AAC, Opus, AMR, PCM, etc.)
- ✅ Presets prédéfinis pour différents usages
- ✅ Configuration flexible de la qualité audio
- ✅ Gestion complète des permissions Android
- ✅ Pause/reprise (Android N+)
- ✅ Monitoring du niveau audio en temps réel
- ✅ Estimation de la taille des fichiers
- ✅ Support des callbacks via interface
- ✅ Architecture prête pour TurboModule JSI
- ✅ API Promise-based pour React Native

## 📋 Prérequis

- Android API 21+ (Android 5.0 Lollipop)
- Pour certains formats :
  - AAC-ELD, HE-AAC : API 16+ (Android 4.1)
  - Vorbis, PCM Float : API 21+ (Android 5.0)
  - Opus : API 29+ (Android 10)
  - Pause/Resume : API 24+ (Android 7.0)

## 🎨 Formats Audio Supportés

### Formats compressés
- **AAC** (.m4a) - Format recommandé, excellent compromis
- **AAC-ELD** (.m4a) - Enhanced Low Delay (API 16+)
- **HE-AAC** (.m4a) - High Efficiency (API 16+)
- **AMR-NB** (.3gp) - Narrowband, optimisé voix (8kHz)
- **AMR-WB** (.3gp) - Wideband, voix HD (16kHz)
- **Opus** (.ogg) - Haute qualité, faible latence (API 29+)
- **Vorbis** (.webm) - Open source (API 21+)

### Formats non compressés
- **PCM 16-bit** (.wav) - Qualité standard
- **PCM 8-bit** (.wav) - Qualité réduite
- **PCM Float** (.wav) - Haute précision (API 21+)

## 🏗️ Architecture

Le module est composé de :

1. **`AudioRecorder.java`** : Classe principale d'enregistrement
2. **`AudioConfiguration.java`** : Configuration audio
3. **`AudioEnums.java`** : Énumérations (formats, qualités, erreurs)
4. **`AudioUtils.java`** : Utilitaires audio
5. **`AudioRecorderModule.java`** : Bridge React Native / TurboModule JSI

## 🚀 Utilisation

### Initialisation

```java
AudioRecorder recorder = new AudioRecorder(context);
recorder.setCallback(callback);
```

### Configuration

```java
// Utiliser un preset
recorder.usePreset(AudioPreset.VOICE_NOTE);

// Ou configuration personnalisée
AudioConfiguration config = new AudioConfiguration();
config.applyFormat(AudioFormatType.AAC);
config.quality = AudioQuality.HIGH;
config.sampleRate = 44100;
config.channels = 2;
config.bitRate = 192000;
recorder.setAudioConfiguration(config);
```

### Permissions

```java
// Vérifier
if (recorder.hasRecordPermission()) {
    // OK
}

// Dans une Activity
ActivityCompat.requestPermissions(activity,
    new String[]{Manifest.permission.RECORD_AUDIO},
    REQUEST_CODE);
```

### Enregistrement

```java
// Démarrer
recorder.startRecording(outputFile); // ou null pour nom auto

// Pause (Android N+)
recorder.pauseRecording();

// Reprendre
recorder.resumeRecording();

// Arrêter
recorder.stopRecording();
```

### Callbacks

```java
recorder.setCallback(new AudioRecorder.AudioRecorderCallback() {
    @Override
    public void onRecordingStarted() {
        // Enregistrement démarré
    }
    
    @Override
    public void onRecordingStopped(String filePath, long duration) {
        // Enregistrement terminé
    }
    
    @Override
    public void onAudioLevel(float level) {
        // Niveau audio en dB (-160 à 0)
    }
    
    @Override
    public void onError(AudioRecorderError error) {
        // Gestion d'erreur
    }
});
```

## 🔌 Intégration React Native / TurboModule JSI

### Méthodes exposées

```javascript
// Démarrer l'enregistrement
AudioRecorderModule.startRecording({
  fileName: "recording.m4a",  // Optionnel
  format: "aac",             // Optionnel
  quality: "high",           // Optionnel
  preset: "voiceNote",       // Optionnel, prioritaire
  sampleRate: 44100,         // Optionnel
  channels: 1                // Optionnel
});

// Arrêter
AudioRecorderModule.stopRecording();

// Pause/Resume
AudioRecorderModule.pauseRecording();
AudioRecorderModule.resumeRecording();

// Statut
const status = AudioRecorderModule.getRecordingStatus();

// Permissions
AudioRecorderModule.requestRecordPermission();

// Formats supportés
const formats = await AudioRecorderModule.getSupportedFormats();
```

### Événements

```javascript
// S'abonner aux événements
const subscription = DeviceEventEmitter.addListener('audioLevel', (data) => {
  console.log('Niveau audio:', data.level);
});

// Événements disponibles :
- recordingStarted
- recordingStopped : { filePath, duration }
- recordingPaused
- recordingResumed
- audioLevel : { level }
- error : { code, message }
```

### Presets disponibles

- `VOICE_NOTE` : Notes vocales (AAC mono 44.1kHz)
- `VOICE_CALL` : Appels VoIP (AMR-NB mono 8kHz)
- `MUSIC_HIGH` : Musique haute qualité (AAC stéréo 48kHz)
- `MUSIC_STANDARD` : Musique standard (AAC stéréo 44.1kHz)
- `PROFESSIONAL` : Enregistrement pro (PCM 16-bit stéréo 48kHz)
- `COMPACT` : Fichiers compacts (AAC mono 22kHz)
- `STREAMING` : Streaming (Opus/AAC stéréo 48kHz)

## 📊 Comparaison des formats

| Format | Extension | Qualité | Taille/min* | Usage |
|--------|-----------|---------|-------------|-------|
| AAC | .m4a | Excellente | ~1 MB | ✅ Recommandé |
| Opus | .ogg | Excellente | ~0.8 MB | Streaming (API 29+) |
| AMR-NB | .3gp | Acceptable | ~0.1 MB | Voix uniquement |
| AMR-WB | .3gp | Bonne | ~0.2 MB | Voix HD |
| PCM 16-bit | .wav | Parfaite | ~10 MB | Production |

*Mono, qualité HIGH

## 🛡️ Gestion des erreurs

```java
public enum AudioRecorderError {
    PERMISSION_DENIED,      // Permission refusée
    ALREADY_RECORDING,      // Déjà en enregistrement
    NOT_RECORDING,          // Pas d'enregistrement
    INVALID_STATE,          // État invalide
    START_FAILED,           // Échec démarrage
    STOP_FAILED,            // Échec arrêt
    PAUSE_NOT_SUPPORTED,    // Pause non supportée
    WRITE_FAILED,           // Échec écriture
    FILE_ERROR              // Erreur fichier
}
```

## 📝 Permissions Android

Dans `AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

Pour Android 6.0+, les permissions doivent être demandées à l'exécution.

## 🧪 Exemple complet

```java
public class MainActivity extends AppCompatActivity {
    private AudioRecorder recorder;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialiser
        recorder = new AudioRecorder(this);
        
        // Configurer
        recorder.usePreset(AudioPreset.VOICE_NOTE);
        
        // Définir callback
        recorder.setCallback(new AudioRecorder.AudioRecorderCallback() {
            @Override
            public void onRecordingStarted() {
                Log.d("Audio", "Démarré");
            }
            
            @Override
            public void onRecordingStopped(String filePath, long duration) {
                Log.d("Audio", "Fichier: " + filePath);
                Log.d("Audio", "Durée: " + duration + "ms");
            }
            
            @Override
            public void onError(AudioRecorderError error) {
                Toast.makeText(MainActivity.this, 
                    error.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
        
        // Vérifier permissions et démarrer
        if (recorder.hasRecordPermission()) {
            recorder.startRecording(null);
        } else {
            // Demander permission
            ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.RECORD_AUDIO}, 100);
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (recorder != null) {
            recorder.release();
        }
    }
}
```

## 🔧 Configuration avancée

### Buffer personnalisé pour AudioRecord

```java
// Dans AudioConfiguration
config.useMediaRecorder = false; // Utiliser AudioRecord
config.audioFormat = AudioFormat.ENCODING_PCM_16BIT;
config.channelConfig = AudioFormat.CHANNEL_IN_STEREO;
```

### Monitoring du niveau audio

```java
config.enableLevelMonitoring = true; // Activer
// Les niveaux seront envoyés via onAudioLevel()
```

### Gestion du stockage

Les fichiers sont sauvegardés dans :
```
/Android/data/[package]/files/Recordings/
```

Pas besoin de permissions de stockage externe.

## 📱 Compatibilité

- ✅ Tous les appareils Android 5.0+
- ✅ Support des écouteurs Bluetooth
- ✅ Compatible avec Android Auto
- ✅ Fonctionne en arrière-plan avec Service
- ⚠️ Certains formats nécessitent des API récentes

## 🚀 Intégration TurboModule JSI

Pour une intégration complète avec TurboModule JSI :

1. Ajouter les dépendances React Native
2. Implémenter l'interface TurboModule
3. Exposer les méthodes natives via JSI
4. Gérer les promesses et callbacks

Le module est déjà préparé avec :
- Méthodes compatibles Promise
- Gestion des événements
- Types de retour appropriés
- Gestion d'erreurs complète

## 📄 License

Ce module est conçu pour être intégré dans des projets React Native. Adaptez la license selon vos besoins.