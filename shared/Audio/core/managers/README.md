# 🎵 Gestionnaires Audio Core - Documentation Doxygen

## 📖 Vue d'ensemble des Gestionnaires

Les gestionnaires audio constituent la couche de coordination du module Core Audio, fournissant une interface unifiée et thread-safe pour la gestion des composants audio. Chaque gestionnaire encapsule un aspect spécifique du traitement audio et gère le cycle de vie des composants associés.

## 🏗️ Architecture des Gestionnaires

```
managers/
├── 📈 AudioAnalysisManager/    # Gestion de l'analyse audio temps réel
├── 🎙️ AudioRecorderManager/    # Gestion de l'enregistrement audio
├── 🎛️ EqualizerManager/        # Gestion de l'égaliseur 10-bandes
└── 🔧 FilterManager/           # Gestion des filtres biquad
```

## 📈 AudioAnalysisManager

### Description

Gestionnaire d'analyse audio temps réel fournissant des métriques audio avancées, une analyse fréquentielle et une détection d'événements. Optimisé pour les applications nécessitant un monitoring audio en continu.

### Caractéristiques Techniques

- **Métriques temps réel** : RMS, Peak, Average (en dB)
- **Analyse fréquentielle** : FFT, bandes d'octave ISO
- **Détection d'événements** : Silence, Clipping, Overflow
- **Statistiques globales** : Durée, frames traités, niveaux min/max
- **Thread-safe** : Mutex et atomic operations
- **Callbacks** : Notifications asynchrones des événements

### Architecture

```cpp
class AudioAnalysisManager {
    // Configuration
    Nyth::Audio::AudioConfig config_;
    int analysisIntervalMs_;           // Intervalle d'analyse (ms)
    double silenceThreshold_;          // Seuil de silence (dB)
    double clippingThreshold_;         // Seuil de clipping (dB)
    bool enableFrequencyAnalysis_;     // Activation analyse fréquentielle
    std::vector<double> frequencyBands_; // Bandes de fréquences

    // État d'analyse
    std::atomic<bool> isAnalyzing_{false};
    std::atomic<bool> isInitialized_{false};
    AudioMetrics currentMetrics_;
    FrequencyAnalysis currentFrequencyAnalysis_;
    AnalysisStats analysisStats_;

    // Buffers et timing
    std::vector<float> analysisBuffer_;
    size_t bufferIndex_;
    std::chrono::steady_clock::time_point lastAnalysisTime_;
};
```

### Métriques Audio

```cpp
struct AudioMetrics {
    double rmsLevel;         // Niveau RMS en dB
    double peakLevel;        // Niveau de crête en dB
    double averageLevel;     // Niveau moyen en dB
    bool hasClipping;        // Indique si il y a clipping
    bool isSilent;           // Indique si c'est silencieux
    double silenceDuration;  // Durée du silence en secondes
    double clippingDuration; // Durée du clipping en secondes
};

struct FrequencyAnalysis {
    std::vector<double> magnitudes;  // Magnitudes par bande
    std::vector<double> frequencies; // Fréquences centrales des bandes
    double spectralCentroid;         // Centroïde spectral
    double spectralRolloff;          // Roll-off spectral
    double spectralFlux;             // Flux spectral
};

struct AnalysisStats {
    uint32_t totalFramesProcessed;   // Total des frames traités
    uint32_t silenceFrames;          // Frames de silence
    uint32_t clippingFrames;         // Frames de clipping
    double maxPeakLevel;             // Niveau de crête maximum
    double minRMSLevel;              // Niveau RMS minimum
    double averageRMSLevel;          // Niveau RMS moyen
    uint32_t analysisDurationMs;     // Durée totale d'analyse
};
```

### Utilisation

```cpp
// Création et configuration
auto analyzer = std::make_unique<AudioAnalysisManager>(callbackManager);

// Configuration de l'analyse
analyzer->setAnalysisConfig(100, -60.0, -1.0, true);
analyzer->setFrequencyBands({31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000});

// Initialisation
analyzer->initialize(audioConfig);

// Démarrage de l'analyse
analyzer->startAnalysis();

// Traitement des données audio
analyzer->processAudioData(audioData, frameCount, channels);

// Récupération des métriques
auto metrics = analyzer->getCurrentMetrics();
auto frequency = analyzer->getFrequencyAnalysis();
auto stats = analyzer->getAnalysisStats();

// Arrêt de l'analyse
analyzer->stopAnalysis();
```

