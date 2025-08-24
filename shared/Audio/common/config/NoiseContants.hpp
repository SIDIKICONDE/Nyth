#pragma once

// C++17 standard headers - Compatibility garantie
#include <cstddef>
#include <cstdint>

// Constantes mathématiques universelles
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// ============================================================================
// CONSTANTES GLOBALES UNIFIÉES - ÉVITE LES DUPLICATIONS
// ============================================================================

// Constantes audio globales (utilisées par tous les composants)
namespace GlobalAudioConstants {
// Fréquences d'échantillonnage standard
constexpr uint32_t DEFAULT_SAMPLE_RATE = 48000; // Fréquence d'échantillonnage par défaut (48 kHz)
constexpr uint32_t MIN_SAMPLE_RATE = 8000;      // Fréquence d'échantillonnage minimale (8 kHz)
constexpr uint32_t MAX_SAMPLE_RATE = 192000;    // Fréquence d'échantillonnage maximale (192 kHz)

// Tailles FFT standard
constexpr size_t DEFAULT_FFT_SIZE = 1024; // Taille FFT par défaut
constexpr size_t MIN_FFT_SIZE = 64;       // Taille FFT minimale
constexpr size_t MAX_FFT_SIZE = 8192;     // Taille FFT maximale

// Tailles de saut standard
constexpr size_t DEFAULT_HOP_SIZE = 256; // Taille de saut par défaut (75% overlap)
constexpr size_t MIN_HOP_SIZE = 1;       // Taille de saut minimale
constexpr size_t MAX_HOP_SIZE = 4096;    // Taille de saut maximale

// Pourcentages de chevauchement
constexpr double OVERLAP_PERCENTAGE = 0.75; // Pourcentage de chevauchement par défaut (75%)

// Canaux audio
constexpr int DEFAULT_CHANNELS = 1; // Nombre de canaux par défaut (mono)
constexpr int MONO_CHANNELS = 1;    // Nombre de canaux mono
constexpr int STEREO_CHANNELS = 2;  // Nombre de canaux stéréo
constexpr int MIN_CHANNELS = 1;     // Nombre minimum de canaux
constexpr int MAX_CHANNELS = 2;     // Nombre maximum de canaux
} // namespace GlobalAudioConstants

// Constantes de validation globales (utilisées par tous les composants)
namespace GlobalValidationConstants {
// Agressivité
constexpr double MIN_AGGRESSIVENESS = 0.0;     // Agressivité minimale
constexpr double MAX_AGGRESSIVENESS = 3.0;     // Agressivité maximale
constexpr double DEFAULT_AGGRESSIVENESS = 1.0; // Agressivité par défaut

// Bêta (facteur de sur-soustraction)
constexpr double MIN_BETA = 0.5;     // Bêta minimal
constexpr double MAX_BETA = 5.0;     // Bêta maximal
constexpr double DEFAULT_BETA = 1.5; // Bêta par défaut

// Gain de plancher
constexpr double MIN_FLOOR_GAIN = 0.0;      // Gain de plancher minimal
constexpr double MAX_FLOOR_GAIN = 1.0;      // Gain de plancher maximal
constexpr double DEFAULT_FLOOR_GAIN = 0.05; // Gain de plancher par défaut

// Mise à jour du bruit
constexpr double MIN_NOISE_UPDATE = 0.0;      // Mise à jour du bruit minimale
constexpr double MAX_NOISE_UPDATE = 1.0;      // Mise à jour du bruit maximale
constexpr double DEFAULT_NOISE_UPDATE = 0.98; // Mise à jour du bruit par défaut

// Alpha (facteur de lissage)
constexpr double MIN_ALPHA = 0.0;      // Alpha minimal
constexpr double MAX_ALPHA = 1.0;      // Alpha maximal
constexpr double DEFAULT_ALPHA = 0.98; // Alpha par défaut

// Gain
constexpr double MIN_GAIN = 0.0;         // Gain minimal
constexpr double MAX_GAIN = 2.0;         // Gain maximal
constexpr double DEFAULT_MIN_GAIN = 0.1; // Gain minimal par défaut
constexpr double DEFAULT_MAX_GAIN = 1.0; // Gain maximal par défaut
} // namespace GlobalValidationConstants

// Constantes de protection globales
namespace GlobalProtectionConstants {
constexpr float EPSILON_PROTECTION = 1e-10f;  // Protection contre division par zéro
constexpr double MIN_SNR_PROTECTION = 1e-10;  // Protection SNR minimale
constexpr double MAX_LIKELIHOOD_RATIO = 50.0; // Ratio de vraisemblance maximal
} // namespace GlobalProtectionConstants

// ============================================================================
// CONSTANTES SPÉCIFIQUES AUX COMPOSANTS
// ============================================================================

