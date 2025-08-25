# 🎵 Composants Audio Core - Documentation Doxygen

## 📖 Vue d'ensemble des Composants

Les composants audio constituent la base du module Core Audio, fournissant des fonctionnalités audio spécialisées et optimisées. Chaque composant est conçu pour être modulaire, réutilisable et haute performance.

## 🏗️ Architecture des Composants

```
components/
├── 🎛️ AudioEqualizer/           # Égaliseur 10-bandes haute performance
├── ⚠️ AudioError/               # Système de gestion d'erreurs standardisé
├── 🎚️ EQBand/                  # Définition et gestion des bandes d'égalisation
├── 🔧 ThreadSafeBiquadFilter/   # Filtres biquad thread-safe
└── 📊 constant/                 # Constantes et configurations globales
```

## 🎛️ AudioEqualizer

### Description

L'égaliseur 10-bandes haute performance avec support des presets et optimisation SIMD. Implémente un pipeline de traitement audio optimisé pour les applications temps réel.

### Caractéristiques Techniques

- **Bandes** : 10 bandes configurables (31.25 Hz à 16 kHz)
- **Types de filtres** : Peak, Shelf, Pass, Notch, Allpass
- **Presets intégrés** : Rock, Pop, Jazz, Classical, Electronic
- **Performance** : 2133x temps réel (optimisé)
- **Thread-safe** : Mutex et atomic operations
- **SIMD** : Optimisations vectorielles et unrolling

### Architecture

```cpp
class AudioEqualizer {
    // Configuration
    std::vector<EQBand> m_bands;           // Bandes d'égalisation
    uint32_t m_sampleRate;                 // Fréquence d'échantillonnage
    std::atomic<double> m_masterGain;      // Gain maître thread-safe
    std::atomic<bool> m_bypass;            // Mode bypass
    std::atomic<bool> m_parametersChanged; // Flag de changement

    // Traitement optimisé
    void processOptimized(const std::vector<float>& input, std::vector<float>& output);
    void processStereoOptimized(const std::vector<float>& inputL, const std::vector<float>& inputR,
                               std::vector<float>& outputL, std::vector<float>& outputR);
};
```

### Utilisation

```cpp
// Création et configuration
auto equalizer = std::make_unique<Audio::core::AudioEqualizer>(10, 48000);

// Configuration des bandes
equalizer->setBandGain(0, 6.0);      // Boost basse (31.25 Hz)
equalizer->setBandGain(4, 2.0);      // Boost mid (500 Hz)
equalizer->setBandGain(9, 4.0);      // Boost aiguë (16 kHz)

// Chargement de preset
equalizer->loadPreset(AudioFX::EQPresetFactory::createRockPreset());

// Traitement audio
std::vector<float> input = {...};
std::vector<float> output(input.size());
equalizer->processOptimized(input, output);
```

### Optimisations

- **Block processing** : Traitement par blocs de 2048 échantillons
- **Unrolling** : Boucles déroulées par facteur 4
- **Prefetch** : Anticipation des données en cache
- **SIMD alignment** : Alignement mémoire pour instructions vectorielles

## ⚠️ AudioError

### Description

Système de gestion d'erreurs standardisé basé sur les codes d'erreur POSIX. Fournit une gestion d'erreurs robuste et prévisible pour les opérations audio temps réel.

### Codes d'Erreur

