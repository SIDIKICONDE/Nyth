# Comparaison des Formats Audio iOS

## 📊 Tableau Comparatif

| Format | Extension | Type | Qualité | Taille/min* | Usage Recommandé |
|--------|-----------|------|---------|-------------|------------------|
| **AAC** | .m4a | Compressé avec perte | Excellente | ~1 MB | ✅ **Recommandé** - Usage général |
| **MP3** | .mp3 | Compressé avec perte | Très bonne | ~1.2 MB | Compatibilité universelle |
| **Opus** | .opus | Compressé avec perte | Excellente | ~0.5-2 MB | Streaming, VoIP moderne |
| **AMR** | .amr | Compressé avec perte | Acceptable | ~0.1 MB | Voix uniquement, téléphonie |
| **AMR-WB** | .amr | Compressé avec perte | Bonne | ~0.2 MB | Voix HD, téléphonie |
| **iLBC** | .ilbc | Compressé avec perte | Acceptable | ~0.1 MB | VoIP, faible bande passante |
| **Speex** | .spx | Compressé avec perte | Bonne | ~0.1-0.3 MB | Compression vocale |
| **ALAC** | .m4a | Compressé sans perte | Parfaite | ~30 MB | Musique haute fidélité |
| **FLAC** | .flac | Compressé sans perte | Parfaite | ~30 MB | Archives audio, mastering |
| **PCM 16-bit** | .wav | Non compressé | Parfaite | ~10 MB | Production standard |
| **PCM 32-bit** | .wav | Non compressé | Parfaite | ~20 MB | Production haute précision |
| **PCM Float32** | .wav | Non compressé | Parfaite | ~20 MB | Production professionnelle |
| **PCM Float64** | .wav | Non compressé | Parfaite | ~40 MB | Qualité maximale |

*Taille approximative pour 1 minute d'audio mono à qualité "high"

## 🎯 Guide de Sélection

### Pour les Notes Vocales / Mémos
- **Format recommandé** : AAC (.m4a)
- **Qualité** : Medium
- **Configuration** : Mono, 44.1 kHz
- **Taille** : ~0.8 MB/min
```swift
audioRecorder.usePreset(.voiceNote)
```

### Pour les Appels VoIP
- **Format recommandé** : Opus (.opus) ou AMR-WB (.amr)
- **Qualité** : Medium
- **Configuration** : Mono, 16 kHz
- **Taille** : ~0.2-0.5 MB/min
```swift
audioRecorder.usePreset(.voiceCall)
```

### Pour l'Enregistrement Musical
- **Format recommandé** : ALAC (.m4a) pour l'archivage, AAC pour le partage
- **Qualité** : High ou Maximum
- **Configuration** : Stéréo, 48 kHz
- **Taille** : ~2 MB/min (AAC) ou ~35 MB/min (ALAC)
```swift
audioRecorder.usePreset(.musicHigh) // ALAC
audioRecorder.usePreset(.musicStandard) // AAC
```

### Pour le Streaming
- **Format recommandé** : Opus (.opus)
- **Qualité** : High
- **Configuration** : Stéréo, 48 kHz
- **Taille** : ~1.5 MB/min
```swift
audioRecorder.usePreset(.streaming)
```

### Pour l'Enregistrement Professionnel
- **Format recommandé** : PCM Float32 (.wav)
- **Qualité** : Maximum
- **Configuration** : Stéréo, 96 kHz
- **Taille** : ~40 MB/min
```swift
audioRecorder.usePreset(.professional)
```

## 🔧 Considérations Techniques

### Latence
- **Plus faible** : PCM (pas de compression)
- **Faible** : Opus, iLBC
- **Moyenne** : AAC, MP3
- **Plus élevée** : ALAC, FLAC

### Consommation CPU
- **Plus faible** : PCM (pas de compression)
- **Faible** : AMR, iLBC
- **Moyenne** : AAC, MP3, Opus
- **Élevée** : ALAC, FLAC

### Compatibilité
- **Universelle** : MP3, WAV (PCM)
- **Excellente** : AAC, M4A
- **Bonne** : FLAC, Opus
- **Limitée** : AMR, iLBC, Speex

## 💡 Recommandations par Scénario

### 1. Application de Messagerie Vocale
```swift
// Configuration optimale
audioRecorder.setAudioFormat(.aac, quality: .medium)
audioRecorder.audioConfiguration = AudioConfiguration(
    format: .aac,
    quality: .medium,
    channels: 1,
    sampleRate: 22050
)
```
- Taille : ~0.5 MB/min
- Qualité suffisante pour la voix
- Compatible avec tous les appareils

### 2. Application de Podcast
```swift
// Configuration recommandée
audioRecorder.setAudioFormat(.aac, quality: .high)
audioRecorder.audioConfiguration = AudioConfiguration(
    format: .aac,
    quality: .high,
    channels: 1,
    sampleRate: 44100
)
```
- Taille : ~1 MB/min
- Excellente qualité vocale
- Format standard de l'industrie

### 3. Application de Musique
```swift
// Pour l'enregistrement
audioRecorder.usePreset(.musicHigh) // ALAC sans perte

// Pour le partage
audioRecorder.setAudioFormat(.aac, quality: .maximum)
```
- ALAC pour l'archivage (sans perte)
- AAC pour le partage (excellent compromis)

### 4. Application de Dictée
```swift
// Configuration économique
audioRecorder.usePreset(.compact)
// ou
audioRecorder.setAudioFormat(.amrWB, quality: .medium)
```
- Taille minimale : ~0.2 MB/min
- Qualité suffisante pour la transcription
- Économie de stockage

## 📱 Performances par Type d'Appareil

### iPhone récents (12+)
- Tous les formats supportés sans problème
- Recommandé : Utiliser la qualité maximale disponible

### iPhone anciens (8-11)
- Éviter PCM Float64 pour les longues sessions
- Préférer AAC ou Opus pour l'efficacité

### iPad
- Performances similaires aux iPhone récents
- Idéal pour l'enregistrement stéréo haute qualité

## 🔍 Détection du Format Optimal

```swift
// Exemple de sélection automatique basée sur l'usage
func selectOptimalFormat(for usage: UsageType) -> AudioConfiguration {
    switch usage {
    case .voice:
        return .voiceRecording
    case .music:
        return UIDevice.current.userInterfaceIdiom == .pad ? .musicHighQuality : .musicStandard
    case .streaming:
        return .streaming
    default:
        return .voiceRecording
    }
}
```