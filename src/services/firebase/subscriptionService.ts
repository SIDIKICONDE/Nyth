import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from "@react-native-firebase/firestore";
import {
  Subscription,
  SubscriptionUsage,
  SubscriptionPlan,
  UsageStats,
} from "../../types/subscription";
import { createLogger } from "../../utils/optimizedLogger";
import subscriptionCacheService from "../subscription/SubscriptionCacheService";

const logger = createLogger("SubscriptionService");

const COLLECTION_NAME = "subscriptions";
// Doit correspondre aux règles Firestore et aux Cloud Functions
const USAGE_COLLECTION = "usage_stats";

class SubscriptionService {
  /**
   * Créer ou mettre à jour un abonnement avec cache et retry
   */
  async createOrUpdateSubscription(
    userId: string,
    subscription: Subscription
  ): Promise<void> {
    return this.withRetry(
      async () => {
        const db = getFirestore(getApp());
        const subscriptionRef = doc(collection(db, COLLECTION_NAME), userId);
        await setDoc(
          subscriptionRef,
          {
            ...subscription,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Invalider et mettre à jour le cache
        await subscriptionCacheService.updateCache(userId, subscription as any);

        logger.info("✅ Abonnement créé/mis à jour:", subscription.planId);
      },
      `createOrUpdateSubscription_${userId}`,
      "Erreur création abonnement"
    );
  }

  /**
   * Obtenir l'abonnement d'un utilisateur avec cache intelligent
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      // Utiliser le cache intelligent
      const cachedSubscription = await subscriptionCacheService.getSubscription(userId);
      if (cachedSubscription) {
        return cachedSubscription as Subscription;
      }

      // Fallback vers Firestore avec retry
      return await this.withRetry(
        async () => {
          const db = getFirestore(getApp());
          const subscriptionRef = doc(collection(db, COLLECTION_NAME), userId);
          const snap = await getDoc(subscriptionRef);

          const subscription = snap.exists() ? (snap.data() as Subscription) : null;

          // Mettre en cache même si null
          await subscriptionCacheService.updateCache(userId, subscription as any);

          return subscription;
        },
        `getSubscription_${userId}`,
        "Erreur récupération abonnement"
      );
    } catch (error) {
      logger.error("❌ Erreur récupération abonnement:", error);
      return null;
    }
  }

  /**
   * Écouter les changements d'abonnement
   */
  onSubscriptionChange(
    userId: string,
    callback: (subscription: Subscription | null) => void
  ): () => void {
    const db = getFirestore(getApp());
    const subscriptionRef = doc(collection(db, COLLECTION_NAME), userId);
    return onSnapshot(
      subscriptionRef,
      (snap) => {
        callback(snap.exists() ? (snap.data() as Subscription) : null);
      },
      (error) => {
        logger.error("❌ Erreur écoute abonnement:", error);
      }
    );
  }

  /**
   * Suivre l'utilisation d'un utilisateur
   */
  async trackUsage(
    userId: string,
    usage: SubscriptionUsage | UsageStats
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const usageRef = doc(collection(db, USAGE_COLLECTION), userId);
      // Supporte à la fois l'ancien schéma { usage: { [feature]: number } }
      // et le nouveau schéma { generations: { today, thisMonth, total }, resetDate }
      const maybeStats = usage as UsageStats;
      const payload =
        (maybeStats as UsageStats).generations !== undefined
          ? {
              generations: {
                today: maybeStats.generations.today ?? 0,
                thisMonth: maybeStats.generations.thisMonth ?? 0,
                total: maybeStats.generations.total ?? 0,
              },
              limits: maybeStats.limits ?? {},
              resetDate: maybeStats.resetDate ?? new Date().toISOString(),
              updatedAt: serverTimestamp(),
            }
          : {
              // Fallback ancien format
              ...(usage as SubscriptionUsage),
              updatedAt: serverTimestamp(),
            };

      await setDoc(usageRef, payload, { merge: true });
      logger.info("✅ Utilisation trackée");
    } catch (error) {
      logger.error("❌ Erreur tracking utilisation:", error);
      throw error;
    }
  }

  /**
   * Obtenir l'utilisation d'un utilisateur
   */
  async getUsage(userId: string): Promise<SubscriptionUsage | null> {
    try {
      const db = getFirestore(getApp());
      const usageRef = doc(collection(db, USAGE_COLLECTION), userId);
      const snap = await getDoc(usageRef);
      return snap.exists() ? (snap.data() as SubscriptionUsage) : null;
    } catch (error) {
      logger.error("❌ Erreur récupération utilisation:", error);
      return null;
    }
  }

  /**
   * Écouter les changements d'utilisation
   */
  onUsageChange(
    userId: string,
    callback: (usage: SubscriptionUsage | null) => void
  ): () => void {
    const db = getFirestore(getApp());
    const usageRef = doc(collection(db, USAGE_COLLECTION), userId);
    return onSnapshot(
      usageRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
          return;
        }

        const data = snap.data() as Record<string, unknown>;
        // Normalise vers le nouveau format UsageStats pour le contexte
        if (data.generations) {
          const generations = data.generations as {
            today?: number;
            thisMonth?: number;
            total?: number;
          };
          const normalised: UsageStats = {
            generations: {
              today: generations.today ?? 0,
              thisMonth: generations.thisMonth ?? 0,
              total: generations.total ?? 0,
            },
            limits: (data.limits as { daily?: number; monthly?: number }) || {},
            resetDate: (data.resetDate as string) || new Date().toISOString(),
          };
          // Cast pour compat avec signature existante
          callback(normalised as unknown as SubscriptionUsage);
        } else {
          // Ancien format inchangé
          callback(snap.data() as SubscriptionUsage);
        }
      },
      (error) => {
        logger.error("❌ Erreur écoute utilisation:", error);
      }
    );
  }

  /**
   * Incrémenter l'utilisation d'une fonctionnalité
   */
  async incrementUsage(
    userId: string,
    feature: string,
    amount: number = 1
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const usageRef = doc(collection(db, USAGE_COLLECTION), userId);
      // Nouveau schéma: met à jour les compteurs generations
      if (feature === "generations") {
        await setDoc(
          usageRef,
          {
            generations: {
              today: increment(amount),
              thisMonth: increment(amount),
              total: increment(amount),
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        // Fallback ancien schéma si jamais utilisé
        await setDoc(
          usageRef,
          {
            [`usage.${feature}`]: increment(amount),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      logger.info("✅ Utilisation incrémentée:", feature);
    } catch (error) {
      logger.error("❌ Erreur incrémentation utilisation:", error);
      throw error;
    }
  }

  /**
   * Réinitialiser l'utilisation mensuelle
   */
  async resetMonthlyUsage(userId: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const usageRef = doc(collection(db, USAGE_COLLECTION), userId);
      await updateDoc(usageRef, {
        usage: {},
        lastResetDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      logger.info("✅ Utilisation mensuelle réinitialisée");
    } catch (error) {
      logger.error("❌ Erreur réinitialisation utilisation:", error);
      throw error;
    }
  }

  /**
   * Vérifier si un utilisateur peut utiliser une fonctionnalité
   */
  async canUseFeature(
    userId: string,
    feature: string,
    requiredAmount: number = 1
  ): Promise<boolean> {
    try {
      const subscription = await this.getSubscription(userId);
      const usage = await this.getUsage(userId);

      if (!subscription) {
        return false;
      }

      // Vérifier les limites du plan
      const planLimits = subscription.planLimits;
      if (!planLimits || !planLimits[feature]) {
        return true; // Pas de limite définie
      }

      const currentUsage = usage?.usage?.[feature] || 0;
      const limit = planLimits[feature];

      return currentUsage + requiredAmount <= limit;
    } catch (error) {
      logger.error("❌ Erreur vérification fonctionnalité:", error);
      return false;
    }
  }

  /**
   * Obtenir les statistiques d'utilisation avec cache intelligent
   */
  async getUsageStats(userId: string): Promise<UsageStats | null> {
    try {
      // Utiliser le cache intelligent
      const cachedUsage = await subscriptionCacheService.getUsageStats(userId);
      if (cachedUsage) {
        return cachedUsage;
      }

      // Fallback vers Firestore avec retry
      return await this.withRetry(
        async () => {
          const db = getFirestore(getApp());
          const usageRef = doc(collection(db, USAGE_COLLECTION), userId);
          const snap = await getDoc(usageRef);

          if (!snap.exists()) {
            // Mettre en cache même si null
            await subscriptionCacheService.updateCache(userId, undefined, null);
            return null;
          }

          const data = snap.data() as Record<string, unknown>;
          let usageStats: UsageStats;

          if (data.generations) {
            const generations = data.generations as {
              today?: number;
              thisMonth?: number;
              total?: number;
            };

            usageStats = {
              generations: {
                today: generations.today ?? 0,
                thisMonth: generations.thisMonth ?? 0,
                total: generations.total ?? 0,
              },
              limits: (data.limits as { daily?: number; monthly?: number }) || {},
              resetDate: (data.resetDate as string) || new Date().toISOString(),
            };
          } else {
            // Fallback ancien schéma
            const legacy = snap.data() as SubscriptionUsage;
            usageStats = {
              generations: {
                today: legacy?.usage?.generations || 0,
                thisMonth: legacy?.usage?.generationsMonthly || 0,
                total: legacy?.usage?.generationsTotal || 0,
              },
              limits: {},
              resetDate: new Date().toISOString(),
            };
          }

          // Mettre en cache
          await subscriptionCacheService.updateCache(userId, undefined, usageStats);

          return usageStats;
        },
        `getUsageStats_${userId}`,
        "Erreur récupération stats utilisation"
      );
    } catch (error) {
      logger.error("❌ Erreur récupération stats utilisation:", error);
      return null;
    }
  }

  /**
   * Supprimer un abonnement avec cache et retry
   */
  async deleteSubscription(userId: string): Promise<void> {
    return this.withRetry(
      async () => {
        const db = getFirestore(getApp());
        const subscriptionRef = doc(collection(db, COLLECTION_NAME), userId);
        await deleteDoc(subscriptionRef);

        // Invalider le cache
        await subscriptionCacheService.invalidateCache(userId);

        logger.info("✅ Abonnement supprimé");
      },
      `deleteSubscription_${userId}`,
      "Erreur suppression abonnement"
    );
  }

  /**
   * Wrapper avec retry automatique et backoff exponentiel
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    errorMessage: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        logger.warn(`⚠️ Tentative ${attempt}/${maxRetries} échouée pour ${operationId}:`, error);

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          logger.info(`⏳ Retry dans ${delay}ms pour ${operationId}`);

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`❌ ${errorMessage} après ${maxRetries} tentatives:`, lastError);
    throw lastError;
  }

  /**
   * Obtenir les statistiques de santé du service
   */
  getHealthStatus() {
    return {
      cacheStats: subscriptionCacheService.getCacheStats(),
      isHealthy: true, // À améliorer avec des checks réels
      lastError: null,
      timestamp: Date.now(),
    };
  }

  /**
   * Forcer le refresh du cache pour un utilisateur
   */
  async refreshCache(userId: string): Promise<void> {
    await subscriptionCacheService.invalidateCache(userId);
    logger.info("🗑️ Cache forcé pour:", userId);
  }
}

export default new SubscriptionService();
