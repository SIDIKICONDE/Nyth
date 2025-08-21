/**
 * Exemple d'utilisation du système de filtres en production
 * Configuration optimisée pour les performances mobiles
 */

import { NativeModules } from 'react-native';

const { NativeCameraFiltersModule } = NativeModules;

/**
 * Configuration de production pour les filtres
 */
export class ProductionFilters {
  constructor() {
    this.isInitialized = false;
    this.currentConfig = null;
  }

  /**
   * Initialisation optimisée pour production
   */
  async initializeForProduction() {
    try {
      // Configuration de base pour production
      const config = {
        productionMode: true,
        enableLogging: false,
        enableProfiling: false,
        cacheSize: 512 * 1024 * 1024, // 512MB
        targetFPS: 60,
        maxThreads: 4,
        enableOpenGL: true,
        enableCache: true,
        enablePrediction: true
      };

      // Appliquer la configuration native
      await NativeCameraFiltersModule.setProductionConfig(config);

      // Détecter les capacités de l'appareil
      const deviceInfo = await this.detectDeviceCapabilities();
      
      // Ajuster la configuration selon l'appareil
      const optimizedConfig = this.optimizeForDevice(config, deviceInfo);
      await NativeCameraFiltersModule.setProductionConfig(optimizedConfig);

      this.currentConfig = optimizedConfig;
      this.isInitialized = true;

      console.log('[ProductionFilters] Initialisé avec succès');
      return true;
    } catch (error) {
      console.error('[ProductionFilters] Erreur initialisation:', error);
      return false;
    }
  }

  /**
   * Détection automatique des capacités de l'appareil
   */
  async detectDeviceCapabilities() {
    try {
      // Obtenir les informations système
      const systemInfo = await NativeCameraFiltersModule.getSystemInfo();
      
      return {
        totalMemoryMB: systemInfo.totalMemory || 4096,
        cpuCores: systemInfo.cpuCores || 4,
        hasGPU: systemInfo.hasGPU || true,
        supportsOpenGLES3: systemInfo.supportsOpenGLES3 || true,
        screenWidth: systemInfo.screenWidth || 1080,
        screenHeight: systemInfo.screenHeight || 1920,
        isLowPowerMode: systemInfo.isLowPowerMode || false
      };
    } catch (error) {
      console.warn('[ProductionFilters] Détection capacités échouée, utilisation valeurs par défaut');
      return {
        totalMemoryMB: 4096,
        cpuCores: 4,
        hasGPU: true,
        supportsOpenGLES3: true,
        screenWidth: 1080,
        screenHeight: 1920,
        isLowPowerMode: false
      };
    }
  }

  /**
   * Optimisation selon le type d'appareil
   */
  optimizeForDevice(baseConfig, deviceInfo) {
    const config = { ...baseConfig };

    // Appareil bas de gamme
    if (deviceInfo.totalMemoryMB < 3000 || deviceInfo.cpuCores < 4) {
      config.cacheSize = 128 * 1024 * 1024; // 128MB
      config.targetFPS = 30;
      config.maxThreads = 2;
      config.enablePrediction = false;
      console.log('[ProductionFilters] Configuration bas de gamme appliquée');
    }
    // Appareil haut de gamme
    else if (deviceInfo.totalMemoryMB > 8000 && deviceInfo.cpuCores >= 8) {
      config.cacheSize = 1024 * 1024 * 1024; // 1GB
      config.targetFPS = 120;
      config.maxThreads = 8;
      config.enablePrediction = true;
      console.log('[ProductionFilters] Configuration haut de gamme appliquée');
    }

    // Mode économie d'énergie
    if (deviceInfo.isLowPowerMode) {
      config.targetFPS = Math.min(config.targetFPS, 30);
      config.maxThreads = Math.min(config.maxThreads, 2);
      config.enableOpenGL = false; // Utiliser CPU uniquement
      console.log('[ProductionFilters] Mode économie d\'énergie activé');
    }

    return config;
  }

