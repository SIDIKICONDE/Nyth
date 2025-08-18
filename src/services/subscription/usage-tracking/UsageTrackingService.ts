import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../../../utils/optimizedLogger";
import { getAuth } from "@react-native-firebase/auth";
import { SUBSCRIPTION_PLANS } from "../../../constants/subscriptionPlans";
import subscriptionService from "../../firebase/subscriptionService";

const logger = createLogger("UsageTrackingService");

interface UsageEntry {
  calls: number;
  tokens: number;
}

interface DailyUsage {
  [provider: string]: UsageEntry;
}

interface MonthlyUsage {
  [month: string]: {
    [provider: string]: UsageEntry;
  };
}

type UsageData = {
  [date: string]: DailyUsage;
} & {
  monthly?: MonthlyUsage;
};

export class UsageTrackingService {
  /**
   * Enregistre l'utilisation d'API pour un utilisateur
   */
  static async trackUsage(
    userId: string,
    provider: string,
    tokens: number
  ): Promise<void> {
    try {
      const key = `api_usage_${userId}`;
      const existing = await AsyncStorage.getItem(key);
      const usage: UsageData = existing ? JSON.parse(existing) : {};

      const today = new Date().toISOString().split("T")[0];
      const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

      // Usage journalier
      if (!usage[today]) {
        usage[today] = {};
      }
      if (!usage[today][provider]) {
        usage[today][provider] = { calls: 0, tokens: 0 };
      }
      usage[today][provider].calls++;
      usage[today][provider].tokens += tokens;

      // Usage mensuel
      if (!usage.monthly) {
        usage.monthly = {};
      }
      if (!usage.monthly[thisMonth]) {
        usage.monthly[thisMonth] = {};
      }
      if (!usage.monthly[thisMonth][provider]) {
        usage.monthly[thisMonth][provider] = { calls: 0, tokens: 0 };
      }
      usage.monthly[thisMonth][provider].calls++;
      usage.monthly[thisMonth][provider].tokens += tokens;

      // Nettoyer les anciennes données (garder seulement 30 jours)
      this.cleanupOldData(usage);

      await AsyncStorage.setItem(key, JSON.stringify(usage));

      // Envoyer au serveur pour analytics globales (sans bloquer l'UX)
      this.sendUsageToServer(userId, provider, tokens).catch((error) => {
        logger.warn("Failed to send usage to server:", error);
      });
    } catch (error) {
      logger.error("Error tracking usage:", error);
    }
  }

  /**
   * Récupère les statistiques d'usage pour un utilisateur
   */
  static async getUsageStats(userId: string): Promise<UsageData> {
    try {
      const key = `api_usage_${userId}`;
      const existing = await AsyncStorage.getItem(key);
      return existing ? JSON.parse(existing) : {};
    } catch (error) {
      logger.error("Error getting usage stats:", error);
      return {};
    }
  }

  /**
   * Calcule l'usage total pour une période donnée
   */
  static async getTotalUsage(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ [provider: string]: UsageEntry }> {
    try {
      const usage = await this.getUsageStats(userId);
      const total: { [provider: string]: UsageEntry } = {};

      Object.keys(usage).forEach((date) => {
        if (date !== "monthly" && date >= startDate && date <= endDate) {
          const dailyUsage = usage[date];
          if (dailyUsage) {
            Object.keys(dailyUsage).forEach((provider) => {
              if (!total[provider]) {
                total[provider] = { calls: 0, tokens: 0 };
              }
              total[provider].calls += dailyUsage[provider].calls;
              total[provider].tokens += dailyUsage[provider].tokens;
            });
          }
        }
      });

      return total;
    } catch (error) {
      logger.error("Error calculating total usage:", error);
      return {};
    }
  }

  /**
   * Nettoie les anciennes données pour optimiser le stockage
   */
  private static cleanupOldData(usage: UsageData): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

    Object.keys(usage).forEach((date) => {
      if (date !== "monthly" && date < cutoffDate) {
        delete usage[date];
      }
    });

