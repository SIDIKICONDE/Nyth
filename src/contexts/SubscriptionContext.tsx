import AsyncStorage from "@react-native-async-storage/async-storage";
import { SecureApiKeyManager } from "../services/ai/SecureApiKeyManager";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { SUBSCRIPTION_PLANS } from "../constants/subscriptionPlans";
import { PaymentService } from "../services/subscription/PaymentService";
import { SubscriptionSyncService } from "../services/subscription/SubscriptionSyncService";
import { TrialService } from "../services/subscription/TrialService";
import { UsageTrackingService } from "../services/subscription/usage-tracking/UsageTrackingService";
import subscriptionService from "../services/firebase/subscriptionService";
import {
  SubscriptionPlan,
  UsageStats,
  UserSubscription,
  Subscription,
  SubscriptionUsage,
} from "../types/subscription";
import { useAuth } from "./AuthContext";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('SubscriptionContext');

interface SubscriptionContextType {
  currentPlan: SubscriptionPlan;
  subscription: UserSubscription | null;
  usage: UsageStats;
  isLoading: boolean;

  // Actions
  checkUsageLimit: () => boolean;
  incrementUsage: () => Promise<void>;
  upgradePlan: (planId: string, isYearly: boolean) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  restoreSubscription: () => Promise<boolean>;

  // Helpers
  canUseFeature: (feature: string) => boolean;
  canUseAPI: (api: string) => boolean;
  getRemainingGenerations: () => { daily?: number; monthly?: number };
  isManaged: boolean;

