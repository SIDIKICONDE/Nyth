# Module de Capture Audio Nyth

Module cross-platform pour la capture audio sur Android et iOS, offrant une API unifiée et des fonctionnalités avancées.

## 🎯 Caractéristiques

### Fonctionnalités principales
- ✅ **Capture audio temps réel** sur Android et iOS
- ✅ **API unifiée** pour les deux plateformes
- ✅ **Enregistrement WAV** avec support multi-fichiers
- ✅ **Analyse audio** en temps réel (RMS, peak, détection de silence)
- ✅ **Gestion des permissions** automatique
- ✅ **Support multi-format** (16/32 bits, mono/stéréo)
- ✅ **Buffer circulaire** thread-safe
- ✅ **Conversion de formats** audio

### Support des plateformes

#### Android
- **OpenSL ES** : Compatible avec Android 2.3+ (API 9+)
- **AAudio** : Faible latence pour Android 8.0+ (API 26+)
- **Oboe** : Wrapper moderne recommandé (détection automatique)

#### iOS
- **Audio Unit** : API native basse latence
- **AVAudioSession** : Gestion de la session audio
- **Core Audio** : Framework audio iOS

## 📁 Structure du projet

```
shared/Audio/capture/
├── AudioCapture.hpp           # Interface principale
├── AudioCaptureImpl.hpp        # Implémentations Android/iOS
├── AudioCaptureUtils.hpp       # Utilitaires (conversion, buffers)
├── AudioFileWriter.hpp         # Enregistrement fichiers WAV
├── CMakeLists.txt             # Configuration de compilation
├── README.md                  # Documentation
└── examples/
    └── audio_recorder_example.cpp  # Exemples d'utilisation
```

## 🚀 Utilisation rapide

### Capture audio simple

```cpp
#include "AudioCapture.hpp"

using namespace Nyth::Audio;

// Configuration
AudioCaptureConfig config;
config.sampleRate = 44100;
config.channelCount = 1;
config.bitsPerSample = 16;

// Création de la capture
auto capture = AudioCapture::create(config);

// Callback pour recevoir les données
capture->setAudioDataCallback([](const float* data, size_t frameCount, int channels) {
    // Traiter les données audio
    float level = AudioAnalyzer::calculateRMS(data, frameCount * channels);
    std::cout << "Niveau: " << level << std::endl;
});

// Démarrage
capture->start();

// ... Capture en cours ...

// Arrêt
capture->stop();
```

### Enregistrement dans un fichier WAV

```cpp
#include "AudioFileWriter.hpp"

// Configuration de l'enregistreur
AudioFileWriterConfig writerConfig;
writerConfig.filePath = "recording.wav";
writerConfig.format = AudioFileFormat::WAV;
writerConfig.sampleRate = 44100;
writerConfig.channelCount = 2;

// Création et démarrage
AudioRecorder recorder;
recorder.initialize(capture, writerConfig);
recorder.setDurationLimit(10.0f);  // Limite 10 secondes
recorder.startRecording();

// Vérifier l'état
if (recorder.isRecording()) {
    float duration = recorder.getRecordingDuration();
    std::cout << "Durée: " << duration << "s" << std::endl;
}

recorder.stopRecording();
```

### Analyse audio en temps réel

```cpp
#include "AudioCaptureUtils.hpp"

capture->setAudioDataCallback([](const float* data, size_t frameCount, int channels) {
    size_t sampleCount = frameCount * channels;
    
    // Analyses disponibles
    float rms = AudioAnalyzer::calculateRMS(data, sampleCount);
    float rmsDb = AudioAnalyzer::calculateRMSdB(data, sampleCount);
    float peak = AudioAnalyzer::calculatePeak(data, sampleCount);
    bool silent = AudioAnalyzer::isSilent(data, sampleCount);
    bool clipping = AudioAnalyzer::hasClipping(data, sampleCount);
    
    // Normalisation si nécessaire
    if (peak > 0.95f) {
        AudioAnalyzer::normalize(const_cast<float*>(data), sampleCount, 0.9f);
    }
});
```

