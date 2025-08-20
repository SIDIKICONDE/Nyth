// utils/contextual-messages/cache/OptimizedMessageCache.ts
import { createLogger } from "@/utils/optimizedLogger";
import {
  ContextualMessage,
  UserContext,
} from "@/utils/contextual-messages/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MessageCacheManager } from "@/utils/contextual-messages/core/MessageCacheManager";

const logger = createLogger("OptimizedMessageCache");

interface CacheMetadata {
  version: string;
  lastCleanup: number;
  totalHits: number;
  totalMisses: number;
}

interface MessageCacheEntry {
  message: ContextualMessage;
  context: Partial<UserContext>;
  hits: number;
  lastAccess: number;
  score: number;
}

export class OptimizedMessageCache {
  private static instance: OptimizedMessageCache;
  private readonly VERSION = "2.0.0";
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 heures
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 heure

  private metadata: CacheMetadata;
  private indexedCache: Map<string, Set<string>> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private messageCache = new MessageCacheManager();

  private constructor() {
    this.metadata = {
      version: this.VERSION,
      lastCleanup: Date.now(),
      totalHits: 0,
      totalMisses: 0,
    };
    this.initialize();
  }

  static getInstance(): OptimizedMessageCache {
    if (!this.instance) {
      this.instance = new OptimizedMessageCache();
    }
    return this.instance;
  }

  private async initialize() {
    await this.loadMetadata();
    await this.buildIndex();
    this.startCleanupScheduler();
  }

  /**
   * Génère une clé de cache intelligente
   */
  private generateCacheKey(context: UserContext): string {
    // Clé basée sur les facteurs les plus discriminants
    const factors = [
      context.skillLevel,
      context.isFirstLogin ? "new" : "existing",
      Math.floor(context.scriptsCount / 10) * 10, // Groupes de 10
      context.timeOfDay,
      context.preferredMessageTone,
      context.productivityTrend,
    ];

    return `msg_${factors.join("_")}`;
  }

  /**
   * Génère des tags pour l'indexation
   */
  private generateTags(context: UserContext): string[] {
    const tags: string[] = [];

    // Tags basés sur le niveau
    tags.push(`level:${context.skillLevel}`);

    // Tags basés sur l'activité
    if (context.scriptsCount === 0) tags.push("no-scripts");
    else if (context.scriptsCount < 5) tags.push("few-scripts");
    else if (context.scriptsCount < 20) tags.push("moderate-scripts");
    else tags.push("many-scripts");

    // Tags basés sur l'engagement
    if (context.consecutiveDays > 7) tags.push("engaged");
    if (context.engagementScore > 70) tags.push("high-engagement");

    // Tags temporels
    tags.push(`time:${context.timeOfDay}`);
    tags.push(`day:${context.dayOfWeek}`);

    return tags;
  }

  /**
   * Ajoute un message au cache avec indexation
   */
  async set(context: UserContext, message: ContextualMessage): Promise<void> {
    const key = this.generateCacheKey(context);
    const tags = this.generateTags(context);

    // Créer l'entrée de cache
    const entry: MessageCacheEntry = {
      message,
      context: this.extractRelevantContext(context),
      hits: 0,
      lastAccess: Date.now(),
      score: message.scoring?.totalScore || 0,
    };

    // Stocker dans le cache mémoire existant
    await this.messageCache.cacheMessage(context, message);

    // Mettre à jour l'index
    tags.forEach((tag) => {
      if (!this.indexedCache.has(tag)) {
        this.indexedCache.set(tag, new Set());
      }
      this.indexedCache.get(tag)!.add(key);
    });

    // Persister si nécessaire
    if (Math.random() < 0.1) {
      // 10% de chance de persister
      await this.persistToDisk(key, entry);
    }

    logger.debug(`Message mis en cache: ${key} avec ${tags.length} tags`);
  }