  // Nouveaux services
  startTrial: (planId: string) => Promise<boolean>;
  checkTrialEligibility: (planId?: string) => Promise<{ eligible: boolean; reason?: string }>;
  syncSubscription: () => Promise<boolean>;
  getRealTimeQuotaStats: () => Promise<any>;
  canPerformAction: (actionType: "generation" | "api_call", provider?: string) => Promise<{ allowed: boolean; reason?: string; resetTime?: number }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [usage, setUsage] = useState<UsageStats>({
    generations: {
      today: 0,
      thisMonth: 0,
      total: 0,
    },
    limits: {},
    resetDate: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load subscription data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Si l'utilisateur est connecté, charger depuis Firebase
        if (currentUser?.uid) {
          // Charger l'abonnement depuis Firebase
          const firebaseSubscription = await subscriptionService.getSubscription(
            currentUser.uid
          );

          if (firebaseSubscription) {
            setSubscription(firebaseSubscription as unknown as UserSubscription);
          }

          // Charger les stats d'usage depuis Firebase
          const usageStats = await subscriptionService.getUsageStats(
            currentUser.uid
          );
          if (usageStats) {
            setUsage(usageStats);
          }
        } else {
          // Si l'utilisateur n'est pas connecté, charger depuis AsyncStorage
          const localSubscription = await AsyncStorage.getItem(
            "user_subscription"
          );
          const localUsage = await AsyncStorage.getItem("usage_stats");

          if (localSubscription) {
            setSubscription(JSON.parse(localSubscription));
          }

          if (localUsage) {
            setUsage(JSON.parse(localUsage));
          }
        }
      } catch (error) {
        logger.error("Error loading subscription data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Setup real-time listeners if user is connected
    if (currentUser?.uid) {
      const unsubscribeSubscription = subscriptionService.onSubscriptionChange(
        currentUser.uid,
        (sub: Subscription | null) => {
          if (sub) {
            setSubscription(sub as UserSubscription);
            AsyncStorage.setItem("user_subscription", JSON.stringify(sub));

            // Update usage limits based on plan
            const plan =
              SUBSCRIPTION_PLANS[sub.planId] || SUBSCRIPTION_PLANS.free;
            setUsage((prev) => ({
              ...prev,
              limits: {
                daily: plan.limits.dailyGenerations,
                monthly: plan.limits.monthlyGenerations,
              },
            }));
          }
        }
      );

      const unsubscribeUsage = subscriptionService.onUsageChange(
        currentUser.uid,
        (stats: SubscriptionUsage | null) => {
          if (stats) {
            setUsage(stats as unknown as UsageStats);
            AsyncStorage.setItem("usage_stats", JSON.stringify(stats));
          }
        }
      );

      // Démarrer la synchronisation automatique
      SubscriptionSyncService.startAutoSync(currentUser.uid, 30); // Sync toutes les 30 minutes

      // Cleanup function
      return () => {
        unsubscribeSubscription();
        unsubscribeUsage();
        SubscriptionSyncService.stopAutoSync();
      };
    }

    // Retourner une fonction de nettoyage vide si les conditions ne sont pas remplies
    return () => {};
  }, [currentUser]);



  const checkUsageLimit = (): boolean => {
    const plan = SUBSCRIPTION_PLANS[subscription?.planId || "free"];

    // Check daily limit
    if (
      plan.limits.dailyGenerations &&
      usage.generations.today >= plan.limits.dailyGenerations
    ) {
      return false;
    }

    // Check monthly limit
    if (
      plan.limits.monthlyGenerations &&
      usage.generations.thisMonth >= plan.limits.monthlyGenerations
    ) {
      return false;
    }

    return true;
  };

  const incrementUsage = async () => {
    if (currentUser?.uid) {
      // Utiliser Firebase pour les utilisateurs connectés
      try {
        await subscriptionService.incrementUsage(
          currentUser.uid,
          "generations"
        );
        // L'état sera mis à jour via le listener en temps réel
      } catch (error) {
        logger.error("Error incrementing usage in Firebase:", error);
        // Fallback to local increment
        const newUsage = {
          ...usage,
          generations: {
            today: usage.generations.today + 1,
            thisMonth: usage.generations.thisMonth + 1,
            total: usage.generations.total + 1,
          },
        };
        setUsage(newUsage);
        await AsyncStorage.setItem("usage_stats", JSON.stringify(newUsage));
      }
    } else {
      // Utilisateur non connecté, incrémenter localement
      const newUsage = {
        ...usage,
        generations: {
          today: usage.generations.today + 1,
          thisMonth: usage.generations.thisMonth + 1,
          total: usage.generations.total + 1,
        },
      };

      setUsage(newUsage);
      await AsyncStorage.setItem("usage_stats", JSON.stringify(newUsage));
    }
  };

  const upgradePlan = async (planId: string, isYearlyPlan: boolean): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Si c'est le plan gratuit, pas besoin de paiement
      if (planId === "free") {
        const newSubscription: UserSubscription = {
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

        if (currentUser?.uid) {
          await subscriptionService.createOrUpdateSubscription(
            currentUser.uid,
            newSubscription
          );
        } else {
          setSubscription(newSubscription);
          await AsyncStorage.setItem(
            "user_subscription",
            JSON.stringify(newSubscription)
          );
        }
        return true;
      }

      // Vérifier que l'utilisateur est connecté pour les plans payants
      if (!currentUser?.uid) {
        logger.error("L'utilisateur doit être connecté pour acheter un abonnement");
        return false;
      }

      // Importer la configuration RevenueCat
      const { PLAN_TO_PRODUCT_MAP } = await import('../config/revenuecat');
      
      // Construire la clé du produit basée sur le plan et la période
      const productKey = `${planId}_${isYearlyPlan ? 'yearly' : 'monthly'}`;
      const packageIdentifier = PLAN_TO_PRODUCT_MAP[productKey];

      if (!packageIdentifier) {
        logger.error("Plan non reconnu:", planId);
        return false;
      }

      // Effectuer l'achat via PaymentService
      logger.info("Début du processus d'achat pour le plan:", planId);
      const paymentResult = await PaymentService.purchaseSubscription(
        packageIdentifier,
        currentUser.uid,
        currentUser.email || undefined
      );

      if (!paymentResult.success) {
        logger.error("Échec du paiement:", paymentResult.error);
        return false;
      }

      // L'abonnement a été sauvegardé côté serveur par PaymentService
      // Récupérer l'abonnement mis à jour
      const updatedSubscription = await subscriptionService.getSubscription(currentUser.uid);
      if (updatedSubscription) {
        setSubscription(updatedSubscription as UserSubscription);
      }

      logger.info("✅ Mise à niveau du plan réussie vers:", planId);
      return true;
    } catch (error) {
      logger.error("❌ Erreur lors de la mise à niveau du plan:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (currentUser?.uid) {
        // Annuler via PaymentService pour les utilisateurs connectés
        logger.info("🚫 Début de l'annulation de l'abonnement pour l'utilisateur:", currentUser.uid);
        
        const cancelResult = await PaymentService.cancelSubscription(currentUser.uid);
        
        if (cancelResult.success) {
          logger.info("✅ Abonnement annulé avec succès via PaymentService");
          
          // Marquer l'abonnement comme annulé localement
          if (subscription) {
            const cancelled = {
              ...subscription,
              status: "cancelled" as const,
              endDate: new Date().toISOString(),
            };
            setSubscription(cancelled);
          }
          return true;
        } else {
          logger.error("❌ Échec de l'annulation via PaymentService:", cancelResult.error);
          
          // Fallback: supprimer directement dans Firebase
          await subscriptionService.deleteSubscription(currentUser.uid);
          setSubscription(null);
          logger.info("✅ Abonnement supprimé via fallback Firebase");
          return true;
        }
      } else if (subscription) {
        // Annuler localement pour les utilisateurs non connectés
        const cancelled = {
          ...subscription,
          status: "cancelled" as const,
          endDate: new Date().toISOString(),
        };

        setSubscription(cancelled);
        await AsyncStorage.setItem(
          "user_subscription",
          JSON.stringify(cancelled)
        );
        logger.info("✅ Abonnement annulé localement");
        return true;
      }

      return false;
    } catch (error) {
      logger.error("❌ Erreur lors de l'annulation de l'abonnement:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const restoreSubscription = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (!currentUser?.uid) {
        logger.error("L'utilisateur doit être connecté pour restaurer un abonnement");
        return false;
      }

      logger.info("🔄 Début de la restauration des achats pour l'utilisateur:", currentUser.uid);

      // Tenter de restaurer via PaymentService (RevenueCat)
      const restoreResult = await PaymentService.restorePurchases(currentUser.uid);
      
      if (restoreResult.success) {
        logger.info("✅ Achats restaurés avec succès via RevenueCat");
        
        // Récupérer l'abonnement mis à jour depuis Firebase
        const restoredSubscription = await subscriptionService.getSubscription(currentUser.uid);
        if (restoredSubscription) {
          setSubscription(restoredSubscription as UserSubscription);
          logger.info("✅ Abonnement restauré:", restoredSubscription.planId);
        }
        return true;
      }

      // Fallback: vérifier directement dans Firebase
      logger.info("🔍 Vérification fallback dans Firebase...");
      const existingSubscription = await subscriptionService.getSubscription(currentUser.uid);
      
      if (existingSubscription && existingSubscription.status === "active") {
        setSubscription(existingSubscription as UserSubscription);
        logger.info("✅ Abonnement trouvé dans Firebase:", existingSubscription.planId);
        return true;
      }

      logger.info("ℹ️ Aucun abonnement actif trouvé à restaurer");
      return false;
    } catch (error) {
      logger.error("❌ Erreur lors de la restauration de l'abonnement:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const canUseFeature = (feature: string): boolean => {
    const plan = SUBSCRIPTION_PLANS[subscription?.planId || "free"];
    return plan.limits.features.includes(feature);
  };

  const canUseAPI = (api: string): boolean => {
    const plan = SUBSCRIPTION_PLANS[subscription?.planId || "free"];
    return plan.limits.apis.includes(api) || plan.limits.apis.includes("all");
  };

  const getRemainingGenerations = () => {
    const plan = SUBSCRIPTION_PLANS[subscription?.planId || "free"];

    return {
      daily: plan.limits.dailyGenerations
        ? Math.max(0, plan.limits.dailyGenerations - usage.generations.today)
        : undefined,
      monthly: plan.limits.monthlyGenerations
        ? Math.max(
            0,
            plan.limits.monthlyGenerations - usage.generations.thisMonth
          )
        : undefined,
    };
  };

  // Nouvelles méthodes utilisant nos services avancés
  const startTrial = async (planId: string): Promise<boolean> => {
    try {
      if (!currentUser?.uid) {
        logger.error("L'utilisateur doit être connecté pour démarrer un essai");
        return false;
      }

      setIsLoading(true);
      const result = await TrialService.startTrial(currentUser.uid, planId);
      
      if (result.success && result.trial) {
        // Mettre à jour l'état local
        const trialSubscription: UserSubscription = {
          planId: result.trial.planId,
          status: "trial",
          startDate: result.trial.startDate,
          endDate: result.trial.endDate,
          usage: {
            daily: 0,
            monthly: 0,
            total: 0,
            lastReset: result.trial.startDate,
          },
        };
        setSubscription(trialSubscription);
        logger.info("✅ Essai gratuit démarré:", planId);
        return true;
      }

      logger.error("❌ Échec du démarrage de l'essai:", result.error);
      return false;
    } catch (error) {
      logger.error("❌ Erreur lors du démarrage de l'essai:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkTrialEligibility = async (planId?: string): Promise<{ eligible: boolean; reason?: string }> => {
    try {
      if (!currentUser?.uid) {
        return { eligible: false, reason: "Utilisateur non connecté" };
      }

      const eligibility = await TrialService.checkTrialEligibility(currentUser.uid, planId);
      return {
        eligible: eligibility.eligible,
        reason: eligibility.reason,
      };
    } catch (error) {
      logger.error("❌ Erreur lors de la vérification d'éligibilité:", error);
      return { eligible: false, reason: "Erreur lors de la vérification" };
    }
  };

  const syncSubscription = async (): Promise<boolean> => {
    try {
      if (!currentUser?.uid) {
        return false;
      }

      setIsLoading(true);
      const success = await SubscriptionSyncService.syncSubscription(currentUser.uid);
      
      if (success) {
        // Récupérer l'abonnement synchronisé
        const syncedSubscription = await subscriptionService.getSubscription(currentUser.uid);
        if (syncedSubscription) {
          setSubscription(syncedSubscription as UserSubscription);
        }
      }

      return success;
    } catch (error) {
      logger.error("❌ Erreur lors de la synchronisation:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getRealTimeQuotaStats = async (): Promise<any> => {
    try {
      if (!currentUser?.uid) {
        return null;
      }

      return await UsageTrackingService.getRealTimeQuotaStats(currentUser.uid);
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération des stats de quota:", error);
      return null;
    }
  };

  const canPerformAction = async (
    actionType: "generation" | "api_call",
    provider?: string
  ): Promise<{ allowed: boolean; reason?: string; resetTime?: number }> => {
    try {
      if (!currentUser?.uid) {
        return { allowed: false, reason: "Utilisateur non connecté" };
      }

      return await UsageTrackingService.canPerformAction(currentUser.uid, actionType, provider);
    } catch (error) {
      logger.error("❌ Erreur lors de la vérification d'action:", error);
      return { allowed: false, reason: "Erreur lors de la vérification" };
    }
  };

  // Check if user is using managed API or their own keys
  const isManaged = !currentUser || !SecureApiKeyManager.getApiKey("openai");

  const currentPlan = SUBSCRIPTION_PLANS[subscription?.planId || "free"];

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        subscription,
        usage,
        isLoading,
        checkUsageLimit,
        incrementUsage,
        upgradePlan,
        cancelSubscription,
        restoreSubscription,
        canUseFeature,
        canUseAPI,
        getRemainingGenerations,
        isManaged,
        // Nouveaux services
        startTrial,
        checkTrialEligibility,
        syncSubscription,
        getRealTimeQuotaStats,
        canPerformAction,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
