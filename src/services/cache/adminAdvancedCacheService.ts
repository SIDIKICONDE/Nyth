import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("AdminAdvancedCacheService");

interface CacheMetadata {
  version: string;
  timestamp: number;
  expiresAt: number;
  size: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[];
}

interface CacheEntry<T> {
  data: T;
  metadata: CacheMetadata;
  lastAccessed: number;
}

interface CacheStrategy {
  name: string;
  ttl: number; // en minutes
  priority: CacheMetadata['priority'];
  maxSize: number; // en octets
  compression: boolean;
}

/**
 * Service Worker avancé pour le cache hors ligne
 * Gère automatiquement la synchronisation, compression et nettoyage
 */
class AdminAdvancedCacheService {
  private readonly CACHE_VERSION = "v2.0.0";
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CLEANUP_THRESHOLD = 0.8; // 80% de la capacité

  private cache: Map<string, CacheEntry<any>> = new Map();
  private isOnline: boolean = true;
  private syncQueue: Array<{ key: string; data: any; strategy: CacheStrategy }> = [];

  // Stratégies de cache par type de données
  private strategies: Record<string, CacheStrategy> = {
    users: {
      name: 'users',
      ttl: 10,
      priority: 'high',
      maxSize: 1024 * 1024, // 1MB
      compression: true
    },
    stats: {
      name: 'stats',
      ttl: 15,
      priority: 'critical',
      maxSize: 512 * 1024, // 512KB
      compression: false
    },
    analytics: {
      name: 'analytics',
      ttl: 60,
      priority: 'medium',
      maxSize: 2 * 1024 * 1024, // 2MB
      compression: true
    },
    subscriptions: {
      name: 'subscriptions',
      ttl: 15,
      priority: 'high',
      maxSize: 256 * 1024, // 256KB
      compression: true
    }
  };

  constructor() {
    this.initialize();
    this.startPeriodicCleanup();
    this.startOnlineStatusMonitoring();
  }

  private async initialize() {
    try {
      await this.loadPersistedCache();
      logger.info("Cache avancé initialisé avec succès");
    } catch (error) {
      logger.error("Erreur lors de l'initialisation du cache:", error);
    }
  }

  /**
   * Charge le cache persistant depuis AsyncStorage
   */
  private async loadPersistedCache() {
    try {
      const persistedCache = await AsyncStorage.getItem('admin_advanced_cache');
      if (persistedCache) {
        const parsed = JSON.parse(persistedCache);
        const now = Date.now();

        // Filtrer les entrées expirées
        const validEntries = Object.entries(parsed).filter(([_, entry]: [string, any]) => {
          return entry.metadata.expiresAt > now;
        });

        validEntries.forEach(([key, entry]) => {
          this.cache.set(key, entry as CacheEntry<any>);
        });

        logger.debug(`Cache chargé: ${validEntries.length} entrées valides`);
      }
    } catch (error) {
      logger.error("Erreur lors du chargement du cache persistant:", error);
    }
  }

