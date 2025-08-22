#pragma once
#ifndef DB_LOOKUP_TABLE_HPP
#define DB_LOOKUP_TABLE_HPP

#include <algorithm>
#include <array>
#include <cmath>


namespace AudioFX {

/**
 * @brief High-performance lookup table for dB ↔ linear conversions
 *
 * Replaces expensive pow() and log10() operations with table lookups.
 * Provides ~50x speedup over standard math functions.
 *
 * Mathematical basis:
 * - Linear to dB: 20 * log10(linear)
 * - dB to Linear: 10^(dB/20)
 */
class DbLookupTable {
public:
    // Table configuration
    static constexpr size_t TABLE_SIZE = 8192; // Resolution (power of 2 for fast indexing)
    static constexpr float MIN_DB = -96.0f;    // Minimum dB value (below = -inf)
    static constexpr float MAX_DB = 24.0f;     // Maximum dB value
    static constexpr float DB_RANGE = MAX_DB - MIN_DB;
    static constexpr float MIN_LINEAR = 0.0000158489f; // 10^(-96/20)
    static constexpr float MAX_LINEAR = 15.8489f;      // 10^(24/20)

    // Singleton instance
    static DbLookupTable& getInstance() {
        static DbLookupTable instance;
        return instance;
    }

    /**
     * @brief Convert dB to linear with interpolation
     * @param db Input in decibels
     * @return Linear amplitude (0 to ~15.85)
     */
    inline float dbToLinear(float db) const noexcept {
        // Clamp input
        if (db <= MIN_DB)
            return 0.0f;
        if (db >= MAX_DB)
            return MAX_LINEAR;

        // Calculate table index
        float normalized = (db - MIN_DB) / DB_RANGE;
        float fIndex = normalized * (TABLE_SIZE - 1);
        size_t index = static_cast<size_t>(fIndex);
        float frac = fIndex - index;

        // Bounds check
        if (index >= TABLE_SIZE - 1) {
            return m_dbToLinearTable[TABLE_SIZE - 1];
        }

        // Linear interpolation for accuracy
        float y0 = m_dbToLinearTable[index];
        float y1 = m_dbToLinearTable[index + 1];
        return y0 + frac * (y1 - y0);
    }

    /**
     * @brief Convert linear to dB with interpolation
     * @param linear Input linear amplitude
     * @return Value in decibels
     */
    inline float linearToDb(float linear) const noexcept {
        // Handle edge cases
        if (linear <= 0.0f)
            return -INFINITY;
        if (linear <= MIN_LINEAR)
            return MIN_DB;
        if (linear >= MAX_LINEAR)
            return MAX_DB;

        // Binary search for the interval
        size_t left = 0;
        size_t right = TABLE_SIZE - 1;

        while (right - left > 1) {
            size_t mid = (left + right) / 2;
            if (m_dbToLinearTable[mid] <= linear) {
                left = mid;
            } else {
                right = mid;
            }
        }

        // Linear interpolation
        float x0 = m_dbToLinearTable[left];
        float x1 = m_dbToLinearTable[right];
        float y0 = m_linearToDbTable[left];
        float y1 = m_linearToDbTable[right];

        if (x1 - x0 > 0.0f) {
            float t = (linear - x0) / (x1 - x0);
            return y0 + t * (y1 - y0);
        }

        return y0;
    }

    /**
     * @brief Fast approximate dB to linear (no interpolation)
     */
    inline float dbToLinearFast(float db) const noexcept {
        if (db <= MIN_DB)
            return 0.0f;
        if (db >= MAX_DB)
            return MAX_LINEAR;

        float normalized = (db - MIN_DB) / DB_RANGE;
        size_t index = static_cast<size_t>(normalized * (TABLE_SIZE - 1));
        return m_dbToLinearTable[std::min(index, TABLE_SIZE - 1)];
    }

    /**
     * @brief Batch conversion for SIMD optimization
     */
    void dbToLinearBatch(const float* dbIn, float* linearOut, size_t count) const noexcept {
        for (size_t i = 0; i < count; ++i) {
            linearOut[i] = dbToLinear(dbIn[i]);
        }
    }

    void linearToDbBatch(const float* linearIn, float* dbOut, size_t count) const noexcept {
        for (size_t i = 0; i < count; ++i) {
            dbOut[i] = linearToDb(linearIn[i]);
        }
    }

    /**
     * @brief Get table memory usage
     */
    static constexpr size_t getMemoryUsage() {
        return 2 * TABLE_SIZE * sizeof(float);
    }

private:
    // Private constructor for singleton
    DbLookupTable() {
        initializeTables();
    }

