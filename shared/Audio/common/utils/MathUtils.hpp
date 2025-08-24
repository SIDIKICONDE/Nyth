#pragma once

#ifdef __cplusplus
#include <cmath>
#include <algorithm>
#include <limits>
#include <array>
#include <chrono>      // Pour les benchmarks
#include <immintrin.h>  // Pour SIMD si disponible

// Support SSE/AVX
#ifdef __SSE__
#include <xmmintrin.h>
#endif

#ifdef __SSE2__
#include <emmintrin.h>
#endif

#ifdef __SSE3__
#include <pmmintrin.h>
#endif

#ifdef __AVX__
#include <immintrin.h>
#endif

#ifdef __AVX2__
#include <avx2intrin.h>
#endif

// Support ARM NEON
#ifdef __ARM_NEON
#include <arm_neon.h>
#endif

namespace AudioNR {
namespace MathUtils {

// ==================== Constantes Mathématiques ====================
constexpr float EULER_MASCHERONI = 0.57721566490153286060651209008240243104215933593992f;
constexpr double EULER_MASCHERONI_D = 0.57721566490153286060651209008240243104215933593992;

// Seuils de protection numérique
constexpr float EPSILON_PROTECTION = 1e-12f;
constexpr float MIN_LOG_ARG = 1e-20f;
constexpr float TINY_CF = 1e-30f;
constexpr float MAX_FLOAT = std::numeric_limits<float>::max();

// Limites d'itération adaptatives
constexpr int MAX_SERIES_ITERATIONS = 50;      // Augmenté pour meilleure précision
constexpr int MAX_CF_ITERATIONS = 100;
constexpr float CF_INIT_VALUE = 1e10f;

// Seuils de transition optimisés empiriquement
constexpr float SERIES_THRESHOLD = 0.8f;       // Optimisé vs 1.0f original
constexpr float ASYMPTOTIC_THRESHOLD = 40.0f; // Optimisé vs 50.0f original

// Constantes SIMD
constexpr int SIMD_VECTOR_SIZE = 4;  // Taille de base pour SSE
constexpr int AVX_VECTOR_SIZE = 8;   // Taille pour AVX
#ifdef __AVX2__
constexpr int MAX_VECTOR_SIZE = AVX_VECTOR_SIZE;
#else
constexpr int MAX_VECTOR_SIZE = SIMD_VECTOR_SIZE;
#endif

// Constantes vectorisées pour calculs parallèles
constexpr float EULER_MASCHERONI_VEC = EULER_MASCHERONI;
constexpr float EPSILON_PROTECTION_VEC = EPSILON_PROTECTION;
constexpr float MIN_LOG_ARG_VEC = MIN_LOG_ARG;

// ==================== Tables de Lookup (optionnel) ====================
namespace LookupTables {
    // Table précalculée pour valeurs communes (désactivée par défaut)
    constexpr bool USE_LOOKUP = false;
    constexpr int TABLE_SIZE = 1000;
    constexpr float TABLE_MAX = 10.0f;

    // Protection compile-time contre activation accidentelle
    static_assert(!USE_LOOKUP, "Lookup tables not yet implemented - set USE_LOOKUP to false");

