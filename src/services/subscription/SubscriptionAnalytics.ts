import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../../utils/optimizedLogger";
import subscriptionService from "../firebase/subscriptionService";
import { UsageTrackingService } from "./usage-tracking/UsageTrackingService";

const logger = createLogger("SubscriptionAnalytics");

export interface SubscriptionMetrics {
  totalRevenue: number;
  activeSubscribers: number;
  churnRate: number;
  averageRevenuePerUser: number;
  conversionRate: number;
  retentionRate: number;
}

export interface UsageAnalytics {
  averageGenerationsPerUser: number;
  mostUsedAPIs: { provider: string; usage: number }[];
  peakUsageHours: number[];
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

export interface RevenueInsights {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  lifetimeValue: number;
  paybackPeriod: number;
  growthRate: number;
}

export interface UserBehaviorAnalytics {
  averageSessionDuration: number;
  featuresUsage: { [feature: string]: number };
  retentionByPlan: { [planId: string]: number };
  upgradePatterns: { from: string; to: string; count: number }[];
}

export class SubscriptionAnalytics {
  private static readonly ANALYTICS_STORAGE_KEY = "subscription_analytics";
  private static analyticsCache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Enregistre un événement d'analytics
   */
  static async trackEvent(
    eventType: string,
    userId: string,
    eventData: Record<string, unknown>
  ): Promise<void> {
    try {
      const event = {
        type: eventType,
        userId,
        timestamp: new Date().toISOString(),
        data: eventData,
      };

      // Stocker localement
      await this.storeEventLocally(event);

      // Envoyer au serveur de manière asynchrone
      this.sendEventToServer(event).catch((error) => {
        logger.warn("Échec de l'envoi de l'événement au serveur:", error);
      });

      logger.debug(`📊 Événement tracké: ${eventType}`);
    } catch (error) {
      logger.error("❌ Erreur lors du tracking de l'événement:", error);
    }
  }

