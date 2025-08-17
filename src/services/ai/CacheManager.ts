import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIPrompt, AIGenerationOptions, AIServiceResponse } from '../../types/ai';
import { createLogger } from '../../utils/optimizedLogger';

// Logger spécifique pour le gestionnaire de cache
const logger = createLogger('CacheManager');

// Clé de stockage pour le cache
const CACHE_STORAGE_KEY = 'ai_response_cache';

// Durée de validité du cache (en millisecondes)
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 heures

// Interface pour un élément en cache
interface CacheEntry {
  prompt: AIPrompt;
  options: AIGenerationOptions;
  response: AIServiceResponse;
  timestamp: number;
  provider: string;
}

export class CacheManager {
  // Cache en mémoire pour accès rapide
  private static memoryCache: Record<string, CacheEntry> = {};
  
  /**
   * Génère une clé de cache basée sur le prompt et les options
   */
  private static generateCacheKey(prompt: AIPrompt, options: AIGenerationOptions): string {
    // Créer un objet de cache qui contient uniquement les propriétés pertinentes
    const cacheObj = {
      topic: prompt.topic,
      tone: prompt.tone,
      platform: prompt.platform,
      language: prompt.language,
      duration: prompt.duration,
      creativity: prompt.creativity,
      includeHooks: options.includeHooks,
      includeCallToAction: options.includeCallToAction,
      includeHashtags: options.includeHashtags,
      narrativeStructure: prompt.narrativeStructure,
      emotionalTone: prompt.emotionalTone
    };
    
    return JSON.stringify(cacheObj);
  }
  
  /**
   * Charge le cache depuis le stockage persistant
   */
  private static async loadCache(): Promise<Record<string, CacheEntry>> {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
      if (!cacheData) return {};
      
      const parsedCache = JSON.parse(cacheData);
      
      // Mettre à jour le cache en mémoire
      this.memoryCache = parsedCache;
      
      return parsedCache;
    } catch (error) {
      logger.error('Erreur lors du chargement du cache', error);
      return {};
    }
  }
  
  /**
   * Sauvegarde le cache dans le stockage persistant
   */
  private static async saveCache(cache: Record<string, CacheEntry>): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du cache', error);
    }
  }
  
  /**
   * Vérifie si une entrée du cache est toujours valide
   */
  private static isCacheEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return now - entry.timestamp < CACHE_TTL;
  }
  
  /**
   * Récupère une réponse en cache
   * @returns La réponse en cache si elle existe et est valide, null sinon
   */
  public static async getCachedResponse(
    prompt: AIPrompt, 
    options: AIGenerationOptions
  ): Promise<AIServiceResponse | null> {
    const cacheKey = this.generateCacheKey(prompt, options);
    
    // Vérifier d'abord le cache en mémoire
    if (this.memoryCache[cacheKey] && this.isCacheEntryValid(this.memoryCache[cacheKey])) {
      logger.info('Réponse trouvée dans le cache mémoire', { 
        topic: prompt.topic,
        provider: this.memoryCache[cacheKey].provider
      });
      return this.memoryCache[cacheKey].response;
    }
    
    // Sinon, charger depuis le stockage
    const cache = await this.loadCache();
    
    if (cache[cacheKey] && this.isCacheEntryValid(cache[cacheKey])) {
      logger.info('Réponse trouvée dans le cache persistant', { 
        topic: prompt.topic,
        provider: cache[cacheKey].provider
      });
      return cache[cacheKey].response;
    }
    
    return null;
  }
  
  /**
   * Ajoute une réponse au cache
   */
  public static async cacheResponse(
    prompt: AIPrompt, 
    options: AIGenerationOptions, 
    response: AIServiceResponse,
    provider: string
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(prompt, options);
    
    // Créer l'entrée de cache
    const cacheEntry: CacheEntry = {
      prompt,
      options,
      response,
      timestamp: Date.now(),
      provider
    };
    
    // Mettre à jour le cache en mémoire
    this.memoryCache[cacheKey] = cacheEntry;
    
    // Charger le cache existant
    const cache = await this.loadCache();
    
    // Ajouter la nouvelle entrée
    cache[cacheKey] = cacheEntry;
    
    // Nettoyer les entrées expirées
    this.cleanCache(cache);
    
    // Sauvegarder le cache mis à jour
    await this.saveCache(cache);
    
    logger.info('Réponse ajoutée au cache', { 
      topic: prompt.topic,
      provider
    });
  }
  
  /**
   * Nettoie les entrées expirées du cache
   */
  private static cleanCache(cache: Record<string, CacheEntry>): void {
    const now = Date.now();
    
    Object.keys(cache).forEach(key => {
      if (now - cache[key].timestamp >= CACHE_TTL) {
        delete cache[key];
      }
    });
  }
  
  /**
   * Vide le cache
   */
  public static async clearCache(): Promise<void> {
    try {
      // Supprimer le cache en mémoire
      this.memoryCache = {};
      // Supprimer le cache persistant
      await AsyncStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Nettoyer le cache pour un fournisseur spécifique
   */
  public static async clearCacheForProvider(provider: string): Promise<void> {
    try {
      // Récupérer le cache actuel
      const cacheData = await this.loadCache();

      // Filtrer pour supprimer les entrées du fournisseur spécifié
      let entriesRemoved = 0;

      Object.keys(cacheData).forEach(key => {
        if (cacheData[key].provider === provider) {
          delete cacheData[key];
          entriesRemoved++;
        }
      });

      // Mettre à jour le cache en mémoire
      this.memoryCache = cacheData;

      // Sauvegarder le cache mis à jour
      await this.saveCache(cacheData);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Obtient des statistiques sur le cache
   */
  public static async getCacheStats(): Promise<{
    entryCount: number;
    sizeInBytes: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    const cache = await this.loadCache();
    const entries = Object.values(cache);
    
    if (entries.length === 0) {
      return {
        entryCount: 0,
        sizeInBytes: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }
    
    const timestamps = entries.map(entry => entry.timestamp);
    const cacheString = JSON.stringify(cache);
    
    return {
      entryCount: entries.length,
      sizeInBytes: new Blob([cacheString]).size,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }
} 