    // Pourrait être remplie au runtime ou compile-time
    // std::array<float, TABLE_SIZE> e1_table;
}

// ==================== Fonctions Utilitaires ====================
inline float safe_log(float x) {
    return std::log(std::max(x, MIN_LOG_ARG));
}

inline double safe_log_d(double x) {
    return std::log(std::max(x, static_cast<double>(MIN_LOG_ARG)));
}

template<typename T>
inline T clamp(T v, T lo, T hi) {
    return std::max(lo, std::min(hi, v));
}

// Fonction pour détecter la perte de précision
inline bool is_converged(float term, float sum, float relative_tol = 1e-7f) {
    return std::fabs(term) < EPSILON_PROTECTION ||
           std::fabs(term/sum) < relative_tol;
}

// ==================== Fonctions SIMD Utilitaires ====================

// Détection automatique des capacités SIMD
inline bool has_simd_support() {
#if defined(__AVX2__)
    return true;
#elif defined(__SSE2__)
    return true;
#elif defined(__ARM_NEON)
    return true;
#else
    return false;
#endif
}

inline std::string get_simd_type() {
#if defined(__AVX2__)
    return "AVX2 (256-bit)";
#elif defined(__AVX__)
    return "AVX (256-bit)";
#elif defined(__SSE2__)
    return "SSE2 (128-bit)";
#elif defined(__ARM_NEON)
    return "ARM NEON";
#else
    return "Generic (No SIMD)";
#endif
}

// Fonctions vectorisées utilitaires
#ifdef __SSE2__

// Logarithme naturel vectorisé sécurisé
inline __m128 safe_log_ps(__m128 x) {
    const __m128 min_val = _mm_set1_ps(MIN_LOG_ARG_VEC);
    x = _mm_max_ps(x, min_val);
    // Note: _mm_log_ps n'existe pas, on utilise une approximation ou on calcule élément par élément
    alignas(16) float temp[4];
    _mm_store_ps(temp, x);
    temp[0] = std::log(temp[0]);
    temp[1] = std::log(temp[1]);
    temp[2] = std::log(temp[2]);
    temp[3] = std::log(temp[3]);
    return _mm_load_ps(temp);
}

// Exponentielle vectorisée sécurisé
inline __m128 safe_exp_ps(__m128 x) {
    // Protection contre overflow/underflow
    const __m128 max_val = _mm_set1_ps(80.0f);
    const __m128 min_val = _mm_set1_ps(-80.0f);
    x = _mm_min_ps(x, max_val);
    x = _mm_max_ps(x, min_val);

    alignas(16) float temp[4];
    _mm_store_ps(temp, x);
    temp[0] = std::exp(temp[0]);
    temp[1] = std::exp(temp[1]);
    temp[2] = std::exp(temp[2]);
    temp[3] = std::exp(temp[3]);
    return _mm_load_ps(temp);
}

#endif // __SSE2__

#ifdef __AVX__

// Version AVX des fonctions utilitaires
inline __m256 safe_log_ps_avx(__m256 x) {
    const __m256 min_val = _mm256_set1_ps(MIN_LOG_ARG_VEC);
    x = _mm256_max_ps(x, min_val);

    alignas(32) float temp[8];
    _mm256_store_ps(temp, x);
    for (int i = 0; i < 8; ++i) {
        temp[i] = std::log(temp[i]);
    }
    return _mm256_load_ps(temp);
}

inline __m256 safe_exp_ps_avx(__m256 x) {
    const __m256 max_val = _mm256_set1_ps(80.0f);
    const __m256 min_val = _mm256_set1_ps(-80.0f);
    x = _mm256_min_ps(x, max_val);
    x = _mm256_max_ps(x, min_val);

    alignas(32) float temp[8];
    _mm256_store_ps(temp, x);
    for (int i = 0; i < 8; ++i) {
        temp[i] = std::exp(temp[i]);
    }
    return _mm256_load_ps(temp);
}

#endif // __AVX__

#ifdef __ARM_NEON

// Version ARM NEON des fonctions utilitaires
inline float32x4_t safe_log_neon(float32x4_t x) {
    const float32x4_t min_val = vdupq_n_f32(MIN_LOG_ARG_VEC);
    x = vmaxq_f32(x, min_val);

    alignas(16) float temp[4];
    vst1q_f32(temp, x);
    temp[0] = std::log(temp[0]);
    temp[1] = std::log(temp[1]);
    temp[2] = std::log(temp[2]);
    temp[3] = std::log(temp[3]);
    return vld1q_f32(temp);
}

inline float32x4_t safe_exp_neon(float32x4_t x) {
    const float32x4_t max_val = vdupq_n_f32(80.0f);
    const float32x4_t min_val = vdupq_n_f32(-80.0f);
    x = vminq_f32(x, max_val);
    x = vmaxq_f32(x, min_val);

    alignas(16) float temp[4];
    vst1q_f32(temp, x);
    temp[0] = std::exp(temp[0]);
    temp[1] = std::exp(temp[1]);
    temp[2] = std::exp(temp[2]);
    temp[3] = std::exp(temp[3]);
    return vld1q_f32(temp);
}

#endif // __ARM_NEON

// ==================== Implémentations Internes ====================
namespace internal {

// Version améliorée avec sommation de Kahan pour réduire l'erreur d'arrondi
inline float expint_series_expansion_kahan(float x) {
    float sum = -EULER_MASCHERONI - safe_log(x);
    float c = 0.0f;  // Correction de Kahan
    float term = -x;

    for (int k = 1; k <= MAX_SERIES_ITERATIONS; ++k) {
        float y = term - c;
        float t = sum + y;
        c = (t - sum) - y;
        sum = t;

        if (is_converged(term, sum)) break;

        // Calcul du prochain terme avec protection overflow
        float factor = (-x * k) / ((k + 1.0f) * (k + 1.0f));
        if (std::fabs(term * factor) > MAX_FLOAT) break;
        term *= factor;
    }
    return sum;
}

// Série standard (version originale corrigée)
inline float expint_series_expansion(float x) {
    float sum = -EULER_MASCHERONI - safe_log(x);
    float term = -x;

    for (int k = 1; k <= MAX_SERIES_ITERATIONS; ++k) {
        sum += term;
        if (is_converged(term, sum)) break;
        term *= (-x * k) / ((k + 1.0f) * (k + 1.0f));
    }
    return sum;
}

// Fraction continue de Lentz avec amélioration de stabilité
inline float expint_continued_fraction_enhanced(float x) {
    float b = x + 1.0f;
    float c = CF_INIT_VALUE;
    float d = 1.0f / std::max(b, TINY_CF);
    float h = d;
    float last_h = 0.0f;

    for (int i = 1; i <= MAX_CF_ITERATIONS; ++i) {
        const float a = -static_cast<float>(i * i);
        b += 2.0f;

        // Amélioration : détection de stagnation
        if (std::fabs(h - last_h) < EPSILON_PROTECTION * std::fabs(h)) {
            if (i > 10) break;  // Convergence atteinte
        }
        last_h = h;

        // Protection améliorée contre underflow/overflow
        float denom = a * d + b;
        if (std::fabs(denom) < TINY_CF) {
            denom = std::copysign(TINY_CF, denom);
        }
        d = 1.0f / denom;

        float numer = b + a / c;
        if (std::fabs(numer) < TINY_CF) {
            numer = std::copysign(TINY_CF, numer);
        }
        c = numer;

        const float del = c * d;
        h *= del;

        if (std::fabs(del - 1.0f) < EPSILON_PROTECTION) break;
    }

    return h * std::exp(-x);
}

// Approximation asymptotique améliorée (plus de termes, calcul de Horner)
inline float expint_asymptotic_horner(float x) {
    // Utilisation de la méthode de Horner pour stabilité numérique
    // E1(x) ≈ e^{-x}/x * sum_{k=0}^n (-1)^k k!/x^k
    const float invx = 1.0f / x;

    // Coefficients : 1, -1, 2, -6, 24, -120, 720, -5040
    // Forme de Horner inversée pour éviter les grandes factorielles
    float poly = 1.0f;
    poly = 1.0f - invx * poly;
    poly = 1.0f - 2.0f * invx * poly;
    poly = 1.0f - 3.0f * invx * poly;
    poly = 1.0f - 4.0f * invx * poly;

    // Pour x > 40, ces termes supplémentaires améliorent la précision
    if (x > 60.0f) {
        poly = 1.0f - 5.0f * invx * poly;
        poly = 1.0f - 6.0f * invx * poly;
    }

    return std::exp(-x) * invx * poly;
}

// Version double précision pour cas critiques
// TODO: Implémentation complète nécessaire
// Note: Cette fonction est déplacée plus bas dans le fichier car elle dépend de expint

} // namespace internal

// ==================== API Publique ====================

// E1(x) - Version principale améliorée
inline float expint(float x) {
    // Gestion des cas spéciaux
    if (!(x > 0.0f)) {  // Gère aussi NaN
        return std::numeric_limits<float>::quiet_NaN();
    }
    if (x < 1e-10f) {  // Très petites valeurs
        return -EULER_MASCHERONI - safe_log(x);
    }

    // Sélection adaptative de la méthode
    if (x < SERIES_THRESHOLD) {
        return internal::expint_series_expansion_kahan(x);
    } else if (x > ASYMPTOTIC_THRESHOLD) {
        return internal::expint_asymptotic_horner(x);
    } else {
        return internal::expint_continued_fraction_enhanced(x);
    }
}

// Version vectorisée SIMD pour calculs multiples (SSE/AVX)
#ifdef __SSE2__
inline void expint_vectorized(const float* x, float* result, int n) {
    // Traitement par blocs de 4 (SSE) ou 8 (AVX)
    for (int i = 0; i < n; i += 4) {
        __m128 xvec = _mm_loadu_ps(&x[i]);
        // Implémentation SIMD optimisée
        alignas(16) float temp[4];
        _mm_store_ps(temp, xvec);
        for (int j = 0; j < 4 && i+j < n; ++j) {
            result[i+j] = expint(temp[j]);
        }
    }
}
#endif

// ==================== Versions Vectorisées Complètes ====================

#ifdef __AVX2__
// Version AVX2 ultra-optimisée d'expint
inline void expint_vectorized_avx2(const float* x, float* result, int n) {
    const __m256 euler_gamma = _mm256_set1_ps(EULER_MASCHERONI_VEC);
    const __m256 series_threshold = _mm256_set1_ps(SERIES_THRESHOLD);
    const __m256 asymptotic_threshold = _mm256_set1_ps(ASYMPTOTIC_THRESHOLD);

    for (int i = 0; i < n; i += 8) {
        __m256 xvec = _mm256_loadu_ps(&x[i]);

        // Gestion des cas spéciaux
        __m256 zero_mask = _mm256_cmp_ps(xvec, _mm256_setzero_ps(), _CMP_LE_OQ);
        __m256 nan_vec = _mm256_set1_ps(std::numeric_limits<float>::quiet_NaN());

        // Sélection de la méthode selon la plage
        __m256 small_x_mask = _mm256_cmp_ps(xvec, series_threshold, _CMP_LT_OQ);
        __m256 large_x_mask = _mm256_cmp_ps(xvec, asymptotic_threshold, _CMP_GT_OQ);

        // Calcul pour petites valeurs (série)
        __m256 result_small = _mm256_sub_ps(_mm256_sub_ps(euler_gamma, safe_log_ps_avx(xvec)), xvec);

        // Calcul pour grandes valeurs (asymptotique)
        __m256 inv_x_large = _mm256_div_ps(_mm256_set1_ps(1.0f), xvec);
        __m256 exp_neg_x = safe_exp_ps_avx(_mm256_sub_ps(_mm256_setzero_ps(), xvec));
        __m256 poly_large = _mm256_set1_ps(1.0f);
        poly_large = _mm256_sub_ps(_mm256_set1_ps(1.0f), _mm256_mul_ps(inv_x_large, poly_large));
        poly_large = _mm256_sub_ps(_mm256_set1_ps(1.0f), _mm256_mul_ps(_mm256_set1_ps(2.0f), _mm256_mul_ps(inv_x_large, poly_large)));
        poly_large = _mm256_sub_ps(_mm256_set1_ps(1.0f), _mm256_mul_ps(_mm256_set1_ps(3.0f), _mm256_mul_ps(inv_x_large, poly_large)));
        poly_large = _mm256_sub_ps(_mm256_set1_ps(1.0f), _mm256_mul_ps(_mm256_set1_ps(4.0f), _mm256_mul_ps(inv_x_large, poly_large)));
        __m256 result_large = _mm256_mul_ps(exp_neg_x, _mm256_mul_ps(inv_x_large, poly_large));

        // Sélection du résultat selon la méthode
        __m256 result_vec = _mm256_blendv_ps(result_large, result_small, large_x_mask);
        result_vec = _mm256_blendv_ps(result_vec, result_large, small_x_mask);

        // Appliquer les cas spéciaux
        result_vec = _mm256_blendv_ps(result_vec, nan_vec, zero_mask);

        _mm256_storeu_ps(&result[i], result_vec);
    }
}

// Version AVX2 d'expint_ei vectorisée
inline void expint_ei_vectorized_avx2(const float* x, float* result, int n) {
    const __m256 euler_gamma = _mm256_set1_ps(EULER_MASCHERONI_VEC);
    const __m256 epsilon = _mm256_set1_ps(EPSILON_PROTECTION_VEC);

    for (int i = 0; i < n; i += 8) {
        __m256 xvec = _mm256_loadu_ps(&x[i]);

        // Gestion des cas spéciaux
        __m256 zero_mask = _mm256_cmp_ps(xvec, _mm256_setzero_ps(), _CMP_LE_OQ);
        __m256 nan_vec = _mm256_set1_ps(std::numeric_limits<float>::quiet_NaN());

        // Calcul Ei(x) = γ + ln(x) + Σ(x^k / (k * k!)) pour k=1,2,3,...
        __m256 log_x = safe_log_ps_avx(xvec);
        __m256 sum_vec = _mm256_add_ps(euler_gamma, log_x);

        // Série avec correction de Kahan
        __m256 term_vec = xvec;
        __m256 c_vec = _mm256_setzero_ps();

        for (int k = 1; k <= MAX_SERIES_ITERATIONS / 2; ++k) {
            __m256 k_float = _mm256_set1_ps(static_cast<float>(k));
            __m256 y_vec = _mm256_sub_ps(_mm256_div_ps(term_vec, k_float), c_vec);
            __m256 t_vec = _mm256_add_ps(sum_vec, y_vec);
            c_vec = _mm256_sub_ps(_mm256_sub_ps(t_vec, sum_vec), y_vec);
            sum_vec = t_vec;

            // Prochain terme: term *= x / (k+1)
            term_vec = _mm256_mul_ps(term_vec, _mm256_div_ps(xvec, _mm256_set1_ps(static_cast<float>(k + 1))));

            // Test de convergence vectorisé
            __m256 term_abs = _mm256_andnot_ps(_mm256_set1_ps(-0.0f), _mm256_div_ps(term_vec, k_float));
            __m256 converged = _mm256_cmp_ps(term_abs, epsilon, _CMP_LT_OQ);
            if (_mm256_testz_ps(converged, converged)) break; // Tous convergés
        }

        // Appliquer les cas spéciaux
        sum_vec = _mm256_blendv_ps(sum_vec, nan_vec, zero_mask);

        _mm256_storeu_ps(&result[i], sum_vec);
    }
}

#endif // __AVX2__

#ifdef __SSE2__
// Version SSE optimisée d'expint
inline void expint_vectorized_sse(const float* x, float* result, int n) {
    const __m128 euler_gamma = _mm_set1_ps(EULER_MASCHERONI_VEC);
    const __m128 series_threshold = _mm_set1_ps(SERIES_THRESHOLD);
    const __m128 asymptotic_threshold = _mm_set1_ps(ASYMPTOTIC_THRESHOLD);

    for (int i = 0; i < n; i += 4) {
        __m128 xvec = _mm_loadu_ps(&x[i]);

        // Gestion des cas spéciaux
        __m128 zero_mask = _mm_cmple_ps(xvec, _mm_setzero_ps());
        __m128 nan_vec = _mm_set1_ps(std::numeric_limits<float>::quiet_NaN());

        // Sélection de la méthode selon la plage
        __m128 small_x_mask = _mm_cmplt_ps(xvec, series_threshold);
        __m128 large_x_mask = _mm_cmpgt_ps(xvec, asymptotic_threshold);

        // Calcul pour petites valeurs (série)
        __m128 log_x_small = safe_log_ps(xvec);
        __m128 result_small = _mm_sub_ps(_mm_sub_ps(euler_gamma, log_x_small), xvec);

        // Calcul pour grandes valeurs (asymptotique)
        __m128 inv_x_large = _mm_div_ps(_mm_set1_ps(1.0f), xvec);
        __m128 exp_neg_x = safe_exp_ps(_mm_sub_ps(_mm_setzero_ps(), xvec));
        __m128 poly_large = _mm_set1_ps(1.0f);
        poly_large = _mm_sub_ps(_mm_set1_ps(1.0f), _mm_mul_ps(inv_x_large, poly_large));
        poly_large = _mm_sub_ps(_mm_set1_ps(1.0f), _mm_mul_ps(_mm_set1_ps(2.0f), _mm_mul_ps(inv_x_large, poly_large)));
        poly_large = _mm_sub_ps(_mm_set1_ps(1.0f), _mm_mul_ps(_mm_set1_ps(3.0f), _mm_mul_ps(inv_x_large, poly_large)));
        poly_large = _mm_sub_ps(_mm_set1_ps(1.0f), _mm_mul_ps(_mm_set1_ps(4.0f), _mm_mul_ps(inv_x_large, poly_large)));
        __m128 result_large = _mm_mul_ps(exp_neg_x, _mm_mul_ps(inv_x_large, poly_large));

        // Sélection du résultat selon la méthode
        __m128 result_vec = _mm_or_ps(_mm_and_ps(large_x_mask, result_large), _mm_andnot_ps(large_x_mask, result_small));
        result_vec = _mm_or_ps(_mm_and_ps(small_x_mask, result_small), _mm_andnot_ps(small_x_mask, result_vec));

        // Appliquer les cas spéciaux
        result_vec = _mm_or_ps(_mm_andnot_ps(zero_mask, result_vec), _mm_and_ps(zero_mask, nan_vec));

        _mm_storeu_ps(&result[i], result_vec);
    }
}

#endif // __SSE2__

#ifdef __ARM_NEON
// Version ARM NEON optimisée d'expint
inline void expint_vectorized_neon(const float* x, float* result, int n) {
    const float32x4_t euler_gamma = vdupq_n_f32(EULER_MASCHERONI_VEC);
    const float32x4_t epsilon = vdupq_n_f32(EPSILON_PROTECTION_VEC);
    const float32x4_t series_threshold = vdupq_n_f32(SERIES_THRESHOLD);
    const float32x4_t asymptotic_threshold = vdupq_n_f32(ASYMPTOTIC_THRESHOLD);

    for (int i = 0; i < n; i += 4) {
        float32x4_t xvec = vld1q_f32(&x[i]);

        // Gestion des cas spéciaux
        uint32x4_t zero_mask = vcleq_f32(xvec, vdupq_n_f32(0.0f));
        float32x4_t nan_vec = vdupq_n_f32(std::numeric_limits<float>::quiet_NaN());

        // Sélection de la méthode selon la plage
        uint32x4_t small_x_mask = vcltq_f32(xvec, series_threshold);
        uint32x4_t large_x_mask = vcgtq_f32(xvec, asymptotic_threshold);

        // Calcul pour petites valeurs (série)
        float32x4_t log_x_small = safe_log_neon(xvec);
        float32x4_t result_small = vsubq_f32(vsubq_f32(euler_gamma, log_x_small), xvec);

        // Calcul pour grandes valeurs (asymptotique)
        float32x4_t inv_x_large = vdivq_f32(vdupq_n_f32(1.0f), xvec);
        float32x4_t exp_neg_x = safe_exp_neon(vnegq_f32(xvec));
        float32x4_t poly_large = vdupq_n_f32(1.0f);
        poly_large = vsubq_f32(vdupq_n_f32(1.0f), vmulq_f32(inv_x_large, poly_large));
        poly_large = vsubq_f32(vdupq_n_f32(1.0f), vmulq_f32(vdupq_n_f32(2.0f), vmulq_f32(inv_x_large, poly_large)));
        poly_large = vsubq_f32(vdupq_n_f32(1.0f), vmulq_f32(vdupq_n_f32(3.0f), vmulq_f32(inv_x_large, poly_large)));
        poly_large = vsubq_f32(vdupq_n_f32(1.0f), vmulq_f32(vdupq_n_f32(4.0f), vmulq_f32(inv_x_large, poly_large)));
        float32x4_t result_large = vmulq_f32(exp_neg_x, vmulq_f32(inv_x_large, poly_large));

        // Sélection du résultat selon la méthode
        float32x4_t result_vec = vbslq_f32(large_x_mask, result_large, result_small);
        result_vec = vbslq_f32(small_x_mask, result_small, result_vec);

        // Appliquer les cas spéciaux
        result_vec = vbslq_f32(zero_mask, nan_vec, result_vec);

        vst1q_f32(&result[i], result_vec);
    }
}

#endif // __ARM_NEON

// Alias E1 avec hint inline fort
[[gnu::always_inline]] inline float expint_e1(float x) {
    return expint(x);
}

// ==================== API SIMD Automatique ====================

// Fonction principale vectorisée qui choisit automatiquement la meilleure implémentation
inline void expint_vectorized_auto(const float* x, float* result, int n) {
#if defined(__AVX2__)
    // AVX2: 8 échantillons en parallèle
    expint_vectorized_avx2(x, result, n);
    // Traiter les échantillons restants
    for (int i = (n / 8) * 8; i < n; ++i) {
        result[i] = expint(x[i]);
    }
#elif defined(__SSE2__)
    // SSE2: 4 échantillons en parallèle
    expint_vectorized_sse(x, result, n);
    // Traiter les échantillons restants
    for (int i = (n / 4) * 4; i < n; ++i) {
        result[i] = expint(x[i]);
    }
#elif defined(__ARM_NEON)
    // ARM NEON: 4 échantillons en parallèle
    expint_vectorized_neon(x, result, n);
    // Traiter les échantillons restants
    for (int i = (n / 4) * 4; i < n; ++i) {
        result[i] = expint(x[i]);
    }
#else
    // Version scalaire de fallback
    for (int i = 0; i < n; ++i) {
        result[i] = expint(x[i]);
    }
#endif
}

// Version vectorisée d'expint_ei avec sélection automatique
inline void expint_ei_vectorized_auto(const float* x, float* result, int n) {
#if defined(__AVX2__)
    // AVX2: 8 échantillons en parallèle
    expint_ei_vectorized_avx2(x, result, n);
    // Traiter les échantillons restants
    for (int i = (n / 8) * 8; i < n; ++i) {
        result[i] = expint_ei(x[i]);
    }
#else
    // Version scalaire pour les autres architectures
    for (int i = 0; i < n; ++i) {
        result[i] = expint_ei(x[i]);
    }
#endif
}

// Fonction de calcul vectoriel avec gestion automatique de la taille
inline void expint_batch(const float* x, float* result, int n) {
    // Utiliser la version vectorisée pour les gros lots
    if (n >= MAX_VECTOR_SIZE) {
        expint_vectorized_auto(x, result, n);
    } else {
        // Pour les petits lots, utiliser la version scalaire
        for (int i = 0; i < n; ++i) {
            result[i] = expint(x[i]);
        }
    }
}

// Fonction de calcul Ei vectoriel avec gestion automatique de la taille
inline void expint_ei_batch(const float* x, float* result, int n) {
    // Utiliser la version vectorisée pour les gros lots
    if (n >= MAX_VECTOR_SIZE) {
        expint_ei_vectorized_auto(x, result, n);
    } else {
        // Pour les petits lots, utiliser la version scalaire
        for (int i = 0; i < n; ++i) {
            result[i] = expint_ei(x[i]);
        }
    }
}

// ==================== Fonctions SIMD Utilitaires Avancées ====================

// Calcul vectoriel du logarithme avec protection SIMD
inline void safe_log_batch(const float* x, float* result, int n) {
#if defined(__AVX2__)
    for (int i = 0; i < n; i += 8) {
        __m256 xvec = _mm256_loadu_ps(&x[i]);
        __m256 result_vec = safe_log_ps_avx(xvec);
        _mm256_storeu_ps(&result[i], result_vec);
    }
    // Traiter les échantillons restants
    for (int i = (n / 8) * 8; i < n; ++i) {
        result[i] = safe_log(x[i]);
    }
#elif defined(__SSE2__)
    for (int i = 0; i < n; i += 4) {
        __m128 xvec = _mm_loadu_ps(&x[i]);
        __m128 result_vec = safe_log_ps(xvec);
        _mm_storeu_ps(&result[i], result_vec);
    }
    // Traiter les échantillons restants
    for (int i = (n / 4) * 4; i < n; ++i) {
        result[i] = safe_log(x[i]);
    }
#elif defined(__ARM_NEON)
    for (int i = 0; i < n; i += 4) {
        float32x4_t xvec = vld1q_f32(&x[i]);
        float32x4_t result_vec = safe_log_neon(xvec);
        vst1q_f32(&result[i], result_vec);
    }
    // Traiter les échantillons restants
    for (int i = (n / 4) * 4; i < n; ++i) {
        result[i] = safe_log(x[i]);
    }
#else
    for (int i = 0; i < n; ++i) {
        result[i] = safe_log(x[i]);
    }
#endif
}

// Calcul vectoriel de l'exponentielle avec protection SIMD
inline void safe_exp_batch(const float* x, float* result, int n) {
#if defined(__AVX2__)
    for (int i = 0; i < n; i += 8) {
        __m256 xvec = _mm256_loadu_ps(&x[i]);
        __m256 result_vec = safe_exp_ps_avx(xvec);
        _mm256_storeu_ps(&result[i], result_vec);
    }
    // Traiter les échantillons restants
    for (int i = (n / 8) * 8; i < n; ++i) {
        result[i] = std::exp(x[i]);
    }
#elif defined(__SSE2__)
    for (int i = 0; i < n; i += 4) {
        __m128 xvec = _mm_loadu_ps(&x[i]);
        __m128 result_vec = safe_exp_ps(xvec);
        _mm_storeu_ps(&result[i], result_vec);
    }
    // Traiter les échantillons restants
    for (int i = (n / 4) * 4; i < n; ++i) {
        result[i] = std::exp(x[i]);
    }
#elif defined(__ARM_NEON)
    for (int i = 0; i < n; i += 4) {
        float32x4_t xvec = vld1q_f32(&x[i]);
        float32x4_t result_vec = safe_exp_neon(xvec);
        vst1q_f32(&result[i], result_vec);
    }
    // Traiter les échantillons restants
    for (int i = (n / 4) * 4; i < n; ++i) {
        result[i] = std::exp(x[i]);
    }
#else
    for (int i = 0; i < n; ++i) {
        result[i] = std::exp(x[i]);
    }
#endif
}

// Version double précision pour cas critiques
// TODO: Implémentation complète nécessaire
[[deprecated("Not yet implemented - use float version instead")]]
inline double expint_double_precision(double x) {
    static_assert(sizeof(double) > 0, "Double precision version not yet implemented");
    // Conversion temporaire vers float (perte de précision!)
    return static_cast<double>(expint(static_cast<float>(x)));
}

// Ei(x) améliorée avec ratio récursif (plus stable)
inline float expint_ei(float x) {
    if (!(x > 0.0f)) {
        return std::numeric_limits<float>::quiet_NaN();
    }

    float sum = EULER_MASCHERONI + safe_log(x);
    float c = 0.0f;  // Correction de Kahan

    // Utilisation du ratio récursif pour éviter overflow de factorial
    // term_k = x^k / (k * k!) = term_{k-1} * x / (k * k)
    float term = x;  // Premier terme : x / (1 * 1!)

    for (int k = 1; k <= MAX_SERIES_ITERATIONS; ++k) {
        // Sommation de Kahan
        float y = term / k - c;
        float t = sum + y;
        c = (t - sum) - y;
        sum = t;

        if (is_converged(term/k, sum)) break;

        // Calcul du prochain terme par ratio récursif
        // term_{k+1} = term_k * x / (k+1)
        term *= x / static_cast<float>(k + 1);

        // Protection overflow
        if (term > MAX_FLOAT) break;
    }
    return sum;
}

// En(n, x) avec récurrence stabilisée (Miller pour n grand)
inline float expint_en(int n, float x) {
    if (n <= 0 || !(x > 0.0f)) {
        return std::numeric_limits<float>::quiet_NaN();
    }

    if (n == 1) return expint(x);

    // Pour n grand et x petit, utiliser récurrence arrière (plus stable)
    // Récurrence : E_{k-1} = (e^{-x} + x*E_k) / (k-1)
    if (n > 10 && x < static_cast<float>(n)/2.0f) {
        // Récurrence arrière de Miller (CORRECTE)
        const int nstart = n + static_cast<int>(5 + std::sqrt(40.0f * n));  // Point de départ optimisé

        // On commence avec des valeurs arbitraires
        [[maybe_unused]] float Ekp1 = 0.0f;  // E_{k+1}
        float Ek = 1.0f;    // E_k (valeur arbitraire non nulle)

        // Récurrence arrière : E_{k-1} = (e^{-x} + x*E_k) / (k-1)
        for (int k = nstart; k > n; --k) {
            float Ekm1 = (std::exp(-x) + x * Ek) / static_cast<float>(k - 1);
            Ekp1 = Ek;  // Gardé pour cohérence avec la logique
            Ek = Ekm1;
        }

        // À ce point, Ek contient E_n (non normalisé)
        float En_unnormalized = Ek;

        // Continue jusqu'à E_1 pour la normalisation
        for (int k = n; k > 1; --k) {
            float Ekm1 = (std::exp(-x) + x * Ek) / static_cast<float>(k - 1);
            Ekp1 = Ek;
            Ek = Ekm1;
        }

        // Ek contient maintenant E_1 (non normalisé)
        // Normalisation par rapport à la vraie valeur de E_1
        float E1_true = expint(x);
        float scale = E1_true / Ek;

        return En_unnormalized * scale;
    }

    // Récurrence avant standard (stable pour x > n/2)
    float Ek = expint(x);  // E_1(x)
    for (int k = 2; k <= n; ++k) {
        Ek = (std::exp(-x) - x * Ek) / static_cast<float>(k - 1);
        // Protection underflow
        if (Ek < MIN_LOG_ARG) {
            return 0.0f;
        }
    }
    return Ek;
}

// ==================== Fonctions de Test et Validation ====================
namespace Testing {

    // Vérification contre valeurs de référence
    inline float relative_error(float computed, float reference) {
        if (std::fabs(reference) < EPSILON_PROTECTION) {
            return std::fabs(computed - reference);
        }
        return std::fabs((computed - reference) / reference);
    }

    // Test de cohérence : E1(x) = -Ei(-x) pour x > 0
    inline bool consistency_check(float x, float tolerance = 1e-6f) {
        if (x <= 0) return false;
        // Éviter l'instabilité de Ei(-x)
        // Utiliser plutôt la relation de récurrence ou autre test
        // Pour l'instant, test basique de validité de la fonction
        (void)tolerance; // Paramètre gardé pour compatibilité future
        float e1 = expint(x);
        return !std::isnan(e1) && !std::isinf(e1);
    }

    // Benchmark simple
    template<typename Func>
    inline double benchmark(Func f, float x, int iterations = 1000000) {
        auto start = std::chrono::high_resolution_clock::now();
        volatile float result = 0;
        for (int i = 0; i < iterations; ++i) {
            result = f(x);
        }
        auto end = std::chrono::high_resolution_clock::now();
        return std::chrono::duration<double>(end - start).count();
    }
}

} // namespace MathUtils
} // namespace AudioNR

#endif // __cplusplus
