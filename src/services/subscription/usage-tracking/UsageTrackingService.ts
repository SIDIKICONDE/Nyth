import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../../../utils/optimizedLogger";
import { getAuth } from "@react-native-firebase/auth";

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
}