// NoiseReducer specific constants
namespace NoiseReducerConstants {
// Validation des fréquences d'échantillonnage (Hz) - Utilise les constantes globales
// Définit les bornes min/max acceptées par les algorithmes
static constexpr uint32_t MIN_SAMPLE_RATE = GlobalAudioConstants::MIN_SAMPLE_RATE; // Minimum sample rate in Hz
static constexpr uint32_t MAX_SAMPLE_RATE = GlobalAudioConstants::MAX_SAMPLE_RATE; // Maximum sample rate in Hz

// Validation du nombre de canaux - Utilise les constantes globales
// Bornes acceptées et contrainte stéréo
static constexpr int MIN_CHANNELS = GlobalAudioConstants::MIN_CHANNELS; // Minimum number of channels
static constexpr int MAX_CHANNELS = GlobalAudioConstants::MAX_CHANNELS; // Maximum number of channels
static constexpr int STEREO_REQUIRED_CHANNELS =
    GlobalAudioConstants::STEREO_CHANNELS; // Channels required for stereo processing

// Validation du seuil (dBFS)
// Valeurs négatives: plus bas -> plus sensible
constexpr double MAX_THRESHOLD_DB = 0.0;   // Maximum threshold in dB
constexpr double MIN_THRESHOLD_DB = -80.0; // Minimum threshold in dB

// Validation du ratio d'expansion
// > 1.0 : plus grand => réduction plus agressive
constexpr double MIN_RATIO = 1.0;  // Minimum compression ratio
constexpr double MAX_RATIO = 20.0; // Maximum compression ratio

// Validation du plancher (dB)
// Atténuation maximale autorisée
constexpr double MAX_FLOOR_DB = 0.0;   // Maximum floor in dB
constexpr double MIN_FLOOR_DB = -60.0; // Minimum floor in dB

// Validation du temps d'attaque (ms)
// Contrôle la réactivité d'ouverture
constexpr double MIN_ATTACK_MS = 0.1;   // Minimum attack time in ms
constexpr double MAX_ATTACK_MS = 100.0; // Maximum attack time in ms

// Validation du temps de relâchement (ms)
// Contrôle la vitesse de fermeture
constexpr double MIN_RELEASE_MS = 1.0;    // Minimum release time in ms
constexpr double MAX_RELEASE_MS = 1000.0; // Maximum release time in ms

// Validation du coupe-bas (Hz)
// Supprime les grondements basse fréquence
constexpr double MIN_HIGHPASS_HZ = 20.0;   // Minimum high-pass frequency in Hz
constexpr double MAX_HIGHPASS_HZ = 1000.0; // Maximum high-pass frequency in Hz

// Paramètres de filtre
// Valeurs par défaut (Butterworth)
constexpr double DEFAULT_Q_FACTOR = 0.707; // Default Q factor (Butterworth response)

// Constantes de calcul des coefficients
// Utilisées pour lisser enveloppe et gain
constexpr double ATTACK_GAIN_FACTOR = 0.5;  // Factor to reduce attack time for gain smoothing
constexpr double MIN_RELEASE_GAIN_MS = 5.0; // Minimum release time for gain smoothing

// Constantes de traitement génériques
constexpr double UNITY_GAIN = 1.0;         // Unity gain value
constexpr double UNITY_RECIPROCAL = 1.0;   // Unity value for division
constexpr size_t FIRST_CHANNEL_INDEX = 0;  // Index of first channel
constexpr size_t SECOND_CHANNEL_INDEX = 1; // Index of second channel
constexpr size_t ZERO_SAMPLES_CHECK = 0;   // Zero samples for validation

// Constantes spécifiques au traitement NoiseReducer
constexpr double BUTTERWORTH_Q_FACTOR = 0.707; // Default Q factor (Butterworth response)

// Valeurs par défaut de configuration (NoiseReducer)
constexpr double DEFAULT_THRESHOLD_DB = -30.0; // Default threshold in dB
constexpr double DEFAULT_RATIO = 2.0;          // Default compression ratio
constexpr double DEFAULT_FLOOR_DB = -40.0;     // Default floor in dB
constexpr double DEFAULT_ATTACK_MS = 10.0;     // Default attack time in ms
constexpr double DEFAULT_RELEASE_MS = 50.0;    // Default release time in ms
constexpr double DEFAULT_HIGHPASS_HZ = 100.0;  // Default high-pass frequency in Hz
constexpr bool DEFAULT_ENABLED = true;         // Default enabled state
constexpr bool DEFAULT_ENABLE_HIGHPASS = true; // Default high-pass enable state

// Valeurs d'initialisation d'état (par canal)
constexpr double INITIAL_ENVELOPE = 0.0; // Initial envelope follower value
constexpr double INITIAL_GAIN = 1.0;     // Initial gain value (unity gain)

// Constantes pré-calculées pour éviter des calculs coûteux
constexpr double DEFAULT_THRESH_LINEAR = 0.0316227766;  // pow(10, DEFAULT_THRESHOLD_DB/20)
constexpr double DEFAULT_FLOOR_LINEAR = 0.01;           // pow(10, DEFAULT_FLOOR_DB/20)
constexpr double DEFAULT_ATTACK_COEFF_ENV = 0.0;        // Will be calculated in updateDerived()
constexpr double DEFAULT_RELEASE_COEFF_ENV = 0.0;       // Will be calculated in updateDerived()
constexpr double DEFAULT_ATTACK_COEFF_GAIN = 0.0;       // Will be calculated in updateDerived()
constexpr double DEFAULT_RELEASE_COEFF_GAIN = 0.0;      // Will be calculated in updateDerived()
constexpr double DEFAULT_EXPANSION_SLOPE = 0.5;         // 1/DEFAULT_RATIO
constexpr double DEFAULT_THRESH_LINEAR_SQUARED = 0.001; // DEFAULT_THRESH_LINEAR * DEFAULT_THRESH_LINEAR

// Constantes utilitaires et conversions
constexpr double LOG_PROTECTION_MIN = 1e-10;     // Minimum value for log calculations
constexpr double MS_TO_SECONDS_DIVISOR = 1000.0; // Convert ms to seconds
constexpr double MIN_MS_FOR_COEFF = 0.001;       // Minimum ms for coefficient calculation
constexpr double EXP_COEFFICIENT = -6.907755;    // Natural log of 0.001 (for 60dB decay)
constexpr double DB_TO_LINEAR_BASE = 10.0;       // Base for dB to linear conversion
constexpr double DB_TO_LINEAR_DIVISOR = 20.0;    // Divisor for dB to linear conversion
} // namespace NoiseReducerConstants