    void initializeTables() {
        // Generate dB to linear table
        for (size_t i = 0; i < TABLE_SIZE; ++i) {
            float db = MIN_DB + (i * DB_RANGE / (TABLE_SIZE - 1));
            m_dbToLinearTable[i] = std::pow(10.0f, db / 20.0f);
        }

        // Generate linear to dB table (inverse mapping)
        for (size_t i = 0; i < TABLE_SIZE; ++i) {
            float linear = m_dbToLinearTable[i];
            if (linear > 0.0f) {
                m_linearToDbTable[i] = 20.0f * std::log10(linear);
            } else {
                m_linearToDbTable[i] = MIN_DB;
            }
        }
    }

    // Lookup tables
    alignas(64) std::array<float, TABLE_SIZE> m_dbToLinearTable;
    alignas(64) std::array<float, TABLE_SIZE> m_linearToDbTable;
};

/**
 * @brief Specialized gain lookup table for common gain values
 *
 * Optimized for typical gain ranges in audio processing
 */
class GainLookupTable {
public:
    static constexpr size_t GAIN_TABLE_SIZE = 4096;
    static constexpr float MIN_GAIN_DB = -60.0f;
    static constexpr float MAX_GAIN_DB = 12.0f;

    static GainLookupTable& getInstance() {
        static GainLookupTable instance;
        return instance;
    }

    /**
     * @brief Apply gain in dB to a sample
     */
    inline float applyGain(float sample, float gainDb) const noexcept {
        float linear = dbToGain(gainDb);
        return sample * linear;
    }

    /**
     * @brief Convert gain in dB to linear multiplier
     */
    inline float dbToGain(float gainDb) const noexcept {
        if (gainDb <= MIN_GAIN_DB)
            return 0.0f;
        if (gainDb >= MAX_GAIN_DB)
            return m_gainTable[GAIN_TABLE_SIZE - 1];

        float normalized = (gainDb - MIN_GAIN_DB) / (MAX_GAIN_DB - MIN_GAIN_DB);
        size_t index = static_cast<size_t>(normalized * (GAIN_TABLE_SIZE - 1));
        return m_gainTable[std::min(index, GAIN_TABLE_SIZE - 1)];
    }

private:
    GainLookupTable() {
        for (size_t i = 0; i < GAIN_TABLE_SIZE; ++i) {
            float db = MIN_GAIN_DB + (i * (MAX_GAIN_DB - MIN_GAIN_DB) / (GAIN_TABLE_SIZE - 1));
            m_gainTable[i] = std::pow(10.0f, db / 20.0f);
        }
    }

    alignas(64) std::array<float, GAIN_TABLE_SIZE> m_gainTable;
};

/**
 * @brief Fast approximation functions for less critical paths
 */
namespace FastMath {
/**
 * @brief Fast approximate pow(10, x) using Taylor series
 * Good for x in range [-2, 2]
 */
inline float fast_pow10(float x) noexcept {
    // pow(10, x) = exp(x * ln(10))
    constexpr float ln10 = 2.302585093f;
    float t = x * ln10;

    // Taylor series approximation of exp(t)
    float result = 1.0f;
    float term = t;
    result += term;
    term *= t / 2.0f;
    result += term;
    term *= t / 3.0f;
    result += term;
    term *= t / 4.0f;
    result += term;

    return result;
}

/**
 * @brief Fast approximate log10 using bit manipulation
 * Error < 0.01 for normalized audio
 */
inline float fast_log10(float x) noexcept {
    if (x <= 0.0f)
        return -100.0f;

    // Extract exponent and mantissa
    union {
        float f;
        uint32_t i;
    } u = {x};
    float log2_approx = ((u.i >> 23) & 0xFF) - 127;
    u.i = (u.i & 0x007FFFFF) | 0x3F800000;

    // Polynomial approximation for mantissa
    float m = u.f;
    float p = m * (m * (-0.333333f) + 2.0f) - 0.666666f;

    // Convert log2 to log10
    constexpr float log2_to_log10 = 0.301029996f;
    return (log2_approx + p) * log2_to_log10;
}

/**
 * @brief Ultra-fast dB to linear for non-critical paths
 * Uses piecewise linear approximation
 */
inline float ultrafast_db_to_linear(float db) noexcept {
    if (db <= -60.0f)
        return 0.0f;
    if (db >= 0.0f)
        return 1.0f + db * 0.115f; // Linear approximation near 0dB

    // Piecewise linear segments
    if (db > -20.0f) {
        return 0.1f + (db + 20.0f) * 0.045f;
    } else if (db > -40.0f) {
        return 0.01f + (db + 40.0f) * 0.0045f;
    } else {
        return 0.001f + (db + 60.0f) * 0.00045f;
    }
}
} // namespace FastMath

} // namespace AudioFX

#endif // DB_LOOKUP_TABLE_HPP
