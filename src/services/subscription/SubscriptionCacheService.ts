import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../../utils/optimizedLogger";
import { UserSubscription, UsageStats, Subscription } from "../../types/subscription";
import { adminAdvancedCacheService } from "../cache/adminAdvancedCacheService";

const logger = createLogger("SubscriptionCacheService");

interface SubscriptionCacheEntry {
  data: UserSubscription | Subscription | null;
  usage: UsageStats | null;
  cachedAt: number;
  expiresAt: number;
  version: string;
}

interface CacheConfig {
  subscriptionTTL: number; // 5 minutes pour les abonnements actifs
  usageTTL: number;        // 2 minutes pour l'usage
  maxRetries: number;      // 3 tentatives max
  retryDelay: number;      // 1000ms délai initial
  enableCompression: boolean;
}

/**
 * Interface for the subscription service that this cache service depends on
 */
export interface SubscriptionServiceInterface {
  getSubscription(userId: string): Promise<Subscription | null>;
  getUsageStats(userId: string): Promise<UsageStats | null>;
}

/**
 * Service de cache intelligent pour les abonnements
 * Utilise Redis-like caching avec Firestore comme backend de secours
 */
class SubscriptionCacheService {
  private static readonly CACHE_VERSION = "v1.0.0";
  private static readonly CACHE_PREFIX = "subscription_cache_";

  private cache = new Map<string, SubscriptionCacheEntry>();
  private config: CacheConfig = {
    subscriptionTTL: 5 * 60 * 1000, // 5 minutes
    usageTTL: 2 * 60 * 1000,       // 2 minutes
    maxRetries: 3,
    retryDelay: 1000,
    enableCompression: true,
  };

  private retryTimeouts = new Map<string, NodeJS.Timeout>();
  private subscriptionService: SubscriptionServiceInterface;

