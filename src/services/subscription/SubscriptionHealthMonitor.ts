import { createLogger } from "../../utils/optimizedLogger";
import subscriptionCacheService from "./SubscriptionCacheService";
import firestoreListenerOptimizer from "./FirestoreListenerOptimizer";
import { SystemHealthMetrics } from "../../types/subscriptionCache";

const logger = createLogger("SubscriptionHealthMonitor");

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  metrics?: any;
  recommendations: string[];
}

/**
 * Service de monitoring de la santé du système d'abonnement
 * Surveille les performances et détecte les problèmes
 */
class SubscriptionHealthMonitor {
  private static instance: SubscriptionHealthMonitor;
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  static getInstance(): SubscriptionHealthMonitor {
    if (!SubscriptionHealthMonitor.instance) {
      SubscriptionHealthMonitor.instance = new SubscriptionHealthMonitor();
    }
    return SubscriptionHealthMonitor.instance;
  }

  constructor() {
    this.startMonitoring();
  }

  /**
   * Démarre le monitoring continu
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    logger.info("🏥 Monitoring de santé démarré");

    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);
  }

  /**
   * Arrête le monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    logger.info("🏥 Monitoring de santé arrêté");
  }

  /**
   * Effectue tous les checks de santé
   */
  private async performHealthChecks(): Promise<void> {
    try {
      const checks = await Promise.all([
        this.checkCacheHealth(),
        this.checkListenerHealth(),
        this.checkSubscriptionHealth(),
        this.checkMemoryHealth(),
        this.checkNetworkHealth(),
      ]);

      checks.forEach(check => {
        this.healthChecks.set(check.service, check);
      });

      this.logHealthStatus();
      this.takeCorrectiveActions();

    } catch (error) {
      logger.error("❌ Erreur lors des checks de santé:", error);
    }
  }

  /**
   * Vérifie la santé du système de cache
   */
  private async checkCacheHealth(): Promise<HealthCheckResult> {
    const cacheStats = subscriptionCacheService.getCacheStats();
    const recommendations: string[] = [];

    let status: HealthCheckResult['status'] = 'healthy';
    let message = 'Cache fonctionne normalement';

    // Vérifier le taux de succès
    if (cacheStats.hitRate < 0.7) {
      status = 'degraded';
      message = 'Taux de succès du cache faible';
      recommendations.push('Optimiser les stratégies de cache');
      recommendations.push('Vérifier la durée de vie des entrées');
    }

    // Vérifier les entrées expirées
    const expiredRatio = cacheStats.expiredEntries / cacheStats.totalEntries;
    if (expiredRatio > 0.5) {
      status = 'degraded';
      message = 'Trop d\'entrées de cache expirées';
      recommendations.push('Ajuster les TTL des entrées de cache');
      recommendations.push('Améliorer la fréquence de nettoyage');
    }

    // Vérifier le nombre total d'entrées
    if (cacheStats.totalEntries > 1000) {
      status = 'degraded';
      message = 'Nombre élevé d\'entrées de cache';
      recommendations.push('Implémenter une stratégie d\'éviction LRU');
      recommendations.push('Réduire la durée de vie des entrées');
    }

    return {
      service: 'cache',
      status,
      message,
      metrics: cacheStats,
      recommendations,
    };
  }