  /**
   * Calcule les métriques de base des abonnements
   */
  static async getSubscriptionMetrics(userId?: string): Promise<SubscriptionMetrics> {
    try {
      const cacheKey = `metrics_${userId || 'global'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Pour un utilisateur spécifique ou global
      let metrics: SubscriptionMetrics;

      if (userId) {
        metrics = await this.getUserSpecificMetrics(userId);
      } else {
        metrics = await this.getGlobalMetrics();
      }

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      logger.error("❌ Erreur lors du calcul des métriques:", error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Analyse l'usage des utilisateurs
   */
  static async getUsageAnalytics(userId?: string): Promise<UsageAnalytics> {
    try {
      const cacheKey = `usage_${userId || 'global'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      let analytics: UsageAnalytics;

      if (userId) {
        analytics = await this.getUserUsageAnalytics(userId);
      } else {
        analytics = await this.getGlobalUsageAnalytics();
      }

      this.setCachedData(cacheKey, analytics);
      return analytics;
    } catch (error) {
      logger.error("❌ Erreur lors de l'analyse d'usage:", error);
      return this.getDefaultUsageAnalytics();
    }
  }

  /**
   * Calcule les insights de revenus
   */
  static async getRevenueInsights(userId?: string): Promise<RevenueInsights> {
    try {
      const cacheKey = `revenue_${userId || 'global'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const insights = userId 
        ? await this.getUserRevenueInsights(userId)
        : await this.getGlobalRevenueInsights();

      this.setCachedData(cacheKey, insights);
      return insights;
    } catch (error) {
      logger.error("❌ Erreur lors du calcul des insights de revenus:", error);
      return this.getDefaultRevenueInsights();
    }
  }

  /**
   * Analyse le comportement des utilisateurs
   */
  static async getUserBehaviorAnalytics(userId?: string): Promise<UserBehaviorAnalytics> {
    try {
      const cacheKey = `behavior_${userId || 'global'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const analytics = userId
        ? await this.getSingleUserBehavior(userId)
        : await this.getGlobalUserBehavior();

      this.setCachedData(cacheKey, analytics);
      return analytics;
    } catch (error) {
      logger.error("❌ Erreur lors de l'analyse comportementale:", error);
      return this.getDefaultBehaviorAnalytics();
    }
  }

  /**
   * Génère un rapport complet d'analytics
   */
  static async generateAnalyticsReport(userId?: string): Promise<{
    metrics: SubscriptionMetrics;
    usage: UsageAnalytics;
    revenue: RevenueInsights;
    behavior: UserBehaviorAnalytics;
    summary: string[];
    recommendations: string[];
  }> {
    try {
      logger.info(`📊 Génération du rapport d'analytics${userId ? ` pour l'utilisateur ${userId}` : ' global'}`);

      const [metrics, usage, revenue, behavior] = await Promise.all([
        this.getSubscriptionMetrics(userId),
        this.getUsageAnalytics(userId),
        this.getRevenueInsights(userId),
        this.getUserBehaviorAnalytics(userId),
      ]);

      const summary = this.generateSummary(metrics, usage, revenue, behavior);
      const recommendations = this.generateRecommendations(metrics, usage, revenue, behavior);

      return {
        metrics,
        usage,
        revenue,
        behavior,
        summary,
        recommendations,
      };
    } catch (error) {
      logger.error("❌ Erreur lors de la génération du rapport:", error);
      throw error;
    }
  }

  /**
   * Métriques spécifiques à un utilisateur
   */
  private static async getUserSpecificMetrics(userId: string): Promise<SubscriptionMetrics> {
    const subscription = await subscriptionService.getSubscription(userId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const usageStats = await UsageTrackingService.getUsageStats(userId);

    // Simuler des métriques pour un utilisateur individuel
    return {
      totalRevenue: subscription?.planId === "free" ? 0 : this.getPlanPrice(subscription?.planId || "free"),
      activeSubscribers: subscription?.status === "active" ? 1 : 0,
      churnRate: 0,
      averageRevenuePerUser: subscription?.planId === "free" ? 0 : this.getPlanPrice(subscription?.planId || "free"),
      conversionRate: subscription?.planId !== "free" ? 100 : 0,
      retentionRate: subscription?.status === "active" ? 100 : 0,
    };
  }

  /**
   * Métriques globales (simulées pour cet exemple)
   */
  private static async getGlobalMetrics(): Promise<SubscriptionMetrics> {
    // Dans un vrai système, ces données viendraient d'une base de données
    return {
      totalRevenue: 12450,
      activeSubscribers: 156,
      churnRate: 5.2,
      averageRevenuePerUser: 79.81,
      conversionRate: 8.7,
      retentionRate: 94.8,
    };
  }

  /**
   * Analytics d'usage pour un utilisateur
   */
  private static async getUserUsageAnalytics(userId: string): Promise<UsageAnalytics> {
    const usageStats = await UsageTrackingService.getUsageStats(userId);
    
    return {
      averageGenerationsPerUser: this.calculateAverageGenerations(usageStats),
      mostUsedAPIs: this.getMostUsedAPIs(usageStats),
      peakUsageHours: [9, 14, 20], // Heures de pic simulées
      dailyActiveUsers: 1,
      weeklyActiveUsers: 1,
      monthlyActiveUsers: 1,
    };
  }

  /**
   * Analytics d'usage globales
   */
  private static async getGlobalUsageAnalytics(): Promise<UsageAnalytics> {
    return {
      averageGenerationsPerUser: 23.5,
      mostUsedAPIs: [
        { provider: "openai", usage: 45 },
        { provider: "claude", usage: 32 },
        { provider: "gemini", usage: 18 },
      ],
      peakUsageHours: [9, 11, 14, 16, 20],
      dailyActiveUsers: 89,
      weeklyActiveUsers: 234,
      monthlyActiveUsers: 567,
    };
  }

  /**
   * Insights de revenus pour un utilisateur
   */
  private static async getUserRevenueInsights(userId: string): Promise<RevenueInsights> {
    const subscription = await subscriptionService.getSubscription(userId);
    const monthlyRevenue = subscription?.planId === "free" ? 0 : this.getPlanPrice(subscription?.planId || "free");

    return {
      monthlyRecurringRevenue: monthlyRevenue,
      annualRecurringRevenue: monthlyRevenue * 12,
      lifetimeValue: monthlyRevenue * 18, // Estimation 18 mois
      paybackPeriod: 2.5,
      growthRate: 0,
    };
  }

  /**
   * Insights de revenus globaux
   */
  private static async getGlobalRevenueInsights(): Promise<RevenueInsights> {
    return {
      monthlyRecurringRevenue: 12450,
      annualRecurringRevenue: 149400,
      lifetimeValue: 1437,
      paybackPeriod: 3.2,
      growthRate: 15.7,
    };
  }

  /**
   * Comportement d'un utilisateur spécifique
   */
  private static async getSingleUserBehavior(_userId: string): Promise<UserBehaviorAnalytics> {
    return {
      averageSessionDuration: 25.5,
      featuresUsage: {
        "text-generation": 45,
        "image-analysis": 12,
        "code-completion": 8,
      },
      retentionByPlan: { free: 100 },
      upgradePatterns: [],
    };
  }

  /**
   * Comportement global des utilisateurs
   */
  private static async getGlobalUserBehavior(): Promise<UserBehaviorAnalytics> {
    return {
      averageSessionDuration: 18.3,
      featuresUsage: {
        "text-generation": 234,
        "image-analysis": 89,
        "code-completion": 156,
        "chat": 567,
      },
      retentionByPlan: {
        free: 85.2,
        starter: 92.1,
        pro: 96.8,
        enterprise: 98.5,
      },
      upgradePatterns: [
        { from: "free", to: "starter", count: 23 },
        { from: "starter", to: "pro", count: 12 },
        { from: "free", to: "pro", count: 8 },
      ],
    };
  }

  /**
   * Génère un résumé des analytics
   */
  private static generateSummary(
    metrics: SubscriptionMetrics,
    usage: UsageAnalytics,
    revenue: RevenueInsights,
    behavior: UserBehaviorAnalytics
  ): string[] {
    const summary: string[] = [];

    summary.push(`💰 Revenus mensuels récurrents: ${revenue.monthlyRecurringRevenue.toLocaleString()}€`);
    summary.push(`👥 ${metrics.activeSubscribers} abonnés actifs`);
    summary.push(`📈 Taux de rétention: ${metrics.retentionRate}%`);
    summary.push(`🔥 ${usage.averageGenerationsPerUser} générations moyennes par utilisateur`);
    summary.push(`⏱️ Session moyenne: ${behavior.averageSessionDuration} minutes`);

    return summary;
  }

  /**
   * Génère des recommandations basées sur les analytics
   */
  private static generateRecommendations(
    metrics: SubscriptionMetrics,
    usage: UsageAnalytics,
    revenue: RevenueInsights,
    behavior: UserBehaviorAnalytics
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.churnRate > 10) {
      recommendations.push("🔴 Taux de désabonnement élevé - Améliorer l'onboarding et le support client");
    }

    if (metrics.conversionRate < 5) {
      recommendations.push("📊 Faible taux de conversion - Optimiser le tunnel de vente et les offres d'essai");
    }

    if (usage.averageGenerationsPerUser < 10) {
      recommendations.push("🎯 Faible engagement - Promouvoir l'usage avec des tutoriels et cas d'usage");
    }

    if (revenue.growthRate < 10) {
      recommendations.push("📈 Croissance lente - Considérer de nouveaux canaux d'acquisition");
    }

    if (behavior.averageSessionDuration < 15) {
      recommendations.push("⏰ Sessions courtes - Améliorer l'expérience utilisateur et l'engagement");
    }

    return recommendations;
  }

  // Méthodes utilitaires
  private static getPlanPrice(planId: string): number {
    const prices: { [key: string]: number } = {
      free: 0,
      starter: 9.99,
      pro: 29.99,
      enterprise: 99.99,
    };
    return prices[planId] || 0;
  }

  private static calculateAverageGenerations(usageStats: any): number {
    if (!usageStats || typeof usageStats !== "object") return 0;
    
    const totalDays = Object.keys(usageStats).filter(key => key !== "monthly").length;
    if (totalDays === 0) return 0;

    let totalGenerations = 0;
    Object.keys(usageStats).forEach(date => {
      if (date !== "monthly") {
        const dailyUsage = usageStats[date];
        if (dailyUsage) {
          Object.values(dailyUsage).forEach((entry: any) => {
            totalGenerations += entry.calls || 0;
          });
        }
      }
    });

    return totalGenerations / totalDays;
  }

  private static getMostUsedAPIs(usageStats: any): { provider: string; usage: number }[] {
    const apiUsage: { [provider: string]: number } = {};
    
    if (!usageStats || typeof usageStats !== "object") {
      return [];
    }

    Object.keys(usageStats).forEach(date => {
      if (date !== "monthly") {
        const dailyUsage = usageStats[date];
        if (dailyUsage) {
          Object.keys(dailyUsage).forEach(provider => {
            if (!apiUsage[provider]) apiUsage[provider] = 0;
            apiUsage[provider] += dailyUsage[provider].calls || 0;
          });
        }
      }
    });

    return Object.entries(apiUsage)
      .map(([provider, usage]) => ({ provider, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);
  }

  // Cache management
  private static getCachedData(key: string): any {
    const cached = this.analyticsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private static setCachedData(key: string, data: any): void {
    this.analyticsCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Données par défaut
  private static getDefaultMetrics(): SubscriptionMetrics {
    return {
      totalRevenue: 0,
      activeSubscribers: 0,
      churnRate: 0,
      averageRevenuePerUser: 0,
      conversionRate: 0,
      retentionRate: 0,
    };
  }

  private static getDefaultUsageAnalytics(): UsageAnalytics {
    return {
      averageGenerationsPerUser: 0,
      mostUsedAPIs: [],
      peakUsageHours: [],
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
    };
  }

  private static getDefaultRevenueInsights(): RevenueInsights {
    return {
      monthlyRecurringRevenue: 0,
      annualRecurringRevenue: 0,
      lifetimeValue: 0,
      paybackPeriod: 0,
      growthRate: 0,
    };
  }

  private static getDefaultBehaviorAnalytics(): UserBehaviorAnalytics {
    return {
      averageSessionDuration: 0,
      featuresUsage: {},
      retentionByPlan: {},
      upgradePatterns: [],
    };
  }

  // Stockage et envoi d'événements
  private static async storeEventLocally(event: any): Promise<void> {
    try {
      const key = `${this.ANALYTICS_STORAGE_KEY}_events`;
      const existing = await AsyncStorage.getItem(key);
      const events = existing ? JSON.parse(existing) : [];
      
      events.push(event);
      
      // Garder seulement les 1000 derniers événements
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(events));
    } catch (error) {
      logger.error("❌ Erreur lors du stockage local de l'événement:", error);
    }
  }

  private static async sendEventToServer(event: any): Promise<void> {
    try {
      // Ici, on enverrait l'événement au serveur d'analytics
      // Pour l'instant, on log juste pour le debug
      logger.debug("📤 Événement envoyé au serveur:", event.type);
    } catch (error) {
      logger.error("❌ Erreur lors de l'envoi au serveur:", error);
    }
  }
}
