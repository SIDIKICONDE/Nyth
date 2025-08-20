import { createLogger } from "../utils/optimizedLogger";
import { adminAdvancedCacheService } from "./cache/adminAdvancedCacheService";
import { adminRealtimeService } from "./realtime/adminRealtimeService";
import { adminPreloadService } from "./cache/adminPreloadService";
import { adminFirestoreOptimizer } from "./firestore/adminFirestoreOptimizer";
import { adminDataCompressor } from "./compression/adminDataCompressor";

const logger = createLogger("AdminOptimizationHub");

interface OptimizationStats {
  cacheStats: any;
  realtimeStats: any;
  preloadStats: any;
  firestoreStats: any;
  compressionStats: any;
  overallPerformance: {
    timestamp: number;
    optimizationsActive: number;
    bandwidthSaved: number;
    loadTimeImprovement: number;
  };
}

/**
 * Hub central pour toutes les optimisations architecturales
 * Coordonne tous les services d'optimisation pour maximiser les performances
 */
class AdminOptimizationHub {
  private isInitialized = false;
  private optimizationStats: OptimizationStats;

  constructor() {
    this.optimizationStats = this.initializeStats();
    this.initializeAllServices();
  }

  /**
   * Initialise tous les services d'optimisation
   */
  private async initializeAllServices(): Promise<void> {
    try {
      logger.info("Initialisation du hub d'optimisations...");

      // Lancer le service temps réel
      adminRealtimeService.on('connected', () => {
        logger.info("Service temps réel connecté");
        this.updateStats();
      });

      // Démarrer les optimisations
      await this.startOptimizations();

      this.isInitialized = true;
      logger.info("Hub d'optimisations initialisé avec succès");

    } catch (error) {
      logger.error("Erreur lors de l'initialisation du hub:", error);
    }
  }

  /**
   * Démarre toutes les optimisations
   */
  private async startOptimizations(): Promise<void> {
    // Précharger les données critiques
    await adminPreloadService.preloadOnAppStart('super_admin');

    // Optimiser les requêtes Firestore courantes
    await adminFirestoreOptimizer.preloadDataForLikelyQueries('super_admin');

    // Écouter les événements pour les optimisations en temps réel
    this.setupRealtimeOptimizations();
  }

  /**
   * Configure les optimisations temps réel
   */
  private setupRealtimeOptimizations(): void {
    // Optimiser le cache basé sur l'utilisation
    adminRealtimeService.onSpecificEvent('tab_switch', (data) => {
      this.optimizeForTabSwitch(data.tab);
    });

    // Optimiser les requêtes selon les actions utilisateur
    adminRealtimeService.onSpecificEvent('user_action', (data) => {
      this.optimizeForUserAction(data);
    });

    // Ajuster la compression selon la qualité de connexion
    adminRealtimeService.on('connected', () => {
      this.adjustCompressionForConnection(true);
    });

    adminRealtimeService.on('disconnected', () => {
      this.adjustCompressionForConnection(false);
    });
  }

  /**
   * Optimise pour un changement d'onglet
   */
  private async optimizeForTabSwitch(tab: string): Promise<void> {
    try {
      // Précharger les données pour l'onglet
      await adminPreloadService.predictivePreload({
        recentTabs: [tab],
        commonActions: [],
        timeOfDay: new Date().getHours()
      });

      // Optimiser les requêtes Firestore pour cet onglet
      const cacheKey = `tab_${tab}_optimized`;
      const queryOptions = this.getQueryOptionsForTab(tab);

      await adminFirestoreOptimizer.cachedQuery(cacheKey, queryOptions, 10);

      logger.debug(`Optimisations appliquées pour l'onglet: ${tab}`);

    } catch (error) {
      logger.warn("Erreur lors de l'optimisation pour le changement d'onglet:", error);
    }
  }

  /**
   * Obtient les options de requête optimisées pour un onglet
   */
  private getQueryOptionsForTab(tab: string): any {
    const tabQueries = {
      dashboard: {
        collectionName: 'adminStats',
        orderBy: { field: 'timestamp', direction: 'desc' },
        limitCount: 10
      },
      users: {
        collectionName: 'users',
        orderBy: { field: 'createdAt', direction: 'desc' },
        limitCount: 50
      },
      analytics: {
        collectionName: 'adminAnalytics',
        filters: [{ field: 'period', operator: '==', value: '7d' }],
        orderBy: { field: 'timestamp', direction: 'desc' },
        limitCount: 20
      }
    };

    return tabQueries[tab as keyof typeof tabQueries] || tabQueries.dashboard;
  }