  /**
   * Sauvegarde le cache vers AsyncStorage
   */
  private async persistCache() {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('admin_advanced_cache', JSON.stringify(cacheObject));
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde du cache:", error);
    }
  }

  /**
   * Récupère des données avec cache intelligent
   */
  async getOrFetch<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    strategyName: string = 'default'
  ): Promise<T> {
    const strategy = this.strategies[strategyName] || {
      name: 'default',
      ttl: 30,
      priority: 'medium',
      maxSize: 512 * 1024,
      compression: false
    };

    // Tenter de récupérer du cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Si hors ligne, utiliser les données mises en file
    if (!this.isOnline) {
      const queued = this.syncQueue.find(item => item.key === key);
      if (queued) {
        return queued.data;
      }
      throw new Error('Données non disponibles hors ligne');
    }

    // Récupérer les données fraiches
    try {
      const freshData = await fetchFunction();
      await this.set(key, freshData, strategy);

      // Si on était hors ligne, ajouter à la file de synchro
      if (!this.isOnline) {
        this.syncQueue.push({ key, data: freshData, strategy });
      }

      return freshData;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données pour ${key}:`, error);
      throw error;
    }
  }

  /**
   * Récupère des données du cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key);
      if (!entry) return null;

      const now = Date.now();

      // Vérifier l'expiration
      if (now > entry.metadata.expiresAt) {
        this.cache.delete(key);
        return null;
      }

      // Vérifier la version
      if (entry.metadata.version !== this.CACHE_VERSION) {
        this.cache.delete(key);
        return null;
      }

      // Mettre à jour le dernier accès
      entry.lastAccessed = now;
      this.cache.set(key, entry);

      const data = entry.data;
      logger.debug(`Cache hit: ${key}`);

      return data;
    } catch (error) {
      logger.error("Erreur lors de la récupération du cache:", error);
      return null;
    }
  }

  /**
   * Stocke des données dans le cache
   */
  async set<T>(
    key: string,
    data: T,
    strategy: CacheStrategy
  ): Promise<void> {
    try {
      // Vérifier la taille avant compression
      const rawSize = JSON.stringify(data).length;

      if (rawSize > strategy.maxSize) {
        logger.warn(`Données trop volumineuses pour ${key}: ${rawSize} octets`);
        return;
      }

      // Compresser si nécessaire
      const processedData = strategy.compression ? this.compress(data) : data;
      const compressedSize = JSON.stringify(processedData).length;

      const now = Date.now();
      const expiresAt = now + (strategy.ttl * 60 * 1000);

      const entry: CacheEntry<T> = {
        data: processedData,
        metadata: {
          version: this.CACHE_VERSION,
          timestamp: now,
          expiresAt,
          size: compressedSize,
          priority: strategy.priority
        },
        lastAccessed: now
      };

      this.cache.set(key, entry);

      // Vérifier la taille totale du cache
      await this.checkCacheSize();

      // Sauvegarder de manière asynchrone
      this.persistCache();

      logger.debug(`Données mises en cache: ${key} (${compressedSize} octets)`);
    } catch (error) {
      logger.error("Erreur lors de la mise en cache:", error);
    }
  }

  /**
   * Invalide une entrée du cache
   */
  async invalidate(key: string): Promise<void> {
    try {
      // Supprimer de la mémoire
      this.cache.delete(key);

      // Invalider dans Firestore
      const db = getFirestore(getApp());
      await setDoc(doc(db, "adminCache", key), {});
      logger.debug("Cache invalidé:", key);
    } catch (error) {
      logger.error("Erreur lors de l'invalidation du cache:", error);
    }
  }

  /**
   * Compression simple des données
   */
  private compress<T>(data: T): T {
    // Implémentation simple de compression/décompression
    // Dans un vrai projet, utiliser une bibliothèque comme pako
    return data;
  }

  /**
   * Vérifie et gère la taille du cache
   */
  private async checkCacheSize(): Promise<void> {
    const totalSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.metadata.size, 0);

    if (totalSize > this.MAX_CACHE_SIZE * this.CLEANUP_THRESHOLD) {
      await this.cleanup();
    }
  }

  /**
   * Nettoyage intelligent du cache
   */
  private async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      const entries = Array.from(this.cache.entries());

      // Trier par priorité (les moins prioritaires d'abord) puis par dernier accès
      entries.sort((a, b) => {
        const [, entryA] = a;
        const [, entryB] = b;

        // Priorité inverse (critical = 4, low = 1)
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[entryA.metadata.priority] - priorityOrder[entryB.metadata.priority];

        if (priorityDiff !== 0) return priorityDiff;

        // Puis par dernier accès (les plus anciens d'abord)
        return entryA.lastAccessed - entryB.lastAccessed;
      });

      let currentSize = entries.reduce((total, [, entry]) => total + entry.metadata.size, 0);
      const targetSize = this.MAX_CACHE_SIZE * 0.7; // Garder 70% de la capacité

      // Supprimer les entrées jusqu'à atteindre la taille cible
      for (const [key, entry] of entries) {
        if (currentSize <= targetSize) break;

        // Ne pas supprimer les entrées critiques ou récentes
        if (entry.metadata.priority === 'critical' &&
            (now - entry.lastAccessed) < 30 * 60 * 1000) { // 30 minutes
          continue;
        }

        this.cache.delete(key);
        currentSize -= entry.metadata.size;
        logger.debug(`Supprimé du cache: ${key}`);
      }

      await this.persistCache();
      logger.info(`Nettoyage du cache terminé. Taille actuelle: ${currentSize} octets`);
    } catch (error) {
      logger.error("Erreur lors du nettoyage du cache:", error);
    }
  }

  /**
   * Synchronisation quand la connexion est rétablie
   */
  private async syncOfflineData() {
    if (this.syncQueue.length === 0) return;

    try {
      logger.info(`Synchronisation de ${this.syncQueue.length} éléments...`);

      for (const item of this.syncQueue) {
        await this.set(item.key, item.data, item.strategy);
      }

      this.syncQueue = [];
      logger.info("Synchronisation terminée");
    } catch (error) {
      logger.error("Erreur lors de la synchronisation:", error);
    }
  }

  /**
   * Surveillance du statut de connexion
   */
  private startOnlineStatusMonitoring() {
    // Dans React Native, utiliser NetInfo ou une autre librairie
    // pour surveiller le statut de connexion
    setInterval(() => {
      // Simulation - à remplacer par une vraie vérification
      this.isOnline = true;
    }, 30000); // Vérifier toutes les 30 secondes
  }

  /**
   * Nettoyage périodique
   */
  private startPeriodicCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000); // Toutes les 10 minutes
  }

  /**
   * Précharge les données critiques
   */
  async preloadCriticalData(): Promise<void> {
    try {
      const criticalKeys = ['admin_users_list', 'admin_stats_calculated'];

      for (const key of criticalKeys) {
        // Vérifier si les données sont en cache
        const cached = await this.get(key);
        if (!cached) {
          logger.debug(`Préchargement nécessaire pour: ${key}`);
          // Le préchargement sera géré par les services qui utilisent ces clés
        }
      }
    } catch (error) {
      logger.error("Erreur lors du préchargement:", error);
    }
  }

  /**
   * Obtient les statistiques du cache
   */
  getCacheStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((total, entry) => total + entry.metadata.size, 0);
    const byPriority = entries.reduce((acc, entry) => {
      acc[entry.metadata.priority] = (acc[entry.metadata.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEntries: entries.length,
      totalSize,
      maxSize: this.MAX_CACHE_SIZE,
      utilizationPercentage: (totalSize / this.MAX_CACHE_SIZE) * 100,
      byPriority,
      isOnline: this.isOnline,
      syncQueueLength: this.syncQueue.length
    };
  }
}

export const adminAdvancedCacheService = new AdminAdvancedCacheService();
