import { createLogger } from "@/utils/optimizedLogger";
import { ContextualMessage, UserContext } from "../types";
import { generateCacheKey } from "../utils/MessageUtils";

const logger = createLogger("MessageCacheManager");

/**
 * Gestionnaire de cache pour les messages contextuels
 */
export class MessageCacheManager {
  private messageCache: Map<string, ContextualMessage[]> = new Map();
  private maxCacheSize: number = 10;

  /**
   * Récupère un message depuis le cache
   */
  async getCachedMessage(
    context: UserContext
  ): Promise<ContextualMessage | null> {
    const cacheKey = generateCacheKey(context);
    const cached = this.messageCache.get(cacheKey);

    if (cached && cached.length > 0) {
      // Retourner un message aléatoire du cache
      const randomIndex = Math.floor(Math.random() * cached.length);
      logger.info("Message trouvé dans le cache", {
        cacheKey,
        messagesCount: cached.length,
      });
      return cached[randomIndex];
    }

    return null;
  }

  /**
   * Met en cache un message
   */
  async cacheMessage(
    context: UserContext,
    message: ContextualMessage
  ): Promise<void> {
    const cacheKey = generateCacheKey(context);
    const cached = this.messageCache.get(cacheKey) || [];

    // Limiter la taille du cache par clé
    if (cached.length >= this.maxCacheSize) {
      cached.shift(); // Retirer le plus ancien
    }

    cached.push(message);
    this.messageCache.set(cacheKey, cached);

    logger.info("Message ajouté au cache", {
      cacheKey,
      cacheSize: cached.length,
    });
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.messageCache.clear();
    logger.info("Cache vidé");
  }

  /**
   * Obtient la taille actuelle du cache
   */
  getCacheSize(): number {
    let totalSize = 0;
    this.messageCache.forEach((messages) => {
      totalSize += messages.length;
    });
    return totalSize;
  }

  /**
   * Configure la taille maximale du cache
   */
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
  }
}
