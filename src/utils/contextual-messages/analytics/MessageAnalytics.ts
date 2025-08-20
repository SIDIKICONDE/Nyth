import {
  ContextualMessage,
  MessageCategory,
  MessageInteraction,
  MessageType,
  UserContext,
} from "@/utils/contextual-messages/types";
import { createLogger } from "@/utils/optimizedLogger";
import AsyncStorage from "@react-native-async-storage/async-storage";

const logger = createLogger("MessageAnalytics");

interface MessageMetrics {
  messageId: string;
  type: MessageType;
  category: MessageCategory;
  impressions: number;
  clicks: number;
  dismissals: number;
  engagementRate: number;
  averageEngagementDuration: number;
  conversionRate: number;
  sentimentScore: number;
  effectiveness: number;
  lastShown: string;
  abTestGroup?: string;
}

interface UserEngagementMetrics {
  userId: string;
  totalMessagesShown: number;
  totalInteractions: number;
  overallEngagementRate: number;
  preferredTypes: MessageType[];
  preferredCategories: MessageCategory[];
  bestPerformingTimeSlots: string[];
  averageSessionDuration: number;
  messageFrequencyOptimal: number;
}

interface ABTestResult {
  testId: string;
  variant: string;
  sampleSize: number;
  conversionRate: number;
  engagementRate: number;
  confidence: number;
  isSignificant: boolean;
}

export class MessageAnalytics {
  private metricsCache: Map<string, MessageMetrics> = new Map();
  private userMetricsCache: Map<string, UserEngagementMetrics> = new Map();
  private abTests: Map<string, ABTestResult[]> = new Map();

  /**
   * Enregistre la génération d'un message
   */
  async trackMessageGeneration(
    message: ContextualMessage,
    context: UserContext
  ): Promise<void> {
    try {
      const event = {
        type: "message_generated",
        messageId: message.id,
        messageType: message.type,
        category: message.category,
        userId: context.userId,
        timestamp: new Date().toISOString(),
        contextData: {
          skillLevel: context.skillLevel,
          engagementScore: context.engagementScore,
          timeOfDay: context.timeOfDay,
          dayOfWeek: context.dayOfWeek,
          scriptsCount: context.scriptsCount,
        },
        scoring: message.scoring,
      };

      await this.saveAnalyticsEvent(event);
      logger.info("Message generation tracked", { messageId: message.id });
    } catch (error) {
      logger.error("Error tracking message generation:", error);
    }
  }

  /**
   * Enregistre une interaction avec un message
   */
  async trackInteraction(interaction: MessageInteraction): Promise<void> {
    try {
      const event = {
        type: "message_interaction",
        ...interaction,
        timestamp: interaction.timestamp || new Date().toISOString(),
      };

      await this.saveAnalyticsEvent(event);
      await this.updateMessageMetrics(interaction);

      logger.info("Interaction tracked", {
        messageId: interaction.messageId,
        action: interaction.action,
      });
    } catch (error) {
      logger.error("Error tracking interaction:", error);
    }
  }

  /**
   * Calcule les métriques d'efficacité d'un message
   */
  async calculateMessageEffectiveness(messageId: string): Promise<number> {
    try {
      const metrics = await this.getMessageMetrics(messageId);
      if (!metrics) return 0;

      // Formule d'efficacité pondérée
      const clickWeight = 0.4;
      const engagementWeight = 0.3;
      const sentimentWeight = 0.2;
      const conversionWeight = 0.1;

      const effectiveness =
        (metrics.clicks / Math.max(metrics.impressions, 1)) * clickWeight +
        metrics.engagementRate * engagementWeight +
        metrics.sentimentScore * sentimentWeight +
        metrics.conversionRate * conversionWeight;

      return Math.min(1, Math.max(0, effectiveness));
    } catch (error) {
      logger.error("Error calculating effectiveness:", error);
      return 0;
    }
  }