## 🔧 Compilation

### Android

```bash
# Avec CMake
mkdir build-android && cd build-android
cmake .. -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
         -DANDROID_ABI=arm64-v8a \
         -DANDROID_PLATFORM=android-21 \
         -DENABLE_OBOE=ON
make
```

### iOS

```bash
# Avec Xcode
mkdir build-ios && cd build-ios
cmake .. -G Xcode \
         -DCMAKE_SYSTEM_NAME=iOS \
         -DCMAKE_OSX_DEPLOYMENT_TARGET=11.0
open NythAudioCapture.xcodeproj
```

### Options de compilation

| Option | Description | Défaut |
|--------|-------------|--------|
| `BUILD_EXAMPLES` | Compiler les exemples | ON |
| `ENABLE_OBOE` | Support Oboe (Android) | ON |
| `ENABLE_AAUDIO` | Support AAudio (Android) | ON |
| `ENABLE_OPENSLES` | Support OpenSL ES (Android) | ON |

## 📱 Permissions

### Android (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### iOS (Info.plist)

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Cette app nécessite l'accès au microphone pour enregistrer l'audio</string>
```

## 🎛️ Configuration avancée

### Buffer circulaire

```cpp
// Création d'un buffer circulaire
CircularBuffer<float> buffer(48000);  // 1 seconde à 48kHz

// Écriture
float data[1024];
size_t written = buffer.write(data, 1024);

// Lecture
float output[512];
size_t read = buffer.read(output, 512);

// Vérification
size_t available = buffer.available();
bool empty = buffer.empty();
```

### Conversion de formats

```cpp
// Int16 vers Float
int16_t input[1024];
float output[1024];
AudioFormatConverter::int16ToFloat(input, output, 1024);

// Mono vers Stéréo
float mono[512];
float stereo[1024];
AudioFormatConverter::monoToStereo(mono, stereo, 512);
```

### Enregistrement multi-fichiers

```cpp
// Configuration de la division automatique
MultiFileRecorder::SplitConfig splitConfig;
splitConfig.mode = MultiFileRecorder::SplitMode::BY_DURATION;
splitConfig.splitDuration = 60.0f;  // Nouveau fichier chaque minute
splitConfig.filePattern = "segment_{index}.wav";

MultiFileRecorder multiRecorder;
multiRecorder.initialize(capture, splitConfig, writerConfig);
multiRecorder.startRecording();
```

## 📊 Performances

### Latence typique
- **Android OpenSL ES** : 20-40ms
- **Android AAudio** : 10-20ms
- **Android Oboe** : 8-15ms (optimal)
- **iOS Audio Unit** : 5-10ms

### Consommation mémoire
- Buffer par défaut : ~8KB
- Overhead par instance : ~2KB
- Pool de buffers (3x) : ~24KB

## 🐛 Dépannage

### Problèmes courants

1. **Permission refusée**
   - Vérifier les permissions dans le manifest/plist
   - Appeler `requestPermission()` avant `start()`

2. **Pas de son capturé**
   - Vérifier que le callback est défini
   - Vérifier l'état avec `getState()`
   - Consulter les logs d'erreur via `setErrorCallback()`

3. **Latence élevée**
   - Réduire `bufferSizeFrames`
   - Utiliser Oboe sur Android
   - Désactiver les traitements audio non nécessaires

## 📚 Exemples complets

Voir le fichier `examples/audio_recorder_example.cpp` pour des exemples détaillés :

1. Capture audio simple avec visualisation
2. Enregistrement dans un fichier WAV
3. Enregistrement multi-fichiers
4. Analyse audio en temps réel
5. Gestion des périphériques audio

Pour exécuter les exemples :

```bash
./audio_recorder_example 1  # Exemple 1
./audio_recorder_example all  # Tous les exemples
```

## 📄 License

Ce module fait partie du projet Nyth et est soumis à la même licence.

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur le dépôt GitHub du projet Nyth.