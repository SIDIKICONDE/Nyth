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

const logger = createLogger("SubscriptionService");

const COLLECTION_NAME = "subscriptions";
// Doit correspondre aux règles Firestore et aux Cloud Functions
const USAGE_COLLECTION = "usage_stats";

class SubscriptionService {
  /**
   * Créer ou mettre à jour un abonnement
   */
  async createOrUpdateSubscription(
    userId: string,
    subscription: Subscription
  ): Promise<void> {
    try {
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
      logger.info("✅ Abonnement créé/mis à jour:", subscription.planId);
    } catch (error) {
      logger.error("❌ Erreur création abonnement:", error);
      throw error;
    }
  }

  /**
   * Obtenir l'abonnement d'un utilisateur
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const db = getFirestore(getApp());
      const subscriptionRef = doc(collection(db, COLLECTION_NAME), userId);
      const snap = await getDoc(subscriptionRef);
      return snap.exists() ? (snap.data() as Subscription) : null;
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
   * Obtenir les statistiques d'utilisation
   */
  async getUsageStats(userId: string): Promise<UsageStats | null> {
    try {
      const db = getFirestore(getApp());
      const usageRef = doc(collection(db, USAGE_COLLECTION), userId);
      const snap = await getDoc(usageRef);

      if (!snap.exists()) {
        return null;
      }

      const data = snap.data() as Record<string, unknown>;

      if (data.generations) {
        const generations = data.generations as {
          today?: number;
          thisMonth?: number;
          total?: number;
        };

        const usageStats: UsageStats = {
          generations: {
            today: generations.today ?? 0,
            thisMonth: generations.thisMonth ?? 0,
            total: generations.total ?? 0,
          },
          limits: (data.limits as { daily?: number; monthly?: number }) || {},
          resetDate: (data.resetDate as string) || new Date().toISOString(),
        };

        return usageStats;
      }

      // Fallback ancien schéma
      const legacy = snap.data() as SubscriptionUsage;
      const usageStats: UsageStats = {
        generations: {
          today: legacy?.usage?.generations || 0,
          thisMonth: legacy?.usage?.generationsMonthly || 0,
          total: legacy?.usage?.generationsTotal || 0,
        },
        limits: {},
        resetDate: new Date().toISOString(),
      };

      return usageStats;
    } catch (error) {
      logger.error("❌ Erreur récupération stats utilisation:", error);
      return null;
    }
  }

  /**
   * Supprimer un abonnement
   */
  async deleteSubscription(userId: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const subscriptionRef = doc(collection(db, COLLECTION_NAME), userId);
      await deleteDoc(subscriptionRef);
      logger.info("✅ Abonnement supprimé");
    } catch (error) {
      logger.error("❌ Erreur suppression abonnement:", error);
      throw error;
    }
  }
}

export default new SubscriptionService();
