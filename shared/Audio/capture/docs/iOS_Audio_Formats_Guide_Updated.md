# Guide des Formats Audio iOS (Mis à jour)

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

### 3. AIFF (Audio Interchange File Format)
- **Extension**: `.aiff`
- **Caractéristiques**:
  - Format non compressé développé par Apple
  - Qualité identique au WAV mais avec structure différente
  - Support natif sur macOS et iOS
  - Idéal pour l'édition audio professionnelle
  - Supporte les métadonnées riches

**Utilisation**:
```cpp
AudioFileWriterConfig config;
config.format = AudioFileFormat::AIFF;
config.filePath = "recording.aiff";
config.sampleRate = 44100;
config.channelCount = 2;
config.bitsPerSample = 16;
```

### 4. M4A avec AAC
- **Extension**: `.m4a`
- **Caractéristiques**:
  - AAC dans conteneur MPEG-4
  - Compression avec perte mais excellente qualité
  - Idéal pour la musique et les podcasts
  - Support natif sur tous les appareils Apple
  - Meilleur rapport qualité/taille que MP3

**Utilisation**:
```cpp
AudioFileWriterConfig config;
config.format = AudioFileFormat::M4A_AAC;
config.filePath = "podcast.m4a";
config.sampleRate = 44100;
config.channelCount = 2;
// Bitrate configuré via AudioFormatConfig
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
// Utilise M4A/AAC avec bitrate optimisé pour la voix (64 kbps)
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
| AIFF   | Aucune | Excellente | Grande | Édition professionnelle |
| M4A/AAC| Avec perte | Très bonne | Petite | Musique, Podcasts, Voix |
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
    // ALAC, AIFF, WAV, et certains CAF sont sans perte
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

### AIFF
- Format Big Endian (contrairement au WAV qui est Little Endian)
- Supporte PCM 8/16/24/32 bits
- Peut inclure des loops et markers pour l'édition
- Structure chunk similaire au WAV

### M4A/AAC
- Utilise AVAssetWriter pour l'encodage
- Profiles AAC: LC (Low Complexity), HE (High Efficiency)
- Bitrate variable (VBR) recommandé
- Container MPEG-4 permet métadonnées riches

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
3. **AIFF**: Parfait pour l'édition et le mastering sur Mac
4. **M4A/AAC**: Excellent compromis qualité/taille pour distribution

## Compatibilité

- **ALAC/M4A**: Compatible avec tous les appareils Apple, QuickTime, iTunes
- **CAF**: Principalement Apple, conversion nécessaire pour autres plateformes
- **AIFF**: Support natif Apple, compatible avec la plupart des DAW
- **M4A/AAC**: Large compatibilité, standard moderne

## Limitations

- AIFF fichiers plus gros que nécessaire (pas de compression)
- CAF peut nécessiter conversion pour partage cross-platform
- ALAC nécessite plus d'espace que AAC pour qualité équivalente perçue
- M4A/AAC compression avec perte (mais excellente qualité)

## Note sur AMR

AMR (Adaptive Multi-Rate) n'est **PAS supporté** pour l'enregistrement sur iOS depuis iOS 4.3. Bien qu'il soit excellent pour la compression voix, Apple a retiré ce support. Pour les enregistrements voix, utilisez M4A/AAC avec un bitrate optimisé (64-96 kbps).