### Callbacks d'Événements

```cpp
// Types de callbacks
using AnalysisCallback = std::function<void(const AudioMetrics& metrics)>;
using FrequencyCallback = std::function<void(const FrequencyAnalysis& analysis)>;
using EventCallback = std::function<void(const std::string& event, const std::string& data)>;

// Configuration des callbacks
analyzer->setAnalysisCallback([](const AudioMetrics& metrics) {
    std::cout << "RMS: " << metrics.rmsLevel << " dB" << std::endl;
});

analyzer->setFrequencyCallback([](const FrequencyAnalysis& analysis) {
    for (size_t i = 0; i < analysis.magnitudes.size(); ++i) {
        std::cout << analysis.frequencies[i] << " Hz: "
                  << analysis.magnitudes[i] << std::endl;
    }
});

analyzer->setEventCallback([](const std::string& event, const std::string& data) {
    std::cout << "Event: " << event << " - " << data << std::endl;
});
```

### Analyse Fréquentielle

```cpp
// Configuration des bandes d'octave ISO
std::vector<double> isoBands = {31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000};
analyzer->setFrequencyBands(isoBands);

// Analyse FFT simplifiée (implémentation de base)
// Dans une vraie implémentation, utiliser FFTW ou KissFFT
auto fftData = analyzer->performFFT(audioData, frameCount);
auto bandMagnitudes = analyzer->calculateBandMagnitudes(fftData);

// Calcul des métriques spectrales
double centroid = analyzer->calculateSpectralCentroid(bandMagnitudes);
double rolloff = analyzer->calculateSpectralRolloff(bandMagnitudes, 0.85);
double flux = analyzer->calculateSpectralFlux(currentMagnitudes, previousMagnitudes);
```

## 🎙️ AudioRecorderManager

### Description

Gestionnaire d'enregistrement audio avec support multi-format, presets de qualité et gestion avancée des fichiers. Optimisé pour les applications nécessitant un enregistrement audio de haute qualité.

### Caractéristiques Techniques

- **Formats supportés** : WAV, FLAC, OGG, MP3, AIFF
- **Presets de qualité** : Low, Medium, High, Lossless
- **Gestion des fichiers** : Création, suppression, listing
- **Statistiques** : Durée, taille, niveaux, clipping
- **Thread-safe** : Mutex et atomic operations
- **Callbacks** : Notifications des événements d'enregistrement

### Architecture

```cpp
class AudioRecorderManager {
    // Configuration d'enregistrement
    std::string currentFilePath_;
    std::string recordingFormat_;
    uint32_t recordingSampleRate_;
    int recordingChannels_;
    int recordingBitsPerSample_;
    uint32_t maxDurationMs_;
    std::string qualityPreset_;

    // État d'enregistrement
    std::atomic<bool> isRecording_{false};
    std::atomic<bool> isPaused_{false};
    std::chrono::steady_clock::time_point recordingStartTime_;
    uint32_t pausedDurationMs_{0};

    // Statistiques
    RecordingStats currentStats_;
    RecordingCallback recordingCallback_;
};
```

### Configuration d'Enregistrement

```cpp
// Configuration manuelle
recorder->setRecordingConfig("/path/recording.wav", "wav", 48000, 2, 24);

// Configuration par preset
recorder->setQualityPreset("high");        // 48 kHz, stéréo, 24-bit, FLAC
recorder->setQualityPreset("lossless");    // 96 kHz, stéréo, 32-bit, FLAC
recorder->setQualityPreset("medium");      // 44.1 kHz, stéréo, 16-bit, WAV
recorder->setQualityPreset("low");         // 22.05 kHz, mono, 16-bit, OGG

// Limitation de durée
recorder->setMaxDuration(300000); // 5 minutes maximum
```

### Presets de Qualité

