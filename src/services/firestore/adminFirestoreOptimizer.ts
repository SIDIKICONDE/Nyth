import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getDocs,
  Timestamp,
} from "@react-native-firebase/firestore";
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("AdminFirestoreOptimizer");

interface QueryOptions {
  collectionName: string;
  filters?: Array<{
    field: string;
    operator: '==' | '>' | '<' | '>=' | '<=' | 'in' | 'array-contains';
    value: any;
  }>;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limitCount?: number;
  cursor?: FirebaseFirestoreTypes.QueryDocumentSnapshot;
  direction?: 'forward' | 'backward';
}

interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: FirebaseFirestoreTypes.QueryDocumentSnapshot;
  prevCursor?: FirebaseFirestoreTypes.QueryDocumentSnapshot;
  totalCount?: number;
  executionTime: number;
}

interface CompoundQueryOptions {
  collectionName: string;
  compoundFilters: Array<{
    field: string;
    operator: '==' | '>' | '<' | '>=' | '<=';
    value: any;
  }>;
  orderBy: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limitCount?: number;
}

/**
 * Service d'optimisation avancé des requêtes Firestore
 * Gère la pagination, les compound queries et l'optimisation des performances
 */
class AdminFirestoreOptimizer {
  private readonly db = getFirestore(getApp());
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();

  /**
   * Exécute une requête optimisée avec pagination
   */
  async executeOptimizedQuery<T = FirebaseFirestoreTypes.DocumentData>(
    options: QueryOptions
  ): Promise<PaginatedResult<T>> {
    const startTime = Date.now();

    try {
      // Construire les contraintes de requête
      const constraints: any[] = [];

      // Ajouter les filtres
      if (options.filters) {
        options.filters.forEach(filter => {
          constraints.push(where(filter.field, filter.operator, filter.value));
        });
      }

      // Ajouter le tri
      if (options.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // Ajouter la limite
      if (options.limitCount) {
        constraints.push(limit(options.limitCount + 1)); // +1 pour détecter s'il y a plus de données
      }

      // Ajouter le curseur pour la pagination
      if (options.cursor) {
        if (options.direction === 'backward') {
          constraints.push(endBefore(options.cursor));
        } else {
          constraints.push(startAfter(options.cursor));
        }
      }

      // Créer et exécuter la requête
      const q = query(collection(this.db, options.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const executionTime = Date.now() - startTime;
      const docs = querySnapshot.docs;

      // Déterminer s'il y a plus de données
      let hasMore = false;
      let actualDocs = docs;

      if (options.limitCount && docs.length > options.limitCount) {
        hasMore = true;
        actualDocs = docs.slice(0, options.limitCount);
      }

      // Convertir les documents
      const data = actualDocs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      // Déterminer les curseurs
      const result: PaginatedResult<T> = {
        data,
        hasMore,
        executionTime,
      };

      if (actualDocs.length > 0) {
        result.nextCursor = actualDocs[actualDocs.length - 1];
        if (options.cursor) {
          result.prevCursor = options.cursor;
        }
      }

      logger.debug(`Requête optimisée exécutée en ${executionTime}ms: ${data.length} documents`);

      return result;

    } catch (error) {
      logger.error("Erreur lors de l'exécution de la requête optimisée:", error);
      throw error;
    }
  }

  /**
   * Exécute une compound query optimisée
   */
  async executeCompoundQuery<T = FirebaseFirestoreTypes.DocumentData>(
    options: CompoundQueryOptions
  ): Promise<T[]> {
    const startTime = Date.now();

    try {
      // Trier les filtres pour optimiser la requête
      const sortedFilters = this.optimizeCompoundFilters(options.compoundFilters);

      // Construire les contraintes
      const constraints: any[] = [];

      sortedFilters.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });

      // Ajouter le tri (obligatoire pour les compound queries)
      constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));

      if (options.limitCount) {
        constraints.push(limit(options.limitCount));
      }

      // Exécuter la requête
      const q = query(collection(this.db, options.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const executionTime = Date.now() - startTime;

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      logger.debug(`Compound query exécutée en ${executionTime}ms: ${data.length} documents`);

      return data;

    } catch (error) {
      logger.error("Erreur lors de l'exécution de la compound query:", error);
      throw error;
    }
  }

  /**
   * Optimise l'ordre des filtres pour les compound queries
   */
  private optimizeCompoundFilters(filters: CompoundQueryOptions['compoundFilters']) {
    // Trier les filtres par sélectivité (égalité d'abord, puis range)
    return filters.sort((a, b) => {
      // Égalité a la plus haute priorité
      if (a.operator === '==' && b.operator !== '==') return -1;
      if (a.operator !== '==' && b.operator === '==') return 1;

      // Ensuite par type d'opérateur
      const operatorPriority = { '==': 3, 'in': 2, '>=': 1, '<=': 1, '>': 0, '<': 0 };
      return operatorPriority[b.operator] - operatorPriority[a.operator];
    });
  }

  /**
   * Récupère des données par lots optimisés
   */
  async batchFetch<T = FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    ids: string[],
    batchSize: number = 10
  ): Promise<T[]> {
    const startTime = Date.now();
    const results: T[] = [];

    try {
      // Diviser les IDs en lots
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);

        // Utiliser 'in' query pour récupérer plusieurs documents
        const q = query(
          collection(this.db, collectionName),
          where('__name__', 'in', batch)
        );

        const querySnapshot = await getDocs(q);
        const batchResults = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];

        results.push(...batchResults);

