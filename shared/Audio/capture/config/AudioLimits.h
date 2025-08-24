#pragma once

// === Constantes de limites pour la sécurité audio ===
namespace Nyth {
namespace Audio {
namespace Limits {

// === Limites de buffer ===
constexpr size_t MAX_BUFFER_SIZE = 1024 * 1024; // 1MB max pour éviter les allocations excessives
constexpr size_t MAX_ARRAY_LENGTH = 100000;     // Limite pour les tableaux JSI

// === Limites de configuration audio ===
constexpr int MIN_SAMPLE_RATE = 8000;   // Minimum supporté
constexpr int MAX_SAMPLE_RATE = 192000; // Maximum supporté
constexpr int DEFAULT_SAMPLE_RATE = 44100;

constexpr int MIN_CHANNELS = 1; // Mono minimum
constexpr int MAX_CHANNELS = 8; // 8 canaux maximum
constexpr int DEFAULT_CHANNELS = 1;

constexpr int MIN_BITS_PER_SAMPLE = 8;
constexpr int MAX_BITS_PER_SAMPLE = 32;
constexpr int DEFAULT_BITS_PER_SAMPLE = 16;

constexpr int MIN_BUFFER_SIZE_FRAMES = 64;
constexpr int MAX_BUFFER_SIZE_FRAMES = 8192;
constexpr int DEFAULT_BUFFER_SIZE_FRAMES = 1024;

constexpr int MIN_NUM_BUFFERS = 2;  // Minimum pour le double buffering
constexpr int MAX_NUM_BUFFERS = 5;  // Maximum raisonnable
constexpr int DEFAULT_NUM_BUFFERS = 3;  // Triple buffering par défaut

// === Limites de niveau audio ===
constexpr float MIN_THRESHOLD = 0.0f;
constexpr float MAX_THRESHOLD = 1.0f;
constexpr float DEFAULT_THRESHOLD = 0.01f;

// === Limites temporelles ===
constexpr double MAX_ANALYSIS_INTERVAL_MS = 10000.0; // 10 secondes max
constexpr double MIN_ANALYSIS_INTERVAL_MS = 10.0;    // 10ms minimum
constexpr double DEFAULT_ANALYSIS_INTERVAL_MS = 100.0;

// === Limites d'enregistrement ===
constexpr size_t MAX_RECORDING_DURATION_MS = 3600000; // 1 heure max
constexpr size_t MIN_RECORDING_DURATION_MS = 1000;    // 1 seconde min

// === Limites de files d'attente ===
constexpr size_t MAX_AUDIO_DATA_QUEUE_SIZE = 10; // Max 10 buffers en attente
constexpr size_t MAX_CALLBACK_QUEUE_SIZE = 100;  // Max 100 callbacks en attente

// === Limites de sécurité ===
constexpr size_t MAX_FILENAME_LENGTH = 255;   // Longueur max du nom de fichier
constexpr size_t MAX_FILE_PATH_LENGTH = 4096; // Longueur max du chemin

} // namespace Limits
} // namespace Audio
} // namespace Nyth
