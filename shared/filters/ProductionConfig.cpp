#include "ProductionConfig.hpp"
#include <iostream>
#include <cstdio>
#include <cstdlib>
#include <mutex>
#include <sstream>

namespace Camera {

ProductionConfig& ProductionConfig::getInstance() {
    static ProductionConfig instance;
    return instance;
}

ProductionConfig::ProductionConfig() {
    initializeDefaults();
    loadFromEnvironment();
    applyOptimizations();

    std::cout << "[ProductionConfig] Configuration de production initialisée" << std::endl;
    if (general_.enableLogging) {
        std::cout << getConfigurationReport() << std::endl;
    }
}

ProductionConfig::~ProductionConfig() {
    std::cout << "[ProductionConfig] Configuration détruite" << std::endl;
}

void ProductionConfig::initializeDefaults() {
    // Configuration générale
    general_.enableProductionMode = true;
    general_.enableLogging = false;
    general_.enableProfiling = false;
    general_.enableCache = true;
    general_.enableOpenGL = true;
    general_.logLevel = "ERROR";

    // Configuration mémoire
    memory_.maxCacheSize = 512 * 1024 * 1024; // 512MB
    memory_.cleanupThreshold = 400 * 1024 * 1024; // 400MB
    memory_.minFramePoolSize = 10;
    memory_.maxFramePoolSize = 50;
    memory_.enableMemoryTracking = true;
    memory_.enablePoolOptimization = true;

    // Configuration GPU
    gpu_.preferOpenGL = true;
    gpu_.enableShaderCache = true;
    gpu_.enableTextureCompression = true;
    gpu_.maxTextureSize = 4096;
    gpu_.enableMipmaps = false;
    gpu_.preferredPixelFormat = "rgba";

    // Configuration performances
    performance_.targetFPS = 60;
    performance_.maxProcessingThreads = 4;
    performance_.enableThreadPooling = true;
    performance_.enableSIMDOptimization = true;
    performance_.enablePrediction = true;
    performance_.predictionHistorySize = 1000;

    // Configuration filtres
    filter_.enableFilterCaching = true;
    filter_.maxCachedFilters = 20;
    filter_.preloadCommonFilters = true;

    // Valeurs par défaut des filtres
    filter_.filterDefaults = {
        {"sepia", 0.8f},
        {"vintage", 0.6f},
        {"cool", 0.7f},
        {"warm", 0.7f},
        {"brightness", 0.0f},
        {"contrast", 1.0f},
        {"saturation", 1.0f}
    };
}

void ProductionConfig::loadFromEnvironment() {
    // Charger depuis les variables d'environnement
    if (const char* env = std::getenv("FILTER_PRODUCTION_MODE")) {
        general_.enableProductionMode = std::string(env) == "1";
    }

    if (const char* env = std::getenv("FILTER_ENABLE_LOGGING")) {
        general_.enableLogging = std::string(env) == "1";
    }

    if (const char* env = std::getenv("FILTER_LOG_LEVEL")) {
        general_.logLevel = env;
    }

    if (const char* env = std::getenv("FILTER_CACHE_SIZE_MB")) {
        memory_.maxCacheSize = std::stoul(env) * 1024 * 1024;
    }

    if (const char* env = std::getenv("FILTER_TARGET_FPS")) {
        performance_.targetFPS = std::stoi(env);
    }

    if (const char* env = std::getenv("FILTER_MAX_THREADS")) {
        performance_.maxProcessingThreads = std::stoi(env);
    }
}

void ProductionConfig::applyOptimizations() {
    // Appliquer les optimisations basées sur la configuration
    if (general_.enableProductionMode) {
        // Désactiver les logs en production
        general_.enableLogging = false;
        general_.enableProfiling = false;

        // Optimiser pour les performances
        memory_.enableMemoryTracking = true;
        memory_.enablePoolOptimization = true;
        performance_.enableThreadPooling = true;
        performance_.enableSIMDOptimization = true;
        performance_.enablePrediction = true;

        // Configuration GPU optimisée
        gpu_.enableShaderCache = true;
        gpu_.enableTextureCompression = true;
    }
}

void ProductionConfig::setProductionMode(bool enable) {
    general_.enableProductionMode = enable;
    applyOptimizations();
}

void ProductionConfig::setLogging(bool enable) {
    general_.enableLogging = enable;
}

void ProductionConfig::setCacheSize(size_t size) {
    memory_.maxCacheSize = size;
    memory_.cleanupThreshold = size * 0.8; // 80% du cache max
}

void ProductionConfig::setTargetFPS(int fps) {
    performance_.targetFPS = fps;
}

bool ProductionConfig::validateConfiguration() const {
    bool valid = true;

    // Validation mémoire
    if (memory_.maxCacheSize < 64 * 1024 * 1024) { // Min 64MB
        PROD_LOG("ERROR", "Cache size too small: " + std::to_string(memory_.maxCacheSize));
        valid = false;
    }

    if (memory_.cleanupThreshold > memory_.maxCacheSize) {
        PROD_LOG("ERROR", "Cleanup threshold cannot be larger than cache size");
        valid = false;
    }

    // Validation performances
    if (performance_.targetFPS <= 0 || performance_.targetFPS > 240) {
        PROD_LOG("ERROR", "Invalid target FPS: " + std::to_string(performance_.targetFPS));
        valid = false;
    }

    if (performance_.maxProcessingThreads <= 0 || performance_.maxProcessingThreads > 16) {
        PROD_LOG("ERROR", "Invalid max processing threads: " + std::to_string(performance_.maxProcessingThreads));
        valid = false;
    }

    // Validation GPU
    if (gpu_.maxTextureSize <= 0 || gpu_.maxTextureSize > 16384) {
        PROD_LOG("ERROR", "Invalid max texture size: " + std::to_string(gpu_.maxTextureSize));
        valid = false;
    }

    return valid;
}

std::string ProductionConfig::getConfigurationReport() const {
    std::stringstream ss;

    ss << "=== Configuration Rapport ===\n";
    ss << "Mode Production: " << (general_.enableProductionMode ? "✅" : "❌") << "\n";
    ss << "Logging: " << (general_.enableLogging ? "✅" : "❌") << "\n";
    ss << "Profiling: " << (general_.enableProfiling ? "✅" : "❌") << "\n";
    ss << "Cache: " << (general_.enableCache ? "✅" : "❌") << "\n";
    ss << "OpenGL: " << (general_.enableOpenGL ? "✅" : "❌") << "\n";
    ss << "Log Level: " << general_.logLevel << "\n\n";

    ss << "=== Configuration Mémoire ===\n";
    ss << "Cache Max: " << (memory_.maxCacheSize / 1024 / 1024) << " MB\n";
    ss << "Seuil Nettoyage: " << (memory_.cleanupThreshold / 1024 / 1024) << " MB\n";
    ss << "Pool Min: " << memory_.minFramePoolSize << "\n";
    ss << "Pool Max: " << memory_.maxFramePoolSize << "\n";
    ss << "Tracking Mémoire: " << (memory_.enableMemoryTracking ? "✅" : "❌") << "\n";
    ss << "Optimisation Pool: " << (memory_.enablePoolOptimization ? "✅" : "❌") << "\n\n";

    ss << "=== Configuration GPU ===\n";
    ss << "Préférer OpenGL: " << (gpu_.preferOpenGL ? "✅" : "❌") << "\n";
    ss << "Cache Shaders: " << (gpu_.enableShaderCache ? "✅" : "❌") << "\n";
    ss << "Compression Textures: " << (gpu_.enableTextureCompression ? "✅" : "❌") << "\n";
    ss << "Taille Texture Max: " << gpu_.maxTextureSize << "\n";
    ss << "Format Pixel: " << gpu_.preferredPixelFormat << "\n\n";

    ss << "=== Configuration Performances ===\n";
    ss << "FPS Cible: " << performance_.targetFPS << "\n";
    ss << "Threads Max: " << performance_.maxProcessingThreads << "\n";
    ss << "Thread Pooling: " << (performance_.enableThreadPooling ? "✅" : "❌") << "\n";
    ss << "Optimisation SIMD: " << (performance_.enableSIMDOptimization ? "✅" : "❌") << "\n";
    ss << "Prédiction: " << (performance_.enablePrediction ? "✅" : "❌") << "\n";
    ss << "Historique Prédiction: " << performance_.predictionHistorySize << "\n\n";

    ss << "=== Configuration Filtres ===\n";
    ss << "Cache Filtres: " << (filter_.enableFilterCaching ? "✅" : "❌") << "\n";
    ss << "Filtres Max: " << filter_.maxCachedFilters << "\n";
    ss << "Préchargement: " << (filter_.preloadCommonFilters ? "✅" : "❌") << "\n";
    ss << "Filtres par défaut: " << filter_.filterDefaults.size() << "\n";

    return ss.str();
}

} // namespace Camera