  /**
   * Récupère un message du cache
   */
  async get(context: UserContext): Promise<ContextualMessage | null> {
    const key = this.generateCacheKey(context);

    // Essayer le cache mémoire d'abord
    const cached = await this.messageCache.getCachedMessage(context);
    if (cached) {
      return cached;
    }

    const entry = await this.loadFromDisk(key);

    // Si trouvé sur disque, l'ajouter au cache mémoire existant
    if (!entry) {
      return null;
    }
    await this.messageCache.cacheMessage(context, entry.message);

    if (entry) {
      // Mettre à jour les statistiques
      entry.hits++;
      entry.lastAccess = Date.now();
      this.metadata.totalHits++;

      // Vérifier la fraîcheur
      if (this.isStale(entry)) {
        logger.debug(`Message périmé: ${key}`);
        await this.invalidate(key);
        this.metadata.totalMisses++;
        return null;
      }

      logger.debug(`Cache hit: ${key}`);
      return entry.message;
    }

    // Recherche floue par tags
    const similarMessage = await this.findSimilarMessage(context);
    if (similarMessage) {
      logger.debug(`Message similaire trouvé pour: ${key}`);
      return similarMessage;
    }

    this.metadata.totalMisses++;
    logger.debug(`Cache miss: ${key}`);
    return null;
  }

  /**
   * Recherche un message similaire par tags
   */
  private async findSimilarMessage(
    context: UserContext
  ): Promise<ContextualMessage | null> {
    const tags = this.generateTags(context);
    const candidateKeys = new Set<string>();

    // Collecter les clés candidates
    for (const tag of tags) {
      const keys = this.indexedCache.get(tag);
      if (keys) {
        keys.forEach((k) => candidateKeys.add(k));
      }
    }

    // Scorer les candidats
    const candidates: {
      key: string;
      score: number;
      entry: MessageCacheEntry;
    }[] = [];

    for (const key of candidateKeys) {
      const entry = await this.loadFromDisk(key);
      if (entry && !this.isStale(entry)) {
        const similarity = this.calculateSimilarity(context, entry.context);
        candidates.push({ key, score: similarity * entry.score, entry });
      }
    }

    // Retourner le meilleur candidat
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];

      // Mettre à jour les stats
      best.entry.hits++;
      best.entry.lastAccess = Date.now();

