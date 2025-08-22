#pragma once

// Configuration spécifique pour les tests de stress mobiles
// Ce fichier permet de forcer la configuration mobile même sur desktop pour les tests

// Décommenter la ligne suivante pour forcer la configuration mobile sur desktop
// #define FORCE_MOBILE_CONFIG

// Détection automatique de la plateforme mobile
#if defined(__ANDROID__) || defined(__IPHONE_OS_VERSION_MIN_REQUIRED) || defined(FORCE_MOBILE_CONFIG)
    #define MOBILE_PLATFORM
    
    // Configuration mobile optimisée
    namespace MobileConfig {
        // Tailles de buffers réduites pour mobile
        constexpr size_t MOBILE_MEGA_BUFFER_SIZE = 64 * 1024;      // 64K échantillons (256KB)
        constexpr size_t MOBILE_ULTRA_BUFFER_SIZE = 256 * 1024;    // 256K échantillons (1MB)
        
        // Itérations réduites pour économiser la batterie
        constexpr size_t MOBILE_MAX_ITERATIONS = 1000;             // 10x moins d'itérations
        constexpr size_t MOBILE_MEMORY_SIZE = 10 * 1024 * 1024;    // 10MB au lieu de 100MB
        
        // Instances réduites pour éviter les OOM
        constexpr size_t MOBILE_MAX_EQUALIZERS = 100;              // 10x moins d'instances
        constexpr size_t MOBILE_MAX_CASCADE_FILTERS = 20;          // 5x moins de filtres
        
        // Tests spécifiques mobiles
        constexpr size_t MOBILE_PRESET_ITERATIONS = 1000;
        constexpr size_t MOBILE_VALIDATION_ITERATIONS = 1000;
        constexpr size_t MOBILE_BUFFER_ITERATIONS = 1000;
        constexpr size_t MOBILE_REGRESSION_ITERATIONS = 1000;
        
        // Configuration audio mobile
        constexpr size_t MOBILE_BANDS = 5;                         // Moins de bandes EQ
        constexpr float MOBILE_MAX_GAIN = 6.0f;                    // Gains plus modérés
        constexpr size_t MOBILE_PROCESSING_BUFFER = 512;           // Buffer de traitement mobile
        constexpr size_t MOBILE_ECO_BUFFER = 256;                  // Buffer économie d'énergie
        
        // Paramètres de performance mobile
        constexpr size_t MOBILE_THREAD_COUNT = 2;                  // Moins de threads
        constexpr size_t MOBILE_BURST_SIZE = 10;                   // Taille des bursts
        constexpr size_t MOBILE_BURST_COUNT = 100;                 // Nombre de bursts
        constexpr size_t MOBILE_PAUSE_MICROSECONDS = 50;           // Pause entre bursts
        
        // Limites de mémoire mobile
        constexpr size_t MOBILE_MAX_INSTANCES = 10;                // Instances max simultanées
        constexpr size_t MOBILE_MEMORY_CYCLES = 50;                // Cycles de création/destruction
        
        // Seuils de détection mobile
        constexpr float MOBILE_SIGNAL_THRESHOLD = 1e-6f;           // Seuil de détection signal
        constexpr float MOBILE_AMPLITUDE_REDUCTION = 0.5f;         // Réduction amplitude
        constexpr float MOBILE_ECO_AMPLITUDE = 0.1f;               // Amplitude mode éco
        
        // Informations de debug mobile
        constexpr bool MOBILE_VERBOSE_OUTPUT = false;              // Sortie détaillée
        constexpr size_t MOBILE_PROGRESS_INTERVAL = 10;            // Intervalle de progression
    }
    
#else
    // Configuration desktop complète
    namespace MobileConfig {
        // Utiliser les valeurs desktop originales
        constexpr size_t MOBILE_MEGA_BUFFER_SIZE = 1024 * 1024;
        constexpr size_t MOBILE_ULTRA_BUFFER_SIZE = 10 * 1024 * 1024;
        constexpr size_t MOBILE_MAX_ITERATIONS = 10000;
        constexpr size_t MOBILE_MEMORY_SIZE = 100 * 1024 * 1024;
        constexpr size_t MOBILE_MAX_EQUALIZERS = 1000;
        constexpr size_t MOBILE_MAX_CASCADE_FILTERS = 100;
        constexpr size_t MOBILE_PRESET_ITERATIONS = 10000;
        constexpr size_t MOBILE_VALIDATION_ITERATIONS = 10000;
        constexpr size_t MOBILE_BUFFER_ITERATIONS = 10000;
        constexpr size_t MOBILE_REGRESSION_ITERATIONS = 10000;
        constexpr size_t MOBILE_BANDS = 10;
        constexpr float MOBILE_MAX_GAIN = 24.0f;
        constexpr size_t MOBILE_PROCESSING_BUFFER = 1024;
        constexpr size_t MOBILE_ECO_BUFFER = 512;
        constexpr size_t MOBILE_THREAD_COUNT = 4;
        constexpr size_t MOBILE_BURST_SIZE = 100;
        constexpr size_t MOBILE_BURST_COUNT = 1000;
        constexpr size_t MOBILE_PAUSE_MICROSECONDS = 10;
        constexpr size_t MOBILE_MAX_INSTANCES = 100;
        constexpr size_t MOBILE_MEMORY_CYCLES = 500;
        constexpr float MOBILE_SIGNAL_THRESHOLD = 1e-10f;
        constexpr float MOBILE_AMPLITUDE_REDUCTION = 1.0f;
        constexpr float MOBILE_ECO_AMPLITUDE = 0.5f;
        constexpr bool MOBILE_VERBOSE_OUTPUT = true;
        constexpr size_t MOBILE_PROGRESS_INTERVAL = 100;
    }
#endif

// Macros utilitaires pour les tests
#ifdef MOBILE_PLATFORM
    #define MOBILE_ONLY(code) do { code } while(0)
    #define DESKTOP_ONLY(code) do { } while(0)
    #define MOBILE_LOG(msg) std::cout << "📱 " << msg << std::endl
#else
    #define MOBILE_ONLY(code) do { } while(0)
    #define DESKTOP_ONLY(code) do { code } while(0)
    #define MOBILE_LOG(msg) std::cout << "🖥️ " << msg << std::endl
#endif

// Fonction utilitaire pour détecter la plateforme
inline const char* getPlatformName() {
    #ifdef MOBILE_PLATFORM
        return "Mobile";
    #else
        return "Desktop";
    #endif
}

// Fonction pour afficher la configuration active
inline void printActiveConfiguration() {
    std::cout << "🔧 Configuration active: " << getPlatformName() << std::endl;
    std::cout << "   • Buffer MEGA: " << MobileConfig::MOBILE_MEGA_BUFFER_SIZE << " échantillons" << std::endl;
    std::cout << "   • Buffer ULTRA: " << MobileConfig::MOBILE_ULTRA_BUFFER_SIZE << " échantillons" << std::endl;
    std::cout << "   • Itérations max: " << MobileConfig::MOBILE_MAX_ITERATIONS << std::endl;
    std::cout << "   • Égaliseurs max: " << MobileConfig::MOBILE_MAX_EQUALIZERS << std::endl;
    std::cout << "   • Bandes EQ: " << MobileConfig::MOBILE_BANDS << std::endl;
    std::cout << "   • Gain max: " << MobileConfig::MOBILE_MAX_GAIN << "dB" << std::endl;
}
