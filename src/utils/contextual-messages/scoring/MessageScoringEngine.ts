import {
  ContextualMessage,
  MessageInteraction,
  MessageScore,
  ScoreFactor,
  UserContext,
} from "@/utils/contextual-messages/types";
import { createLogger } from "@/utils/optimizedLogger";

const logger = createLogger("MessageScoringEngine");

export class MessageScoringEngine {
  private readonly weights = {
    relevance: 0.25,
    engagement: 0.2,
    personality: 0.15,
    timing: 0.2,
    context: 0.15,
    novelty: 0.05,
  };

  constructor(private readonly historicalData: MessageInteraction[] = []) {}

  /**
   * Calcule un score global pour un message en fonction du contexte utilisateur
   */
  scoreMessage(message: ContextualMessage, context: UserContext): MessageScore {
    const factors: ScoreFactor[] = [];

    // 1. Score de pertinence
    const relevanceScore = this.calculateRelevanceScore(message, context);
    factors.push({
      name: "relevance",
      value: relevanceScore,
      weight: this.weights.relevance,
      reason: this.getRelevanceReason(relevanceScore, message, context),
    });

    // 2. Score d'engagement prédit
    const engagementScore = this.calculateEngagementScore(message, context);
    factors.push({
      name: "engagement",
      value: engagementScore,
      weight: this.weights.engagement,
      reason: this.getEngagementReason(engagementScore, message),
    });

    // 3. Score de correspondance de personnalité
    const personalityScore = this.calculatePersonalityMatchScore(
      message,
      context
    );
    factors.push({
      name: "personality",
      value: personalityScore,
      weight: this.weights.personality,
      reason: this.getPersonalityReason(personalityScore, context),
    });

    // 4. Score de timing
    const timingScore = this.calculateTimingScore(message, context);
    factors.push({
      name: "timing",
      value: timingScore,
      weight: this.weights.timing,
      reason: this.getTimingReason(timingScore, context),
    });

    // 5. Score contextuel
    const contextScore = this.calculateContextScore(message, context);
    factors.push({
      name: "context",
      value: contextScore,
      weight: this.weights.context,
      reason: this.getContextReason(contextScore, context),
    });

    // 6. Score de nouveauté
    const noveltyScore = this.calculateNoveltyScore(message, context);
    factors.push({
      name: "novelty",
      value: noveltyScore,
      weight: this.weights.novelty,
      reason: this.getNoveltyReason(noveltyScore, message),
    });

    // Calcul du score total pondéré
    const totalScore = factors.reduce(
      (sum, factor) => sum + factor.value * factor.weight,
      0
    );

    return {
      relevanceScore,
      engagementScore,
      personalityMatchScore: personalityScore,
      timingScore,
      contextScore,
      noveltyScore,
      totalScore,
      factors,
    };
  }