  /**
   * Obtient les métriques d'engagement utilisateur
   */
  async getUserEngagementMetrics(
    userId: string
  ): Promise<UserEngagementMetrics> {
    try {
      // Vérifier le cache
      const cached = this.userMetricsCache.get(userId);
      if (cached) return cached;

      // Charger depuis le stockage
      const events = await this.loadUserAnalyticsEvents(userId);
      const metrics = this.calculateUserMetrics(userId, events);

      // Mettre en cache
      this.userMetricsCache.set(userId, metrics);

      return metrics;
    } catch (error) {
      logger.error("Error getting user metrics:", error);
      return this.getDefaultUserMetrics(userId);
    }
  }

  /**
   * Analyse les performances par type de message
   */
  async analyzeMessageTypePerformance(): Promise<
    Map<
      MessageType,
      {
        averageEngagement: number;
        totalImpressions: number;
        bestTimeSlots: string[];
        effectiveness: number;
      }
    >
  > {
    const performanceMap = new Map<MessageType, any>();

    try {
      const allEvents = await this.loadAllAnalyticsEvents();

      // Grouper par type de message
      const typeGroups = this.groupEventsByType(allEvents);

      for (const [type, events] of typeGroups.entries()) {
        const performance = {
          averageEngagement: this.calculateAverageEngagement(events),
          totalImpressions: events.filter((e) => e.type === "message_generated")
            .length,
          bestTimeSlots: this.findBestTimeSlots(events),
          effectiveness: this.calculateTypeEffectiveness(events),
        };

        performanceMap.set(type as MessageType, performance);
      }
    } catch (error) {
      logger.error("Error analyzing message type performance:", error);
    }

    return performanceMap;
  }

  /**
   * Effectue un test A/B sur les variations de messages
   */
  async runABTest(
    testId: string,
    variants: ContextualMessage[],
    sampleSize: number = 100
  ): Promise<ABTestResult[]> {
    try {
      const results: ABTestResult[] = [];

      for (const variant of variants) {
        const variantEvents = await this.getVariantEvents(testId, variant.id);

        const result: ABTestResult = {
          testId,
          variant: variant.id,
          sampleSize: variantEvents.length,
          conversionRate: this.calculateConversionRate(variantEvents),
          engagementRate: this.calculateEngagementRate(variantEvents),
          confidence: 0,
          isSignificant: false,
        };

        // Calculer la confiance statistique
        if (variantEvents.length >= sampleSize * 0.5) {
          result.confidence = this.calculateStatisticalConfidence(
            result,
            results[0]
          );
          result.isSignificant = result.confidence >= 0.95;
        }

        results.push(result);
      }

      // Sauvegarder les résultats
      this.abTests.set(testId, results);

      return results;
    } catch (error) {
      logger.error("Error running A/B test:", error);
      return [];
    }
  }

  /**
   * Prédit l'engagement futur basé sur l'historique
   */
  async predictEngagement(
    userId: string,
    messageType: MessageType
  ): Promise<number> {
    try {
      const userMetrics = await this.getUserEngagementMetrics(userId);
      const typePerformance = await this.analyzeMessageTypePerformance();

      const baseEngagement = userMetrics.overallEngagementRate;
      const typeModifier =
        typePerformance.get(messageType)?.averageEngagement || 0.5;

      // Facteurs de prédiction
      const userPreference = userMetrics.preferredTypes.includes(messageType)
        ? 1.2
        : 0.8;
      const recentTrend = await this.calculateRecentEngagementTrend(userId);

      const predictedEngagement =
        baseEngagement * typeModifier * userPreference * recentTrend;

      return Math.min(1, Math.max(0, predictedEngagement));
    } catch (error) {
      logger.error("Error predicting engagement:", error);
      return 0.5;
    }
  }