```cpp
enum class AudioError : int32_t {
    // Succès
    OK = 0,

    // Erreurs de validation (1-99)
    NULL_POINTER = 1,
    INVALID_SIZE = 2,
    BUFFER_TOO_SMALL = 3,
    BUFFER_TOO_LARGE = 4,
    SIZE_MISMATCH = 5,
    INVALID_PARAMETER = 6,
    OUT_OF_RANGE = 7,

    // Erreurs d'état (100-199)
    NOT_INITIALIZED = 100,
    ALREADY_INITIALIZED = 101,
    INVALID_STATE = 102,
    EFFECT_DISABLED = 103,

    // Erreurs de ressources (200-299)
    OUT_OF_MEMORY = 200,
    ALLOCATION_FAILED = 201,
    RESOURCE_BUSY = 202,

    // Erreurs de configuration (300-399)
    INVALID_SAMPLE_RATE = 300,
    INVALID_CHANNELS = 301,
    INVALID_FREQUENCY = 302,
    INVALID_Q_FACTOR = 303,
    INVALID_GAIN = 304,

    // Erreurs de traitement (400-499)
    PROCESSING_FAILED = 400,
    OVERFLOW_DETECTED = 401,
    UNDERFLOW_DETECTED = 402,
    DENORMAL_DETECTED = 403,
    NAN_DETECTED = 404,
    INF_DETECTED = 405
};
```

### Utilisation

```cpp
// Vérification d'erreur
AudioError result = validateAudioBuffer(buffer, size);
if (result != AudioError::OK) {
    handleError(result);
    return;
}

// Utilisation avec AudioResult<T>
AudioResult<float> processAudio(const std::vector<float>& input) {
    if (input.empty()) {
        return AudioResult<float>(AudioError::INVALID_SIZE);
    }

    // Traitement...
    float output = process(input);
    return AudioResult<float>(output);
}
```

### Validation

```cpp
class AudioValidator {
    // Validation des pointeurs
    template <typename T>
    static AudioError validatePointer(const T* ptr);

    // Validation des buffers
    template <typename T>
    static AudioError validateBuffer(const T* buffer, size_t size);

    // Validation des plages
    template <typename T>
    static AudioError validateRange(T value, T min, T max);

    // Validation des fréquences
    static AudioError validateFrequency(double freq, double sampleRate);

    // Validation des facteurs Q
    static AudioError validateQ(double q);
};
```

## 🎚️ EQBand

### Description

Structure de données représentant une bande d'égaliseur individuelle. Chaque bande contient les paramètres de fréquence, gain, facteur Q et type de filtre.

### Structure

```cpp
struct EQBand {
    double frequency;                           // Fréquence centrale (Hz)
    double gain;                               // Gain en dB
    double q;                                  // Facteur de qualité
    FilterType type;                           // Type de filtre
    std::unique_ptr<BiquadFilter> filter;     // Filtre biquad associé
    bool enabled;                              // État activé/désactivé

    // Constructeurs
    EQBand();                                  // Constructeur par défaut
    EQBand(const EQBand& other);               // Constructeur de copie
    EQBand(EQBand&& other);                    // Constructeur de déplacement

    // Opérateurs d'assignation
    EQBand& operator=(const EQBand& other);   // Assignation par copie
    EQBand& operator=(EQBand&& other);        // Assignation par déplacement
};
```

### Types de Filtres

```cpp
enum class FilterType {
    LOWPASS,      // Passe-bas
    HIGHPASS,     // Passe-haut
    BANDPASS,     // Passe-bande
    NOTCH,        // Notch (élimination)
    PEAK,         // Peaking (boost/atténuation)
    LOWSHELF,     // Shelf basse fréquence
    HIGHSHELF,    // Shelf haute fréquence
    ALLPASS       // Allpass (phase uniquement)
};
```

### Utilisation

```cpp
// Création d'une bande
EQBand band;
band.frequency = 1000.0;    // 1 kHz
band.gain = 3.0;            // +3 dB
band.q = 0.707;             // Butterworth
band.type = FilterType::PEAK;
band.enabled = true;

// Configuration du filtre
band.filter->calculatePeaking(band.frequency, sampleRate, band.q, band.gain);
```

## 🔧 ThreadSafeBiquadFilter

### Description

Wrapper thread-safe pour les filtres biquad, garantissant un accès concurrent sécurisé aux filtres audio. Implémente des stratégies de verrouillage optimisées pour les applications temps réel.

### Classes

