import { createLogger } from "../../utils/optimizedLogger";
import { adminAdvancedCacheService } from "./adminAdvancedCacheService";
import { adminRealtimeService } from "../realtime/adminRealtimeService";

const logger = createLogger("AdminPreloadService");

interface PreloadRule {
  id: string;
  trigger: 'app_start' | 'tab_switch' | 'user_action' | 'time_based';
  conditions?: {
    tab?: string;
    userRole?: string;
    timeRange?: string;
  };
  dataKeys: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  ttl: number; // minutes
}

interface PreloadStats {
  totalPreloads: number;
  successfulPreloads: number;
  failedPreloads: number;
  cacheHitRate: number;
  averageLoadTime: number;
  lastPreloadTime: number;
}

/**
 * Service de préchargement intelligent pour les données administratives
 * Anticipe les besoins des utilisateurs et optimise les performances
 */
class AdminPreloadService {
  private preloadRules: PreloadRule[] = [];
  private activePreloads = new Map<string, Promise<any>>();
  private preloadStats: PreloadStats = {
    totalPreloads: 0,
    successfulPreloads: 0,
    failedPreloads: 0,
    cacheHitRate: 0,
    averageLoadTime: 0,
    lastPreloadTime: 0
  };

  private readonly DEFAULT_RULES: PreloadRule[] = [
    // Règles pour les super admins
    {
      id: 'super_admin_startup',
      trigger: 'app_start',
      conditions: { userRole: 'super_admin' },
      dataKeys: ['admin_users_list', 'admin_stats_calculated'],
      priority: 'critical',
      ttl: 10
    },
    {
      id: 'dashboard_preload',
      trigger: 'tab_switch',
      conditions: { tab: 'dashboard' },
      dataKeys: ['admin_stats_calculated', 'admin_analytics_7d'],
      priority: 'high',
      ttl: 15
    },
    {
      id: 'users_tab_preload',
      trigger: 'tab_switch',
      conditions: { tab: 'users' },
      dataKeys: ['admin_users_list', 'admin_subscriptions'],
      priority: 'high',
      ttl: 10
    },
    {
      id: 'analytics_preload',
      trigger: 'tab_switch',
      conditions: { tab: 'analytics' },
      dataKeys: ['admin_analytics_30d', 'admin_analytics_7d'],
      priority: 'medium',
      ttl: 60
    },
    // Préchargement périodique pour garder les données fraiches
    {
      id: 'periodic_stats_refresh',
      trigger: 'time_based',
      conditions: { timeRange: '5min' },
      dataKeys: ['admin_stats_calculated'],
      priority: 'medium',
      ttl: 15
    }
  ];

  constructor() {
    this.initialize();
    this.startPeriodicPreloading();
  }

  private initialize(): void {
    this.preloadRules = [...this.DEFAULT_RULES];
    this.setupRealtimeListeners();
    logger.info("Service de préchargement initialisé");
  }

  /**
   * Configure les écouteurs temps réel
   */
  private setupRealtimeListeners(): void {
    // Écouter les changements d'onglet
    adminRealtimeService.onSpecificEvent('tab_switch', (data) => {
      this.handleTabSwitch(data.tab);
    });

    // Écouter les actions utilisateur
    adminRealtimeService.onSpecificEvent('user_action', (data) => {
      this.handleUserAction(data);
    });
  }

  /**
   * Gère le changement d'onglet
   */
  private handleTabSwitch(tab: string): void {
    const matchingRules = this.preloadRules.filter(rule =>
      rule.trigger === 'tab_switch' &&
      rule.conditions?.tab === tab
    );

    matchingRules.forEach(rule => {
      this.executePreloadRule(rule);
    });
  }

  /**
   * Gère les actions utilisateur
   */
  private handleUserAction(data: any): void {
    // Logique pour déclencher des préchargements basés sur les actions
    if (data.action === 'search_start') {
      this.preloadSearchData(data.query);
    }
  }

  /**
   * Exécute une règle de préchargement
   */
  private async executePreloadRule(rule: PreloadRule): Promise<void> {
    const startTime = Date.now();
    this.preloadStats.totalPreloads++;

    try {
      logger.debug(`Exécution de la règle de préchargement: ${rule.id}`);

      // Vérifier si le préchargement est déjà en cours
      if (this.activePreloads.has(rule.id)) {
        logger.debug(`Préchargement déjà en cours: ${rule.id}`);
        return;
      }

      // Créer la promesse de préchargement
      const preloadPromise = this.preloadData(rule.dataKeys, rule.priority);
      this.activePreloads.set(rule.id, preloadPromise);

      await preloadPromise;

      const loadTime = Date.now() - startTime;
      this.updatePreloadStats(true, loadTime);

      logger.info(`Préchargement réussi: ${rule.id} (${loadTime}ms)`);

    } catch (error) {
      const loadTime = Date.now() - startTime;
      this.updatePreloadStats(false, loadTime);

      logger.error(`Erreur lors du préchargement ${rule.id}:`, error);
    } finally {
      this.activePreloads.delete(rule.id);
    }
  }

