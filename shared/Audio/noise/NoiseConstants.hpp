#pragma once

// C++17 standard headers - Compatibility garantie
#include <cstdint>
#include <cstddef>

// Constantes mathématiques universelles
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// NoiseReducer specific constants
namespace NoiseReducerConstants {
    // Validation des fréquences d'échantillonnage (Hz)
    // Définit les bornes min/max acceptées par les algorithmes
    constexpr uint32_t MIN_SAMPLE_RATE = 8000;           // Minimum sample rate in Hz
    constexpr uint32_t MAX_SAMPLE_RATE = 192000;         // Maximum sample rate in Hz

    // Validation du nombre de canaux
    // Bornes acceptées et contrainte stéréo
    constexpr int MIN_CHANNELS = 1;                      // Minimum number of channels
    constexpr int MAX_CHANNELS = 2;                      // Maximum number of channels
    constexpr int STEREO_REQUIRED_CHANNELS = 2;         // Channels required for stereo processing

    // Validation du seuil (dBFS)
    // Valeurs négatives: plus bas -> plus sensible
    constexpr double MAX_THRESHOLD_DB = 0.0;             // Maximum threshold in dB
    constexpr double MIN_THRESHOLD_DB = -80.0;           // Minimum threshold in dB

    // Validation du ratio d'expansion
    // > 1.0 : plus grand => réduction plus agressive
    constexpr double MIN_RATIO = 1.0;                    // Minimum compression ratio
    constexpr double MAX_RATIO = 20.0;                   // Maximum compression ratio

    // Validation du plancher (dB)
    // Atténuation maximale autorisée
    constexpr double MAX_FLOOR_DB = 0.0;                 // Maximum floor in dB
    constexpr double MIN_FLOOR_DB = -60.0;               // Minimum floor in dB

    // Validation du temps d'attaque (ms)
    // Contrôle la réactivité d'ouverture
    constexpr double MIN_ATTACK_MS = 0.1;                // Minimum attack time in ms
    constexpr double MAX_ATTACK_MS = 100.0;              // Maximum attack time in ms

    // Validation du temps de relâchement (ms)
    // Contrôle la vitesse de fermeture
    constexpr double MIN_RELEASE_MS = 1.0;               // Minimum release time in ms
    constexpr double MAX_RELEASE_MS = 1000.0;            // Maximum release time in ms

    // Validation du coupe-bas (Hz)
    // Supprime les grondements basse fréquence
    constexpr double MIN_HIGHPASS_HZ = 20.0;             // Minimum high-pass frequency in Hz
    constexpr double MAX_HIGHPASS_HZ = 1000.0;           // Maximum high-pass frequency in Hz

    // Paramètres de filtre
    // Valeurs par défaut (Butterworth)
    constexpr double DEFAULT_Q_FACTOR = 0.707;          // Default Q factor (Butterworth response)

    // Constantes de calcul des coefficients
    // Utilisées pour lisser enveloppe et gain
    constexpr double ATTACK_GAIN_FACTOR = 0.5;          // Factor to reduce attack time for gain smoothing
    constexpr double MIN_RELEASE_GAIN_MS = 5.0;         // Minimum release time for gain smoothing

    // Constantes de traitement génériques
    constexpr double UNITY_GAIN = 1.0;                  // Unity gain value
    constexpr double UNITY_RECIPROCAL = 1.0;            // Unity value for division
    constexpr size_t FIRST_CHANNEL_INDEX = 0;           // Index of first channel
    constexpr size_t SECOND_CHANNEL_INDEX = 1;          // Index of second channel
    constexpr size_t ZERO_SAMPLES_CHECK = 0;            // Zero samples for validation

    // Constantes spécifiques au traitement NoiseReducer
    constexpr double BUTTERWORTH_Q_FACTOR = 0.707;      // Default Q factor (Butterworth response)

    // Valeurs par défaut de configuration (NoiseReducer)
    constexpr double DEFAULT_THRESHOLD_DB = -30.0;       // Default threshold in dB
    constexpr double DEFAULT_RATIO = 2.0;                // Default compression ratio
    constexpr double DEFAULT_FLOOR_DB = -40.0;           // Default floor in dB
    constexpr double DEFAULT_ATTACK_MS = 10.0;           // Default attack time in ms
    constexpr double DEFAULT_RELEASE_MS = 50.0;          // Default release time in ms
    constexpr double DEFAULT_HIGHPASS_HZ = 100.0;        // Default high-pass frequency in Hz
    constexpr bool DEFAULT_ENABLED = true;               // Default enabled state
    constexpr bool DEFAULT_ENABLE_HIGHPASS = true;       // Default high-pass enable state