    // Nettoyer les mois anciens (garder seulement 12 mois)
    if (usage.monthly) {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const cutoffMonth = twelveMonthsAgo.toISOString().substring(0, 7);

      Object.keys(usage.monthly).forEach((month) => {
        if (month < cutoffMonth) {
          delete usage.monthly![month];
        }
      });
    }
  }

  /**
   * Envoie les données d'usage au serveur Firebase
   */
  private static async sendUsageToServer(
    userId: string,
    provider: string,
    tokens: number
  ): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const idToken = await user.getIdToken();

      const { FirebaseFunctionsFallbackService } = await import("../../firebaseFunctionsFallback");
      await FirebaseFunctionsFallbackService.callFunction(
        "trackAPIUsage",
        { userId, provider, tokens, timestamp: new Date().toISOString() },
        { useCache: false }
      );
    } catch (error) {
      // Échec silencieux pour ne pas affecter l'UX
      logger.debug("Failed to send usage to server:", error);
    }
  }

  /**
   * Exporte les données d'usage pour backup ou migration
   */
  static async exportUsageData(userId: string): Promise<string> {
    try {
      const usage = await this.getUsageStats(userId);
      return JSON.stringify(usage, null, 2);
    } catch (error) {
      logger.error("Error exporting usage data:", error);
      throw error;
    }
  }

  /**
   * Importe des données d'usage depuis un backup
   */
  static async importUsageData(userId: string, data: string): Promise<void> {
    try {
      const usage = JSON.parse(data);
      const key = `api_usage_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(usage));
      logger.info("Usage data imported successfully");
    } catch (error) {
      logger.error("Error importing usage data:", error);
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur peut effectuer une action selon ses quotas
   */
  static async canPerformAction(
    userId: string,
    actionType: "generation" | "api_call",
    provider?: string
  ): Promise<{ allowed: boolean; reason?: string; resetTime?: number }> {
    try {
      const subscription = await subscriptionService.getSubscription(userId);
      const planId = subscription?.planId || "free";
      const plan = SUBSCRIPTION_PLANS[planId];

      if (!plan) {
        return { allowed: false, reason: "Plan non reconnu" };
      }

      const today = new Date().toISOString().split("T")[0];
      const thisMonth = new Date().toISOString().substring(0, 7);
      
      const usage = await this.getUsageStats(userId);
      const dailyUsage = usage[today] || {};
      const monthlyUsage = usage.monthly?.[thisMonth] || {};

      // Vérifier les limites journalières
      if (plan.limits.dailyGenerations) {
        const totalDailyGenerations = Object.values(dailyUsage).reduce(
          (sum, entry) => sum + entry.calls,
          0
        );

        if (totalDailyGenerations >= plan.limits.dailyGenerations) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          
          return {
            allowed: false,
            reason: `Limite journalière atteinte (${plan.limits.dailyGenerations})`,
            resetTime: tomorrow.getTime(),
          };
        }
      }

      // Vérifier les limites mensuelles
      if (plan.limits.monthlyGenerations) {
        const totalMonthlyGenerations = Object.values(monthlyUsage).reduce(
          (sum, entry) => sum + entry.calls,
          0
        );

        if (totalMonthlyGenerations >= plan.limits.monthlyGenerations) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
          nextMonth.setHours(0, 0, 0, 0);
          
          return {
            allowed: false,
            reason: `Limite mensuelle atteinte (${plan.limits.monthlyGenerations})`,
            resetTime: nextMonth.getTime(),
          };
        }
      }

      // Vérifier si l'API/provider est autorisé
      if (provider && !plan.limits.apis.includes(provider) && !plan.limits.apis.includes("all")) {
        return {
          allowed: false,
          reason: `API ${provider} non disponible sur le plan ${planId}`,
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error("Error checking quota:", error);
      return { allowed: false, reason: "Erreur lors de la vérification des quotas" };
    }
  }

  /**
   * Obtient les statistiques de quota en temps réel
   */
  static async getRealTimeQuotaStats(userId: string): Promise<{
    daily: { used: number; limit: number | null; remaining: number | null };
    monthly: { used: number; limit: number | null; remaining: number | null };
    resetTimes: { daily: number; monthly: number };
  }> {
    try {
      const subscription = await subscriptionService.getSubscription(userId);
      const planId = subscription?.planId || "free";
      const plan = SUBSCRIPTION_PLANS[planId];

      const today = new Date().toISOString().split("T")[0];
      const thisMonth = new Date().toISOString().substring(0, 7);
      
      const usage = await this.getUsageStats(userId);
      const dailyUsage = usage[today] || {};
      const monthlyUsage = usage.monthly?.[thisMonth] || {};

      const dailyUsed = Object.values(dailyUsage).reduce(
        (sum, entry) => sum + entry.calls,
        0
      );
      const monthlyUsed = Object.values(monthlyUsage).reduce(
        (sum, entry) => sum + entry.calls,
        0
      );

      // Calculer les temps de reset
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);

      return {
        daily: {
          used: dailyUsed,
          limit: plan?.limits.dailyGenerations || null,
          remaining: plan?.limits.dailyGenerations 
            ? Math.max(0, plan.limits.dailyGenerations - dailyUsed)
            : null,
        },
        monthly: {
          used: monthlyUsed,
          limit: plan?.limits.monthlyGenerations || null,
          remaining: plan?.limits.monthlyGenerations
            ? Math.max(0, plan.limits.monthlyGenerations - monthlyUsed)
            : null,
        },
        resetTimes: {
          daily: tomorrow.getTime(),
          monthly: nextMonth.getTime(),
        },
      };
    } catch (error) {
      logger.error("Error getting quota stats:", error);
      return {
        daily: { used: 0, limit: null, remaining: null },
        monthly: { used: 0, limit: null, remaining: null },
        resetTimes: { daily: 0, monthly: 0 },
      };
    }
  }

  /**
   * Prédit si une action sera possible dans le futur
   */
  static async predictQuotaAvailability(
    userId: string,
    hoursAhead: number = 24
  ): Promise<{ willBeAvailable: boolean; nextAvailableTime?: number }> {
    try {
      const quotaCheck = await this.canPerformAction(userId, "generation");
      
      if (quotaCheck.allowed) {
        return { willBeAvailable: true };
      }

      if (quotaCheck.resetTime) {
        const resetDate = new Date(quotaCheck.resetTime);
        const targetDate = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
        
        return {
          willBeAvailable: targetDate >= resetDate,
          nextAvailableTime: quotaCheck.resetTime,
        };
      }

      return { willBeAvailable: false };
    } catch (error) {
      logger.error("Error predicting quota availability:", error);
      return { willBeAvailable: false };
    }
  }

  /**
   * Optimise automatiquement l'usage en redistribuant les quotas
   */
  static async optimizeUsage(userId: string): Promise<{
    suggestions: string[];
    optimizedSchedule?: { time: number; action: string }[];
  }> {
    try {
      const stats = await this.getRealTimeQuotaStats(userId);
      const suggestions: string[] = [];
      
      // Analyser l'usage et suggérer des optimisations
      if (stats.daily.remaining !== null && stats.daily.remaining < 5) {
        suggestions.push("Limite journalière presque atteinte. Considérez une mise à niveau ou attendez demain.");
      }

      if (stats.monthly.remaining !== null && stats.monthly.remaining < 20) {
        suggestions.push("Limite mensuelle bientôt atteinte. Planifiez votre usage pour le reste du mois.");
      }

      const subscription = await subscriptionService.getSubscription(userId);
      const planId = subscription?.planId || "free";
      
      if (planId === "free") {
        suggestions.push("Passez à un plan payant pour plus de générations et de fonctionnalités.");
      }

      return { suggestions };
    } catch (error) {
      logger.error("Error optimizing usage:", error);
      return { suggestions: ["Erreur lors de l'optimisation"] };
    }
  }
}