  constructor(subscriptionService: SubscriptionServiceInterface) {
    this.subscriptionService = subscriptionService;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadPersistedCache();
      this.startPeriodicCleanup();
      logger.info("✅ SubscriptionCacheService initialisé");
    } catch (error) {
      logger.error("❌ Erreur initialisation cache abonnements:", error);
    }
  }

  /**
   * Récupère l'abonnement avec cache intelligent
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    const cacheKey = `${this.constructor.name}_subscription_${userId}`;

    try {
      // Vérifier le cache local
      const cached = this.cache.get(cacheKey);
      if (cached && !this.isExpired(cached)) {
        logger.debug("✅ Cache hit pour abonnement:", userId);
        return cached.data as Subscription | null;
      }

      // Vérifier AsyncStorage
      const stored = await this.getFromStorage(cacheKey);
      if (stored && !this.isExpired(stored)) {
        this.cache.set(cacheKey, stored);
        logger.debug("✅ Storage hit pour abonnement:", userId);
        return stored.data as Subscription | null;
      }

      // Récupérer depuis Firestore avec retry
      const subscription = await this.fetchWithRetry(
        () => this.subscriptionService.getSubscription(userId),
        `getSubscription_${userId}`
      );

      // Mettre en cache
      const cacheEntry: SubscriptionCacheEntry = {
        data: subscription,
        usage: null,
        cachedAt: Date.now(),
        expiresAt: Date.now() + this.config.subscriptionTTL,
        version: SubscriptionCacheService.CACHE_VERSION,
      };

      this.cache.set(cacheKey, cacheEntry);
      await this.saveToStorage(cacheKey, cacheEntry);

      logger.info("✅ Abonnement récupéré et mis en cache:", userId);
      return subscription;

    } catch (error) {
      logger.error("❌ Erreur récupération abonnement:", error);

      // En cas d'erreur, retourner le cache expiré si disponible
      const cached = this.cache.get(cacheKey) || await this.getFromStorage(cacheKey);
      if (cached?.data) {
        logger.warn("⚠️ Utilisation du cache expiré pour:", userId);
        return cached.data as Subscription | null;
      }

      throw error;
    }
  }

  /**
   * Récupère les stats d'usage avec cache intelligent
   */
  async getUsageStats(userId: string): Promise<UsageStats | null> {
    const cacheKey = `${this.constructor.name}_usage_${userId}`;

    try {
      // Vérifier le cache local
      const cached = this.cache.get(cacheKey);
      if (cached && !this.isExpired(cached, this.config.usageTTL)) {
        logger.debug("✅ Cache hit pour usage:", userId);
        return cached.usage;
      }

      // Vérifier AsyncStorage
      const stored = await this.getFromStorage(cacheKey);
      if (stored && !this.isExpired(stored, this.config.usageTTL)) {
        this.cache.set(cacheKey, stored);
        logger.debug("✅ Storage hit pour usage:", userId);
        return stored.usage;
      }

      // Récupérer depuis Firestore avec retry
      const usage = await this.fetchWithRetry(
        () => this.subscriptionService.getUsageStats(userId),
        `getUsageStats_${userId}`
      );

      // Mettre à jour le cache existant ou créer une nouvelle entrée
      const existingCache = this.cache.get(cacheKey);
      const cacheEntry: SubscriptionCacheEntry = {
        data: existingCache?.data || null,
        usage: usage,
        cachedAt: Date.now(),
        expiresAt: Date.now() + this.config.usageTTL,
        version: SubscriptionCacheService.CACHE_VERSION,
      };

      this.cache.set(cacheKey, cacheEntry);
      await this.saveToStorage(cacheKey, cacheEntry);

      logger.info("✅ Usage récupéré et mis en cache:", userId);
      return usage;

    } catch (error) {
      logger.error("❌ Erreur récupération usage:", error);

      // En cas d'erreur, retourner le cache expiré si disponible
      const cached = this.cache.get(cacheKey) || await this.getFromStorage(cacheKey);
      if (cached?.usage) {
        logger.warn("⚠️ Utilisation du cache expiré pour usage:", userId);
        return cached.usage;
      }

      throw error;
    }
  }

  /**
   * Invalide le cache pour un utilisateur
   */
  async invalidateCache(userId: string): Promise<void> {
    const subscriptionKey = `${this.constructor.name}_subscription_${userId}`;
    const usageKey = `${this.constructor.name}_usage_${userId}`;

    this.cache.delete(subscriptionKey);
    this.cache.delete(usageKey);

    await AsyncStorage.multiRemove([subscriptionKey, usageKey]);

    logger.info("🗑️ Cache invalidé pour:", userId);
  }

  /**
   * Met à jour le cache après modification
   */
  async updateCache(userId: string, subscription: Subscription | null, usage?: UsageStats | null): Promise<void> {
    const subscriptionKey = `${this.constructor.name}_subscription_${userId}`;
    const usageKey = `${this.constructor.name}_usage_${userId}`;

    // Mettre à jour cache abonnement
    if (subscription !== undefined) {
      const subscriptionEntry: SubscriptionCacheEntry = {
        data: subscription,
        usage: null,
        cachedAt: Date.now(),
        expiresAt: Date.now() + this.config.subscriptionTTL,
        version: SubscriptionCacheService.CACHE_VERSION,
      };

      this.cache.set(subscriptionKey, subscriptionEntry);
      await this.saveToStorage(subscriptionKey, subscriptionEntry);
    }

    // Mettre à jour cache usage
    if (usage !== undefined) {
      const existingSubscription = this.cache.get(subscriptionKey);
      const usageEntry: SubscriptionCacheEntry = {
        data: existingSubscription?.data || null,
        usage: usage,
        cachedAt: Date.now(),
        expiresAt: Date.now() + this.config.usageTTL,
        version: SubscriptionCacheService.CACHE_VERSION,
      };

      this.cache.set(usageKey, usageEntry);
      await this.saveToStorage(usageKey, usageEntry);
    }

    logger.info("✅ Cache mis à jour pour:", userId);
  }

  /**
   * Fetch avec retry automatique et backoff exponentiel
   */
  private async fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    operationId: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Annuler le timeout précédent si existe
        const existingTimeout = this.retryTimeouts.get(operationId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          this.retryTimeouts.delete(operationId);
        }

        const result = await fetchFn();
        return result;

      } catch (error) {
        lastError = error as Error;
        logger.warn(`⚠️ Tentative ${attempt}/${this.config.maxRetries} échouée pour ${operationId}:`, error);

        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          logger.info(`⏳ Retry dans ${delay}ms pour ${operationId}`);

          await new Promise(resolve => {
            const timeout = setTimeout(resolve, delay);
            this.retryTimeouts.set(operationId, timeout);
          });
        }
      }
    }

    throw lastError;
  }

  /**
   * Vérifie si une entrée de cache est expirée
   */
  private isExpired(entry: SubscriptionCacheEntry, customTTL?: number): boolean {
    const ttl = customTTL || (entry.expiresAt - entry.cachedAt);
    return Date.now() > entry.expiresAt;
  }

  /**
   * Sauvegarde vers AsyncStorage avec compression optionnelle
   */
  private async saveToStorage(key: string, entry: SubscriptionCacheEntry): Promise<void> {
    try {
      let dataToStore = JSON.stringify(entry);

      if (this.config.enableCompression) {
        // Simple compression en retirant les espaces inutiles
        dataToStore = JSON.stringify(entry);
      }

      await AsyncStorage.setItem(key, dataToStore);
    } catch (error) {
      logger.error("❌ Erreur sauvegarde cache:", error);
    }
  }

  /**
   * Récupère depuis AsyncStorage
   */
  private async getFromStorage(key: string): Promise<SubscriptionCacheEntry | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const entry = JSON.parse(stored) as SubscriptionCacheEntry;

      // Vérifier la version
      if (entry.version !== SubscriptionCacheService.CACHE_VERSION) {
        logger.warn("🗑️ Cache version mismatch, suppression:", key);
        await AsyncStorage.removeItem(key);
        return null;
      }

      return entry;
    } catch (error) {
      logger.error("❌ Erreur lecture cache:", error);
      return null;
    }
  }

  /**
   * Charge le cache persistant au démarrage
   */
  private async loadPersistedCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(SubscriptionCacheService.CACHE_PREFIX));

      for (const key of cacheKeys) {
        const entry = await this.getFromStorage(key);
        if (entry && !this.isExpired(entry)) {
          this.cache.set(key, entry);
        } else {
          // Nettoyer les entrées expirées
          await AsyncStorage.removeItem(key);
        }
      }

      logger.info(`✅ ${this.cache.size} entrées de cache chargées`);
    } catch (error) {
      logger.error("❌ Erreur chargement cache persistant:", error);
    }
  }

  /**
   * Nettoyage périodique du cache
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // Toutes les 5 minutes
  }

  /**
   * Nettoie les entrées expirées
   */
  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    // Supprimer du cache mémoire
    expiredKeys.forEach(key => this.cache.delete(key));

    // Supprimer d'AsyncStorage
    if (expiredKeys.length > 0) {
      await AsyncStorage.multiRemove(expiredKeys);
      logger.info(`🧹 ${expiredKeys.length} entrées de cache nettoyées`);
    }
  }

  /**
   * Obtient les statistiques du cache
   */
  getCacheStats() {
    const totalEntries = this.cache.size;
    const expiredEntries = Array.from(this.cache.values()).filter(entry => this.isExpired(entry)).length;
    const activeEntries = totalEntries - expiredEntries;

    return {
      totalEntries,
      activeEntries,
      expiredEntries,
      hitRate: 0, // À implémenter avec un système de métriques
      version: SubscriptionCacheService.CACHE_VERSION,
    };
  }
}