```cpp
// Low Quality
recordingSampleRate_ = 22050;      // 22.05 kHz
recordingChannels_ = 1;            // Mono
recordingBitsPerSample_ = 16;      // 16-bit
recordingFormat_ = "ogg";          // Compression OGG

// Medium Quality
recordingSampleRate_ = 44100;      // 44.1 kHz
recordingChannels_ = 2;            // Stéréo
recordingBitsPerSample_ = 16;      // 16-bit
recordingFormat_ = "wav";          // WAV non compressé

// High Quality
recordingSampleRate_ = 48000;      // 48 kHz
recordingChannels_ = 2;            // Stéréo
recordingBitsPerSample_ = 24;      // 24-bit
recordingFormat_ = "flac";         // FLAC sans perte

// Lossless Quality
recordingSampleRate_ = 96000;      // 96 kHz
recordingChannels_ = 2;            // Stéréo
recordingBitsPerSample_ = 32;      // 32-bit
recordingFormat_ = "flac";         // FLAC sans perte
```

### Utilisation

```cpp
// Création et configuration
auto recorder = std::make_unique<AudioRecorderManager>(callbackManager);

// Configuration
recorder->setRecordingConfig("/recordings/session.wav", "wav", 48000, 2, 24);
recorder->setQualityPreset("high");
recorder->setMaxDuration(600000); // 10 minutes

// Initialisation
recorder->initialize(audioConfig);

// Enregistrement
recorder->startRecording();

// Pause/Reprise (optionnel)
recorder->pauseRecording();
recorder->resumeRecording();

// Arrêt et finalisation
recorder->stopRecording();

// Récupération des statistiques
auto stats = recorder->getRecordingStats();
std::cout << "Durée: " << stats.durationMs << " ms" << std::endl;
std::cout << "Taille: " << stats.fileSizeBytes << " bytes" << std::endl;
```

### Gestion des Fichiers

```cpp
// Génération de nom de fichier automatique
std::string filename = recorder->generateFileName("session");
// Résultat: "session_20241201_143022.wav"

// Vérification d'existence
if (recorder->fileExists("/path/file.wav")) {
    std::cout << "Fichier existe" << std::endl;
}

// Suppression de fichier
if (recorder->deleteRecording("/path/old.wav")) {
    std::cout << "Fichier supprimé" << std::endl;
}

// Listing des enregistrements
auto recordings = recorder->listRecordings();
for (const auto& recording : recordings) {
    std::cout << "Enregistrement: " << recording << std::endl;
}

// Informations sur le fichier
std::string state = recorder->getRecordingState(); // "recording", "paused", "stopped"
uint32_t duration = recorder->getCurrentDuration(); // Durée actuelle en ms
size_t fileSize = recorder->getFileSize(); // Taille du fichier en bytes
```

### Callbacks d'Enregistrement

```cpp
// Configuration du callback
recorder->setRecordingCallback([](const std::string& event, const std::string& data) {
    if (event == "started") {
        std::cout << "Enregistrement démarré: " << data << std::endl;
    } else if (event == "stopped") {
        std::cout << "Enregistrement arrêté: " << data << std::endl;
    } else if (event == "paused") {
        std::cout << "Enregistrement en pause" << std::endl;
    } else if (event == "resumed") {
        std::cout << "Enregistrement repris" << std::endl;
    }
});
```

## 🎛️ EqualizerManager

### Description

Gestionnaire de l'égaliseur 10-bandes avec support des presets, configuration des bandes et traitement audio optimisé. Fournit une interface unifiée pour la gestion de l'égaliseur audio.

### Caractéristiques Techniques

- **10 bandes configurables** : 31.25 Hz à 16 kHz
- **Types de filtres** : Peak, Shelf, Pass, Notch, Allpass
- **Presets intégrés** : Rock, Pop, Jazz, Classical, Electronic
- **Presets personnalisés** : Sauvegarde et chargement
- **Thread-safe** : Mutex et atomic operations
- **Performance** : Optimisations SIMD et block processing

### Architecture

