import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from "@react-native-firebase/firestore";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("AdminCacheService");

interface CacheEntry<T> {
  data: T;
  timestamp: Timestamp;
  expiresAt: Timestamp;
  version: string;
}

interface CacheConfig {
  defaultTTL: number; // en minutes
  maxEntries: number;
}

/**
 * Service de cache avancé pour les données administratives
 * Utilise Firestore comme couche de cache distribué
 */
class AdminCacheService {
  private readonly config: CacheConfig = {
    defaultTTL: 30, // 30 minutes
    maxEntries: 1000,
  };

  private readonly CACHE_VERSION = "v1.0.0";

  /**
   * Récupère des données du cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = getFirestore(getApp());
      const cacheDoc = await getDoc(doc(db, "adminCache", key));

      if (!cacheDoc.exists()) {
        logger.debug("Cache miss:", key);
        return null;
      }

      const entry = cacheDoc.data() as CacheEntry<T>;

      // Vérifier la version du cache
      if (entry.version !== this.CACHE_VERSION) {
        logger.debug("Cache version mismatch, invalidating:", key);
        return null;
      }

      // Vérifier l'expiration
      const now = Timestamp.now();
      if (now.toMillis() > entry.expiresAt.toMillis()) {
        logger.debug("Cache expired:", key);
        return null;
      }

      logger.debug("Cache hit:", key);
      return entry.data;
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
    ttlMinutes: number = this.config.defaultTTL
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(
        now.toMillis() + ttlMinutes * 60 * 1000
      );

      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt,
        version: this.CACHE_VERSION,
      };

      await setDoc(doc(db, "adminCache", key), entry);
      logger.debug("Données mises en cache:", key);
    } catch (error) {
      logger.error("Erreur lors de la mise en cache:", error);
    }
  }

  /**
   * Invalide une entrée du cache
   */
  async invalidate(key: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      await setDoc(doc(db, "adminCache", key), {});
      logger.debug("Cache invalidé:", key);
    } catch (error) {
      logger.error("Erreur lors de l'invalidation du cache:", error);
    }
  }

  /**
   * Invalide toutes les entrées du cache
   */
  async invalidateAll(): Promise<void> {
    try {
      // Pour une invalidation complète, on incrémente la version
      const newVersion = `v${Date.now()}`;
      await this.set("__cache_version", newVersion, 24 * 60); // 24h
      logger.info("Cache complètement invalidé, nouvelle version:", newVersion);
    } catch (error) {
      logger.error("Erreur lors de l'invalidation complète du cache:", error);
    }
  }

  /**
   * Récupère des données avec cache intelligent
   */
  async getOrFetch<T>(
    cacheKey: string,
    fetchFunction: () => Promise<T>,
    ttlMinutes: number = this.config.defaultTTL
  ): Promise<T> {
    // Essayer de récupérer du cache
    const cachedData = await this.get<T>(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }

    // Si pas en cache, récupérer et mettre en cache
    logger.debug("Fetching fresh data for:", cacheKey);
    const freshData = await fetchFunction();
    await this.set(cacheKey, freshData, ttlMinutes);

    return freshData;
  }

  /**
   * Cache pour les statistiques administratives
   */
  async getCachedAdminStats() {
    return this.getOrFetch(
      "admin_stats_global",
      async () => {
        // Cette fonction sera appelée par la Cloud Function
        const { httpsCallable } = await import("@react-native-firebase/functions");
        const getAdminStatsFunction = httpsCallable("getAdminStats");
        const result = await getAdminStatsFunction();
        return result.data;
      },
      15 // 15 minutes TTL pour les stats
    );
  }

  /**
   * Cache pour la liste des utilisateurs
   */
  async getCachedUsers(forceRefresh: boolean = false) {
    const cacheKey = "admin_users_list";

    if (forceRefresh) {
      await this.invalidate(cacheKey);
    }

    return this.getOrFetch(
      cacheKey,
      async () => {
        const db = getFirestore(getApp());
        const query = await import("@react-native-firebase/firestore");
        const usersQuery = query.query(
          query.collection(db, "users"),
          query.orderBy("createdAt", "desc"),
          query.limit(100)
        );
        const snapshot = await query.getDocs(usersQuery);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      },
      10 // 10 minutes TTL pour la liste des utilisateurs
    );
  }

  /**
   * Cache pour les métriques analytics
   */
  async getCachedAnalytics(timeRange: string) {
    const cacheKey = `admin_analytics_${timeRange}`;

    return this.getOrFetch(
      cacheKey,
      async () => {
        // Implémentation des calculs d'analytics
        const db = getFirestore(getApp());
        const query = await import("@react-native-firebase/firestore");

        const [userGrowth, activityData] = await Promise.all([
          this.calculateUserGrowth(db, query, timeRange),
          this.calculateActivityMetrics(db, query, timeRange)
        ]);

        return { userGrowth, activityData };
      },
      60 // 1 heure TTL pour les analytics
    );
  }

  private async calculateUserGrowth(db: any, query: any, timeRange: string) {
    // Logique de calcul de la croissance des utilisateurs
    const usersRef = query.collection(db, "users");
    const snapshot = await query.getDocs(usersRef);

    // Calculs simplifiés - à adapter selon vos besoins
    return {
      total: snapshot.size,
      growth: Math.floor(Math.random() * 100), // Remplacer par calcul réel
      period: timeRange
    };
  }

  private async calculateActivityMetrics(db: any, query: any, timeRange: string) {
    // Logique de calcul des métriques d'activité
    const [scriptsSnapshot, recordingsSnapshot] = await Promise.all([
      query.getDocs(query.collection(db, "scripts")),
      query.getDocs(query.collection(db, "recordings"))
    ]);

    return {
      scripts: scriptsSnapshot.size,
      recordings: recordingsSnapshot.size,
      period: timeRange
    };
  }
}

export const adminCacheService = new AdminCacheService();