// RNNoiseSuppressor specific constants
namespace RNNoiseSuppressorConstants {
// Validation des paramètres audio - Utilise les constantes globales
// Bornes d'entrée globales pour l'API publique
static constexpr uint32_t MIN_SAMPLE_RATE = GlobalAudioConstants::MIN_SAMPLE_RATE; // Minimum sample rate in Hz
static constexpr uint32_t MAX_SAMPLE_RATE = GlobalAudioConstants::MAX_SAMPLE_RATE; // Maximum sample rate in Hz
static constexpr int MIN_CHANNELS = GlobalAudioConstants::MIN_CHANNELS;            // Minimum number of channels
static constexpr int MAX_CHANNELS = GlobalAudioConstants::MAX_CHANNELS;            // Maximum number of channels
static constexpr int STEREO_REQUIRED_CHANNELS =
    GlobalAudioConstants::STEREO_CHANNELS; // Channels required for stereo processing

// Paramètres audio par défaut - Utilise les constantes globales
static constexpr int DEFAULT_CHANNELS = GlobalAudioConstants::DEFAULT_CHANNELS; // Default number of channels (mono)
static constexpr int MONO_CHANNELS = GlobalAudioConstants::MONO_CHANNELS;       // Mono channel count
static constexpr int STEREO_CHANNELS = GlobalAudioConstants::STEREO_CHANNELS;   // Stereo channel count

// Paramètres de traitement par défaut - Utilise les constantes globales
static constexpr double DEFAULT_AGGRESSIVENESS =
    GlobalValidationConstants::DEFAULT_AGGRESSIVENESS; // Default noise suppression aggressiveness
static constexpr double MIN_AGGRESSIVENESS =
    GlobalValidationConstants::MIN_AGGRESSIVENESS; // Minimum aggressiveness value
static constexpr double MAX_AGGRESSIVENESS =
    GlobalValidationConstants::MAX_AGGRESSIVENESS; // Maximum aggressiveness value

// Valeurs de configuration par défaut (RNNoiseSuppressor)
static constexpr double DEFAULT_HIGHPASS_HZ = 80.0;   // Default high-pass frequency in Hz
static constexpr bool DEFAULT_ENABLE_HIGHPASS = true; // Default high-pass enable state
static constexpr uint32_t DEFAULT_FFT_SIZE = GlobalAudioConstants::DEFAULT_FFT_SIZE;   // Default FFT size
static constexpr uint32_t DEFAULT_HOP_SIZE = GlobalAudioConstants::DEFAULT_HOP_SIZE;   // Default hop size
static constexpr double OVERLAP_PERCENTAGE = GlobalAudioConstants::OVERLAP_PERCENTAGE; // Overlap percentage (75%)

// Facteurs de traitement
constexpr float STEREO_DOWNMIX_FACTOR = 0.5f;        // Stereo to mono downmix factor
constexpr double AGGRESSIVENESS_NORMALIZATION = 3.0; // Normalization factor for aggressiveness

// Mappage agressivité → paramètres du NoiseReducer (gate)
namespace GateMapping {
static constexpr double THRESHOLD_BASE_DB = -45.0;
static constexpr double THRESHOLD_RANGE_DB = -25.0;
static constexpr double RATIO_BASE = 1.5;
static constexpr double RATIO_RANGE = 6.5;
static constexpr double FLOOR_BASE_DB = -12.0;
static constexpr double FLOOR_RANGE_DB = -23.0;
static constexpr double ATTACK_BASE_MS = 3.0;
static constexpr double ATTACK_RANGE_MS = 7.0;
static constexpr double RELEASE_BASE_MS = 30.0;
static constexpr double RELEASE_RANGE_MS = 120.0;
static constexpr double HIGHPASS_BASE_HZ = 60.0;
static constexpr double HIGHPASS_RANGE_HZ = 60.0;
} // namespace GateMapping

// Mappage agressivité → paramètres de la SpectralNR
namespace SpectralMapping {
static constexpr uint32_t FFT_SIZE = 1024; // Fixed and robust
static constexpr uint32_t HOP_SIZE = 256;  // 75% overlap
static constexpr double BETA_BASE = 1.2;
static constexpr double BETA_RANGE = 1.6;
static constexpr double FLOOR_GAIN_BASE = 0.10;
static constexpr double FLOOR_GAIN_RANGE = -0.07;
static constexpr double NOISE_UPDATE_BASE = 0.95;
static constexpr double NOISE_UPDATE_RANGE = 0.035;
} // namespace SpectralMapping
} // namespace RNNoiseSuppressorConstants

