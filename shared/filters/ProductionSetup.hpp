#pragma once

#include "ProductionConfig.hpp"
#include "FilterManager.hpp"
#include "MemoryManager.hpp"
#include "SmartCache.hpp"

namespace Camera {

/**
 * Classe utilitaire pour configurer le système de filtres en production
 */
class ProductionSetup {
public:
    // Configuration rapide pour production
    static bool configureForProduction(FilterManager& filterManager);

    // Configuration pour différents types d'appareils
    static bool configureForLowEndDevice(FilterManager& filterManager);
    static bool configureForMidRangeDevice(FilterManager& filterManager);
    static bool configureForHighEndDevice(FilterManager& filterManager);

    // Configuration personnalisée par plateforme
    static bool configureForAndroid(FilterManager& filterManager);
    static bool configureForIOS(FilterManager& filterManager);

    // Optimisations spécifiques
    static void optimizeMemoryUsage(FilterManager& filterManager);
    static void optimizePerformance(FilterManager& filterManager);
    static void optimizeBatteryLife(FilterManager& filterManager);

    // Validation et monitoring
    static bool validateProductionSetup(const FilterManager& filterManager);
    static std::string getSetupReport(const FilterManager& filterManager);

private:
    // Détection automatique des capacités
    static DeviceCapabilities detectDeviceCapabilities();
    static void applyDeviceSpecificOptimizations(FilterManager& filterManager, 
                                                const DeviceCapabilities& caps);

    struct DeviceCapabilities {
        size_t totalMemoryMB{0};
        int cpuCores{0};
        bool hasGPU{false};
        std::string gpuVendor;
        bool supportsOpenGLES3{false};
        int screenWidth{0};
        int screenHeight{0};
        bool isLowPowerMode{false};
    };
};

/**
 * Configuration automatique basée sur les performances système
 */
class AutoProductionConfig {
public:
    AutoProductionConfig();
    ~AutoProductionConfig();

    // Configuration automatique
    bool autoConfigureSystem();
    
    // Benchmarking automatique
    bool runPerformanceBenchmark();
    
    // Ajustement dynamique
    void enableDynamicAdjustment(bool enable);
    void adjustForCurrentLoad();

    // Statistiques
    struct SystemMetrics {
        double averageFPS{0.0};
        size_t memoryUsageMB{0};
        double cpuUsagePercent{0.0};
        double gpuUsagePercent{0.0};
        double batteryDrainRate{0.0};
        int thermalState{0}; // 0=normal, 1=warm, 2=hot
    };

    SystemMetrics getCurrentMetrics() const;
    bool isSystemUnderStress() const;

private:
    bool dynamicAdjustmentEnabled_{false};
    SystemMetrics lastMetrics_;
    std::chrono::steady_clock::time_point lastAdjustment_;

    void adjustCacheSize();
    void adjustThreadCount();
    void adjustQuality();
};

} // namespace Camera

// Macros pour configuration rapide en production
#define SETUP_PRODUCTION_FILTERS() \
    do { \
        auto& filterManager = Camera::FilterManager::getInstance(); \
        Camera::ProductionSetup::configureForProduction(filterManager); \
    } while(0)

#define SETUP_LOW_END_DEVICE() \
    do { \
        auto& filterManager = Camera::FilterManager::getInstance(); \
        Camera::ProductionSetup::configureForLowEndDevice(filterManager); \
    } while(0)

#define SETUP_HIGH_END_DEVICE() \
    do { \
        auto& filterManager = Camera::FilterManager::getInstance(); \
        Camera::ProductionSetup::configureForHighEndDevice(filterManager); \
    } while(0)
