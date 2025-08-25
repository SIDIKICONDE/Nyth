# Guide des Formats Audio iOS

Ce guide explique comment utiliser les formats audio spécifiques à iOS dans le système de capture audio.

## Formats Supportés

### 1. ALAC (Apple Lossless Audio Codec)
- **Extension**: `.m4a`
- **Caractéristiques**: 
  - Compression sans perte
  - Qualité identique au WAV mais ~50% plus compact
  - Idéal pour la musique et les enregistrements haute fidélité
  - Compatible avec tous les appareils Apple

**Utilisation**:
```cpp
AudioFileWriterConfig config;
config.format = AudioFileFormat::ALAC;
config.filePath = "recording.m4a";
config.sampleRate = 44100;
config.channelCount = 2;
config.bitsPerSample = 16;
```

### 2. CAF (Core Audio Format)
- **Extension**: `.caf`
- **Caractéristiques**:
  - Format propriétaire Apple très flexible
  - **Pas de limite de taille 4GB** (contrairement au WAV)
  - Supporte de nombreux codecs internes
  - Parfait pour les enregistrements longs ou professionnels
  - Métadonnées riches

**Utilisation**:
```cpp
AudioFileWriterConfig config;
config.format = AudioFileFormat::CAF;
config.filePath = "long_recording.caf";
config.sampleRate = 48000;
config.channelCount = 1;
config.bitsPerSample = 32; // Float 32-bit
```

### 3. AMR (Adaptive Multi-Rate)
- **Extension**: `.amr`
- **Caractéristiques**:
  - Optimisé pour la voix humaine
  - Très faible bitrate (4.75 - 12.2 kbps)
  - Utilisé dans les applications VoIP et téléphonie
  - Excellente compression pour les messages vocaux
  - Économe en batterie avec DTX (Discontinuous Transmission)

**Utilisation**:
```cpp
AudioFileWriterConfig config;
config.format = AudioFileFormat::AMR;
config.filePath = "voice_message.amr";
config.sampleRate = 8000;  // Toujours 8kHz pour AMR-NB
config.channelCount = 1;    // Toujours mono
```

## Configurations Prédéfinies

### Enregistrement Haute Qualité
```cpp
auto config = IOSAudioFormatConfig::forHighQualityRecording();
// Utilise ALAC avec compression niveau 0 (meilleure qualité)
```

### Enregistrement Voix
```cpp
auto config = IOSAudioFormatConfig::forVoiceRecording();
// Utilise AMR avec bitrate optimisé et DTX activé
```

### Enregistrement Long
```cpp
auto config = IOSAudioFormatConfig::forLongRecording();
// Utilise CAF sans limite de taille
```

## Comparaison des Formats

| Format | Compression | Qualité | Taille Fichier | Usage Recommandé |
|--------|------------|---------|----------------|------------------|
| ALAC   | Sans perte | Excellente | Moyenne | Musique, Production |
| CAF    | Variable | Excellente | Variable | Enregistrements longs |
| AMR    | Avec perte | Bonne (voix) | Très petite | Messages vocaux, VoIP |
| WAV    | Aucune | Excellente | Grande | Compatibilité universelle |

## Intégration dans l'Application

### 1. Vérifier le Support
```cpp
if (AudioFormat::isIOSNative(AudioFormats::ALAC)) {
    // Format supporté nativement
}
```

### 2. Obtenir l'Extension
```cpp
AudioFormatConfig config;
config.format = AudioFormats::CAF;
std::string extension = config.getFileExtension(); // ".caf"
```

### 3. Vérifier si Sans Perte
```cpp
if (config.isLossless()) {
    // ALAC, WAV, et certains CAF sont sans perte
}
```

## Considérations Techniques

### ALAC
- Utilise AVAssetWriter pour l'encodage
- Supporte 16/24/32 bits par échantillon
- Compression niveau 0-8 (0 = meilleure qualité)

### CAF
- Utilise AudioFile API directement
- Peut contenir PCM, ALAC, AAC, etc.
- Supporte les métadonnées étendues
- Pas de limite de taille de fichier

### AMR
- Fixé à 8kHz pour AMR-NB, 16kHz pour AMR-WB
- Toujours mono
- Frames de 20ms (160 échantillons)
- DTX permet des économies significatives

## Exemple Complet

```cpp
#include "IOSAudioFileWriter.h"
#include "IOSAudioFormats.h"

void recordHighQualityAudio() {
    AudioFileWriterConfig config;
    config.format = AudioFileFormat::ALAC;
    config.filePath = getDocumentsPath() + "/concert.m4a";
    config.sampleRate = 48000;
    config.channelCount = 2;
    config.bitsPerSample = 24;
    
    IOSAudioFileWriter writer;
    if (writer.open(config)) {
        // Enregistrer l'audio...
        float* audioData = captureAudio();
        size_t frameCount = getFrameCount();
        
        writer.write(audioData, frameCount);
        writer.close();
        
        NSLog(@"Enregistrement ALAC créé: %zu frames", 
              writer.getFramesWritten());
    }
}
```

## Performances et Recommandations

1. **ALAC**: Utilisez pour la qualité maximale sans souci d'espace
2. **CAF**: Idéal pour les sessions d'enregistrement professionnelles
3. **AMR**: Parfait pour les notes vocales et communications

## Compatibilité

- **ALAC/M4A**: Compatible avec tous les appareils Apple, QuickTime, iTunes
- **CAF**: Principalement Apple, conversion nécessaire pour autres plateformes
- **AMR**: Large support mais qualité limitée à la voix

## Limitations

- AMR est limité à la voix (8kHz/16kHz, mono)
- CAF peut nécessiter conversion pour partage cross-platform
- ALAC nécessite plus d'espace que AAC pour qualité équivalente perçue