// SpectralNR specific constants
namespace SpectralNRConstants {
// Paramètres audio par défaut - Utilise les constantes globales

// Paramètres FFT / overlap - Utilise les constantes globales
static constexpr size_t DEFAULT_FFT_SIZE =
    GlobalAudioConstants::DEFAULT_FFT_SIZE; // Default FFT size (must be power of 2)
static constexpr size_t DEFAULT_HOP_SIZE = GlobalAudioConstants::DEFAULT_HOP_SIZE; // Default hop size for overlap-add
static constexpr size_t OVERLAP_DIVISOR = 4; // Divisor for overlap (fftSize/4 = 75% overlap)

// Paramètres de traitement spectral (soustraction) - Utilise les constantes globales
static constexpr double DEFAULT_BETA = GlobalValidationConstants::DEFAULT_BETA; // Default over-subtraction factor
static constexpr double DEFAULT_FLOOR_GAIN =
    GlobalValidationConstants::DEFAULT_FLOOR_GAIN; // Default spectral floor gain
static constexpr double DEFAULT_NOISE_UPDATE =
    GlobalValidationConstants::DEFAULT_NOISE_UPDATE; // Default noise estimation smoothing

// Bornes/validation des paramètres utilisateur - Utilise les constantes globales
static constexpr double MIN_BETA = GlobalValidationConstants::MIN_BETA;             // Minimum over-subtraction factor
static constexpr double MAX_BETA = GlobalValidationConstants::MAX_BETA;             // Maximum over-subtraction factor
static constexpr double MIN_FLOOR_GAIN = GlobalValidationConstants::MIN_FLOOR_GAIN; // Minimum spectral floor gain
static constexpr double MAX_FLOOR_GAIN = GlobalValidationConstants::MAX_FLOOR_GAIN; // Maximum spectral floor gain
static constexpr double MIN_NOISE_UPDATE =
    GlobalValidationConstants::MIN_NOISE_UPDATE; // Minimum noise update coefficient
static constexpr double MAX_NOISE_UPDATE =
    GlobalValidationConstants::MAX_NOISE_UPDATE; // Maximum noise update coefficient

// Initialisation de l'état interne
constexpr size_t INITIAL_WRITE_POSITION = 0; // Initial write position
constexpr bool INITIAL_NOISE_STATE = true;   // Initial noise initialization state

// Constantes FFT et fenêtrage - Utilise les constantes globales
static constexpr size_t MIN_FFT_SIZE = GlobalAudioConstants::MIN_FFT_SIZE; // Minimum FFT size
static constexpr size_t MAX_FFT_SIZE = GlobalAudioConstants::MAX_FFT_SIZE; // Maximum FFT size
static constexpr size_t MIN_HOP_SIZE = GlobalAudioConstants::MIN_HOP_SIZE; // Minimum hop size
static constexpr double MIN_BETA_EXTENDED = 0.5;                           // Extended minimum beta for validation
static constexpr double MAX_BETA_EXTENDED = 5.0;                           // Extended maximum beta for validation
static constexpr double MIN_FLOOR_GAIN_EXTENDED = 0.0;                     // Extended minimum floor gain
static constexpr double MAX_FLOOR_GAIN_EXTENDED = 1.0;                     // Extended maximum floor gain
static constexpr double MIN_NOISE_UPDATE_EXTENDED = 0.0;                   // Extended minimum noise update
static constexpr double MAX_NOISE_UPDATE_EXTENDED = 1.0;                   // Extended maximum noise update

// Constantes de la fenêtre de Hann
constexpr float HANN_AMPLITUDE = 0.5f;        // Hann window amplitude
constexpr float HANN_FACTOR = 1.0f;           // Hann window factor
constexpr float HANN_FREQUENCY_FACTOR = 2.0f; // Hann window frequency factor
constexpr size_t HANN_LENGTH_OFFSET = 1;      // Hann window length offset

// Constantes pour le traitement FFT (radix-2)
constexpr size_t FFT_HALF_DIVISOR = 2; // FFT half divisor
constexpr size_t FFT_MIN_SIZE = 1;     // Minimum FFT size for processing
constexpr size_t BIT_SHIFT_ONE = 1;    // Bit shift by one
constexpr size_t BIT_MASK_ONE = 1;     // Bit mask for one
constexpr size_t FFT_RADIX_BASE = 2;   // FFT radix base (2 for radix-2)

// Constantes de traitement spectral génériques
constexpr double NOISE_UPDATE_COMPLEMENT = 1.0; // Complement for noise update calculation
constexpr float MAGNITUDE_EPSILON = 0.0f;       // Magnitude epsilon for calculations
constexpr float HALF = 0.5f;                    // Half value
constexpr float ONE = 1.0f;                     // One value
constexpr float TWO = 2.0f;                     // Two value
constexpr float ZERO = 0.0f;                    // Zero value

// Indices et offsets dans le spectre
constexpr size_t SPECTRUM_DC_INDEX = 0;       // DC component index
constexpr size_t SPECTRUM_NYQUIST_OFFSET = 1; // Nyquist offset
constexpr long long SHIFT_CAST_OFFSET = 0;    // Shift cast offset
} // namespace SpectralNRConstants

// IMCRA specific constants
namespace IMCRAConstants {
// Constantes mathématiques et utilitaires
constexpr double EULER_MASCHERONI = 0.57721566;        // Constante d'Euler-Mascheroni
constexpr double EXPONENTIAL_APPROX_THRESHOLD = 1e-10; // Seuil pour l'approximation exponentielle
constexpr double MAX_LIKELIHOOD_RATIO = 50.0;          // Limite maximale du ratio de vraisemblance
constexpr double BIAS_CORRECTION_FACTOR = 2.12;        // Facteur de correction de biais
constexpr double BIAS_CORRECTION_STEP = 0.025;         // Pas de correction de biais
constexpr double DB_TO_LINEAR_FACTOR = 10.0;           // Facteur de conversion dB vers linéaire
constexpr double DB_TO_LINEAR_DIVISOR = 10.0;          // Diviseur pour conversion dB vers linéaire

// Valeurs d'initialisation
constexpr double INITIAL_MINIMUM_VALUE = 1e10; // Valeur initiale très élevée pour les minima
constexpr double INITIAL_SNR_VALUE = 1.0;      // Valeur initiale du SNR
constexpr double INITIAL_PROBABILITY = 0.5;    // Probabilité initiale (50%)
constexpr double INITIAL_BIAS_FACTOR = 1.0;    // Facteur de biais initial
constexpr double INITIAL_GAIN = 1.0;           // Gain initial

// Constantes de calcul
constexpr double MIN_SNR_PROTECTION = 1e-10; // Protection contre division par zéro
constexpr double UNITY_VALUE = 1.0;          // Valeur unitaire
constexpr double ZERO_VALUE = 0.0;           // Valeur zéro
constexpr double HALF_VALUE = 0.5;           // Valeur 0.5

// Constantes pour les calculs mathématiques
constexpr int MAX_ITERATIONS_EXPINT = 20;              // Nombre maximum d'itérations pour expint
constexpr double EXPONENTIAL_SERIES_THRESHOLD = 1e-10; // Seuil pour la série exponentielle
} // namespace IMCRAConstants