    // Valeurs d'initialisation d'état (par canal)
    constexpr double INITIAL_ENVELOPE = 0.0;             // Initial envelope follower value
    constexpr double INITIAL_GAIN = 1.0;                 // Initial gain value (unity gain)

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
    constexpr double LOG_PROTECTION_MIN = 1e-10;           // Minimum value for log calculations
    constexpr double MS_TO_SECONDS_DIVISOR = 1000.0;       // Convert ms to seconds
    constexpr double MIN_MS_FOR_COEFF = 0.001;             // Minimum ms for coefficient calculation
    constexpr double EXP_COEFFICIENT = -6.907755;          // Natural log of 0.001 (for 60dB decay)
    constexpr double DB_TO_LINEAR_BASE = 10.0;             // Base for dB to linear conversion
    constexpr double DB_TO_LINEAR_DIVISOR = 20.0;          // Divisor for dB to linear conversion
}

// RNNoiseSuppressor specific constants
namespace RNNoiseSuppressorConstants {
    // Validation des paramètres audio
    // Bornes d'entrée globales pour l'API publique
    constexpr uint32_t MIN_SAMPLE_RATE = 8000;           // Minimum sample rate in Hz
    constexpr uint32_t MAX_SAMPLE_RATE = 192000;         // Maximum sample rate in Hz
    constexpr int MIN_CHANNELS = 1;                      // Minimum number of channels
    constexpr int MAX_CHANNELS = 2;                      // Maximum number of channels
    constexpr int STEREO_REQUIRED_CHANNELS = 2;          // Channels required for stereo processing

    // Paramètres audio par défaut (utilise les constantes globales)
    constexpr int DEFAULT_CHANNELS = 1;                  // Default number of channels (mono)
    constexpr int MONO_CHANNELS = 1;                     // Mono channel count
    constexpr int STEREO_CHANNELS = 2;                   // Stereo channel count

    // Paramètres de traitement par défaut
    constexpr double DEFAULT_AGGRESSIVENESS = 1.0;       // Default noise suppression aggressiveness
    constexpr double MIN_AGGRESSIVENESS = 0.0;           // Minimum aggressiveness value
    constexpr double MAX_AGGRESSIVENESS = 3.0;           // Maximum aggressiveness value

    // Valeurs de configuration par défaut (RNNoiseSuppressor)
    constexpr double DEFAULT_HIGHPASS_HZ = 80.0;         // Default high-pass frequency in Hz
    constexpr bool DEFAULT_ENABLE_HIGHPASS = true;       // Default high-pass enable state
    constexpr uint32_t DEFAULT_FFT_SIZE = 1024;          // Default FFT size
    constexpr uint32_t DEFAULT_HOP_SIZE = 256;           // Default hop size
    constexpr double OVERLAP_PERCENTAGE = 0.75;          // Overlap percentage (75%)

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
    }

    // Mappage agressivité → paramètres de la SpectralNR
    namespace SpectralMapping {
        static constexpr uint32_t FFT_SIZE = 1024;        // Fixed and robust
        static constexpr uint32_t HOP_SIZE = 256;         // 75% overlap
        static constexpr double BETA_BASE = 1.2;
        static constexpr double BETA_RANGE = 1.6;
        static constexpr double FLOOR_GAIN_BASE = 0.10;
        static constexpr double FLOOR_GAIN_RANGE = -0.07;
        static constexpr double NOISE_UPDATE_BASE = 0.95;
        static constexpr double NOISE_UPDATE_RANGE = 0.035;
    }
}

// SpectralNR specific constants
namespace SpectralNRConstants {
    // Paramètres audio par défaut (utilise les constantes globales)

    // Paramètres FFT / overlap
    constexpr size_t DEFAULT_FFT_SIZE = 1024;             // Default FFT size (must be power of 2)
    constexpr size_t DEFAULT_HOP_SIZE = 256;              // Default hop size for overlap-add
    constexpr size_t OVERLAP_DIVISOR = 4;                 // Divisor for overlap (fftSize/4 = 75% overlap)

    // Paramètres de traitement spectral (soustraction)
    constexpr double DEFAULT_BETA = 1.5;                  // Default over-subtraction factor
    constexpr double DEFAULT_FLOOR_GAIN = 0.05;           // Default spectral floor gain
    constexpr double DEFAULT_NOISE_UPDATE = 0.98;         // Default noise estimation smoothing

    // Bornes/validation des paramètres utilisateur
    constexpr double MIN_BETA = 1.0;                      // Minimum over-subtraction factor
    constexpr double MAX_BETA = 3.0;                      // Maximum over-subtraction factor
    constexpr double MIN_FLOOR_GAIN = 0.01;               // Minimum spectral floor gain
    constexpr double MAX_FLOOR_GAIN = 0.1;                // Maximum spectral floor gain
    constexpr double MIN_NOISE_UPDATE = 0.9;              // Minimum noise update coefficient
    constexpr double MAX_NOISE_UPDATE = 0.99;             // Maximum noise update coefficient