  /**
   * Application optimisée d'un filtre
   */
  async applyFilter(filterType, intensity = 0.8) {
    if (!this.isInitialized) {
      console.warn('[ProductionFilters] Non initialisé, initialisation automatique...');
      await this.initializeForProduction();
    }

    try {
      const startTime = performance.now();
      
      // Appliquer le filtre avec optimisations
      const result = await NativeCameraFiltersModule.applyFilter({
        type: filterType,
        intensity: intensity,
        useCache: true,
        useGPU: this.currentConfig.enableOpenGL
      });

      const processingTime = performance.now() - startTime;
      
      // Monitoring des performances
      if (processingTime > 33) { // > 30 FPS
        console.warn(`[ProductionFilters] Filtre lent: ${filterType} (${processingTime.toFixed(2)}ms)`);
        this.adjustPerformance();
      }

      return result;
    } catch (error) {
      console.error(`[ProductionFilters] Erreur application filtre ${filterType}:`, error);
      throw error;
    }
  }

  /**
   * Ajustement automatique des performances
   */
  async adjustPerformance() {
    if (!this.currentConfig) return;

    // Réduire la qualité si nécessaire
    if (this.currentConfig.targetFPS > 30) {
      this.currentConfig.targetFPS = 30;
      await NativeCameraFiltersModule.setTargetFPS(30);
      console.log('[ProductionFilters] FPS réduit à 30 pour maintenir les performances');
    }

    // Réduire le cache si mémoire insuffisante
    const memoryStats = await NativeCameraFiltersModule.getMemoryStats();
    if (memoryStats.currentUsage > this.currentConfig.cacheSize * 0.9) {
      this.currentConfig.cacheSize *= 0.8;
      await NativeCameraFiltersModule.setCacheSize(this.currentConfig.cacheSize);
      console.log('[ProductionFilters] Cache réduit pour économiser la mémoire');
    }
  }

  /**
   * Préchargement des filtres populaires
   */
  async preloadCommonFilters() {
    const commonFilters = ['sepia', 'vintage', 'cool', 'warm'];
    
    try {
      await NativeCameraFiltersModule.preloadFilters(commonFilters);
      console.log('[ProductionFilters] Filtres populaires préchargés');
    } catch (error) {
      console.warn('[ProductionFilters] Erreur préchargement:', error);
    }
  }

  /**
   * Nettoyage et optimisation
   */
  async cleanup() {
    try {
      await NativeCameraFiltersModule.cleanup();
      console.log('[ProductionFilters] Nettoyage effectué');
    } catch (error) {
      console.warn('[ProductionFilters] Erreur nettoyage:', error);
    }
  }

  /**
   * Obtenir les statistiques de performance
   */
  async getPerformanceStats() {
    try {
      const stats = await NativeCameraFiltersModule.getPerformanceStats();
      return {
        averageFPS: stats.averageFPS || 0,
        memoryUsage: stats.memoryUsage || 0,
        cacheHitRate: stats.cacheHitRate || 0,
        processingTime: stats.averageProcessingTime || 0
      };
    } catch (error) {
      console.warn('[ProductionFilters] Erreur récupération stats:', error);
      return null;
    }
  }
}

/**
 * Instance singleton pour utilisation globale
 */
export const productionFilters = new ProductionFilters();

/**
 * Hook React pour utilisation dans les composants
 */
export const useProductionFilters = () => {
  const [isReady, setIsReady] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const init = async () => {
      const success = await productionFilters.initializeForProduction();
      if (success) {
        await productionFilters.preloadCommonFilters();
        setIsReady(true);
      }
    };

    init();

    // Monitoring périodique
    const interval = setInterval(async () => {
      const currentStats = await productionFilters.getPerformanceStats();
      setStats(currentStats);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    isReady,
    stats,
    applyFilter: productionFilters.applyFilter.bind(productionFilters),
    cleanup: productionFilters.cleanup.bind(productionFilters)
  };
};

/**
 * Exemple d'utilisation dans un composant
 */
export const FilterExample = () => {
  const { isReady, stats, applyFilter } = useProductionFilters();

  const handleApplySepia = async () => {
    if (isReady) {
      try {
        await applyFilter('sepia', 0.8);
        console.log('Filtre sépia appliqué');
      } catch (error) {
        console.error('Erreur application filtre:', error);
      }
    }
  };

  return (
    <View>
      <Text>Filtres: {isReady ? 'Prêt' : 'Initialisation...'}</Text>
      {stats && (
        <Text>
          FPS: {stats.averageFPS.toFixed(1)} | 
          Mémoire: {(stats.memoryUsage / 1024 / 1024).toFixed(0)}MB |
          Cache: {(stats.cacheHitRate * 100).toFixed(1)}%
        </Text>
      )}
      <Button 
        title="Appliquer Sépia" 
        onPress={handleApplySepia} 
        disabled={!isReady} 
      />
    </View>
  );
};