// Constantes spécifiques aux composants Noise
namespace NoiseComponentsConstants {
// Constantes de validation et limites - Utilise les constantes globales
static constexpr uint32_t DEFAULT_SAMPLE_RATE =
    GlobalAudioConstants::DEFAULT_SAMPLE_RATE; // Fréquence d'échantillonnage par défaut
static constexpr int DEFAULT_CHANNELS = GlobalAudioConstants::DEFAULT_CHANNELS; // Nombre de canaux par défaut
static constexpr bool DEFAULT_ENABLED = true;                                   // État activé par défaut

// Constantes de traitement audio
static constexpr size_t MIN_BUFFER_SIZE = 1;        // Taille minimale des buffers
static constexpr size_t DEFAULT_BUFFER_SIZE = 1024; // Taille de buffer par défaut
static constexpr double MIN_AGGRESSIVENESS = GlobalValidationConstants::MIN_AGGRESSIVENESS; // Agressivité minimale
static constexpr double MAX_AGGRESSIVENESS = GlobalValidationConstants::MAX_AGGRESSIVENESS; // Agressivité maximale
static constexpr double DEFAULT_AGGRESSIVENESS =
    GlobalValidationConstants::DEFAULT_AGGRESSIVENESS; // Agressivité par défaut

// Constantes de validation des entrées
constexpr double MIN_VALID_THRESHOLD = -80.0; // Seuil minimal valide
constexpr double MAX_VALID_THRESHOLD = 0.0;   // Seuil maximal valide
constexpr double MIN_VALID_RATIO = 1.0;       // Ratio minimal valide
constexpr double MAX_VALID_RATIO = 20.0;      // Ratio maximal valide
constexpr double MIN_VALID_FLOOR = -60.0;     // Plancher minimal valide
constexpr double MAX_VALID_FLOOR = 0.0;       // Plancher maximal valide

// Constantes de temps (ms)
constexpr double MIN_VALID_ATTACK = 0.1;     // Temps d'attaque minimal
constexpr double MAX_VALID_ATTACK = 100.0;   // Temps d'attaque maximal
constexpr double MIN_VALID_RELEASE = 1.0;    // Temps de relâchement minimal
constexpr double MAX_VALID_RELEASE = 1000.0; // Temps de relâchement maximal

// Constantes de fréquence (Hz)
constexpr double MIN_VALID_HIGHPASS = 20.0;   // Fréquence coupe-bas minimale
constexpr double MAX_VALID_HIGHPASS = 1000.0; // Fréquence coupe-bas maximale

// Constantes de traitement des canaux
constexpr size_t MONO_CHANNEL_COUNT = 1;   // Nombre de canaux mono
constexpr size_t STEREO_CHANNEL_COUNT = 2; // Nombre de canaux stéréo
constexpr size_t FIRST_CHANNEL = 0;        // Index du premier canal
constexpr size_t SECOND_CHANNEL = 1;       // Index du second canal

// Constantes de validation des buffers
constexpr size_t ZERO_SAMPLES = 0;             // Zéro échantillon
constexpr bool ENABLE_HIGHPASS_DEFAULT = true; // Activation coupe-bas par défaut

// Constantes de calcul des coefficients
constexpr double ATTACK_GAIN_FACTOR = 0.5;  // Facteur d'attaque pour le gain
constexpr double MIN_RELEASE_GAIN_MS = 5.0; // Temps de relâchement minimal pour le gain

// Constantes de traitement spectral - Utilise les constantes globales
static constexpr uint32_t DEFAULT_FFT_SIZE = GlobalAudioConstants::DEFAULT_FFT_SIZE;   // Taille FFT par défaut
static constexpr uint32_t DEFAULT_HOP_SIZE = GlobalAudioConstants::DEFAULT_HOP_SIZE;   // Taille de saut par défaut
static constexpr double OVERLAP_PERCENTAGE = GlobalAudioConstants::OVERLAP_PERCENTAGE; // Pourcentage de chevauchement

// Constantes de mappage d'agressivité
namespace AggressivenessMapping {
constexpr double THRESHOLD_BASE_DB = -45.0;  // Seuil de base en dB
constexpr double THRESHOLD_RANGE_DB = -25.0; // Plage de seuil en dB
constexpr double RATIO_BASE = 1.5;           // Ratio de base
constexpr double RATIO_RANGE = 6.5;          // Plage de ratio
constexpr double FLOOR_BASE_DB = -12.0;      // Plancher de base en dB
constexpr double FLOOR_RANGE_DB = -23.0;     // Plage de plancher en dB
constexpr double ATTACK_BASE_MS = 3.0;       // Attaque de base en ms
constexpr double ATTACK_RANGE_MS = 7.0;      // Plage d'attaque en ms
constexpr double RELEASE_BASE_MS = 30.0;     // Relâchement de base en ms
constexpr double RELEASE_RANGE_MS = 120.0;   // Plage de relâchement en ms
constexpr double HIGHPASS_BASE_HZ = 60.0;    // Coupe-bas de base en Hz
constexpr double HIGHPASS_RANGE_HZ = 60.0;   // Plage de coupe-bas en Hz
} // namespace AggressivenessMapping

// Constantes de mappage spectral
namespace SpectralMapping {
constexpr uint32_t FFT_SIZE = 1024;          // Taille FFT fixe
constexpr uint32_t HOP_SIZE = 256;           // Taille de saut fixe
constexpr double BETA_BASE = 1.2;            // Bêta de base
constexpr double BETA_RANGE = 1.6;           // Plage de bêta
constexpr double FLOOR_GAIN_BASE = 0.10;     // Gain de plancher de base
constexpr double FLOOR_GAIN_RANGE = -0.07;   // Plage de gain de plancher
constexpr double NOISE_UPDATE_BASE = 0.95;   // Mise à jour de bruit de base
constexpr double NOISE_UPDATE_RANGE = 0.035; // Plage de mise à jour de bruit
} // namespace SpectralMapping

// Constantes de normalisation
constexpr double AGGRESSIVENESS_NORMALIZATION = 3.0; // Facteur de normalisation d'agressivité
constexpr float STEREO_DOWNMIX_FACTOR = 0.5f;        // Facteur de downmix stéréo
} // namespace NoiseComponentsConstants

