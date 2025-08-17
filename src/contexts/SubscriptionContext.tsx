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
  upgradePlan: (planId: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  restoreSubscription: () => Promise<boolean>;

  // Helpers
  canUseFeature: (feature: string) => boolean;
  canUseAPI: (api: string) => boolean;
  getRemainingGenerations: () => { daily?: number; monthly?: number };
  isManaged: boolean;
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
    loadSubscriptionData();

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

      // Cleanup function
      return () => {
        unsubscribeSubscription();
        unsubscribeUsage();
      };
    }

    // Retourner une fonction de nettoyage vide si les conditions ne sont pas remplies
    return () => {};
  }, [currentUser]);

  const loadSubscriptionData = async () => {
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

          // Sauvegarder localement pour le cache
          await AsyncStorage.setItem(
            "user_subscription",
            JSON.stringify(firebaseSubscription)
          );

          // Update usage limits based on plan
          const plan =
            SUBSCRIPTION_PLANS[firebaseSubscription.planId] ||
            SUBSCRIPTION_PLANS.free;
          setUsage((prev) => ({
            ...prev,
            limits: {
              daily: plan.limits.dailyGenerations,
              monthly: plan.limits.monthlyGenerations,
            },
          }));
        }

        // Charger l'usage depuis Firebase
        const firebaseUsage = await subscriptionService.getUsageStats(
          currentUser.uid
        );

        if (firebaseUsage) {
          setUsage(firebaseUsage);
          await AsyncStorage.setItem(
            "usage_stats",
            JSON.stringify(firebaseUsage)
          );
        }
      } else {
        // Utilisateur non connecté, charger depuis le stockage local
        const savedSubscription = await AsyncStorage.getItem(
          "user_subscription"
        );
        const savedUsage = await AsyncStorage.getItem("usage_stats");

        if (savedSubscription) {
          const sub = JSON.parse(savedSubscription) as UserSubscription;
          setSubscription(sub);

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

        if (savedUsage) {
          const stats = JSON.parse(savedUsage) as UsageStats;
          // Check if we need to reset daily/monthly counters
          const today = new Date().toDateString();
          const savedDate = new Date(stats.resetDate).toDateString();

          if (today !== savedDate) {
            // Reset daily counter
            stats.generations.today = 0;

            // Check if month changed
            const currentMonth = new Date().getMonth();
            const savedMonth = new Date(stats.resetDate).getMonth();
            if (currentMonth !== savedMonth) {
              stats.generations.thisMonth = 0;
            }

            stats.resetDate = new Date().toISOString();
            await AsyncStorage.setItem("usage_stats", JSON.stringify(stats));
          }

          setUsage(stats);
        }
      }
    } catch (error) {
      logger.error("Error loading subscription data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const upgradePlan = async (planId: string): Promise<boolean> => {
    try {
      // TODO: Implement payment processing
      // For now, just update the subscription
      const newSubscription: UserSubscription = {
        planId,
        status: "active",
        startDate: new Date().toISOString(),
        usage: subscription?.usage || {
          daily: 0,
          monthly: 0,
          total: 0,
          lastReset: new Date().toISOString(),
        },
      };

      if (currentUser?.uid) {
        // Sauvegarder dans Firebase pour les utilisateurs connectés
        await subscriptionService.createOrUpdateSubscription(
          currentUser.uid,
          newSubscription
        );
      } else {
        // Sauvegarder localement pour les utilisateurs non connectés
        setSubscription(newSubscription);
        await AsyncStorage.setItem(
          "user_subscription",
          JSON.stringify(newSubscription)
        );
      }

      return true;
    } catch (error) {
      logger.error("Error upgrading plan:", error);
      return false;
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    try {
      if (currentUser?.uid) {
        // Annuler dans Firebase pour les utilisateurs connectés
        await subscriptionService.deleteSubscription(currentUser.uid);
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
      }

      return true;
    } catch (error) {
      logger.error("Error cancelling subscription:", error);
      return false;
    }
  };

  const restoreSubscription = async (): Promise<boolean> => {
    try {
      if (!currentUser?.uid) return false;
      const result = await PaymentService.restorePurchases(currentUser.uid);
      return result.success;
    } catch (error) {
      logger.error("Error restoring subscription:", error);
      return false;
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
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