  /**
   * Génère un rapport d'insights
   */
  async generateInsightsReport(userId?: string): Promise<{
    topPerformingMessages: MessageMetrics[];
    userInsights?: UserEngagementMetrics;
    recommendations: string[];
    trends: {
      engagementTrend: "increasing" | "stable" | "decreasing";
      bestPerformingTypes: MessageType[];
      optimalFrequency: number;
      peakEngagementTimes: string[];
    };
  }> {
    try {
      const topMessages = await this.getTopPerformingMessages(10);
      const userInsights = userId
        ? await this.getUserEngagementMetrics(userId)
        : undefined;
      const typePerformance = await this.analyzeMessageTypePerformance();

      const recommendations = this.generateRecommendations(
        topMessages,
        userInsights,
        typePerformance
      );

      const trends = {
        engagementTrend: await this.calculateEngagementTrend(),
        bestPerformingTypes: this.identifyBestTypes(typePerformance),
        optimalFrequency: userInsights?.messageFrequencyOptimal || 3,
        peakEngagementTimes: await this.findPeakEngagementTimes(),
      };

      return {
        topPerformingMessages: topMessages,
        userInsights,
        recommendations,
        trends,
      };
    } catch (error) {
      logger.error("Error generating insights report:", error);
      return {
        topPerformingMessages: [],
        recommendations: [],
        trends: {
          engagementTrend: "stable",
          bestPerformingTypes: [],
          optimalFrequency: 3,
          peakEngagementTimes: [],
        },
      };
    }
  }

  // Méthodes privées

  private async saveAnalyticsEvent(event: any): Promise<void> {
    try {
      const key = `@analytics_events_${new Date().toISOString().split("T")[0]}`;
      const existing = await AsyncStorage.getItem(key);
      const events = existing ? JSON.parse(existing) : [];

      events.push(event);

      // Limiter à 1000 événements par jour
      if (events.length > 1000) {
        events.shift();
      }

      await AsyncStorage.setItem(key, JSON.stringify(events));
    } catch (error) {
      logger.error("Error saving analytics event:", error);
    }
  }

  private async updateMessageMetrics(
    interaction: MessageInteraction
  ): Promise<void> {
    const metrics =
      (await this.getMessageMetrics(interaction.messageId)) ||
      this.createDefaultMetrics(interaction.messageId);

    // Mettre à jour les compteurs
    switch (interaction.action) {
      case "viewed":
        metrics.impressions++;
        break;
      case "clicked":
        metrics.clicks++;
        break;
      case "dismissed":
        metrics.dismissals++;
        break;
    }

    // Mettre à jour les taux
    metrics.engagementRate =
      (metrics.clicks + metrics.dismissals) / Math.max(metrics.impressions, 1);

    if (interaction.engagementDuration) {
      const totalDuration =
        metrics.averageEngagementDuration * (metrics.clicks - 1) +
        interaction.engagementDuration;
      metrics.averageEngagementDuration = totalDuration / metrics.clicks;
    }

    if (interaction.feedback) {
      metrics.sentimentScore =
        (metrics.sentimentScore + interaction.feedback.rating / 5) / 2;
    }

    metrics.lastShown = new Date().toISOString();

    // Sauvegarder
    this.metricsCache.set(interaction.messageId, metrics);
    await this.persistMessageMetrics(metrics);
  }