// Constantes spécifiques à AdvancedSpectralNR
namespace AdvancedSpectralNRConstants {
// Paramètres de base par défaut - Utilise les constantes globales
static constexpr uint32_t DEFAULT_SAMPLE_RATE =
    GlobalAudioConstants::DEFAULT_SAMPLE_RATE;   // Fréquence d'échantillonnage par défaut
static constexpr size_t DEFAULT_FFT_SIZE = 2048; // Taille FFT par défaut (plus grande pour meilleure résolution)
static constexpr size_t DEFAULT_HOP_SIZE = 512;  // Taille de saut par défaut (75% overlap)

// Valeurs d'agressivité par défaut - Utilise les constantes globales
static constexpr float DEFAULT_AGGRESSIVENESS =
    GlobalValidationConstants::DEFAULT_AGGRESSIVENESS; // Agressivité par défaut (0-1)

// Paramètres IMCRA par défaut
constexpr float DEFAULT_SPEECH_THRESHOLD = 4.6f; // Seuil de détection de parole par défaut
static constexpr float DEFAULT_NOISE_UPDATE_RATE =
    GlobalValidationConstants::DEFAULT_NOISE_UPDATE; // Taux de mise à jour du bruit par défaut

// Paramètres Wiener par défaut - Utilise les constantes globales
static constexpr float DEFAULT_WIENER_ALPHA =
    GlobalValidationConstants::DEFAULT_ALPHA; // Paramètre alpha de Wiener par défaut
static constexpr float DEFAULT_MIN_GAIN = GlobalValidationConstants::DEFAULT_MIN_GAIN; // Gain minimal par défaut
static constexpr float DEFAULT_MAX_GAIN = GlobalValidationConstants::DEFAULT_MAX_GAIN; // Gain maximal par défaut

// Paramètres de réduction du bruit musical par défaut
constexpr float DEFAULT_TEMPORAL_SMOOTHING = 0.7f; // Lissage temporel par défaut
constexpr float DEFAULT_SPECTRAL_SMOOTHING = 0.3f; // Lissage spectral par défaut

// Paramètres de préservation des transitoires par défaut
constexpr float DEFAULT_TRANSIENT_THRESHOLD = 6.0f;  // Seuil de détection des transitoires par défaut
constexpr float DEFAULT_TRANSIENT_PROTECTION = 0.8f; // Protection des transitoires par défaut

// Seuils de détection de contenu
constexpr float SPEECH_DETECTION_THRESHOLD = 0.7f;    // Seuil de détection de parole
constexpr float MUSIC_DETECTION_THRESHOLD = 0.5f;     // Seuil de détection de musique
constexpr float TRANSIENT_DETECTION_THRESHOLD = 6.0f; // Seuil de détection des transitoires

// Poids des algorithmes par type de contenu
namespace AlgorithmWeights {
// Poids pour la parole
constexpr float SPEECH_WIENER = 0.8f;   // Poids Wiener pour la parole
constexpr float SPEECH_SPECTRAL = 0.2f; // Poids spectral pour la parole

// Poids pour la musique
constexpr float MUSIC_WIENER = 0.5f;    // Poids Wiener pour la musique
constexpr float MUSIC_MULTIBAND = 0.5f; // Poids multibande pour la musique

// Poids pour le bruit
constexpr float NOISE_SPECTRAL = 0.6f; // Poids spectral pour le bruit
constexpr float NOISE_WIENER = 0.4f;   // Poids Wiener pour le bruit
} // namespace AlgorithmWeights

// Paramètres de traitement par défaut
constexpr size_t DEFAULT_BLOCK_SIZE = 512;          // Taille de bloc par défaut
constexpr bool DEFAULT_ENABLE_MULTIBAND = true;     // Activation multibande par défaut
constexpr bool DEFAULT_PRESERVE_TRANSIENTS = true;  // Préservation des transitoires par défaut
constexpr bool DEFAULT_REDUCE_MUSICAL_NOISE = true; // Réduction du bruit musical par défaut
} // namespace AdvancedSpectralNRConstants

// Constantes spécifiques à MultibandProcessor
namespace MultibandProcessorConstants {
// Paramètres de bandes par défaut
constexpr size_t DEFAULT_NUM_BANDS = 24;      // Nombre de bandes par défaut
constexpr float DEFAULT_LOW_FREQ = 20.0f;     // Fréquence basse par défaut (20 Hz)
constexpr float DEFAULT_HIGH_FREQ = 20000.0f; // Fréquence haute par défaut (20 kHz)

// Modes de bandes disponibles
enum BandMode {
    LINEAR = 0,     // Échelle linéaire (fréquences équidistantes)
    BARK_SCALE = 1, // Échelle de Bark (perception auditive)
    MEL_SCALE = 2,  // Échelle de Mel (perception de hauteur)
    ERB_SCALE = 3   // Échelle ERB (Equivalent Rectangular Bandwidth)
};

// Valeurs par défaut
constexpr BandMode DEFAULT_BAND_MODE = BARK_SCALE; // Mode de bande par défaut

// Limites de validation - Utilise les constantes globales
static constexpr size_t MIN_FRAME_SIZE = GlobalAudioConstants::MIN_FFT_SIZE; // Taille minimale de frame
static constexpr size_t MAX_FRAME_SIZE = GlobalAudioConstants::MAX_FFT_SIZE; // Taille maximale de frame

// Limites spécifiques aux bandes
constexpr size_t MIN_NUM_BANDS = 4;   // Nombre minimum de bandes
constexpr size_t MAX_NUM_BANDS = 128; // Nombre maximum de bandes
constexpr float MIN_FREQ = 1.0f;      // Fréquence minimale (1 Hz)
constexpr float MAX_FREQ = 100000.0f; // Fréquence maximale (100 kHz)
} // namespace MultibandProcessorConstants