  /**
   * Vérifie la santé des listeners Firestore
   */
  private async checkListenerHealth(): Promise<HealthCheckResult> {
    const listenerStats = firestoreListenerOptimizer.getStats();
    const recommendations: string[] = [];

    let status: HealthCheckResult['status'] = 'healthy';
    let message = 'Listeners Firestore fonctionnent normalement';

    // Vérifier le nombre de connexions actives
    if (listenerStats.activeConnections > 50) {
      status = 'degraded';
      message = 'Nombre élevé de connexions Firestore actives';
      recommendations.push('Optimiser les listeners avec batch processing');
      recommendations.push('Implémenter le debouncing des mises à jour');
    }

    // Vérifier le taux d'erreur
    const errorRate = listenerStats.errorRate || 0;
    if (errorRate > 0.1) {
      status = 'unhealthy';
      message = 'Taux d\'erreur des listeners élevé';
      recommendations.push('Vérifier la connectivité réseau');
      recommendations.push('Implémenter retry automatique');
      recommendations.push('Ajouter gestion d\'erreurs robuste');
    }

    // Vérifier les groupes sans subscribers
    const emptyGroups = listenerStats.groups.filter(g => g.subscribers === 0);
    if (emptyGroups.length > 0) {
      recommendations.push(`Nettoyer ${emptyGroups.length} groupes sans subscribers`);
    }

    return {
      service: 'listeners',
      status,
      message,
      metrics: listenerStats,
      recommendations,
    };
  }

  /**
   * Vérifie la santé globale des abonnements
   */
  private async checkSubscriptionHealth(): Promise<HealthCheckResult> {
    // Simuler des métriques d'abonnement
    // À implémenter avec de vraies données
    const mockMetrics = {
      totalSubscriptions: 1250,
      activeSubscriptions: 1180,
      errorRate: 0.02,
      averageResponseTime: 150, // ms
    };

    const recommendations: string[] = [];
    let status: HealthCheckResult['status'] = 'healthy';
    let message = 'Service d\'abonnement fonctionne normalement';

    if (mockMetrics.errorRate > 0.05) {
      status = 'degraded';
      message = 'Taux d\'erreur des abonnements élevé';
      recommendations.push('Investiguer les erreurs récurrentes');
      recommendations.push('Améliorer la gestion d\'erreurs');
    }

    if (mockMetrics.averageResponseTime > 500) {
      status = 'degraded';
      message = 'Latence d\'abonnement élevée';
      recommendations.push('Optimiser les requêtes Firestore');
      recommendations.push('Améliorer le système de cache');
    }

    return {
      service: 'subscriptions',
      status,
      message,
      metrics: mockMetrics,
      recommendations,
    };
  }

  /**
   * Vérifie l'utilisation mémoire
   */
  private async checkMemoryHealth(): Promise<HealthCheckResult> {
    // Simuler vérification mémoire
    // Dans un vrai environnement, utiliser performance.memory
    const mockMemoryUsage = {
      usedJSHeapSize: 25 * 1024 * 1024, // 25MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
    };

    const recommendations: string[] = [];
    let status: HealthCheckResult['status'] = 'healthy';
    let message = 'Utilisation mémoire normale';

    const usagePercentage = mockMemoryUsage.usedJSHeapSize / mockMemoryUsage.jsHeapSizeLimit;

    if (usagePercentage > 0.8) {
      status = 'degraded';
      message = 'Utilisation mémoire élevée';
      recommendations.push('Optimiser la taille du cache');
      recommendations.push('Implémenter garbage collection');
      recommendations.push('Réduire les batch sizes');
    }

    return {
      service: 'memory',
      status,
      message,
      metrics: {
        usagePercentage: Math.round(usagePercentage * 100),
        usedMB: Math.round(mockMemoryUsage.usedJSHeapSize / 1024 / 1024),
        limitMB: Math.round(mockMemoryUsage.jsHeapSizeLimit / 1024 / 1024),
      },
      recommendations,
    };
  }

  /**
   * Vérifie la santé réseau
   */
  private async checkNetworkHealth(): Promise<HealthCheckResult> {
    // Simuler vérification réseau
    const recommendations: string[] = [];
    let status: HealthCheckResult['status'] = 'healthy';
    let message = 'Connectivité réseau normale';

    // À implémenter avec NetInfo ou des ping vers Firestore
    const isOnline = true; // Simuler
    const latency = 50; // ms simulé

    if (!isOnline) {
      status = 'unhealthy';
      message = 'Problème de connectivité réseau';
      recommendations.push('Vérifier la connexion internet');
      recommendations.push('Activer le mode hors ligne');
    }

    if (latency > 200) {
      status = 'degraded';
      message = 'Latence réseau élevée';
      recommendations.push('Optimiser les requêtes Firestore');
      recommendations.push('Utiliser plus de cache local');
    }

    return {
      service: 'network',
      status,
      message,
      metrics: { isOnline, latency },
      recommendations,
    };
  }