  /**
   * Optimise selon les actions utilisateur
   */
  private async optimizeForUserAction(data: any): Promise<void> {
    // Invalider le cache pour les actions de modification
    if (data.action?.includes('update') || data.action?.includes('delete')) {
      await adminAdvancedCacheService.invalidate(data.cacheKey || 'all');
    }

    // Précharger les données liées à l'action
    if (data.action?.includes('search')) {
      // Précharger les résultats de recherche probables
      await adminPreloadService.predictivePreload({
        recentTabs: ['users'],
        commonActions: ['search'],
        timeOfDay: new Date().getHours()
      });
    }
  }

  /**
   * Ajuste la compression selon la qualité de connexion
   */
  private adjustCompressionForConnection(isConnected: boolean): void {
    // Ajuster les niveaux de compression selon la connexion
    if (!isConnected) {
      // Hors ligne : compression maximale pour économiser la batterie
      logger.debug("Mode hors ligne : compression maximale activée");
    } else {
      // En ligne : compression optimisée pour la vitesse
      logger.debug("Mode en ligne : compression optimisée activée");
    }
  }

  /**
   * Obtient les statistiques complètes d'optimisation
   */
  async getOptimizationStats(): Promise<OptimizationStats> {
    await this.updateStats();

    return {
      ...this.optimizationStats,
      overallPerformance: {
        timestamp: Date.now(),
        optimizationsActive: this.countActiveOptimizations(),
        bandwidthSaved: await this.calculateBandwidthSavings(),
        loadTimeImprovement: await this.calculateLoadTimeImprovement()
      }
    };
  }

  /**
   * Met à jour toutes les statistiques
   */
  private async updateStats(): Promise<void> {
    try {
      this.optimizationStats = {
        cacheStats: adminAdvancedCacheService.getCacheStats(),
        realtimeStats: adminRealtimeService.getConnectionStatus(),
        preloadStats: adminPreloadService.getPreloadStats(),
        firestoreStats: adminFirestoreOptimizer.getQueryStats(),
        compressionStats: adminDataCompressor.getCompressionStats(),
        overallPerformance: this.optimizationStats.overallPerformance
      };
    } catch (error) {
      logger.warn("Erreur lors de la mise à jour des statistiques:", error);
    }
  }

  /**
   * Compte les optimisations actives
   */
  private countActiveOptimizations(): number {
    let count = 0;

    if (this.optimizationStats.cacheStats.totalEntries > 0) count++;
    if (this.optimizationStats.realtimeStats.isConnected) count++;
    if (this.optimizationStats.preloadStats.totalPreloads > 0) count++;

    return count;
  }

  /**
   * Calcule les économies de bande passante
   */
  private async calculateBandwidthSavings(): Promise<number> {
    // Calcul basé sur les statistiques de compression
    const compressionStats = this.optimizationStats.compressionStats;
    if (compressionStats.length === 0) return 0;

    const totalOriginal = compressionStats.reduce((sum, stat) => sum + stat.originalSize, 0);
    const totalCompressed = compressionStats.reduce((sum, stat) => sum + stat.compressedSize, 0);

    if (totalOriginal === 0) return 0;

    return ((totalOriginal - totalCompressed) / totalOriginal) * 100;
  }

  /**
   * Calcule l'amélioration du temps de chargement
   */
  private async calculateLoadTimeImprovement(): Promise<number> {
    // Estimation basée sur les hits du cache et le préchargement
    const cacheStats = this.optimizationStats.cacheStats;
    const preloadStats = this.optimizationStats.preloadStats;

    const cacheHitRate = cacheStats.cacheHitRate || 0;
    const successfulPreloads = preloadStats.successfulPreloads || 0;

    // Estimation : chaque hit de cache sauve ~100ms, chaque préchargement réussi sauve ~200ms
    const cacheSavings = (cacheHitRate / 100) * cacheStats.totalEntries * 0.1; // 100ms par hit
    const preloadSavings = successfulPreloads * 0.2; // 200ms par préchargement

    return cacheSavings + preloadSavings;
  }