// Constantes spécifiques à SpectralNR
namespace SpectralNRConstants {
// Paramètres de base par défaut - Utilise les constantes globales
static constexpr uint32_t DEFAULT_SAMPLE_RATE =
    GlobalAudioConstants::DEFAULT_SAMPLE_RATE; // Fréquence d'échantillonnage par défaut (48 kHz)
constexpr bool DEFAULT_ENABLED = false;        // État activé par défaut (désactivé)

// Paramètres FFT par défaut - Utilise les constantes globales
static constexpr size_t DEFAULT_FFT_SIZE = GlobalAudioConstants::DEFAULT_FFT_SIZE; // Taille FFT par défaut
static constexpr size_t DEFAULT_HOP_SIZE = GlobalAudioConstants::DEFAULT_HOP_SIZE; // Taille de saut par défaut

// Paramètres de traitement par défaut - Utilise les constantes globales
static constexpr double DEFAULT_BETA =
    GlobalValidationConstants::DEFAULT_BETA; // Facteur de sur-soustraction par défaut
static constexpr double DEFAULT_FLOOR_GAIN =
    GlobalValidationConstants::DEFAULT_FLOOR_GAIN; // Gain de plancher spectral par défaut
static constexpr double DEFAULT_NOISE_UPDATE =
    GlobalValidationConstants::DEFAULT_NOISE_UPDATE; // Mise à jour du bruit par défaut

// États d'initialisation par défaut
constexpr size_t INITIAL_WRITE_POSITION = 0; // Position d'écriture initiale
constexpr bool INITIAL_NOISE_STATE = true;   // État initial du bruit (initialisation)

// Constantes de validation - Utilise les constantes globales
static constexpr size_t MIN_FFT_SIZE = GlobalAudioConstants::MIN_FFT_SIZE;              // Taille FFT minimale
static constexpr size_t MAX_FFT_SIZE = GlobalAudioConstants::MAX_FFT_SIZE;              // Taille FFT maximale
static constexpr size_t MIN_HOP_SIZE = GlobalAudioConstants::MIN_HOP_SIZE;              // Taille de saut minimale
static constexpr double MIN_BETA = GlobalValidationConstants::MIN_BETA;                 // Bêta minimal
static constexpr double MAX_BETA = GlobalValidationConstants::MAX_BETA;                 // Bêta maximal
static constexpr double MIN_FLOOR_GAIN = GlobalValidationConstants::MIN_FLOOR_GAIN;     // Gain de plancher minimal
static constexpr double MAX_FLOOR_GAIN = GlobalValidationConstants::MAX_FLOOR_GAIN;     // Gain de plancher maximal
static constexpr double MIN_NOISE_UPDATE = GlobalValidationConstants::MIN_NOISE_UPDATE; // Mise à jour du bruit minimale
static constexpr double MAX_NOISE_UPDATE = GlobalValidationConstants::MAX_NOISE_UPDATE; // Mise à jour du bruit maximale
} // namespace SpectralNRConstants

// Constantes spécifiques à WienerFilter
namespace WienerFilterConstants {
// Paramètres de base par défaut - Utilise les constantes globales
static constexpr size_t DEFAULT_FFT_SIZE = GlobalAudioConstants::DEFAULT_FFT_SIZE; // Taille FFT par défaut
static constexpr uint32_t DEFAULT_SAMPLE_RATE =
    GlobalAudioConstants::DEFAULT_SAMPLE_RATE; // Fréquence d'échantillonnage par défaut (48 kHz)

// Paramètres du filtre Wiener par défaut - Utilise les constantes globales
static constexpr double DEFAULT_ALPHA =
    GlobalValidationConstants::DEFAULT_ALPHA; // Facteur de lissage décisionnel par défaut
static constexpr double DEFAULT_MIN_GAIN =
    GlobalValidationConstants::DEFAULT_MIN_GAIN; // Gain minimal par défaut (prévention de la sur-suppression)
static constexpr double DEFAULT_MAX_GAIN = GlobalValidationConstants::DEFAULT_MAX_GAIN; // Gain maximal par défaut

// Paramètres MMSE-LSA par défaut
constexpr double DEFAULT_XI_MIN = 0.001;  // SNR a priori minimal par défaut
constexpr double DEFAULT_XI_MAX = 1000.0; // SNR a priori maximal par défaut

// Paramètres de réduction du bruit musical par défaut
constexpr double DEFAULT_GAIN_SMOOTHING = 0.7;      // Lissage temporel des gains par défaut
constexpr double DEFAULT_FREQUENCY_SMOOTHING = 0.3; // Lissage spectral des gains par défaut

// Paramètres de pondération perceptuelle par défaut
constexpr double DEFAULT_PERCEPTUAL_FACTOR = 0.5; // Force de la pondération perceptuelle par défaut

// Valeurs d'initialisation d'état
constexpr float INITIAL_SNR_VALUE = 1.0f;    // Valeur initiale du SNR
constexpr float INITIAL_GAIN_VALUE = 1.0f;   // Valeur initiale du gain
constexpr float INITIAL_NOISE_VALUE = 0.0f;  // Valeur initiale du bruit
constexpr float INITIAL_SPEECH_VALUE = 0.0f; // Valeur initiale de la parole

// Constantes de calcul et protection
constexpr float EPSILON_PROTECTION = 1e-10f; // Protection contre division par zéro
constexpr float VAD_THRESHOLD_FACTOR = 3.0f; // Facteur de seuil pour VAD
constexpr float NOISE_UPDATE_ALPHA = 0.98f;  // Alpha pour mise à jour du bruit

// Constantes de pondération perceptuelle
constexpr float A_WEIGHTING_FREQ_1 = 20.6f;    // Fréquence de pondération A (Hz)
constexpr float A_WEIGHTING_FREQ_2 = 107.7f;   // Fréquence de pondération A (Hz)
constexpr float A_WEIGHTING_FREQ_3 = 737.9f;   // Fréquence de pondération A (Hz)
constexpr float A_WEIGHTING_FREQ_4 = 12194.0f; // Fréquence de pondération A (Hz)
constexpr float PERCEPTUAL_WEIGHT_MIN = 0.5f;  // Poids perceptuel minimal
constexpr float PERCEPTUAL_WEIGHT_MAX = 2.0f;  // Poids perceptuel maximal

// Constantes de lissage spectral
constexpr float FREQUENCY_SMOOTHING_WEIGHT = 0.25f; // Poids du lissage spectral (3-point)

// Constantes pour expint (intégrale exponentielle)
constexpr int MAX_EXPINT_ITERATIONS = 20;              // Nombre maximum d'itérations pour expint
constexpr int MAX_CONTINUED_FRACTION_ITERATIONS = 100; // Nombre maximum d'itérations pour fraction continue
constexpr float EXPINT_SMALL_THRESHOLD = 0.001f;       // Seuil pour approximation expint
constexpr float CONTINUED_FRACTION_INIT = 1e30f;       // Valeur initiale pour fraction continue
constexpr float EULER_MASCHERONI = -0.57721566f;       // Constante d'Euler-Mascheroni

// Constantes de validation
constexpr double MIN_ALPHA = 0.0;             // Alpha minimal
constexpr double MAX_ALPHA = 1.0;             // Alpha maximal
constexpr double MIN_GAIN = 0.0;              // Gain minimal
constexpr double MAX_GAIN = 2.0;              // Gain maximal
constexpr double MIN_XI = 1e-6;               // SNR a priori minimal
constexpr double MAX_XI = 1e6;                // SNR a priori maximal
constexpr double MIN_SMOOTHING = 0.0;         // Lissage minimal
constexpr double MAX_SMOOTHING = 1.0;         // Lissage maximal
constexpr double MIN_PERCEPTUAL_FACTOR = 0.0; // Facteur perceptuel minimal
constexpr double MAX_PERCEPTUAL_FACTOR = 2.0; // Facteur perceptuel maximal
} // namespace WienerFilterConstants