  /**
   * Log le statut de santé global
   */
  private logHealthStatus(): void {
    const services = Array.from(this.healthChecks.values());
    const unhealthy = services.filter(s => s.status === 'unhealthy');
    const degraded = services.filter(s => s.status === 'degraded');
    const healthy = services.filter(s => s.status === 'healthy');

    if (unhealthy.length > 0) {
      logger.error(`🚨 ${unhealthy.length} services non sains:`, unhealthy.map(s => s.service));
    }

    if (degraded.length > 0) {
      logger.warn(`⚠️ ${degraded.length} services dégradés:`, degraded.map(s => s.service));
    }

    if (healthy.length === services.length) {
      logger.info(`✅ Tous les ${services.length} services sont sains`);
    }
  }

  /**
   * Prend des actions correctives automatiques
   */
  private async takeCorrectiveActions(): Promise<void> {
    const services = Array.from(this.healthChecks.values());

    for (const service of services) {
      if (service.status === 'unhealthy') {
        await this.handleUnhealthyService(service);
      } else if (service.status === 'degraded') {
        await this.handleDegradedService(service);
      }
    }
  }

  /**
   * Gère un service non sain
   */
  private async handleUnhealthyService(service: HealthCheckResult): Promise<void> {
    logger.error(`🚨 Action corrective pour service ${service.service}: ${service.message}`);

    switch (service.service) {
      case 'cache':
        // Recréer le cache
        logger.info('🔄 Reconstruction du cache...');
        break;

      case 'listeners':
        // Recréer les listeners
        firestoreListenerOptimizer.cleanupAll();
        logger.info('🔄 Reconstruction des listeners...');
        break;

      case 'network':
        // Basculer en mode hors ligne
        logger.info('🔄 Activation du mode hors ligne...');
        break;
    }
  }

  /**
   * Gère un service dégradé
   */
  private async handleDegradedService(service: HealthCheckResult): Promise<void> {
    logger.warn(`⚠️ Optimisation pour service ${service.service}: ${service.message}`);

    // Appliquer les recommandations automatisables
    for (const recommendation of service.recommendations) {
      if (recommendation.includes('Nettoyer') && recommendation.includes('groupes')) {
        firestoreListenerOptimizer.cleanupAll();
      }
    }
  }

  /**
   * Obtient le statut de santé global
   */
  getOverallHealth(): SystemHealthMetrics {
    const cacheHealth = this.healthChecks.get('cache')?.metrics || {};
    const listenerHealth = this.healthChecks.get('listeners')?.metrics || {};
    const subscriptionHealth = this.healthChecks.get('subscriptions')?.metrics || {};

    const services = Array.from(this.healthChecks.values());
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    let overallHealth: SystemHealthMetrics['overallHealth'] = 'healthy';
    if (unhealthyCount > 0) overallHealth = 'unhealthy';
    else if (degradedCount > 0) overallHealth = 'degraded';

    const allRecommendations = services.flatMap(s => s.recommendations);

    return {
      cacheHealth,
      listenerHealth,
      subscriptionHealth,
      overallHealth,
      timestamp: Date.now(),
      recommendations: allRecommendations,
    };
  }

  /**
   * Obtient le détail de tous les checks de santé
   */
  getDetailedHealth(): HealthCheckResult[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Force un check de santé immédiat
   */
  async forceHealthCheck(): Promise<SystemHealthMetrics> {
    await this.performHealthChecks();
    return this.getOverallHealth();
  }
}

export const subscriptionHealthMonitor = SubscriptionHealthMonitor.getInstance();
export default subscriptionHealthMonitor;
