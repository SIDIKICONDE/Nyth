# Nyth Audio Capture System

Un système de capture audio moderne et multiplateforme en C++17 pour l'enregistrement, le traitement et l'analyse audio en temps réel.

## 🎯 Caractéristiques

- ✅ **Multiplateforme** : Support Windows (WASAPI), macOS (CoreAudio), Linux (ALSA)
- ✅ **Temps réel** : Capture audio avec faible latence
- ✅ **Formats multiples** : WAV, RAW (Float32, Int16, Int24, Int32)
- ✅ **Enregistrement circulaire** : Buffer ring pour capturer les N dernières secondes
- ✅ **Détection de silence** : Découpage automatique basé sur les niveaux audio
- ✅ **Monitoring** : Niveaux RMS/Peak en temps réel
- ✅ **Thread-safe** : Architecture multi-thread sécurisée
- ✅ **Header-only** : Facile à intégrer dans vos projets

## 📁 Structure du projet

```
shared/Audio/capture/
├── AudioCapture.hpp           # Interface principale
├── AudioCaptureImpl.hpp       # Implémentation multiplateforme
├── AudioCaptureUtils.hpp      # Utilitaires audio (conversions, calculs)
├── AudioFileWriter.hpp        # Écriture de fichiers audio
├── AudioFileWriterImpl.hpp    # Implémentation du writer
├── CMakeLists.txt            # Configuration CMake
├── README.md                 # Cette documentation
└── examples/
    ├── audio_recorder_example.cpp  # Exemples d'utilisation
    └── CMakeLists.txt
```

## 🚀 Installation

### Prérequis

- C++17 ou plus récent
- CMake 3.10+
- Dépendances système :
  - **Windows** : Windows SDK (pour WASAPI)
  - **macOS** : Xcode Command Line Tools
  - **Linux** : ALSA development libraries (`libasound2-dev` sur Ubuntu/Debian)

### Compilation

```bash
# Créer le répertoire de build
mkdir build && cd build

# Configurer avec CMake
cmake .. -DCMAKE_BUILD_TYPE=Release

# Compiler
cmake --build .

# Installer (optionnel)
sudo cmake --install .
```

### Options de compilation

```bash
# Désactiver les exemples
cmake .. -DBUILD_EXAMPLES=OFF

# Activer les tests
cmake .. -DBUILD_TESTS=ON

# Compiler en mode debug
cmake .. -DCMAKE_BUILD_TYPE=Debug
```

## 📖 Guide d'utilisation

### Exemple basique : Enregistrement simple

```cpp
#include "AudioCapture.hpp"
#include "AudioCaptureImpl.hpp"
#include "AudioFileWriter.hpp"

using namespace Nyth::Audio;

int main() {
    // Créer l'instance de capture
    auto capture = std::make_unique<AudioCaptureImpl>();
    
    // Configuration
    CaptureConfig config;
    config.sampleRate = 48000;
    config.channels = 2;
    config.bitsPerSample = 16;
    config.bufferSize = 4096;
    
    capture->configure(config);
    
    // Créer le writer pour enregistrer
    AudioFileWriter writer;
    FileWriterConfig writerConfig;
    writerConfig.format = AudioFileFormat::WAV;
    writerConfig.sampleRate = config.sampleRate;
    writerConfig.channels = config.channels;
    writerConfig.bitsPerSample = config.bitsPerSample;
    
    writer.open("output.wav", writerConfig);
    
    // Configurer le callback pour recevoir les données
    capture->setDataCallback([&writer](const float* data, size_t frames, size_t channels) {
        writer.write(data, frames);
    });
    
    // Démarrer l'enregistrement
    capture->start();
    
    // Enregistrer pendant 10 secondes
    std::this_thread::sleep_for(std::chrono::seconds(10));
    
    // Arrêter
    capture->stop();
    writer.close();
    
    return 0;
}
```

### Enregistrement circulaire (Buffer Ring)

```cpp
// Créer un buffer circulaire de 30 secondes
CircularRecorder recorder(30, 48000, 2);

// Dans le callback de capture
capture->setDataCallback([&recorder](const float* data, size_t frames, size_t channels) {
    recorder.write(data, frames);
});

// Plus tard, sauvegarder les 10 dernières secondes
FileWriterConfig config;
config.format = AudioFileFormat::WAV;
config.sampleRate = 48000;
config.channels = 2;
config.bitsPerSample = 16;

recorder.saveLastSeconds("last_10_seconds.wav", 10.0, config);
```

### Monitoring des niveaux audio

```cpp
capture->setDataCallback([&capture](const float* data, size_t frames, size_t channels) {
    float rms = capture->getRMSLevel();
    float peak = capture->getPeakLevel();
    
    std::cout << "RMS: " << Utils::linearToDb(rms) << " dB, "
              << "Peak: " << Utils::linearToDb(peak) << " dB\n";
});
```

### Détection de silence

```cpp
capture->setDataCallback([](const float* data, size_t frames, size_t channels) {
    if (Utils::isSilent(data, frames * channels, -40.0f)) {
        std::cout << "Silence détecté\n";
    } else {
        std::cout << "Audio actif\n";
    }
});
```

## 🛠️ API Reference

### Classes principales

#### `AudioCapture`
Interface principale pour la capture audio.

**Méthodes principales :**
- `configure(const CaptureConfig& config)` : Configure la capture
- `start()` : Démarre la capture
- `stop()` : Arrête la capture
- `pause()` / `resume()` : Met en pause/reprend
- `setDataCallback()` : Définit le callback pour recevoir les données
- `getState()` : Obtient l'état actuel
- `getRMSLevel()` / `getPeakLevel()` : Obtient les niveaux audio