        // Petite pause entre les lots pour éviter la surcharge
        if (i + batchSize < ids.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const executionTime = Date.now() - startTime;
      logger.debug(`Batch fetch exécuté en ${executionTime}ms: ${results.length} documents`);

      return results;

    } catch (error) {
      logger.error("Erreur lors du batch fetch:", error);
      throw error;
    }
  }

  /**
   * Requête avec cache intelligent
   */
  async cachedQuery<T = FirebaseFirestoreTypes.DocumentData>(
    cacheKey: string,
    options: QueryOptions,
    ttlMinutes: number = 5
  ): Promise<PaginatedResult<T>> {
    // Vérifier le cache
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttlMinutes * 60 * 1000) {
      logger.debug(`Cache hit pour la requête: ${cacheKey}`);
      return cached.result;
    }

    // Exécuter la requête
    const result = await this.executeOptimizedQuery<T>(options);

    // Mettre en cache
    this.queryCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });

    logger.debug(`Requête mise en cache: ${cacheKey}`);
    return result;
  }

  /**
   * Invalide le cache pour une clé spécifique
   */
  invalidateCache(cacheKey: string): void {
    this.queryCache.delete(cacheKey);
    logger.debug(`Cache invalidé: ${cacheKey}`);
  }

  /**
   * Nettoie le cache expiré
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of Array.from(this.queryCache.entries())) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`${cleaned} entrées de cache nettoyées`);
    }
  }

  /**
   * Requête pour les statistiques avec agrégation optimisée
   */
  async getOptimizedStats(
    collectionName: string,
    dateField: string,
    dateRange: { start: Date; end: Date },
    groupBy?: string
  ): Promise<any[]> {
    const startTime = Date.now();

    try {
      const constraints: any[] = [
        where(dateField, '>=', Timestamp.fromDate(dateRange.start)),
        where(dateField, '<=', Timestamp.fromDate(dateRange.end)),
        orderBy(dateField, 'desc')
      ];

      if (groupBy) {
        constraints.push(orderBy(groupBy));
      }

      const q = query(collection(this.db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const executionTime = Date.now() - startTime;
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      logger.debug(`Statistiques optimisées récupérées en ${executionTime}ms: ${data.length} documents`);

      return data;

    } catch (error) {
      logger.error("Erreur lors de la récupération des statistiques:", error);
      throw error;
    }
  }

  /**
   * Requête de recherche optimisée avec index
   */
  async searchQuery<T = FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    searchField: string,
    searchTerm: string,
    options: {
      limitCount?: number;
      caseSensitive?: boolean;
      fuzzyMatch?: boolean;
    } = {}
  ): Promise<T[]> {
    const startTime = Date.now();

    try {
      // Pour les recherches textuelles, utiliser des indexes composites
      // Ici on utilise une approche simplifiée
      const constraints: any[] = [
        orderBy(searchField),
        limit(options.limitCount || 50)
      ];

      // Ajouter une contrainte de recherche si nécessaire
      if (!options.fuzzyMatch) {
        constraints.unshift(where(searchField, '>=', searchTerm));
        constraints.splice(1, 0, where(searchField, '<=', searchTerm + '\uf8ff'));
      }

      const q = query(collection(this.db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const executionTime = Date.now() - startTime;

      // Filtrage côté client pour les recherches floues
      let results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      if (options.fuzzyMatch) {
        const searchLower = searchTerm.toLowerCase();
        results = results.filter(item => {
          const fieldValue = (item as any)[searchField];
          return fieldValue && fieldValue.toLowerCase().includes(searchLower);
        });
      }

      logger.debug(`Recherche exécutée en ${executionTime}ms: ${results.length} résultats`);

      return results;

    } catch (error) {
      logger.error("Erreur lors de la recherche:", error);
      throw error;
    }
  }

  /**
   * Requête avec timeout pour éviter les blocages
   */
  async queryWithTimeout<T = FirebaseFirestoreTypes.DocumentData>(
    options: QueryOptions,
    timeoutMs: number = 10000
  ): Promise<PaginatedResult<T>> {
    return Promise.race([
      this.executeOptimizedQuery<T>(options),
      new Promise<PaginatedResult<T>>((_, reject) =>
        setTimeout(() => reject(new Error(`Query timeout après ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Obtient les statistiques des requêtes
   */
  getQueryStats() {
    return {
      cacheSize: this.queryCache.size,
      cacheEntries: Array.from(this.queryCache.keys()),
      timestamp: Date.now()
    };
  }

  /**
   * Précharge des données pour anticiper les besoins
   */
  async preloadDataForLikelyQueries(userRole: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Précharger les requêtes courantes selon le rôle
      const preloadPromises: Promise<any>[] = [];

      if (userRole === 'super_admin') {
        // Précharger la liste des utilisateurs récents
        preloadPromises.push(
          this.cachedQuery('preload_users', {
            collectionName: 'users',
            orderBy: { field: 'createdAt', direction: 'desc' },
            limitCount: 20
          }, 10)
        );

        // Précharger les statistiques récentes
        preloadPromises.push(
          this.cachedQuery('preload_stats', {
            collectionName: 'adminStats',
            orderBy: { field: 'timestamp', direction: 'desc' },
            limitCount: 10
          }, 5)
        );
      }

      await Promise.allSettled(preloadPromises);

      const executionTime = Date.now() - startTime;
      logger.info(`Préchargement des données terminé en ${executionTime}ms`);

    } catch (error) {
      logger.error("Erreur lors du préchargement:", error);
    }
  }
}

export const adminFirestoreOptimizer = new AdminFirestoreOptimizer();

// Nettoyage périodique du cache
setInterval(() => {
  adminFirestoreOptimizer.cleanupExpiredCache();
}, 5 * 60 * 1000); // Toutes les 5 minutes