  private async getMessageMetrics(
    messageId: string
  ): Promise<MessageMetrics | null> {
    // Vérifier le cache
    const cached = this.metricsCache.get(messageId);
    if (cached) return cached;

    // Charger depuis le stockage
    try {
      const key = `@message_metrics_${messageId}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const metrics = JSON.parse(stored);
        this.metricsCache.set(messageId, metrics);
        return metrics;
      }
    } catch (error) {
      logger.error("Error loading message metrics:", error);
    }

    return null;
  }

  private createDefaultMetrics(messageId: string): MessageMetrics {
    return {
      messageId,
      type: "tip",
      category: "engagement",
      impressions: 0,
      clicks: 0,
      dismissals: 0,
      engagementRate: 0,
      averageEngagementDuration: 0,
      conversionRate: 0,
      sentimentScore: 0.5,
      effectiveness: 0,
      lastShown: new Date().toISOString(),
    };
  }

  private async persistMessageMetrics(metrics: MessageMetrics): Promise<void> {
    try {
      const key = `@message_metrics_${metrics.messageId}`;
      await AsyncStorage.setItem(key, JSON.stringify(metrics));
    } catch (error) {
      logger.error("Error persisting message metrics:", error);
    }
  }

  private async loadUserAnalyticsEvents(userId: string): Promise<any[]> {
    const events: any[] = [];

    try {
      // Charger les 30 derniers jours
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = `@analytics_events_${date.toISOString().split("T")[0]}`;

        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const dayEvents = JSON.parse(stored);
          const userEvents = dayEvents.filter((e: any) => e.userId === userId);
          events.push(...userEvents);
        }
      }
    } catch (error) {
      logger.error("Error loading user analytics events:", error);
    }

    return events;
  }

  private async loadAllAnalyticsEvents(): Promise<any[]> {
    const events: any[] = [];

    try {
      // Charger les 7 derniers jours pour l'analyse globale
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = `@analytics_events_${date.toISOString().split("T")[0]}`;

        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          events.push(...JSON.parse(stored));
        }
      }
    } catch (error) {
      logger.error("Error loading all analytics events:", error);
    }

    return events;
  }

  private calculateUserMetrics(
    userId: string,
    events: any[]
  ): UserEngagementMetrics {
    const messageEvents = events.filter((e) => e.type === "message_generated");
    const interactionEvents = events.filter(
      (e) => e.type === "message_interaction"
    );

    const typeFrequency = new Map<MessageType, number>();
    const categoryFrequency = new Map<MessageCategory, number>();
    const timeSlotEngagement = new Map<string, number>();

    // Analyser les événements
    messageEvents.forEach((event) => {
      const type = event.messageType as MessageType;
      const category = event.category as MessageCategory;

      typeFrequency.set(type, (typeFrequency.get(type) || 0) + 1);
      categoryFrequency.set(
        category,
        (categoryFrequency.get(category) || 0) + 1
      );
    });

    interactionEvents.forEach((event) => {
      const hour = new Date(event.timestamp).getHours();
      const timeSlot = `${Math.floor(hour / 4) * 4}-${
        Math.floor(hour / 4) * 4 + 4
      }h`;
      timeSlotEngagement.set(
        timeSlot,
        (timeSlotEngagement.get(timeSlot) || 0) + 1
      );
    });

    // Calculer les métriques
    const totalMessagesShown = messageEvents.length;
    const totalInteractions = interactionEvents.length;
    const engagementRate =
      totalMessagesShown > 0 ? totalInteractions / totalMessagesShown : 0;

    // Types et catégories préférés
    const preferredTypes = Array.from(typeFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    const preferredCategories = Array.from(categoryFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    // Meilleurs créneaux horaires
    const bestTimeSlots = Array.from(timeSlotEngagement.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slot]) => slot);

    return {
      userId,
      totalMessagesShown,
      totalInteractions,
      overallEngagementRate: engagementRate,
      preferredTypes,
      preferredCategories,
      bestPerformingTimeSlots: bestTimeSlots,
      averageSessionDuration: 0, // À calculer séparément
      messageFrequencyOptimal: this.calculateOptimalFrequency(events),
    };
  }

  private calculateOptimalFrequency(events: any[]): number {
    // Analyser la fréquence optimale basée sur l'engagement
    const dailyGroups = this.groupEventsByDay(events);
    let optimalCount = 3; // Par défaut
    let maxEngagement = 0;

    for (const [day, dayEvents] of dailyGroups.entries()) {
      const messages = dayEvents.filter(
        (e) => e.type === "message_generated"
      ).length;
      const interactions = dayEvents.filter(
        (e) => e.type === "message_interaction"
      ).length;

      if (messages > 0) {
        const engagement = interactions / messages;
        if (engagement > maxEngagement) {
          maxEngagement = engagement;
          optimalCount = messages;
        }
      }
    }

    return Math.min(5, Math.max(1, optimalCount));
  }

  private groupEventsByDay(events: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    events.forEach((event) => {
      const day = event.timestamp.split("T")[0];
      const dayEvents = groups.get(day) || [];
      dayEvents.push(event);
      groups.set(day, dayEvents);
    });

    return groups;
  }

  private groupEventsByType(events: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    events.forEach((event) => {
      if (event.messageType) {
        const typeEvents = groups.get(event.messageType) || [];
        typeEvents.push(event);
        groups.set(event.messageType, typeEvents);
      }
    });

    return groups;
  }

  private calculateAverageEngagement(events: any[]): number {
    const messages = events.filter((e) => e.type === "message_generated");
    const interactions = events.filter((e) => e.type === "message_interaction");

    if (messages.length === 0) return 0;
    return interactions.length / messages.length;
  }

  private findBestTimeSlots(events: any[]): string[] {
    const timeSlotPerformance = new Map<string, number>();

    events.forEach((event) => {
      if (event.type === "message_interaction" && event.action === "clicked") {
        const hour = new Date(event.timestamp).getHours();
        const slot = `${hour}h`;
        timeSlotPerformance.set(slot, (timeSlotPerformance.get(slot) || 0) + 1);
      }
    });

    return Array.from(timeSlotPerformance.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slot]) => slot);
  }

  private calculateTypeEffectiveness(events: any[]): number {
    const interactions = events.filter(
      (e) =>
        e.type === "message_interaction" &&
        (e.action === "clicked" || e.feedback?.helpful)
    );

    const impressions = events.filter((e) => e.type === "message_generated");

    if (impressions.length === 0) return 0;
    return interactions.length / impressions.length;
  }

  private async getVariantEvents(
    testId: string,
    variantId: string
  ): Promise<any[]> {
    const allEvents = await this.loadAllAnalyticsEvents();
    return allEvents.filter(
      (e) => e.abTestGroup === testId && e.messageId?.includes(variantId)
    );
  }

  private calculateConversionRate(events: any[]): number {
    const impressions = events.filter((e) => e.type === "message_generated");
    const conversions = events.filter(
      (e) => e.type === "message_interaction" && e.action === "clicked"
    );

    if (impressions.length === 0) return 0;
    return conversions.length / impressions.length;
  }

  private calculateEngagementRate(events: any[]): number {
    const impressions = events.filter((e) => e.type === "message_generated");
    const engagements = events.filter((e) => e.type === "message_interaction");

    if (impressions.length === 0) return 0;
    return engagements.length / impressions.length;
  }

  private calculateStatisticalConfidence(
    variant: ABTestResult,
    control: ABTestResult | undefined
  ): number {
    if (!control || variant.sampleSize < 30 || control.sampleSize < 30) {
      return 0;
    }

    // Z-test simplifié pour la proportion
    const p1 = variant.conversionRate;
    const p2 = control.conversionRate;
    const n1 = variant.sampleSize;
    const n2 = control.sampleSize;

    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

    if (se === 0) return 0;

    const z = Math.abs(p1 - p2) / se;

    // Convertir z-score en niveau de confiance
    if (z >= 2.58) return 0.99; // 99% confiance
    if (z >= 1.96) return 0.95; // 95% confiance
    if (z >= 1.64) return 0.9; // 90% confiance

    return z / 2.58; // Échelle linéaire pour z < 1.64
  }

  private async calculateRecentEngagementTrend(
    userId: string
  ): Promise<number> {
    const events = await this.loadUserAnalyticsEvents(userId);
    const sortedEvents = events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const recentEvents = sortedEvents.slice(0, 20);
    const olderEvents = sortedEvents.slice(20, 40);

    if (olderEvents.length === 0) return 1;

    const recentEngagement = this.calculateAverageEngagement(recentEvents);
    const olderEngagement = this.calculateAverageEngagement(olderEvents);

    if (olderEngagement === 0) return 1;

    return recentEngagement / olderEngagement;
  }

  private async getTopPerformingMessages(
    count: number
  ): Promise<MessageMetrics[]> {
    const allMetrics: MessageMetrics[] = [];

    // Charger toutes les métriques
    for (const [id, metrics] of this.metricsCache.entries()) {
      allMetrics.push(metrics);
    }

    // Trier par efficacité
    allMetrics.sort((a, b) => b.effectiveness - a.effectiveness);

    return allMetrics.slice(0, count);
  }

  private generateRecommendations(
    topMessages: MessageMetrics[],
    userInsights?: UserEngagementMetrics,
    typePerformance?: Map<MessageType, any>
  ): string[] {
    const recommendations: string[] = [];

    // Recommandations basées sur les top messages
    if (topMessages.length > 0) {
      const topType = topMessages[0].type;
      recommendations.push(
        `Les messages de type "${topType}" performent particulièrement bien. Considérez en augmenter la fréquence.`
      );
    }

    // Recommandations basées sur l'utilisateur
    if (userInsights) {
      if (userInsights.overallEngagementRate < 0.3) {
        recommendations.push(
          "L'engagement est faible. Essayez de personnaliser davantage les messages ou réduire leur fréquence."
        );
      }

      if (userInsights.bestPerformingTimeSlots.length > 0) {
        recommendations.push(
          `Privilégiez l'envoi de messages pendant les créneaux ${userInsights.bestPerformingTimeSlots.join(
            ", "
          )}.`
        );
      }
    }

    // Recommandations basées sur les types
    if (typePerformance) {
      const lowPerformers = Array.from(typePerformance.entries())
        .filter(([_, perf]) => perf.effectiveness < 0.3)
        .map(([type]) => type);

      if (lowPerformers.length > 0) {
        recommendations.push(
          `Les types ${lowPerformers.join(
            ", "
          )} sous-performent. Considérez de réviser leur contenu ou timing.`
        );
      }
    }

    return recommendations;
  }

  private async calculateEngagementTrend(): Promise<
    "increasing" | "stable" | "decreasing"
  > {
    const events = await this.loadAllAnalyticsEvents();
    const dailyEngagement = new Map<string, number>();

    // Calculer l'engagement par jour
    const dailyGroups = this.groupEventsByDay(events);
    for (const [day, dayEvents] of dailyGroups.entries()) {
      const engagement = this.calculateAverageEngagement(dayEvents);
      dailyEngagement.set(day, engagement);
    }

    // Analyser la tendance
    const values = Array.from(dailyEngagement.values());
    if (values.length < 3) return "stable";

    const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

    if (recentAvg > olderAvg * 1.1) return "increasing";
    if (recentAvg < olderAvg * 0.9) return "decreasing";
    return "stable";
  }

  private identifyBestTypes(
    typePerformance: Map<MessageType, any>
  ): MessageType[] {
    return Array.from(typePerformance.entries())
      .sort((a, b) => b[1].effectiveness - a[1].effectiveness)
      .slice(0, 3)
      .map(([type]) => type);
  }

  private async findPeakEngagementTimes(): Promise<string[]> {
    const events = await this.loadAllAnalyticsEvents();
    const hourlyEngagement = new Map<number, number>();

    events.forEach((event) => {
      if (event.type === "message_interaction" && event.action === "clicked") {
        const hour = new Date(event.timestamp).getHours();
        hourlyEngagement.set(hour, (hourlyEngagement.get(hour) || 0) + 1);
      }
    });

    return Array.from(hourlyEngagement.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}h-${hour + 1}h`);
  }

  private getDefaultUserMetrics(userId: string): UserEngagementMetrics {
    return {
      userId,
      totalMessagesShown: 0,
      totalInteractions: 0,
      overallEngagementRate: 0,
      preferredTypes: [],
      preferredCategories: [],
      bestPerformingTimeSlots: [],
      averageSessionDuration: 0,
      messageFrequencyOptimal: 3,
    };
  }
}