```cpp
class EqualizerManager {
    // Composants audio
    std::unique_ptr<Audio::core::AudioEqualizer> equalizer_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // Configuration
    Nyth::Audio::AudioConfig config_;
    mutable std::mutex equalizerMutex_;
    std::atomic<bool> isInitialized_{false};

    // Presets personnalisés
    std::unordered_map<std::string, AudioFX::EQPreset> customPresets_;
};
```

### Configuration des Bandes

```cpp
// Configuration complète d'une bande
equalizer->setBand(0, 31.25, 6.0, 0.707, 5, true);  // LOWSHELF, +6 dB
equalizer->setBand(4, 500.0, 2.0, 1.0, 4, true);     // PEAK, +2 dB
equalizer->setBand(9, 16000.0, 4.0, 0.707, 6, true); // HIGHSHELF, +4 dB

// Configuration individuelle des paramètres
equalizer->setBandGain(0, 6.0);           // Gain de la bande 0
equalizer->setBandFrequency(4, 500.0);    // Fréquence de la bande 4
equalizer->setBandQ(4, 1.0);              // Facteur Q de la bande 4
equalizer->setBandType(4, 4);             // Type PEAK pour la bande 4
equalizer->setBandEnabled(4, true);       // Activation de la bande 4
```

### Types de Filtres

```cpp
// Énumération des types de filtres
enum FilterType {
    LOWPASS = 0,      // Passe-bas
    HIGHPASS = 1,     // Passe-haut
    BANDPASS = 2,     // Passe-bande
    NOTCH = 3,        // Notch (élimination)
    PEAK = 4,         // Peaking (boost/atténuation)
    LOWSHELF = 5,     // Shelf basse fréquence
    HIGHSHELF = 6,    // Shelf haute fréquence
    ALLPASS = 7       // Allpass (phase uniquement)
};

// Configuration par type
equalizer->setLowpass(0, 100.0, 0.707);           // Passe-bas à 100 Hz
equalizer->setHighpass(9, 8000.0, 0.707);         // Passe-haut à 8 kHz
equalizer->setPeaking(4, 500.0, 1.0, 3.0);        // Peaking +3 dB à 500 Hz
equalizer->setLowShelf(0, 31.25, 0.707, 6.0);     // Shelf basse +6 dB
equalizer->setHighShelf(9, 16000.0, 0.707, 4.0);  // Shelf haute +4 dB
```

### Utilisation

```cpp
// Création et initialisation
auto equalizer = std::make_unique<EqualizerManager>(callbackManager);
equalizer->initialize(audioConfig);

// Configuration globale
equalizer->setMasterGain(0.0);     // Gain maître 0 dB
equalizer->setBypass(false);        // Désactivation du bypass
equalizer->setSampleRate(48000);    // Fréquence d'échantillonnage

// Configuration des bandes
for (size_t i = 0; i < 10; ++i) {
    equalizer->setBandGain(i, 0.0);        // Reset des gains
    equalizer->setBandEnabled(i, true);    // Activation des bandes
}

// Configuration spécifique
equalizer->setBandGain(0, 6.0);    // Boost basse (31.25 Hz)
equalizer->setBandGain(4, 2.0);    // Boost mid (500 Hz)
equalizer->setBandGain(9, 4.0);    // Boost aiguë (16 kHz)

// Traitement audio
equalizer->processMono(inputData, outputData, numSamples);
equalizer->processStereo(inputL, inputR, outputL, outputR, numSamples);
```

### Presets Intégrés

```cpp
// Chargement des presets intégrés
equalizer->loadPreset("rock");           // Preset Rock
equalizer->loadPreset("pop");            // Preset Pop
equalizer->loadPreset("jazz");           // Preset Jazz
equalizer->loadPreset("classical");      // Preset Classical
equalizer->loadPreset("electronic");     // Preset Electronic
equalizer->loadPreset("vocal_boost");    // Preset Vocal Boost
equalizer->loadPreset("bass_boost");     // Preset Bass Boost
equalizer->loadPreset("treble_boost");   // Preset Treble Boost
equalizer->loadPreset("loudness");       // Preset Loudness

// Sauvegarde de preset personnalisé
equalizer->savePreset("my_custom_preset");

// Récupération des presets disponibles
auto presets = equalizer->getAvailablePresets();
for (const auto& preset : presets) {
    std::cout << "Preset disponible: " << preset << std::endl;
}

// Reset de toutes les bandes
equalizer->resetAllBands();
```