```cpp
class ThreadSafeBiquadFilter {
    // Méthodes thread-safe
    void setCoefficients(double a0, double a1, double a2, double b0, double b1, double b2);
    void calculateLowpass(double frequency, double sampleRate, double q);
    void calculateHighpass(double frequency, double sampleRate, double q);
    void calculatePeaking(double frequency, double sampleRate, double q, double gainDB);

    // Traitement avec gestion d'erreur
    AudioError process(const float* input, float* output, size_t numSamples);
    void processStereo(const float* inputL, const float* inputR,
                      float* outputL, float* outputR, size_t numSamples);
};

class LockFreeBiquadFilter {
    // Double buffering lock-free
    void updateCoefficients(double a0, double a1, double a2, double b0, double b1, double b2);
    void process(const float* input, float* output, size_t numSamples);
    void processStereo(const float* inputL, const float* inputR,
                      float* outputL, float* outputR, size_t numSamples);
};
```

### Stratégies de Thread Safety

1. **ThreadSafeBiquadFilter** : Utilise des mutex pour la protection
2. **LockFreeBiquadFilter** : Double buffering avec échange atomique
3. **try_lock** : Évite le blocage en cas de conflit
4. **Pass-through** : En cas d'échec de verrouillage, passe le signal non traité

### Utilisation

```cpp
// Filtre thread-safe
auto filter = std::make_unique<ThreadSafeBiquadFilter>();

// Configuration thread-safe
filter->calculateLowpass(1000.0, 48000, 0.707);

// Traitement avec gestion d'erreur
AudioError result = filter->process(input, output, numSamples);
if (result == AudioError::RESOURCE_BUSY) {
    // Filtre occupé, utiliser le signal d'entrée
    std::copy(input, input + numSamples, output);
}

// Filtre lock-free
auto lockFreeFilter = std::make_unique<LockFreeBiquadFilter>();
lockFreeFilter->updateCoefficients(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
lockFreeFilter->process(input, output, numSamples);
```

## 📊 CoreConstants

### Description

Module centralisé contenant toutes les constantes, configurations et utilitaires mathématiques utilisés par le système audio. Fournit une interface cohérente et optimisée pour la configuration audio.

### Constantes Principales

```cpp
namespace AudioFX {
    // Fréquences d'échantillonnage
    constexpr uint32_t SAMPLE_RATE_44100 = 44100;
    constexpr uint32_t SAMPLE_RATE_48000 = 48000;
    constexpr uint32_t SAMPLE_RATE_96000 = 96000;
    constexpr uint32_t DEFAULT_SAMPLE_RATE = SAMPLE_RATE_48000;

    // Taille des blocs de traitement
    constexpr size_t DEFAULT_BLOCK_SIZE = 512;
    constexpr size_t MAX_BLOCK_SIZE = 2048;
    constexpr size_t MIN_BLOCK_SIZE = 64;

    // Configuration de l'égaliseur
    constexpr size_t NUM_BANDS = 10;
    constexpr size_t MAX_BANDS = 31;

    // Plages des paramètres
    constexpr double MIN_Q = 0.1;
    constexpr double MAX_Q = 10.0;
    constexpr double DEFAULT_Q = 0.707;

    constexpr double MIN_GAIN_DB = -24.0;
    constexpr double MAX_GAIN_DB = 24.0;
    constexpr double DEFAULT_GAIN_DB = 0.0;
}
```

### Constantes d'Égaliseur

```cpp
namespace EqualizerConstants {
    // Fréquences par défaut (Hz)
    constexpr double DEFAULT_FREQUENCIES[NUM_BANDS] = {
        31.25,   // Sub-bass
        62.5,    // Bass
        125.0,   // Low-mid
        250.0,   // Mid
        500.0,   // Mid
        1000.0,  // Mid-high
        2000.0,  // High-mid
        4000.0,  // Presence
        8000.0,  // Brilliance
        16000.0  // Air
    };

    // Presets de gains
    namespace PresetGains {
        constexpr std::array<double, NUM_BANDS> ROCK = {4.0, 3.0, -1.0, -2.0, -1.0, 2.0, 3.0, 4.0, 3.0, 2.0};
        constexpr std::array<double, NUM_BANDS> POP = {-1.0, 2.0, 4.0, 3.0, 0.0, -1.0, -1.0, 0.0, 2.0, 3.0};
        constexpr std::array<double, NUM_BANDS> JAZZ = {0.0, 2.0, 1.0, 2.0, -2.0, -2.0, 0.0, 1.0, 2.0, 3.0};
    }
}
```

