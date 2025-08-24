#pragma once

#ifdef __cplusplus

// Configuration de la bibliothèque SIMD AudioNR
namespace AudioNR {
namespace SIMD {
namespace Config {

// ====================
// Configuration générale
// ====================

// Version de la bibliothèque SIMD
#define SIMD_VERSION_MAJOR 1
#define SIMD_VERSION_MINOR 0
#define SIMD_VERSION_PATCH 0
#define SIMD_VERSION_STRING "1.0.0"

// Activer/désactiver les optimisations SIMD
#ifndef SIMD_ENABLE_OPTIMIZATIONS
#define SIMD_ENABLE_OPTIMIZATIONS 1
#endif

// Activer/désactiver les benchmarks automatiques
#ifndef SIMD_ENABLE_BENCHMARKS
#define SIMD_ENABLE_BENCHMARKS 1
#endif

// Activer/désactiver les logs de debug
#ifndef SIMD_ENABLE_DEBUG_LOG
#define SIMD_ENABLE_DEBUG_LOG 0
#endif

// ====================
// Configuration des performances
// ====================

// Taille minimale pour activer SIMD (éléments)
#define SIMD_MIN_SIZE_THRESHOLD 64

// Taille optimale pour les blocs de traitement
#define SIMD_OPTIMAL_BLOCK_SIZE 1024

// Nombre d'itérations pour les benchmarks
#define SIMD_BENCHMARK_ITERATIONS 100

// ====================
// Configuration mémoire
// ====================

// Alignement mémoire pour AVX (32 octets)
#define SIMD_MEMORY_ALIGNMENT 32

// Activer l'allocation mémoire alignée automatique
#define SIMD_AUTO_ALIGNED_MEMORY 1

// ====================
// Configuration des architectures
// ====================

// Forcer l'utilisation d'une architecture spécifique
// #define SIMD_FORCE_AVX2 1
// #define SIMD_FORCE_SSE2 1
// #define SIMD_FORCE_NEON 1

// Configuration pour les architectures mobiles
#ifdef __ANDROID__
#define SIMD_MOBILE_OPTIMIZATIONS 1
#define SIMD_LOW_POWER_MODE 0
#endif

// Configuration pour les architectures mobiles (ARM NEON uniquement)
#ifdef __ARM_NEON
#define SIMD_NEON_OPTIMIZATIONS 1
#endif

// ====================
// Configuration des fonctions
// ====================

// Activer les fonctions mathématiques avancées
#define SIMD_ENABLE_ADVANCED_MATH 1

// Activer les effets audio DSP
#define SIMD_ENABLE_DSP_EFFECTS 1

// Activer les fonctions de filtrage
#define SIMD_ENABLE_FILTERING 1

// Activer les conversions de format
#define SIMD_ENABLE_FORMAT_CONVERSION 1

// ====================
// Configuration des erreurs
// ====================

// Tolérance pour les tests de précision
#define SIMD_PRECISION_TOLERANCE 1e-6f

// Activer la protection contre les overflows
#define SIMD_ENABLE_OVERFLOW_PROTECTION 1

// Activer la protection contre les underflows
#define SIMD_ENABLE_UNDERFLOW_PROTECTION 1

// ====================
// Macros utilitaires
// ====================

// Vérification de la disponibilité SIMD
#define SIMD_IS_AVAILABLE() (AudioNR::SIMD::SIMDDetector::hasSIMD())

// Vérification de la taille optimale pour SIMD
#define SIMD_IS_OPTIMAL_SIZE(count) ((count) >= SIMD_MIN_SIZE_THRESHOLD)

// Log de debug (seulement si activé)
#if SIMD_ENABLE_DEBUG_LOG
#define SIMD_DEBUG_LOG(msg) std::cout << "[SIMD Debug] " << msg << std::endl
#else
#define SIMD_DEBUG_LOG(msg) // Rien
#endif

// Benchmark automatique (seulement si activé)
#if SIMD_ENABLE_BENCHMARKS
#define SIMD_AUTO_BENCHMARK(func, data, count) \
    AudioNR::SIMD::SIMDManager::getInstance().runBenchmark(count)
#else
#define SIMD_AUTO_BENCHMARK(func, data, count) // Rien
#endif

// ====================
// Fonctions d'initialisation
// ====================

// Initialisation automatique de SIMD
#define SIMD_INIT_AUTO() \
    do { \
        AudioNR::SIMD::SIMDManager::getInstance().initialize(); \
        SIMD_DEBUG_LOG("SIMD initialized: " + AudioNR::SIMD::SIMDManager::getInstance().getSIMDInfo()); \
    } while(0)

// Vérification de l'initialisation
#define SIMD_CHECK_INIT() \
    do { \
        if (!AudioNR::SIMD::SIMDManager::getInstance().isInitialized()) { \
            SIMD_INIT_AUTO(); \
        } \
    } while(0)

// ====================
// Fonctions de commodité pour les utilisateurs
// ====================

// Wrapper pour les fonctions avec fallback automatique
#define SIMD_CALL(func, ...) \
    do { \
        SIMD_CHECK_INIT(); \
        if (SIMD_IS_AVAILABLE()) { \
            func(__VA_ARGS__); \
        } else { \
            SIMD_DEBUG_LOG("SIMD not available, using fallback"); \
        } \
    } while(0)

// Application conditionnelle d'une fonction SIMD
#define SIMD_APPLY_IF_OPTIMAL(func, data, count, ...) \
    do { \
        if (SIMD_IS_OPTIMAL_SIZE(count) && SIMD_IS_AVAILABLE()) { \
            func(data, count, __VA_ARGS__); \
            SIMD_DEBUG_LOG("Applied SIMD optimization"); \
        } \
    } while(0)

} // namespace Config
} // namespace SIMD
} // namespace AudioNR

// ====================
// Headers à inclure automatiquement
// ====================

// Headers principaux
#include "SIMDCore.hpp"

// Headers optionnels (activables via configuration)
#if SIMD_ENABLE_ADVANCED_MATH
#include "SIMDMathFunctions.hpp"
#endif

#if SIMD_ENABLE_DSP_EFFECTS
#include "SIMDIntegration.hpp"
#endif

#endif // __cplusplus
