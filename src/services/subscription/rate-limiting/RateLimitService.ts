import { RateLimitEntry } from "../types/api";
import { RATE_LIMITS } from "../../../constants/subscriptionPlans";
import { createLogger } from "../../../utils/optimizedLogger";

const logger = createLogger("RateLimitService");

export class RateLimitService {
  private static cache = new Map<string, RateLimitEntry>();

  /**
   * Vérifie les limites de taux pour un utilisateur
   */
  static checkRateLimit(
    userId: string,
    planId: string
  ): {
    allowed: boolean;
    remainingMinute?: number;
    remainingDay?: number;
    resetTime?: number;
  } {
    const limits =
      RATE_LIMITS[planId as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;
    const cacheKey = `${userId}-${planId}`;
    const now = Date.now();
    const minuteMs = 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;

    let cached = this.cache.get(cacheKey);

    // Initialiser si pas de cache
    if (!cached) {
      cached = {
        count: 0,
        resetTime: now + minuteMs,
        dailyCount: 0,
        dailyResetTime: now + dayMs,
      };
      this.cache.set(cacheKey, cached);
    }

    // Reset compteur par minute si nécessaire
    if (cached.resetTime <= now) {
      cached.count = 0;
      cached.resetTime = now + minuteMs;
    }

    // Reset compteur journalier si nécessaire
    if (cached.dailyResetTime <= now) {
      cached.dailyCount = 0;
      cached.dailyResetTime = now + dayMs;
    }

    // Vérifier les limites
    const minuteExceeded = cached.count >= limits.requestsPerMinute;
    const dayExceeded = cached.dailyCount >= limits.requestsPerDay;

    if (minuteExceeded || dayExceeded) {
      return {
        allowed: false,
        remainingMinute: Math.max(0, limits.requestsPerMinute - cached.count),
        remainingDay: Math.max(0, limits.requestsPerDay - cached.dailyCount),
        resetTime: minuteExceeded ? cached.resetTime : cached.dailyResetTime,
      };
    }

    // Incrémenter les compteurs
    cached.count++;
    cached.dailyCount++;

    return {
      allowed: true,
      remainingMinute: Math.max(0, limits.requestsPerMinute - cached.count),
      remainingDay: Math.max(0, limits.requestsPerDay - cached.dailyCount),
    };
  }

  /**
   * Remet à zéro les compteurs pour un utilisateur
   */
  static resetUserLimits(userId: string, planId: string): void {
    const cacheKey = `${userId}-${planId}`;
    this.cache.delete(cacheKey);
    logger.info(`Reset rate limits for user ${userId} on plan ${planId}`);
  }

  /**
   * Nettoie le cache des entrées expirées
   */
  static cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Utilisation d'Array.from pour compatibilité avec les anciennes versions TS
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.dailyResetTime < now) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  /**
   * Obtient les statistiques actuelles pour un utilisateur
   */
  static getUserStats(
    userId: string,
    planId: string
  ): {
    minuteUsage: number;
    dailyUsage: number;
    limits: { requestsPerMinute: number; requestsPerDay: number };
  } {
    const limits =
      RATE_LIMITS[planId as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;
    const cacheKey = `${userId}-${planId}`;
    const cached = this.cache.get(cacheKey);

    return {
      minuteUsage: cached?.count || 0,
      dailyUsage: cached?.dailyCount || 0,
      limits: {
        requestsPerMinute: limits.requestsPerMinute,
        requestsPerDay: limits.requestsPerDay,
      },
    };
  }
}