      return best.entry.message;
    }

    return null;
  }

  /**
   * Calcule la similarité entre deux contextes
   */
  private calculateSimilarity(
    context1: UserContext,
    context2: Partial<UserContext>
  ): number {
    let score = 0;
    let factors = 0;

    // Facteurs critiques
    if (context2.skillLevel === context1.skillLevel) score += 3;
    if (context2.isFirstLogin === context1.isFirstLogin) score += 3;
    factors += 6;

    // Facteurs importants
    if (context2.timeOfDay === context1.timeOfDay) score += 2;
    if (context2.preferredMessageTone === context1.preferredMessageTone)
      score += 2;
    factors += 4;

    // Facteurs secondaires
    if (context2.productivityTrend === context1.productivityTrend) score += 1;
    if (context2.dayOfWeek === context1.dayOfWeek) score += 1;
    factors += 2;

    return score / factors;
  }

  /**
   * Extrait le contexte pertinent pour le cache
   */
  private extractRelevantContext(context: UserContext): Partial<UserContext> {
    return {
      skillLevel: context.skillLevel,
      isFirstLogin: context.isFirstLogin,
      scriptsCount: context.scriptsCount,
      timeOfDay: context.timeOfDay,
      dayOfWeek: context.dayOfWeek,
      preferredMessageTone: context.preferredMessageTone,
      productivityTrend: context.productivityTrend,
      consecutiveDays: context.consecutiveDays,
      engagementScore: context.engagementScore,
    };
  }

  /**
   * Vérifie si une entrée est périmée
   */
  private isStale(entry: MessageCacheEntry): boolean {
    const age = Date.now() - entry.lastAccess;
    const maxAge = this.calculateMaxAge(entry);
    return age > maxAge;
  }

  /**
   * Calcule l'âge maximum d'une entrée basé sur sa popularité
   */
  private calculateMaxAge(entry: MessageCacheEntry): number {
    const baseAge = this.MAX_AGE_MS;
    const popularityBonus = Math.min(entry.hits * 0.1, 0.5); // Max 50% bonus
    return baseAge * (1 + popularityBonus);
  }

  /**
   * Invalide une entrée de cache
   */
  private async invalidate(key: string): Promise<void> {
    await this.removeFromDisk(key);

    // Nettoyer l'index
    for (const [tag, keys] of this.indexedCache.entries()) {
      keys.delete(key);
      if (keys.size === 0) {
        this.indexedCache.delete(tag);
      }
    }
  }

  /**
   * Nettoie le cache périodiquement
   */
  private async performCleanup(): Promise<void> {
    logger.info("🧹 Nettoyage du cache des messages...");

    const now = Date.now();
    let cleaned = 0;

    // Nettoyer les entrées périmées
    const allKeys = await this.getAllCacheKeys();

    for (const key of allKeys) {
      const entry = await this.loadFromDisk(key);
      if (entry && this.isStale(entry)) {
        await this.invalidate(key);
        cleaned++;
      }
    }

    // Limiter la taille du cache
    if (allKeys.length > this.MAX_CACHE_SIZE) {
      const entries: { key: string; entry: MessageCacheEntry }[] = [];

      for (const key of allKeys) {
        const entry = await this.loadFromDisk(key);
        if (entry) {
          entries.push({ key, entry });
        }
      }

      // Trier par score LRU (dernière utilisation + hits)
      entries.sort((a, b) => {
        const scoreA = a.entry.lastAccess + a.entry.hits * 1000;
        const scoreB = b.entry.lastAccess + b.entry.hits * 1000;
        return scoreB - scoreA;
      });

      // Garder seulement les meilleurs
      const toKeep = entries.slice(0, this.MAX_CACHE_SIZE);
      const toRemove = entries.slice(this.MAX_CACHE_SIZE);

      for (const { key } of toRemove) {
        await this.invalidate(key);
        cleaned++;
      }
    }

    this.metadata.lastCleanup = now;
    await this.saveMetadata();

    logger.info(`✅ Nettoyage terminé: ${cleaned} entrées supprimées`);
  }

  /**
   * Démarre le scheduler de nettoyage
   */
  private startCleanupScheduler(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Construit l'index à partir du cache existant
   */
  private async buildIndex(): Promise<void> {
    const keys = await this.getAllCacheKeys();

    for (const key of keys) {
      const entry = await this.loadFromDisk(key);
      if (entry && entry.context) {
        const tags = this.generateTags(entry.context as UserContext);
        tags.forEach((tag) => {
          if (!this.indexedCache.has(tag)) {
            this.indexedCache.set(tag, new Set());
          }
          this.indexedCache.get(tag)!.add(key);
        });
      }
    }

    logger.info(`Index construit: ${this.indexedCache.size} tags`);
  }

  /**
   * Obtient toutes les clés du cache
   */
  private async getAllCacheKeys(): Promise<string[]> {
    const keys: string[] = [];

    // Récupérer depuis AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter((k) => k.startsWith("@message_cache_"));

    for (const key of cacheKeys) {
      keys.push(key.replace("@message_cache_", ""));
    }

    return keys;
  }

  /**
   * Persiste une entrée sur le disque
   */
  private async persistToDisk(
    key: string,
    entry: MessageCacheEntry
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `@message_cache_${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      logger.error("Erreur persistance cache:", error);
    }
  }

  /**
   * Charge une entrée depuis le disque
   */
  private async loadFromDisk(key: string): Promise<MessageCacheEntry | null> {
    try {
      const data = await AsyncStorage.getItem(`@message_cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error("Erreur chargement cache:", error);
      return null;
    }
  }

  /**
   * Supprime une entrée du disque
   */
  private async removeFromDisk(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@message_cache_${key}`);
    } catch (error) {
      logger.error("Erreur suppression cache:", error);
    }
  }

  /**
   * Charge les métadonnées
   */
  private async loadMetadata(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem("@message_cache_metadata");
      if (data) {
        const saved = JSON.parse(data);
        if (saved.version === this.VERSION) {
          this.metadata = saved;
        }
      }
    } catch (error) {
      logger.error("Erreur chargement métadonnées:", error);
    }
  }

  /**
   * Sauvegarde les métadonnées
   */
  private async saveMetadata(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        "@message_cache_metadata",
        JSON.stringify(this.metadata)
      );
    } catch (error) {
      logger.error("Erreur sauvegarde métadonnées:", error);
    }
  }

  /**
   * Obtient les statistiques du cache
   */
  getStatistics() {
    const hitRate =
      this.metadata.totalHits /
        (this.metadata.totalHits + this.metadata.totalMisses) || 0;

    return {
      version: this.metadata.version,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.metadata.totalHits,
      totalMisses: this.metadata.totalMisses,
      lastCleanup: new Date(this.metadata.lastCleanup).toISOString(),
      indexSize: this.indexedCache.size,
      cacheKeys: this.getAllCacheKeys().then((keys) => keys.length),
    };
  }

  /**
   * Nettoie toutes les ressources
   */
  cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.indexedCache.clear();
    this.saveMetadata();
  }
}

export const optimizedMessageCache = OptimizedMessageCache.getInstance();