  /**
   * Précharge les données spécifiées
   */
  private async preloadData(dataKeys: string[], priority: PreloadRule['priority']): Promise<void> {
    const promises = dataKeys.map(key => this.preloadSingleData(key, priority));
    await Promise.allSettled(promises);
  }

  /**
   * Précharge une seule clé de données
   */
  private async preloadSingleData(key: string, priority: PreloadRule['priority']): Promise<void> {
    try {
      // Déterminer la stratégie de cache appropriée
      const strategyName = this.getStrategyNameForKey(key);

      // Vérifier si les données sont déjà en cache
      const cached = await adminAdvancedCacheService.get(key);
      if (cached) {
        logger.debug(`Données déjà en cache: ${key}`);
        return;
      }

      // Récupérer les données selon le type
      const data = await this.fetchDataForKey(key);

      if (data) {
        // Stocker dans le cache avancé
        await adminAdvancedCacheService.set(key, data, {
          name: strategyName,
          ttl: this.getTTLForPriority(priority),
          priority,
          maxSize: this.getMaxSizeForKey(key),
          compression: this.shouldCompressKey(key)
        });

        logger.debug(`Données préchargées: ${key}`);
      }

    } catch (error) {
      logger.warn(`Erreur lors du préchargement de ${key}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les données pour une clé spécifique
   */
  private async fetchDataForKey(key: string): Promise<any> {
    // Import dynamique pour éviter les dépendances circulaires
    const { adminCacheService } = await import("./adminCacheService");

    switch (key) {
      case 'admin_users_list':
        return adminCacheService.getCachedUsers();

      case 'admin_stats_calculated':
        return adminCacheService.getOrFetch(
          key,
          async () => {
            // Calcul des stats (implémentation simplifiée)
            return { timestamp: Date.now(), status: 'calculated' };
          },
          15
        );

      case 'admin_subscriptions':
        return adminCacheService.getOrFetch(
          key,
          async () => {
            // Récupération des abonnements
            return { timestamp: Date.now(), subscriptions: [] };
          },
          15
        );

      case 'admin_analytics_7d':
        return adminCacheService.getCachedAnalytics('7d');

      case 'admin_analytics_30d':
        return adminCacheService.getCachedAnalytics('30d');

      default:
        logger.warn(`Type de données inconnu pour le préchargement: ${key}`);
        return null;
    }
  }

  /**
   * Détermine le nom de stratégie pour une clé
   */
  private getStrategyNameForKey(key: string): string {
    if (key.includes('users')) return 'users';
    if (key.includes('stats')) return 'stats';
    if (key.includes('analytics')) return 'analytics';
    if (key.includes('subscriptions')) return 'subscriptions';
    return 'default';
  }

  /**
   * Obtient le TTL selon la priorité
   */
  private getTTLForPriority(priority: PreloadRule['priority']): number {
    switch (priority) {
      case 'critical': return 5;
      case 'high': return 10;
      case 'medium': return 30;
      case 'low': return 60;
      default: return 15;
    }
  }

  /**
   * Obtient la taille maximale pour une clé
   */
  private getMaxSizeForKey(key: string): number {
    if (key.includes('users')) return 1024 * 1024; // 1MB
    if (key.includes('stats')) return 512 * 1024; // 512KB
    if (key.includes('analytics')) return 2 * 1024 * 1024; // 2MB
    return 256 * 1024; // 256KB par défaut
  }

  /**
   * Détermine si une clé doit être compressée
   */
  private shouldCompressKey(key: string): boolean {
    return !key.includes('stats'); // Les stats sont souvent déjà optimisées
  }

  /**
   * Préchargement au démarrage de l'application
   */
  async preloadOnAppStart(userRole: string): Promise<void> {
    const startTime = Date.now();

    try {
      const startupRules = this.preloadRules.filter(rule =>
        rule.trigger === 'app_start' &&
        (!rule.conditions?.userRole || rule.conditions.userRole === userRole)
      );

      logger.info(`Préchargement au démarrage: ${startupRules.length} règles`);

      await Promise.all(
        startupRules.map(rule => this.executePreloadRule(rule))
      );

      const totalTime = Date.now() - startTime;
      logger.info(`Préchargement initial terminé en ${totalTime}ms`);

    } catch (error) {
      logger.error("Erreur lors du préchargement initial:", error);
    }
  }

  /**
   * Préchargement basé sur les prédictions d'utilisation
   */
  async predictivePreload(userBehavior: {
    recentTabs: string[];
    commonActions: string[];
    timeOfDay: number;
  }): Promise<void> {
    // Logique de prédiction basée sur le comportement utilisateur
    const predictedKeys = this.predictNeededData(userBehavior);

    if (predictedKeys.length > 0) {
      logger.debug(`Préchargement prédictif: ${predictedKeys.join(', ')}`);
      await this.preloadData(predictedKeys, 'medium');
    }
  }

  /**
   * Prédit les données nécessaires basées sur le comportement
   */
  private predictNeededData(behavior: any): string[] {
    const predictions: string[] = [];

    if (behavior.recentTabs.includes('users')) {
      predictions.push('admin_users_list', 'admin_subscriptions');
    }

    if (behavior.recentTabs.includes('analytics')) {
      predictions.push('admin_analytics_7d');
    }

    if (behavior.timeOfDay > 18 || behavior.timeOfDay < 6) {
      predictions.push('admin_stats_calculated'); // Check de fin de journée
    }

    return predictions;
  }

  /**
   * Préchargement pour la recherche
   */
  private async preloadSearchData(query: string): Promise<void> {
    // Précharger les données de recherche fréquentes
    const searchKeys = ['admin_users_list', 'admin_stats_calculated'];
    await this.preloadData(searchKeys, 'high');
  }

  /**
   * Démarre le préchargement périodique
   */
  private startPeriodicPreloading(): void {
    setInterval(() => {
      const periodicRules = this.preloadRules.filter(rule =>
        rule.trigger === 'time_based'
      );

      periodicRules.forEach(rule => {
        this.executePreloadRule(rule);
      });
    }, 5 * 60 * 1000); // Toutes les 5 minutes
  }

  /**
   * Met à jour les statistiques de préchargement
   */
  private updatePreloadStats(success: boolean, loadTime: number): void {
    if (success) {
      this.preloadStats.successfulPreloads++;
    } else {
      this.preloadStats.failedPreloads++;
    }

    // Calcul de la moyenne mobile
    const totalCompleted = this.preloadStats.successfulPreloads + this.preloadStats.failedPreloads;
    this.preloadStats.averageLoadTime =
      ((this.preloadStats.averageLoadTime * (totalCompleted - 1)) + loadTime) / totalCompleted;

    this.preloadStats.lastPreloadTime = Date.now();

    // Calcul du taux de succès du cache
    if (this.preloadStats.totalPreloads > 0) {
      this.preloadStats.cacheHitRate =
        (this.preloadStats.successfulPreloads / this.preloadStats.totalPreloads) * 100;
    }
  }

  /**
   * Obtient les statistiques de préchargement
   */
  getPreloadStats(): PreloadStats {
    return { ...this.preloadStats };
  }

  /**
   * Ajoute une règle de préchargement personnalisée
   */
  addCustomRule(rule: PreloadRule): void {
    // Vérifier que l'ID est unique
    if (this.preloadRules.some(r => r.id === rule.id)) {
      throw new Error(`Une règle avec l'ID ${rule.id} existe déjà`);
    }

    this.preloadRules.push(rule);
    logger.info(`Règle de préchargement ajoutée: ${rule.id}`);
  }

  /**
   * Supprime une règle de préchargement
   */
  removeRule(ruleId: string): boolean {
    const index = this.preloadRules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.preloadRules.splice(index, 1);
      logger.info(`Règle de préchargement supprimée: ${ruleId}`);
      return true;
    }
    return false;
  }

  /**
   * Nettoyage des anciens préchargements
   */
  cleanup(): void {
    // Annuler les préchargements en cours trop longs
    const now = Date.now();
    for (const [ruleId, promise] of Array.from(this.activePreloads.entries())) {
      // Timeout de 30 secondes pour les préchargements
      if (now - this.preloadStats.lastPreloadTime > 30000) {
        logger.warn(`Préchargement timeout: ${ruleId}`);
        this.activePreloads.delete(ruleId);
      }
    }

    logger.debug("Nettoyage du service de préchargement terminé");
  }
}

export const adminPreloadService = new AdminPreloadService();

// Nettoyage automatique toutes les 10 minutes
setInterval(() => {
  adminPreloadService.cleanup();
}, 10 * 60 * 1000);