#### `AudioFileWriter`
Classe pour l'écriture de fichiers audio.

**Méthodes principales :**
- `open(filename, config)` : Ouvre un fichier pour l'écriture
- `write(data, frames)` : Écrit des données audio
- `close()` : Ferme le fichier
- `getStats()` : Obtient les statistiques d'écriture

#### `CircularRecorder`
Enregistreur avec buffer circulaire.

**Méthodes principales :**
- `write(data, frames)` : Ajoute des données au buffer
- `saveLastSeconds(filename, seconds, config)` : Sauvegarde les N dernières secondes
- `saveAll(filename, config)` : Sauvegarde tout le buffer
- `clear()` : Vide le buffer

### Structures de configuration

#### `CaptureConfig`
```cpp
struct CaptureConfig {
    uint32_t sampleRate = 48000;      // Hz
    uint16_t channels = 2;            // 1=mono, 2=stéréo
    uint16_t bitsPerSample = 16;      // 16, 24, ou 32
    uint32_t bufferSize = 4096;       // Échantillons
    bool useFloatingPoint = false;
    uint32_t latencyMs = 10;          // Latence cible
    bool enableNoiseReduction = false;
    bool enableEchoCancellation = false;
    bool enableAutoGainControl = false;
};
```

#### `FileWriterConfig`
```cpp
struct FileWriterConfig {
    AudioFileFormat format = AudioFileFormat::WAV;
    uint32_t sampleRate = 48000;
    uint16_t channels = 2;
    uint16_t bitsPerSample = 16;
    bool normalizeOnWrite = false;
    float normalizeTarget = 0.95f;
};
```

### Utilitaires (namespace `Utils`)

**Conversions de format :**
- `int16ToFloat()` / `floatToInt16()`
- `int24ToFloat()` / `floatToInt24()`
- `int32ToFloat()` / `floatToInt32()`

**Conversions de canaux :**
- `monoToStereo()` / `stereoToMono()`
- `interleave()` / `deinterleave()`

**Calculs audio :**
- `calculateRMS()` : Calcule le niveau RMS
- `calculatePeak()` : Calcule le niveau peak
- `calculateTruePeak()` : Calcule le true peak avec interpolation
- `linearToDb()` / `dbToLinear()` : Conversions dB
- `calculateLUFS()` : Calcule le loudness (LUFS)

**Détection :**
- `isSilent()` : Détecte le silence
- `isClipping()` : Détecte la saturation
- `calculateZeroCrossingRate()` : Taux de passage par zéro

**Traitement :**
- `applyGain()` : Applique un gain
- `normalize()` : Normalise le signal
- `removeDCOffset()` : Supprime l'offset DC
- `fadeIn()` / `fadeOut()` : Applique un fondu

**Génération de signaux :**
- `generateSine()` : Génère un sinus
- `generateWhiteNoise()` : Génère du bruit blanc
- `generatePinkNoise()` : Génère du bruit rose

## 🧪 Exemples complets

Le fichier `examples/audio_recorder_example.cpp` contient 4 exemples complets :

1. **Enregistrement simple** : Capture et sauvegarde dans un fichier WAV
2. **Enregistrement circulaire** : Buffer ring avec sauvegarde des dernières secondes
3. **Détection de silence** : Découpage automatique basé sur les niveaux
4. **Signaux de test** : Génération de signaux audio de test

Pour compiler et exécuter les exemples :

```bash
cd build
cmake .. -DBUILD_EXAMPLES=ON
cmake --build .
./bin/audio_recorder_example
```

## 🔧 Intégration dans votre projet

### Méthode 1 : Header-only

Copiez simplement les fichiers `.hpp` dans votre projet et incluez-les :

```cpp
#include "path/to/AudioCapture.hpp"
#include "path/to/AudioCaptureImpl.hpp"
```

### Méthode 2 : CMake

Ajoutez le projet comme sous-module :

```cmake
add_subdirectory(path/to/nyth-audio-capture)
target_link_libraries(your_target PRIVATE Nyth::AudioCapture)
```

### Méthode 3 : Installation système

Après installation avec `cmake --install` :

```cmake
find_package(NythAudioCapture REQUIRED)
target_link_libraries(your_target PRIVATE Nyth::AudioCapture)
```

## 🐛 Dépannage

### Linux : "Cannot open ALSA device"
Assurez-vous que :
- Les librairies ALSA sont installées : `sudo apt-get install libasound2-dev`
- L'utilisateur a accès au périphérique audio : `sudo usermod -a -G audio $USER`
- Le périphérique n'est pas utilisé par une autre application

### Windows : "Failed to initialize WASAPI"
- Vérifiez que le service Windows Audio est en cours d'exécution
- Mettez à jour les pilotes audio
- Essayez d'exécuter en tant qu'administrateur

### macOS : "CoreAudio permission denied"
- Accordez les permissions microphone dans Préférences Système > Sécurité et confidentialité
- Recompilez avec la signature de code appropriée

## 📊 Performances

- **Latence** : < 10ms en configuration optimale
- **CPU** : < 2% sur un processeur moderne
- **Mémoire** : ~10MB pour 30 secondes de buffer stéréo 48kHz
- **Thread-safe** : Toutes les opérations sont thread-safe

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Soumettre des pull requests

## 📄 Licence

Ce projet fait partie du système Nyth. Consultez le fichier LICENSE principal du projet pour plus d'informations.

## 📮 Contact

Pour toute question ou support, veuillez ouvrir une issue sur le dépôt GitHub du projet Nyth.

---

*Développé avec ❤️ pour le projet Nyth*