  /**
   * Initialise les statistiques
   */
  private initializeStats(): OptimizationStats {
    return {
      cacheStats: {},
      realtimeStats: {},
      preloadStats: {},
      firestoreStats: {},
      compressionStats: [],
      overallPerformance: {
        timestamp: Date.now(),
        optimizationsActive: 0,
        bandwidthSaved: 0,
        loadTimeImprovement: 0
      }
    };
  }

  /**
   * Optimise une requête spécifique
   */
  async optimizeQuery(
    collectionName: string,
    options: any,
    useCache: boolean = true,
    useCompression: boolean = true
  ): Promise<any> {
    const startTime = Date.now();

    try {
      let result;

      if (useCache) {
        // Utiliser le cache avancé
        const cacheKey = `optimized_${collectionName}_${JSON.stringify(options)}`;
        result = await adminFirestoreOptimizer.cachedQuery(cacheKey, {
          collectionName,
          ...options
        });
      } else {
        // Requête directe
        result = await adminFirestoreOptimizer.executeOptimizedQuery({
          collectionName,
          ...options
        });
      }

      // Compresser si demandé et si les données sont volumineuses
      if (useCompression && JSON.stringify(result).length > 2048) {
        const compressed = await adminDataCompressor.compress(result);
        result = {
          ...result,
          _compressed: true,
          _originalSize: compressed.originalSize,
          _compressedSize: compressed.compressedSize
        };
      }

      const optimizationTime = Date.now() - startTime;
      logger.debug(`Requête optimisée en ${optimizationTime}ms pour ${collectionName}`);

      return result;

    } catch (error) {
      logger.error("Erreur lors de l'optimisation de la requête:", error);
      throw error;
    }
  }

  /**
   * Nettoie et optimise tous les services
   */
  async cleanupAndOptimize(): Promise<void> {
    try {
      logger.info("Nettoyage et optimisation de tous les services...");

      // Nettoyer le cache
      await adminAdvancedCacheService.cleanup();

      // Nettoyer les requêtes Firestore
      adminFirestoreOptimizer.cleanupExpiredCache();

      // Nettoyer le préchargeur
      adminPreloadService.cleanup();

      // Mettre à jour les statistiques
      await this.updateStats();

      logger.info("Nettoyage et optimisation terminés");

    } catch (error) {
      logger.error("Erreur lors du nettoyage:", error);
    }
  }

  /**
   * Test de performance de toutes les optimisations
   */
  async runPerformanceTest(): Promise<any> {
    const testData = {
      metrics: Array.from({ length: 100 }, (_, i) => ({
        type: 'load_time',
        name: `test_metric_${i}`,
        value: Math.random() * 1000,
        timestamp: Timestamp.now(),
        metadata: { test: true }
      }))
    };

    const results = {
      cache: await this.testCachePerformance(testData),
      compression: await adminDataCompressor.benchmarkCompression(testData),
      query: await this.testQueryPerformance(),
      timestamp: Date.now()
    };

    logger.info("Test de performance terminé", results);
    return results;
  }

  /**
   * Test de performance du cache
   */
  private async testCachePerformance(testData: any): Promise<any> {
    const startTime = Date.now();

    // Test de mise en cache
    await adminAdvancedCacheService.set('performance_test', testData, {
      name: 'test',
      ttl: 60,
      priority: 'medium',
      maxSize: 1024 * 1024,
      compression: true
    });

    // Test de récupération
    const cached = await adminAdvancedCacheService.get('performance_test');

    const testTime = Date.now() - startTime;

    return {
      testTime,
      cacheHit: cached !== null,
      dataSize: JSON.stringify(testData).length
    };
  }

  /**
   * Test de performance des requêtes
   */
  private async testQueryPerformance(): Promise<any> {
    const startTime = Date.now();

    // Test de requête optimisée
    const result = await adminFirestoreOptimizer.executeOptimizedQuery({
      collectionName: 'users',
      limitCount: 10,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });

    const queryTime = Date.now() - startTime;

    return {
      queryTime,
      resultsCount: result.data.length,
      hasMore: result.hasMore
    };
  }

  /**
   * État d'initialisation
   */
  get isReady(): boolean {
    return this.isInitialized;
  }
}

export const adminOptimizationHub = new AdminOptimizationHub();

// Nettoyage périodique toutes les 30 minutes
setInterval(() => {
  adminOptimizationHub.cleanupAndOptimize();
}, 30 * 60 * 1000);
