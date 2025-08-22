#pragma once

#include <string>
#include <unordered_map>
#include <cstdint>
#include <cstring>

namespace Camera {

/**
 * Configuration de production pour le système de filtres
 * Optimisé pour les performances et la stabilité en production
 */
class ProductionConfig {
public:
    // Singleton pour accès global
    static ProductionConfig& getInstance();

    // Configuration générale
    struct GeneralConfig {
        bool enableProductionMode{true};
        bool enableLogging{false};
        bool enableProfiling{false};
        bool enableCache{true};
        bool enableOpenGL{true};
        std::string logLevel{"ERROR"}; // ERROR, WARN, INFO, DEBUG
    };

    // Configuration mémoire
    struct MemoryConfig {
        size_t maxCacheSize{512 * 1024 * 1024}; // 512MB pour production
        size_t cleanupThreshold{400 * 1024 * 1024}; // 400MB
        size_t minFramePoolSize{10};
        size_t maxFramePoolSize{50};
        bool enableMemoryTracking{true};
        bool enablePoolOptimization{true};
    };

    // Configuration GPU
    struct GPUConfig {
        bool preferOpenGL{true};
        bool enableShaderCache{true};
        bool enableTextureCompression{true};
        int maxTextureSize{4096};
        bool enableMipmaps{false}; // Pas nécessaire pour les filtres
        std::string preferredPixelFormat{"rgba"};
    };

    // Configuration des performances
    struct PerformanceConfig {
        int targetFPS{60};
        int maxProcessingThreads{4};
        bool enableThreadPooling{true};
        bool enableSIMDOptimization{true};
        bool enablePrediction{true};
        size_t predictionHistorySize{1000};
    };

    // Configuration des filtres
    struct FilterConfig {
        bool enableFilterCaching{true};
        size_t maxCachedFilters{20};
        bool preloadCommonFilters{true};
        std::unordered_map<std::string, float> filterDefaults;
    };

    // Getters pour les configurations
    const GeneralConfig& getGeneral() const { return general_; }
    const MemoryConfig& getMemory() const { return memory_; }
    const GPUConfig& getGPU() const { return gpu_; }
    const PerformanceConfig& getPerformance() const { return performance_; }
    const FilterConfig& getFilter() const { return filter_; }

    // Setters pour modification runtime (avec verrouillage)
    void setProductionMode(bool enable);
    void setLogging(bool enable);
    void setCacheSize(size_t size);
    void setTargetFPS(int fps);

    // Utilitaires
    bool isProductionMode() const { return general_.enableProductionMode; }
    bool isLoggingEnabled() const { return general_.enableLogging; }
    bool isProfilingEnabled() const { return general_.enableProfiling; }

    // Validation de configuration
    bool validateConfiguration() const;
    std::string getConfigurationReport() const;

private:
    ProductionConfig();
    ~ProductionConfig();

    // Configurations
    GeneralConfig general_;
    MemoryConfig memory_;
    GPUConfig gpu_;
    PerformanceConfig performance_;
    FilterConfig filter_;

    // Initialisation des valeurs par défaut
    void initializeDefaults();
    void loadFromEnvironment();
    void applyOptimizations();
};

// Macros pour faciliter l'utilisation en production
#ifdef NDEBUG // Release mode
    #define PROD_LOG(level, message) if (ProductionConfig::getInstance().isLoggingEnabled()) { /* Log impl */ }
    #define PROD_ASSERT(condition, message) /* Disabled in production */
    #define PROD_PROFILE_START(name) /* Disabled in production */
    #define PROD_PROFILE_END(name) /* Disabled in production */
#else // Debug mode
    #define PROD_LOG(level, message) std::cout << "[" << level << "] " << message << std::endl
    #define PROD_ASSERT(condition, message) if (!(condition)) { throw std::runtime_error(message); }
    #define PROD_PROFILE_START(name) auto name##_start = std::chrono::high_resolution_clock::now()
    #define PROD_PROFILE_END(name) auto name##_end = std::chrono::high_resolution_clock::now(); \
        std::cout << "[PROFILE] " << #name << ": " \
                  << std::chrono::duration<double, std::milli>(name##_end - name##_start).count() \
                  << "ms" << std::endl
#endif

// Configuration de build pour différents environnements
namespace BuildConfig {

    // Production build flags (à utiliser dans CMakeLists.txt)
    inline std::string getProductionFlags() {
        return "-O3 -DNDEBUG -DPRODUCTION_BUILD "
               "-march=native -flto -fomit-frame-pointer "
               "-ffast-math -funroll-loops";
    }

    // Debug build flags
    inline std::string getDebugFlags() {
        return "-O0 -g -DDEBUG_BUILD -Wall -Wextra -Wpedantic";
    }

    // Platform-specific optimizations
    inline std::string getPlatformFlags() {
    #if defined(__ANDROID__)
        return "-DANDROID -fvisibility=hidden -fPIC";
    #elif defined(__APPLE__)
        return "-fobjc-arc -fvisibility=hidden";
    #elif defined(_WIN32)
        return "/O2 /DNDEBUG /D_CRT_SECURE_NO_WARNINGS";
    #else
        return "-pthread -fvisibility=hidden";
    #endif
    }

} // namespace BuildConfig

} // namespace Camera