// Constantes spécifiques à ParametricWienerFilter
namespace ParametricWienerConstants {
// Paramètres de compromis par défaut - Utilise les constantes globales
static constexpr double DEFAULT_BETA =
    GlobalValidationConstants::DEFAULT_BETA;       // Facteur de sur-soustraction par défaut
constexpr double DEFAULT_MUSIC_NOISE_FLOOR = 0.01; // Plancher pour bruit musical par défaut

// Paramètres adaptatifs basés sur SNR
constexpr double DEFAULT_LOW_SNR_THRESHOLD = -5.0;  // Seuil SNR bas par défaut (dB)
constexpr double DEFAULT_HIGH_SNR_THRESHOLD = 20.0; // Seuil SNR élevé par défaut (dB)
constexpr double DEFAULT_AGGRESSIVE_LOW = 0.9;      // Réduction agressive à SNR bas par défaut
constexpr double DEFAULT_GENTLE_HIGH = 0.3;         // Réduction douce à SNR élevé par défaut

// Limites de validation - Utilise les constantes globales
static constexpr double MIN_BETA = GlobalValidationConstants::MIN_BETA; // Bêta minimal
static constexpr double MAX_BETA = GlobalValidationConstants::MAX_BETA; // Bêta maximal
constexpr double MIN_MUSIC_NOISE_FLOOR = 0.0;                           // Plancher bruit musical minimal
constexpr double MAX_MUSIC_NOISE_FLOOR = 0.1;                           // Plancher bruit musical maximal
constexpr double MIN_SNR_THRESHOLD = -50.0;                             // Seuil SNR minimal (dB)
constexpr double MAX_SNR_THRESHOLD = 50.0;                              // Seuil SNR maximal (dB)
} // namespace ParametricWienerConstants

// Constantes spécifiques à TwoStepNoiseReduction
namespace TwoStepNoiseReductionConstants {
// Paramètres de base par défaut - Utilise les constantes globales
static constexpr size_t DEFAULT_FFT_SIZE = GlobalAudioConstants::DEFAULT_FFT_SIZE; // Taille FFT par défaut
static constexpr uint32_t DEFAULT_SAMPLE_RATE =
    GlobalAudioConstants::DEFAULT_SAMPLE_RATE; // Fréquence d'échantillonnage par défaut (48 kHz)

// Première étape : Filtre Wiener conservateur
constexpr double DEFAULT_STEP1_MIN_GAIN = 0.3; // Gain minimal de l'étape 1
constexpr double DEFAULT_STEP1_ALPHA = 0.95;   // Alpha de l'étape 1

// Deuxième étape : Filtrage agressif sur le bruit résiduel
constexpr double DEFAULT_STEP2_MIN_GAIN = 0.1;                                          // Gain minimal de l'étape 2
static constexpr double DEFAULT_STEP2_ALPHA = GlobalValidationConstants::DEFAULT_ALPHA; // Alpha de l'étape 2

// Estimation du bruit résiduel
constexpr double DEFAULT_RESIDUAL_THRESHOLD = 0.5; // Seuil de détection résiduelle par défaut
constexpr double DEFAULT_RESIDUAL_SMOOTHING = 0.9; // Lissage pour estimation résiduelle par défaut

// Limites de validation - Utilise les constantes globales
static constexpr double MIN_STEP_GAIN = GlobalValidationConstants::MIN_GAIN;   // Gain d'étape minimal
static constexpr double MAX_STEP_GAIN = GlobalValidationConstants::MAX_GAIN;   // Gain d'étape maximal
static constexpr double MIN_STEP_ALPHA = GlobalValidationConstants::MIN_ALPHA; // Alpha d'étape minimal
static constexpr double MAX_STEP_ALPHA = GlobalValidationConstants::MAX_ALPHA; // Alpha d'étape maximal
constexpr double MIN_RESIDUAL_THRESHOLD = 0.0;                                 // Seuil résiduel minimal
constexpr double MAX_RESIDUAL_THRESHOLD = 1.0;                                 // Seuil résiduel maximal
constexpr double MIN_RESIDUAL_SMOOTHING = 0.0;                                 // Lissage résiduel minimal
constexpr double MAX_RESIDUAL_SMOOTHING = 1.0;                                 // Lissage résiduel maximal
} // namespace TwoStepNoiseReductionConstants
