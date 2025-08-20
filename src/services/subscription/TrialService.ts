import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../../utils/optimizedLogger";
import subscriptionService from "../firebase/subscriptionService";
import { UserSubscription } from "../../types/subscription";
import { PaymentService } from "./PaymentService";

const logger = createLogger("TrialService");

export interface TrialInfo {
  planId: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  isActive: boolean;
  isExpired: boolean;
  hasEverTrialed: boolean;
}

export interface TrialEligibility {
  eligible: boolean;
  reason?: string;
  availableTrials: string[];
}

export class TrialService {
  private static readonly TRIAL_DURATION_DAYS = 7;
  private static readonly TRIAL_STORAGE_KEY = "trial_history";

  /**
   * Démarre une période d'essai pour un plan donné
   */
  static async startTrial(
    userId: string,
    planId: string,
    durationDays: number = this.TRIAL_DURATION_DAYS
  ): Promise<{ success: boolean; trial?: TrialInfo; error?: string }> {
    try {
      logger.info(`🆓 Début de l'essai gratuit pour le plan ${planId}, utilisateur: ${userId}`);

      // Vérifier l'éligibilité
      const eligibility = await this.checkTrialEligibility(userId, planId);
      if (!eligibility.eligible) {
        return {
          success: false,
          error: eligibility.reason || "Non éligible à l'essai gratuit",
        };
      }

      const now = new Date();
      const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Créer l'abonnement d'essai
      const trialSubscription: UserSubscription = {
        planId,
        status: "trial",
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        usage: {
          daily: 0,
          monthly: 0,
          total: 0,
          lastReset: now.toISOString(),
        },
      };

      // Sauvegarder l'abonnement
      if (userId) {
        await subscriptionService.createOrUpdateSubscription(userId, trialSubscription);
      }

      // Enregistrer l'historique d'essai
      await this.recordTrialHistory(userId, planId, now.toISOString());

      const trialInfo: TrialInfo = {
        planId,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        daysRemaining: durationDays,
        isActive: true,
        isExpired: false,
        hasEverTrialed: true,
      };

      logger.info(`✅ Essai gratuit démarré avec succès pour le plan ${planId}`);
      return { success: true, trial: trialInfo };
    } catch (error) {
      logger.error("❌ Erreur lors du démarrage de l'essai:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Vérifie l'éligibilité d'un utilisateur pour un essai gratuit
   */
  static async checkTrialEligibility(
    userId: string,
    planId?: string
  ): Promise<TrialEligibility> {
    try {
      // Vérifier l'historique des essais
      const trialHistory = await this.getTrialHistory(userId);
      
      if (planId) {
        // Vérifier un plan spécifique
        if (trialHistory.includes(planId)) {
          return {
            eligible: false,
            reason: `Essai gratuit déjà utilisé pour le plan ${planId}`,
            availableTrials: [],
          };
        }

        return {
          eligible: true,
          availableTrials: [planId],
        };
      }

      // Vérifier tous les plans disponibles
      const allPlans = ["starter", "pro", "enterprise"];
      const availableTrials = allPlans.filter(plan => !trialHistory.includes(plan));

      return {
        eligible: availableTrials.length > 0,
        reason: availableTrials.length === 0 ? "Tous les essais gratuits ont été utilisés" : undefined,
        availableTrials,
      };
    } catch (error) {
      logger.error("❌ Erreur lors de la vérification d'éligibilité:", error);
      return {
        eligible: false,
        reason: "Erreur lors de la vérification",
        availableTrials: [],
      };
    }
  }

  /**
   * Obtient les informations sur l'essai actuel
   */
  static async getCurrentTrialInfo(userId: string): Promise<TrialInfo | null> {
    try {
      const subscription = await subscriptionService.getSubscription(userId);
      
      if (!subscription || subscription.status !== "trial" || !subscription.endDate) {
        return null;
      }

      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      const isExpired = now > endDate;
      const isActive = !isExpired && subscription.status === "trial";

      return {
        planId: subscription.planId,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        daysRemaining,
        isActive,
        isExpired,
        hasEverTrialed: true,
      };
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération des infos d'essai:", error);
      return null;
    }
  }

  /**
   * Vérifie et gère l'expiration des essais
   */
  static async checkTrialExpiration(userId: string): Promise<{ expired: boolean; action?: string }> {
    try {
      const trialInfo = await this.getCurrentTrialInfo(userId);
      
      if (!trialInfo || !trialInfo.isActive) {
        return { expired: false };
      }

      if (trialInfo.isExpired) {
        logger.info(`⏰ Essai gratuit expiré pour l'utilisateur ${userId}, plan: ${trialInfo.planId}`);
        
        // Mettre à jour le statut de l'abonnement
        const expiredSubscription: UserSubscription = {
          planId: "free", // Retour au plan gratuit
          status: "expired",
          startDate: new Date().toISOString(),
          usage: {
            daily: 0,
            monthly: 0,
            total: 0,
            lastReset: new Date().toISOString(),
          },
        };

        await subscriptionService.createOrUpdateSubscription(userId, expiredSubscription);

        return {
          expired: true,
          action: "downgraded_to_free",
        };
      }

      return { expired: false };
    } catch (error) {
      logger.error("❌ Erreur lors de la vérification d'expiration:", error);
      return { expired: false };
    }
  }

  /**
   * Convertit un essai en abonnement payant
   */
  static async convertTrialToSubscription(
    userId: string,
    packageIdentifier: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`💳 Conversion de l'essai en abonnement payant: ${packageIdentifier}`);

      const trialInfo = await this.getCurrentTrialInfo(userId);
      if (!trialInfo || !trialInfo.isActive) {
        return {
          success: false,
          error: "Aucun essai actif à convertir",
        };
      }

      // Effectuer l'achat via PaymentService
      const paymentResult = await PaymentService.purchaseSubscription(packageIdentifier, userId);
      
      if (paymentResult.success) {
        logger.info("✅ Conversion réussie de l'essai en abonnement payant");
        return { success: true };
      } else {
        return {
          success: false,
          error: paymentResult.error || "Échec du paiement",
        };
      }
    } catch (error) {
      logger.error("❌ Erreur lors de la conversion de l'essai:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Annule un essai en cours
   */
  static async cancelTrial(userId: string): Promise<boolean> {
    try {
      logger.info(`🚫 Annulation de l'essai pour l'utilisateur: ${userId}`);

      const freeSubscription: UserSubscription = {
        planId: "free",
        status: "active",
        startDate: new Date().toISOString(),
        usage: {
          daily: 0,
          monthly: 0,
          total: 0,
          lastReset: new Date().toISOString(),
        },
      };

      await subscriptionService.createOrUpdateSubscription(userId, freeSubscription);
      
      logger.info("✅ Essai annulé, retour au plan gratuit");
      return true;
    } catch (error) {
      logger.error("❌ Erreur lors de l'annulation de l'essai:", error);
      return false;
    }
  }

  /**
   * Enregistre l'historique des essais
   */
  private static async recordTrialHistory(
    userId: string,
    planId: string,
    startDate: string
  ): Promise<void> {
    try {
      const key = `${this.TRIAL_STORAGE_KEY}_${userId}`;
      const existing = await AsyncStorage.getItem(key);
      const history = existing ? JSON.parse(existing) : [];
      
      const newEntry = {
        planId,
        startDate,
        timestamp: new Date().toISOString(),
      };

      history.push(newEntry);
      await AsyncStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      logger.error("❌ Erreur lors de l'enregistrement de l'historique d'essai:", error);
    }
  }

  /**
   * Récupère l'historique des essais
   */
  private static async getTrialHistory(userId: string): Promise<string[]> {
    try {
      const key = `${this.TRIAL_STORAGE_KEY}_${userId}`;
      const existing = await AsyncStorage.getItem(key);
      
      if (!existing) {
        return [];
      }

      const history = JSON.parse(existing);
      return history.map((entry: any) => entry.planId);
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération de l'historique d'essai:", error);
      return [];
    }
  }

  /**
   * Génère des suggestions pour maximiser la valeur de l'essai
   */
  static async getTrialOptimizationSuggestions(userId: string): Promise<string[]> {
    try {
      const trialInfo = await this.getCurrentTrialInfo(userId);
      const suggestions: string[] = [];

      if (!trialInfo || !trialInfo.isActive) {
        return suggestions;
      }

      if (trialInfo.daysRemaining <= 2) {
        suggestions.push("⏰ Il ne vous reste que quelques jours d'essai. Profitez-en pour explorer toutes les fonctionnalités !");
        suggestions.push("💳 Pensez à vous abonner pour continuer à profiter des fonctionnalités premium.");
      } else if (trialInfo.daysRemaining <= 5) {
        suggestions.push("🔥 Votre essai se termine bientôt. Testez les fonctionnalités avancées dès maintenant !");
      }

      suggestions.push("📚 Consultez notre guide pour tirer le maximum de votre essai gratuit.");
      suggestions.push("🤖 Essayez différents modèles d'IA pour comparer les résultats.");

      return suggestions;
    } catch (error) {
      logger.error("❌ Erreur lors de la génération des suggestions:", error);
      return [];
    }
  }

  /**
   * Nettoie les données d'essai expirées
   */
  static async cleanupExpiredTrials(): Promise<void> {
    try {
      logger.info("🧹 Nettoyage des données d'essai expirées");
      
      // Cette méthode pourrait être appelée périodiquement pour nettoyer
      // les données d'essai anciennes dans AsyncStorage
      
      logger.info("✅ Nettoyage terminé");
    } catch (error) {
      logger.error("❌ Erreur lors du nettoyage:", error);
    }
  }
}