/**
 * Factory function to create a SubscriptionCacheService instance
 * with the required subscription service dependency
 */
export function createSubscriptionCacheService(subscriptionService: SubscriptionServiceInterface): SubscriptionCacheService {
  return new SubscriptionCacheService(subscriptionService);
}

// For backward compatibility, we'll create a placeholder that will be initialized later
let _subscriptionCacheService: SubscriptionCacheService | null = null;

/**
 * Initialize the global subscription cache service instance
 * This should be called after the subscription service is created
 */
export function initializeSubscriptionCacheService(subscriptionService: SubscriptionServiceInterface): void {
  _subscriptionCacheService = new SubscriptionCacheService(subscriptionService);
}

/**
 * Get the global subscription cache service instance
 * Throws an error if not initialized
 */
export function getSubscriptionCacheService(): SubscriptionCacheService {
  if (!_subscriptionCacheService) {
    throw new Error("SubscriptionCacheService not initialized. Call initializeSubscriptionCacheService first.");
  }
  return _subscriptionCacheService;
}

// Export the class for direct instantiation if needed
export { SubscriptionCacheService };

// Default export for backward compatibility
// This creates a temporary instance that will be properly initialized later
const defaultSubscriptionCacheService = new SubscriptionCacheService({
  getSubscription: async () => {
    throw new Error("SubscriptionCacheService not properly initialized");
  },
  getUsageStats: async () => {
    throw new Error("SubscriptionCacheService not properly initialized");
  }
});

export default defaultSubscriptionCacheService;