### Informations et État

```cpp
// Informations sur l'égaliseur
size_t numBands = equalizer->getNumBands();        // Nombre de bandes (10)
uint32_t sampleRate = equalizer->getSampleRate();  // Fréquence d'échantillonnage
double masterGain = equalizer->getMasterGain();    // Gain maître actuel
bool isBypassed = equalizer->isBypassed();         // État du bypass

// Configuration d'une bande spécifique
double frequency, gainDB, q;
int filterType;
bool enabled;

if (equalizer->getBand(4, frequency, gainDB, q, filterType, enabled)) {
    std::cout << "Bande 4: " << frequency << " Hz, "
              << gainDB << " dB, Q=" << q << std::endl;
}
```

## 🔧 FilterManager

### Description

Gestionnaire de filtres biquad avec support de tous les types classiques et gestion du cycle de vie des filtres. Fournit une interface unifiée pour la création, configuration et traitement des filtres audio.

### Caractéristiques Techniques

- **Types de filtres** : Tous les types biquad classiques
- **Gestion des IDs** : Création et destruction de filtres
- **Configuration dynamique** : Changement des paramètres en temps réel
- **Thread-safe** : Mutex et atomic operations
- **Performance** : Optimisations SIMD et block processing

### Architecture

```cpp
class FilterManager {
    // Gestion des filtres
    std::unordered_map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>> filters_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // Configuration
    mutable std::mutex filtersMutex_;
    std::atomic<int64_t> nextFilterId_{1};
    uint32_t sampleRate_ = 44100;
};
```

### Gestion du Cycle de Vie

```cpp
// Création d'un filtre
int64_t filterId = filterManager->createFilter();
if (filterId > 0) {
    std::cout << "Filtre créé avec ID: " << filterId << std::endl;
}

// Vérification d'existence
if (filterManager->filterExists(filterId)) {
    std::cout << "Filtre existe" << std::endl;
}

// Destruction d'un filtre
if (filterManager->destroyFilter(filterId)) {
    std::cout << "Filtre détruit" << std::endl;
}

// Statistiques
size_t filterCount = filterManager->getFilterCount();
auto allFilterIds = filterManager->getAllFilterIds();
```

### Configuration des Filtres

```cpp
// Configuration complète
filterManager->setFilterConfig(filterId, 1000.0, 0.707, 3.0, 4);

// Configuration par type spécifique
filterManager->setLowpass(filterId, 1000.0, 0.707);           // Passe-bas
filterManager->setHighpass(filterId, 1000.0, 0.707);          // Passe-haut
filterManager->setBandpass(filterId, 1000.0, 0.707);          // Passe-bande
filterManager->setNotch(filterId, 1000.0, 0.707);             // Notch
filterManager->setPeaking(filterId, 1000.0, 0.707, 3.0);      // Peaking +3 dB
filterManager->setLowShelf(filterId, 100.0, 0.707, 6.0);      // Shelf basse +6 dB
filterManager->setHighShelf(filterId, 8000.0, 0.707, 4.0);    // Shelf haute +4 dB
filterManager->setAllpass(filterId, 1000.0, 0.707);            // Allpass
```

### Traitement Audio

```cpp
// Traitement mono
if (filterManager->processMono(filterId, inputData, outputData, numSamples)) {
    std::cout << "Traitement mono réussi" << std::endl;
}

// Traitement stéréo
if (filterManager->processStereo(filterId, inputL, inputR, outputL, outputR, numSamples)) {
    std::cout << "Traitement stéréo réussi" << std::endl;
}

// Reset d'un filtre
if (filterManager->resetFilter(filterId)) {
    std::cout << "Filtre reset" << std::endl;
}
```

### Informations et Utilitaires