  /**
   * Calcule la pertinence du message par rapport au contexte utilisateur
   */
  private calculateRelevanceScore(
    message: ContextualMessage,
    context: UserContext
  ): number {
    let score = 0.5; // Score de base

    // Conditions spécifiques au message
    const conditionsMet = message.conditions.filter((condition) => {
      return this.evaluateCondition(condition, context);
    });

    score += (conditionsMet.length / message.conditions.length) * 0.3;

    // Pertinence par rapport au niveau de compétence
    if (message.type === "educational" && context.skillLevel === "beginner") {
      score += 0.1;
    } else if (
      message.type === "achievement" &&
      context.skillLevel === "expert"
    ) {
      score += 0.1;
    }

    // Pertinence par rapport à l'activité récente
    if (context.scriptsCount === 0 && message.type === "welcome") {
      score += 0.15;
    } else if (context.consecutiveDays > 7 && message.type === "achievement") {
      score += 0.15;
    }

    // Tags correspondants
    const relevantTags = this.getRelevantTags(context);
    const matchingTags = message.tags.filter((tag) =>
      relevantTags.includes(tag)
    );
    score += (matchingTags.length / Math.max(message.tags.length, 1)) * 0.1;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Prédit le score d'engagement basé sur l'historique
   */
  private calculateEngagementScore(
    message: ContextualMessage,
    context: UserContext
  ): number {
    let score = 0.6; // Score de base

    // Historique d'interaction avec des messages similaires
    const similarInteractions = this.historicalData.filter((interaction) =>
      this.isSimilarMessage(interaction.messageId, message)
    );

    if (similarInteractions.length > 0) {
      const avgEngagement =
        similarInteractions.reduce((sum, interaction) => {
          return sum + this.getInteractionScore(interaction);
        }, 0) / similarInteractions.length;
      score = avgEngagement;
    }

    // Ajustement basé sur l'engagement global
    score *= context.engagementScore / 100;

    // Bonus pour les types préférés
    if (context.messagePreferences?.preferredTypes.includes(message.type)) {
      score += 0.15;
    }

    // Pénalité pour les catégories bloquées
    if (
      context.messagePreferences?.blockedCategories.includes(message.category)
    ) {
      score *= 0.3;
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calcule la correspondance avec la personnalité de l'utilisateur
   */
  private calculatePersonalityMatchScore(
    message: ContextualMessage,
    context: UserContext
  ): number {
    let score = 0.7; // Score de base

    // Correspondance du ton
    const preferredTone = context.preferredMessageTone;
    const matchingVariation = message.variations.find(
      (v) => v.tone === preferredTone
    );

    if (matchingVariation) {
      score += 0.2;
    }

    // Correspondance de longueur basée sur l'engagement
    if (context.engagementScore > 80) {
      // Utilisateur très engagé - peut préférer des messages plus détaillés
      const longVariation = message.variations.find((v) => v.length === "long");
      if (longVariation) score += 0.1;
    } else if (context.engagementScore < 40) {
      // Utilisateur peu engagé - préfère probablement des messages courts
      const shortVariation = message.variations.find(
        (v) => v.length === "short"
      );
      if (shortVariation) score += 0.1;
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calcule le score de timing
   */
  private calculateTimingScore(
    message: ContextualMessage,
    context: UserContext
  ): number {
    let score = 0.5; // Score de base

    // Heure de la journée
    const timeScores: Record<
      typeof context.timeOfDay,
      Record<string, number>
    > = {
      early_morning: { motivation: 0.9, tip: 0.7, achievement: 0.5 },
      morning: { welcome: 0.9, motivation: 0.8, tip: 0.7 },
      afternoon: { educational: 0.8, tip: 0.7, reminder: 0.6 },
      evening: { achievement: 0.8, milestone: 0.7, celebration: 0.8 },
      night: { reflection: 0.8, achievement: 0.7, educational: 0.6 },
      late_night: { motivation: 0.5, achievement: 0.6, tip: 0.4 },
    };

    if (timeScores[context.timeOfDay]?.[message.type]) {
      score = timeScores[context.timeOfDay][message.type];
    }

    // Jour de la semaine
    const isWeekend = ["saturday", "sunday"].includes(context.dayOfWeek);
    if (isWeekend && message.type === "motivation") {
      score += 0.1;
    } else if (!isWeekend && message.type === "educational") {
      score += 0.1;
    }

    // Saisonnalité
    if (message.type === "seasonal") {
      score = context.isHoliday ? 0.95 : 0.3;
    }

    // Fréquence des messages
    const lastShown = message.metadata.lastShown;
    if (lastShown) {
      const hoursSinceLastShown =
        (Date.now() - new Date(lastShown).getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastShown < 24) {
        score *= 0.3; // Pénalité forte si montré récemment
      } else if (hoursSinceLastShown < 72) {
        score *= 0.7;
      }
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calcule le score contextuel global
   */
  private calculateContextScore(
    message: ContextualMessage,
    context: UserContext
  ): number {
    let score = 0.6; // Score de base

    // Progression et milestones
    const relevantMilestones = context.milestoneProgress.filter(
      (m) => m.progress > 0.7 && m.progress < 1
    );
    if (relevantMilestones.length > 0 && message.type === "milestone") {
      score += 0.3;
    }

    // Tendance de productivité
    if (
      context.productivityTrend === "increasing" &&
      ["motivation", "achievement"].includes(message.type)
    ) {
      score += 0.2;
    } else if (
      context.productivityTrend === "decreasing" &&
      ["tip", "educational", "re_engagement"].includes(message.type)
    ) {
      score += 0.2;
    }

    // Niveau de collaboration
    if (
      context.collaborationLevel === "team" &&
      message.tags.includes("collaboration")
    ) {
      score += 0.15;
    }

    // Plateforme et appareil
    if (
      context.deviceType === "mobile" &&
      message.variations.some((v) => v.length === "short")
    ) {
      score += 0.1;
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calcule le score de nouveauté
   */
  private calculateNoveltyScore(
    message: ContextualMessage,
    context: UserContext
  ): number {
    let score = 0.8; // Score de base élevé pour les nouveaux messages

    // Nombre de fois montré
    const showCount = message.metadata.showCount;
    if (showCount > 0) {
      score *= Math.exp(-showCount / 5); // Décroissance exponentielle
    }

    // Diversité par rapport aux messages récents
    const recentTypes = context.interactionHistory
      .slice(-10)
      .map((i) => this.getMessageType(i.messageId));

    if (recentTypes.includes(message.type)) {
      score *= 0.7;
    }

    return Math.min(1, Math.max(0, score));
  }

  // Méthodes utilitaires

  private evaluateCondition(condition: any, context: UserContext): boolean {
    try {
      const value = this.getNestedProperty(context, condition.property);

      switch (condition.operator) {
        case "equals":
          return value === condition.value;
        case "greater_than":
          return value > condition.value;
        case "less_than":
          return value < condition.value;
        case "contains":
          return Array.isArray(value)
            ? value.includes(condition.value)
            : String(value).includes(condition.value);
        case "between":
          return value >= condition.value[0] && value <= condition.value[1];
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((curr, prop) => curr?.[prop], obj);
  }

  private isSimilarMessage(
    messageId: string,
    message: ContextualMessage
  ): boolean {
    // Logique pour déterminer si deux messages sont similaires
    // Basé sur le type, la catégorie, les tags, etc.
    return false; // Simplification pour l'exemple
  }

  private getInteractionScore(interaction: MessageInteraction): number {
    switch (interaction.action) {
      case "clicked":
        return 1.0;
      case "viewed":
        return 0.6 + (interaction.engagementDuration || 0) / 10000;
      case "rated":
        return interaction.feedback?.rating
          ? interaction.feedback.rating / 5
          : 0.5;
      case "dismissed":
        return 0.2;
      default:
        return 0.5;
    }
  }

  private getMessageType(messageId: string): string {
    // Récupérer le type de message depuis l'ID
    return "unknown"; // Simplification
  }

  private getRelevantTags(context: UserContext): string[] {
    const tags: string[] = [];

    if (context.isFirstLogin) tags.push("onboarding", "new_user");
    if (context.consecutiveDays > 7) tags.push("engaged", "regular");
    if (context.scriptsCount > 10) tags.push("productive", "experienced");
    if (context.skillLevel === "expert") tags.push("advanced", "power_user");

    return tags;
  }

  // Méthodes pour générer les raisons des scores

  private getRelevanceReason(
    score: number,
    message: ContextualMessage,
    context: UserContext
  ): string {
    if (score > 0.8)
      return "Très pertinent pour votre profil et activité actuelle";
    if (score > 0.6) return "Pertinent pour votre niveau d'expérience";
    if (score > 0.4) return "Partiellement pertinent";
    return "Pertinence limitée dans le contexte actuel";
  }

  private getEngagementReason(
    score: number,
    message: ContextualMessage
  ): string {
    if (score > 0.8)
      return "Forte probabilité d'interaction basée sur votre historique";
    if (score > 0.6) return "Bon potentiel d'engagement";
    if (score > 0.4) return "Engagement modéré attendu";
    return "Faible probabilité d'engagement";
  }

  private getPersonalityReason(score: number, context: UserContext): string {
    if (score > 0.8)
      return `Parfaitement adapté à votre style ${context.preferredMessageTone}`;
    if (score > 0.6) return "Correspond bien à vos préférences";
    if (score > 0.4) return "Correspondance partielle avec vos préférences";
    return "Style peu adapté à vos préférences";
  }

  private getTimingReason(score: number, context: UserContext): string {
    if (score > 0.8) return "Moment idéal pour ce type de message";
    if (score > 0.6) return "Bon timing";
    if (score > 0.4) return "Timing acceptable";
    return "Timing peu optimal";
  }

  private getContextReason(score: number, context: UserContext): string {
    if (score > 0.8) return "Parfaitement aligné avec votre contexte actuel";
    if (score > 0.6) return "Bien adapté à votre situation";
    if (score > 0.4) return "Contexte partiellement pertinent";
    return "Peu adapté au contexte actuel";
  }

  private getNoveltyReason(score: number, message: ContextualMessage): string {
    if (score > 0.8) return "Message nouveau et diversifié";
    if (score > 0.6) return "Relativement nouveau";
    if (score > 0.4) return "Déjà vu mais pas récemment";
    return "Message fréquemment affiché";
  }
}