    // Initialisation de l'état interne
    constexpr size_t INITIAL_WRITE_POSITION = 0;          // Initial write position
    constexpr bool INITIAL_NOISE_STATE = true;            // Initial noise initialization state

    // Constantes FFT et fenêtrage
    constexpr size_t MIN_FFT_SIZE = 64;                    // Minimum FFT size
    constexpr size_t MAX_FFT_SIZE = 8192;                  // Maximum FFT size
    constexpr size_t MIN_HOP_SIZE = 1;                     // Minimum hop size
    constexpr double MIN_BETA_EXTENDED = 0.5;             // Extended minimum beta for validation
    constexpr double MAX_BETA_EXTENDED = 5.0;             // Extended maximum beta for validation
    constexpr double MIN_FLOOR_GAIN_EXTENDED = 0.0;       // Extended minimum floor gain
    constexpr double MAX_FLOOR_GAIN_EXTENDED = 1.0;       // Extended maximum floor gain
    constexpr double MIN_NOISE_UPDATE_EXTENDED = 0.0;     // Extended minimum noise update
    constexpr double MAX_NOISE_UPDATE_EXTENDED = 1.0;     // Extended maximum noise update

    // Constantes de la fenêtre de Hann
    constexpr float HANN_AMPLITUDE = 0.5f;                // Hann window amplitude
    constexpr float HANN_FACTOR = 1.0f;                   // Hann window factor
    constexpr float HANN_FREQUENCY_FACTOR = 2.0f;         // Hann window frequency factor
    constexpr size_t HANN_LENGTH_OFFSET = 1;              // Hann window length offset

    // Constantes pour le traitement FFT (radix-2)
    constexpr size_t FFT_HALF_DIVISOR = 2;                // FFT half divisor
    constexpr size_t FFT_MIN_SIZE = 1;                    // Minimum FFT size for processing
    constexpr size_t BIT_SHIFT_ONE = 1;                   // Bit shift by one
    constexpr size_t BIT_MASK_ONE = 1;                    // Bit mask for one
    constexpr size_t FFT_RADIX_BASE = 2;                  // FFT radix base (2 for radix-2)

    // Constantes de traitement spectral génériques
    constexpr double NOISE_UPDATE_COMPLEMENT = 1.0;       // Complement for noise update calculation
    constexpr float MAGNITUDE_EPSILON = 0.0f;             // Magnitude epsilon for calculations
    constexpr float HALF = 0.5f;                          // Half value
    constexpr float ONE = 1.0f;                           // One value
    constexpr float TWO = 2.0f;                          // Two value
    constexpr float ZERO = 0.0f;                         // Zero value

    // Indices et offsets dans le spectre
    constexpr size_t SPECTRUM_DC_INDEX = 0;               // DC component index
    constexpr size_t SPECTRUM_NYQUIST_OFFSET = 1;         // Nyquist offset
    constexpr long long SHIFT_CAST_OFFSET = 0;            // Shift cast offset
}

// MultibandProcessor specific constants
namespace MultibandProcessorConstants {
    // Fréquences de coupure par défaut (Hz)
    constexpr float FREQ_SUB_BASS = 60.0f;           // Sub-bass upper limit
    constexpr float FREQ_BASS = 250.0f;              // Bass upper limit
    constexpr float FREQ_LOW_MID = 500.0f;           // Low-mid upper limit
    constexpr float FREQ_MID = 2000.0f;              // Mid upper limit
    constexpr float FREQ_HIGH_MID = 4000.0f;         // High-mid upper limit
    constexpr float FREQ_HIGH = 8000.0f;             // High upper limit
    constexpr float FREQ_ULTRA_HIGH = 16000.0f;      // Ultra-high upper limit
    
    // Valeurs de réduction par défaut (0.0 - 1.0)
    constexpr float DEFAULT_SUB_BASS_REDUCTION = 0.9f;
    constexpr float DEFAULT_BASS_REDUCTION = 0.7f;
    constexpr float DEFAULT_LOW_MID_REDUCTION = 0.5f;
    constexpr float DEFAULT_MID_REDUCTION = 0.3f;
    constexpr float DEFAULT_HIGH_MID_REDUCTION = 0.4f;
    constexpr float DEFAULT_HIGH_REDUCTION = 0.6f;
    constexpr float DEFAULT_ULTRA_HIGH_REDUCTION = 0.8f;
    
    // Q factor standard pour les filtres
    constexpr float DEFAULT_Q_FACTOR = 0.707f;       // Butterworth response
    
    // Nombre de bandes
    constexpr size_t NUM_BANDS = 7;
    
    // Facteur de conversion gain en dB
    constexpr float DB_REDUCTION_FACTOR = -20.0f;
    
    // Configuration par défaut
    constexpr uint32_t DEFAULT_SAMPLE_RATE = 48000;
    constexpr size_t DEFAULT_FFT_SIZE = 2048;
}