```cpp
// Récupération de la configuration
double frequency, q, gainDB;
int filterType;

if (filterManager->getFilterConfig(filterId, frequency, q, gainDB, filterType)) {
    std::cout << "Fréquence: " << frequency << " Hz" << std::endl;
    std::cout << "Q: " << q << std::endl;
    std::cout << "Gain: " << gainDB << " dB" << std::endl;
    std::cout << "Type: " << filterType << std::endl;
}

// Informations sur les coefficients
double a0, a1, a2, b1, b2;
if (filterManager->getFilterInfo(filterId, a0, a1, a2, b1, b2)) {
    std::cout << "Coefficients: a0=" << a0 << ", a1=" << a1
              << ", a2=" << a2 << ", b1=" << b1 << ", b2=" << b2 << std::endl;
}
```

## 🔄 Intégration des Gestionnaires

### Pipeline de Traitement Complet

```cpp
// Création des gestionnaires
auto equalizer = std::make_unique<EqualizerManager>(callbackManager);
auto filter = std::make_unique<FilterManager>(callbackManager);
auto analyzer = std::make_unique<AudioAnalysisManager>(callbackManager);
auto recorder = std::make_unique<AudioRecorderManager>(callbackManager);

// Initialisation
equalizer->initialize(audioConfig);
filter->initialize(audioConfig);
analyzer->initialize(audioConfig);
recorder->initialize(audioConfig);

// Configuration
equalizer->loadPreset("rock");
int64_t filterId = filter->createFilter();
filter->setLowpass(filterId, 8000.0, 0.707);
analyzer->startAnalysis();
recorder->startRecording();

// Pipeline de traitement
std::vector<float> input = {...};
std::vector<float> temp1(input.size());
std::vector<float> temp2(input.size());
std::vector<float> output(input.size());

// Égaliseur → Filtre → Sortie
equalizer->processMono(input.data(), temp1.data(), input.size());
filter->processMono(filterId, temp1.data(), temp2.data(), temp1.size());
std::copy(temp2.begin(), temp2.end(), output.begin());

// Analyse et enregistrement
analyzer->processAudioData(output.data(), output.size(), 1);
// L'enregistrement se fait automatiquement via le callback
```

### Gestion des Erreurs

```cpp
// Validation des paramètres
if (!equalizer->setBandGain(0, 30.0)) {  // Gain trop élevé
    std::cerr << "Gain invalide" << std::endl;
}

if (!filter->setFilterConfig(filterId, 50000.0, 0.707, 0.0, 0)) {  // Fréquence invalide
    std::cerr << "Fréquence invalide" << std::endl;
}

// Gestion des erreurs de traitement
if (!equalizer->processMono(input, output, numSamples)) {
    std::cerr << "Erreur de traitement égaliseur" << std::endl;
}

if (!filter->processMono(filterId, input, output, numSamples)) {
    std::cerr << "Erreur de traitement filtre" << std::endl;
}
```

## 📚 Documentation Doxygen

### Génération

```bash
# Depuis le répertoire core
doxygen Doxyfile

# Documentation générée dans docs/html/
open docs/html/index.html
```

### Standards de Documentation

- **Classes** : `@brief` pour la description courte
- **Méthodes** : `@param`, `@return`, `@throws` pour les détails
- **Exemples** : `@code` et `@endcode` pour le code
- **Liens** : `@see` pour les références croisées

### Exemple de Documentation

```cpp
/**
 * @brief Gestionnaire d'analyse audio temps réel
 *
 * Cette classe gère l'analyse audio en temps réel, fournissant des métriques
 * audio, une analyse fréquentielle et une détection d'événements. Optimisé
 * pour les applications nécessitant un monitoring audio continu.
 *
 * @see AudioMetrics pour la structure des métriques
 * @see FrequencyAnalysis pour l'analyse fréquentielle
 *
 * @example
 * @code
 * auto analyzer = std::make_unique<AudioAnalysisManager>(callbackManager);
 * analyzer->setAnalysisConfig(100, -60.0, -1.0, true);
 * analyzer->startAnalysis();
 * analyzer->processAudioData(audioData, frameCount, channels);
 * @endcode
 */
class AudioAnalysisManager {
    // ... implémentation
};
```

---

_Documentation des gestionnaires audio du Module Core Audio NYTH_
