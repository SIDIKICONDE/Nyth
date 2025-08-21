#pragma once

#include "common/FilterTypes.hpp"
#include <memory>
#include <unordered_map>
#include <list>
#include <vector>
#include <chrono>
#include <functional>
#include <mutex>

namespace Camera {

/**
 * Système de cache intelligent pour les filtres
 * Utilise LRU avec prédiction d'utilisation et préchargement
 */
class SmartCache {
public:
    SmartCache();
    ~SmartCache();

    // Configuration
    void setMaxCacheSize(size_t maxSize);
    void setCacheTTL(std::chrono::milliseconds ttl);
    void enablePrediction(bool enable);

    // Cache des frames traitées
    struct CachedFrame {
        std::vector<uint8_t> frameData;
        FilterState appliedFilter;
        std::chrono::steady_clock::time_point lastAccess;
        size_t accessCount{0};
        size_t dataSize{0};
    };

    // Interface du cache
    bool getCachedFrame(const FilterState& filter, const void* inputData, size_t inputSize,
                       std::vector<uint8_t>& outputData);
    void putCachedFrame(const FilterState& filter, const void* inputData, size_t inputSize,
                       const void* outputData, size_t outputSize);

    // Prédiction d'utilisation
    void recordFilterUsage(FilterType type);
    std::vector<FilterType> predictNextFilters(size_t count = 3) const;

    // Préchargement
    void preloadCommonFilters();
    void preloadFilter(FilterType type);

    // Statistiques
    struct CacheStats {
        size_t totalHits{0};
        size_t totalMisses{0};
        double hitRate{0.0};
        size_t currentCacheSize{0};
        size_t maxCacheSize{0};
        size_t totalEvictions{0};
        size_t prefetchHits{0};
    };

    CacheStats getStats() const;
    void resetStats();

    // Nettoyage
    void cleanupExpired();
    void clearCache();

private:
    // Structure pour LRU cache
    using CacheKey = std::pair<std::string, size_t>; // hash du filtre + hash des données d'entrée
    using CacheList = std::list<std::pair<CacheKey, CachedFrame>>;
    using CacheMap = std::unordered_map<CacheKey, typename CacheList::iterator>;

    mutable std::mutex mutex_;
    CacheList cacheList_;
    CacheMap cacheMap_;
    size_t maxCacheSize_;
    std::chrono::milliseconds cacheTTL_;
    bool predictionEnabled_;

    // Statistiques d'utilisation des filtres
    std::unordered_map<FilterType, size_t> filterUsage_;
    std::vector<FilterType> usageHistory_;

    // Préchargement
    std::vector<FilterType> prefetchedFilters_;

    // Méthodes internes
    CacheKey createCacheKey(const FilterState& filter, const void* inputData, size_t inputSize) const;
    size_t calculateDataHash(const void* data, size_t size) const;
    size_t getCurrentCacheSize() const;
    void evictLRU();
    bool isExpired(const CachedFrame& frame) const;
    void updateHitRate();
};

/**
 * Cache spécialisé pour les shaders GPU
 */
class ShaderCache {
public:
    ShaderCache();
    ~ShaderCache();

    // Cache des programmes shader
    struct CachedShader {
        unsigned int program{0};
        unsigned int vertexShader{0};
        unsigned int fragmentShader{0};
        FilterType filterType;
        std::string shaderSource;
        std::chrono::steady_clock::time_point lastUsed;
        bool isCompiled{false};
    };

    // Interface du cache shader
    CachedShader* getCompiledShader(FilterType type);
    void putCompiledShader(FilterType type, unsigned int program,
                          unsigned int vertexShader, unsigned int fragmentShader,
                          const std::string& source);

    // Gestion des shaders
    void cleanupUnusedShaders();
    void reloadAllShaders();

    // Statistiques
    struct ShaderStats {
        size_t totalShaders{0};
        size_t compiledShaders{0};
        size_t cacheHits{0};
        size_t cacheMisses{0};
        double compilationTime{0.0}; // en ms
    };

    ShaderStats getStats() const;

private:
    mutable std::mutex mutex_;
    std::unordered_map<FilterType, CachedShader> shaderCache_;
    ShaderStats stats_;
};

/**
 * Système de cache unifié
 */
class UnifiedCache {
public:
    UnifiedCache();
    ~UnifiedCache();

    // Accès aux sous-caches
    SmartCache& getFrameCache() { return frameCache_; }
    ShaderCache& getShaderCache() { return shaderCache_; }

    // Configuration globale
    void setGlobalCacheSize(size_t maxSize);
    void enableAllCaches(bool enable);

    // Nettoyage global
    void cleanupAll();
    void clearAll();

    // Statistiques globales
    struct GlobalStats {
        SmartCache::CacheStats frameStats;
        ShaderCache::ShaderStats shaderStats;
        size_t totalMemoryUsed{0};
    };

    GlobalStats getGlobalStats() const;

private:
    SmartCache frameCache_;
    ShaderCache shaderCache_;
};

} // namespace Camera