### Utilitaires Mathématiques

```cpp
// Conversion dB ↔ Linéaire
template<typename T = double>
constexpr T db_to_linear(T db) {
    return static_cast<T>(std::pow(10.0, db / 20.0));
}

template<typename T = double>
constexpr T linear_to_db(T linear) {
    return static_cast<T>(20.0 * std::log10(linear));
}

// Validation des paramètres
constexpr bool is_valid_frequency(double freq) {
    return freq > 0.0 && freq <= 22050.0;
}

constexpr bool is_valid_q(double q) {
    return q >= MIN_Q && q <= MAX_Q;
}

constexpr bool is_valid_gain_db(double gain_db) {
    return gain_db >= MIN_GAIN_DB && gain_db <= MAX_GAIN_DB;
}
```

### Macros de Compilation

```cpp
// Détection de plateforme
#if defined(__APPLE__) && defined(__MACH__)
    #define AUDIO_PLATFORM_MACOS 1
#elif defined(_WIN32) || defined(_WIN64)
    #define AUDIO_PLATFORM_WINDOWS 1
#elif defined(__linux__)
    #define AUDIO_PLATFORM_LINUX 1
#endif

// Détection de compilateur
#if defined(__clang__)
    #define AUDIO_COMPILER_CLANG 1
#elif defined(__GNUC__) || defined(__GNUG__)
    #define AUDIO_COMPILER_GCC 1
#elif defined(_MSC_VER)
    #define AUDIO_COMPILER_MSVC 1
#endif

// Macros d'optimisation
#ifdef AUDIO_COMPILER_CLANG
    #define AUDIO_FORCE_INLINE __attribute__((always_inline)) inline
    #define AUDIO_NO_INLINE __attribute__((noinline))
    #define AUDIO_ALIGNED(x) __attribute__((aligned(x)))
#endif
```

## 🔄 Intégration des Composants

### Pipeline de Traitement

```cpp
// Création du pipeline
auto equalizer = std::make_unique<Audio::core::AudioEqualizer>(10, 48000);
auto filter = std::make_unique<ThreadSafeBiquadFilter>();

// Configuration
equalizer->setBandGain(0, 6.0);
filter->calculateLowpass(8000.0, 48000, 0.707);

// Traitement en chaîne
std::vector<float> input = {...};
std::vector<float> temp(input.size());
std::vector<float> output(input.size());

// Égaliseur → Filtre
equalizer->processOptimized(input, temp);
filter->process(temp.data(), output.data(), temp.size());
```

### Gestion des Erreurs

```cpp
// Validation des paramètres
AudioError freqError = AudioValidator::validateFrequency(1000.0, 48000);
if (freqError != AudioError::OK) {
    handleError(freqError);
    return;
}

// Traitement avec gestion d'erreur
AudioResult<std::vector<float>> result = processAudio(input);
if (result.hasError()) {
    handleError(result.error());
    return;
}

auto output = result.value();
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
 * @brief Égaliseur audio 10-bandes haute performance
 *
 * Cette classe implémente un égaliseur audio numérique avec 10 bandes
 * configurables, optimisé pour les applications temps réel. Chaque bande
 * peut être configurée individuellement avec sa fréquence, gain et facteur Q.
 *
 * @see EQBand pour la structure des bandes individuelles
 * @see EQPreset pour la gestion des presets
 *
 * @example
 * @code
 * auto equalizer = std::make_unique<Audio::core::AudioEqualizer>(10, 48000);
 * equalizer->setBandGain(0, 6.0);  // Boost basse
 * equalizer->processOptimized(input, output);
 * @endcode
 */
class AudioEqualizer {
    // ... implémentation
};
```

---

_Documentation des composants audio du Module Core Audio NYTH_
