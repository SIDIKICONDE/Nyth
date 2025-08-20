import {
  ContextualMessage,
  MessageCategory,
  MessageCondition,
  MessageType,
  UserContext,
} from "@/utils/contextual-messages/types";
import { createLogger } from "@/utils/optimizedLogger";

const logger = createLogger("MessageTemplateEngine");

interface MessageTemplate {
  id: string;
  type: MessageType;
  category: MessageCategory;
  templates: {
    title: string;
    message: string;
    emoji: string;
  }[];
  conditions: MessageCondition[];
  tags: string[];
  weight: number;
}

export class MessageTemplateEngine {
  private templates: Map<MessageType, MessageTemplate[]> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Génère des messages basés sur les templates
   */
  async generateMessages(
    context: UserContext,
    specificType?: MessageType,
    count: number = 3
  ): Promise<ContextualMessage[]> {
    const messages: ContextualMessage[] = [];

    // Sélectionner les types de messages appropriés
    const messageTypes = specificType
      ? [specificType]
      : this.selectAppropriateTypes(context);

    for (const type of messageTypes) {
      const typeMessages = await this.generateMessagesForType(
        type,
        context,
        count
      );
      messages.push(...typeMessages);
    }

    // Mélanger et limiter
    return this.shuffleAndLimit(messages, count);
  }

  /**
   * Obtient un template de base pour un type donné
   */
  async getBaseTemplate(
    context: UserContext,
    type?: MessageType
  ): Promise<ContextualMessage | null> {
    const selectedType = type || this.selectOptimalType(context);
    const templates = this.templates.get(selectedType) || [];

    if (templates.length === 0) return null;

    // Filtrer par conditions
    const eligibleTemplates = templates.filter((template) =>
      this.evaluateConditions(template.conditions, context)
    );

    if (eligibleTemplates.length === 0) return null;

    // Sélectionner le meilleur template
    const selectedTemplate = this.selectBestTemplate(
      eligibleTemplates,
      context
    );

    return this.instantiateTemplate(selectedTemplate, context);
  }

  private initializeTemplates() {
    // Messages de bienvenue
    this.addTemplate({
      id: "welcome_first_time",
      type: "welcome",
      category: "onboarding",
      templates: [
        {
          title: "Bienvenue sur Nyth ! 🎉",
          message:
            "Bonjour {name} ! Prêt à transformer vos idées en scripts captivants ? Notre IA est là pour vous accompagner à chaque étape.",
          emoji: "🚀",
        },
        {
          title: "C'est parti ! ✨",
          message:
            "Salut {name} ! Découvrez comment Nyth peut révolutionner votre création de contenu. Commençons par votre premier script !",
          emoji: "🎬",
        },
        {
          title: "Votre voyage créatif commence 🌟",
          message:
            "Bienvenue {name} ! Avec Nyth, créer des scripts professionnels n'a jamais été aussi simple. Explorons ensemble !",
          emoji: "📝",
        },
      ],
      conditions: [
        {
          type: "user_property",
          property: "isFirstLogin",
          operator: "equals",
          value: true,
          weight: 1.0,
        },
      ],
      tags: ["onboarding", "new_user", "welcome"],
      weight: 1.0,
    });

    // Messages de retour
    this.addTemplate({
      id: "welcome_returning",
      type: "re_engagement",
      category: "retention",
      templates: [
        {
          title: "Content de vous revoir ! 👋",
          message:
            "Bon retour {name} ! Vos {scriptsCount} scripts vous attendent. Prêt à en créer de nouveaux ?",
          emoji: "🔄",
        },
        {
          title: "Vous nous avez manqué ! 💫",
          message:
            "Heureux de vous retrouver {name} ! Reprenons là où vous vous étiez arrêté avec de nouvelles idées créatives.",
          emoji: "🎯",
        },
      ],
      conditions: [
        {
          type: "user_property",
          property: "daysSinceLastLogin",
          operator: "greater_than",
          value: 7,
          weight: 0.8,
        },
      ],
      tags: ["returning", "re_engagement"],
      weight: 0.9,
    });

    // Messages de motivation
    this.addTemplate({
      id: "motivation_productivity",
      type: "motivation",
      category: "motivation",
      templates: [
        {
          title: "Vous êtes en feu ! 🔥",
          message:
            "Incroyable {name} ! {consecutiveDays} jours d'affilée. Votre régularité porte ses fruits avec {words} mots écrits !",
          emoji: "💪",
        },
        {
          title: "Quelle constance ! 🌟",
          message:
            "Bravo {name} ! Votre dévouement est inspirant. Continuez sur cette lancée extraordinaire !",
          emoji: "🚀",
        },
      ],
      conditions: [
        {
          type: "user_property",
          property: "consecutiveDays",
          operator: "greater_than",
          value: 3,
          weight: 0.7,
        },
      ],
      tags: ["motivation", "streak", "productivity"],
      weight: 0.8,
    });

    // Messages éducatifs
    this.addTemplate({
      id: "educational_beginner",
      type: "educational",
      category: "education",
      templates: [
        {
          title: "Astuce du jour 💡",
          message:
            "Saviez-vous que l'IA peut adapter le ton de vos scripts ? Essayez différents styles pour trouver votre voix unique !",
          emoji: "🎓",
        },
        {
          title: "Découverte Nyth 📚",
          message:
            "Le téléprompteur ajuste automatiquement la vitesse de défilement. Parfait pour des présentations naturelles !",
          emoji: "🎥",
        },
      ],
      conditions: [
        {
          type: "user_property",
          property: "skillLevel",
          operator: "equals",
          value: "beginner",
          weight: 0.8,
        },
      ],
      tags: ["education", "tips", "beginner"],
      weight: 0.7,
    });

    // Messages d'accomplissement
    this.addTemplate({
      id: "achievement_milestone",
      type: "achievement",
      category: "achievement",
      templates: [
        {
          title: "Milestone atteint ! 🏆",
          message:
            "Félicitations {name} ! Vous avez écrit {words} mots. C'est l'équivalent d'un petit livre !",
          emoji: "🎊",
        },
        {
          title: "Nouveau record ! 🎯",
          message:
            "Incroyable {name} ! {scriptsCount} scripts créés. Votre bibliothèque de contenu grandit impressionnamment !",
          emoji: "📈",
        },
      ],
      conditions: [
        {
          type: "achievement",
          property: "achievements.length",
          operator: "greater_than",
          value: 0,
          weight: 0.9,
        },
      ],
      tags: ["achievement", "milestone", "celebration"],
      weight: 0.95,
    });

    // Messages saisonniers
    this.addTemplate({
      id: "seasonal_holiday",
      type: "seasonal",
      category: "engagement",
      templates: [
        {
          title: "Moment festif ! 🎄",
          message:
            "Joyeuses fêtes {name} ! C'est le moment parfait pour créer des messages spéciaux pour vos proches.",
          emoji: "🎁",
        },
        {
          title: "Saison créative ! 🌸",
          message:
            "Profitez de cette belle saison pour créer du contenu inspirant. L'inspiration est partout !",
          emoji: "🌺",
        },
      ],
      conditions: [
        {
          type: "time",
          property: "isHoliday",
          operator: "equals",
          value: true,
          weight: 0.9,
        },
      ],
      tags: ["seasonal", "holiday", "special"],
      weight: 0.85,
    });

    // Messages de conseils avancés
    this.addTemplate({
      id: "tip_advanced",
      type: "tip",
      category: "education",
      templates: [
        {
          title: "Pro tip 🎯",
          message:
            "Utilisez les raccourcis clavier pour éditer plus rapidement. Ctrl+B pour gras, Ctrl+I pour italique !",
          emoji: "⚡",
        },
        {
          title: "Optimisez votre workflow 🔧",
          message:
            "Créez des templates réutilisables pour vos formats de scripts préférés. Gain de temps garanti !",
          emoji: "🛠️",
        },
      ],
      conditions: [
        {
          type: "user_property",
          property: "skillLevel",
          operator: "equals",
          value: "advanced",
          weight: 0.7,
        },
      ],
      tags: ["tips", "advanced", "productivity"],
      weight: 0.6,
    });

    // Messages de rappel
    this.addTemplate({
      id: "reminder_save",
      type: "reminder",
      category: "retention",
      templates: [
        {
          title: "N'oubliez pas ! ⏰",
          message:
            "Pensez à sauvegarder vos scripts importants dans vos favoris pour un accès rapide.",
          emoji: "💾",
        },
        {
          title: "Petit rappel 📌",
          message:
            "Vos brouillons sont sauvegardés automatiquement, mais n'oubliez pas d'exporter vos scripts finalisés !",
          emoji: "📤",
        },
      ],
      conditions: [
        {
          type: "user_property",
          property: "scriptsCount",
          operator: "greater_than",
          value: 5,
          weight: 0.5,
        },
      ],
      tags: ["reminder", "tips", "organization"],
      weight: 0.5,
    });

    // Messages de découverte de fonctionnalités
    this.addTemplate({
      id: "feature_discovery",
      type: "feature_discovery",
      category: "feature_adoption",
      templates: [
        {
          title: "Nouvelle fonctionnalité ! ✨",
          message:
            "Avez-vous essayé notre mode collaboration ? Travaillez à plusieurs sur le même script en temps réel !",
          emoji: "👥",
        },
        {
          title: "À découvrir 🔍",
          message:
            "L'export vidéo est maintenant disponible ! Transformez vos scripts en vidéos professionnelles en un clic.",
          emoji: "🎬",
        },
      ],
      conditions: [
        {
          type: "behavior",
          property: "featureUsageMap.collaboration",
          operator: "equals",
          value: 0,
          weight: 0.6,
        },
      ],
      tags: ["features", "discovery", "new"],
      weight: 0.7,
    });
  }

  private addTemplate(template: MessageTemplate) {
    const existing = this.templates.get(template.type) || [];
    existing.push(template);
    this.templates.set(template.type, existing);
  }

  private selectAppropriateTypes(context: UserContext): MessageType[] {
    const types: MessageType[] = [];

    if (context.isFirstLogin) {
      types.push("welcome");
    } else if (context.daysSinceLastLogin > 7) {
      types.push("re_engagement");
    }

    if (context.consecutiveDays > 3) {
      types.push("motivation");
    }

    if (context.achievements.length > 0) {
      types.push("achievement");
    }

    if (context.skillLevel === "beginner") {
      types.push("educational");
    } else if (context.skillLevel === "advanced") {
      types.push("tip");
    }

    if (context.isHoliday) {
      types.push("seasonal");
    }

    // Ajouter des types par défaut si aucun n'est sélectionné
    if (types.length === 0) {
      types.push("tip", "motivation", "reminder");
    }

    return types;
  }

  private selectOptimalType(context: UserContext): MessageType {
    const types = this.selectAppropriateTypes(context);

    // Pondérer par priorité contextuelle
    const weights: Record<MessageType, number> = {
      welcome: context.isFirstLogin ? 10 : 0,
      achievement: context.achievements.length > 0 ? 8 : 0,
      re_engagement: context.daysSinceLastLogin > 7 ? 7 : 0,
      milestone: this.isNearMilestone(context) ? 6 : 0,
      motivation: context.productivityTrend === "increasing" ? 5 : 3,
      educational: context.skillLevel === "beginner" ? 5 : 1,
      tip: 4,
      seasonal: context.isHoliday ? 8 : 0,
      feature_discovery: 3,
      reminder: 2,
      celebration: 2,
      feedback_request: 1,
    };

    // Sélectionner le type avec le poids le plus élevé
    return types.reduce((best, current) =>
      (weights[current] || 0) > (weights[best] || 0) ? current : best
    );
  }

  private async generateMessagesForType(
    type: MessageType,
    context: UserContext,
    maxCount: number
  ): Promise<ContextualMessage[]> {
    const templates = this.templates.get(type) || [];
    const messages: ContextualMessage[] = [];

    for (const template of templates) {
      if (this.evaluateConditions(template.conditions, context)) {
        const message = await this.instantiateTemplate(template, context);
        if (message) messages.push(message);
      }
    }

    return messages.slice(0, maxCount);
  }

  private evaluateConditions(
    conditions: MessageCondition[],
    context: UserContext
  ): boolean {
    if (conditions.length === 0) return true;

    let totalWeight = 0;
    let weightedScore = 0;

    for (const condition of conditions) {
      const met = this.evaluateCondition(condition, context);
      totalWeight += condition.weight;
      if (met) weightedScore += condition.weight;
    }

    // Au moins 70% des conditions pondérées doivent être remplies
    return weightedScore / totalWeight >= 0.7;
  }

  private evaluateCondition(
    condition: MessageCondition,
    context: UserContext
  ): boolean {
    try {
      const value = this.getNestedProperty(context, condition.property);

      switch (condition.operator) {
        case "equals":
          return value === condition.value;
        case "greater_than":
          return Number(value) > Number(condition.value);
        case "less_than":
          return Number(value) < Number(condition.value);
        case "contains":
          return Array.isArray(value)
            ? value.includes(condition.value)
            : String(value).includes(String(condition.value));
        case "between":
          const [min, max] = condition.value as [number, number];
          return Number(value) >= min && Number(value) <= max;
        default:
          return false;
      }
    } catch (error) {
      logger.error("Erreur évaluation condition:", error);
      return false;
    }
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((current, prop) => current?.[prop], obj);
  }

  private selectBestTemplate(
    templates: MessageTemplate[],
    context: UserContext
  ): MessageTemplate {
    // Scorer chaque template basé sur le contexte
    const scored = templates.map((template) => ({
      template,
      score: this.scoreTemplate(template, context),
    }));

    // Trier par score décroissant
    scored.sort((a, b) => b.score - a.score);

    return scored[0].template;
  }

  private scoreTemplate(
    template: MessageTemplate,
    context: UserContext
  ): number {
    let score = template.weight;

    // Bonus pour les tags correspondants
    const contextTags = this.getContextTags(context);
    const matchingTags = template.tags.filter((tag) =>
      contextTags.includes(tag)
    );
    score += matchingTags.length * 0.1;

    // Bonus pour les conditions bien remplies
    const conditionScore = this.calculateConditionScore(
      template.conditions,
      context
    );
    score += conditionScore * 0.3;

    return score;
  }

  private getContextTags(context: UserContext): string[] {
    const tags: string[] = [];

    if (context.isFirstLogin) tags.push("new_user", "onboarding");
    if (context.consecutiveDays > 7) tags.push("engaged", "regular");
    if (context.skillLevel === "beginner") tags.push("beginner");
    if (context.skillLevel === "expert") tags.push("advanced", "power_user");
    if (context.productivityTrend === "increasing") tags.push("productive");
    if (context.isHoliday) tags.push("holiday", "special");

    return tags;
  }

  private calculateConditionScore(
    conditions: MessageCondition[],
    context: UserContext
  ): number {
    if (conditions.length === 0) return 0.5;

    let totalScore = 0;
    for (const condition of conditions) {
      if (this.evaluateCondition(condition, context)) {
        totalScore += condition.weight;
      }
    }

    return totalScore / conditions.length;
  }

  private async instantiateTemplate(
    template: MessageTemplate,
    context: UserContext
  ): Promise<ContextualMessage> {
    // Sélectionner une variation aléatoire du template
    const variation =
      template.templates[Math.floor(Math.random() * template.templates.length)];

    return {
      id: `template_${template.id}_${Date.now()}`,
      title: variation.title,
      message: variation.message,
      emoji: variation.emoji,
      type: template.type,
      priority: this.determinePriority(template.type, context),
      category: template.category,
      tags: [...template.tags],
      metadata: {
        createdAt: new Date().toISOString(),
        showCount: 0,
        effectiveness: 0,
        targetAudience: [context.skillLevel],
        excludeAudience: [],
      },
      personalizationTokens: this.extractTokens(context),
      variations: [
        {
          id: `${template.id}_default`,
          content: variation.message,
          tone: context.preferredMessageTone,
          length: this.determineLength(variation.message),
          effectiveness: 0,
        },
      ],
      conditions: template.conditions,
      scoring: {
        relevanceScore: 0,
        engagementScore: 0,
        personalityMatchScore: 0,
        timingScore: 0,
        contextScore: 0,
        noveltyScore: 0,
        totalScore: 0,
        factors: [],
      },
    };
  }

  private determinePriority(
    type: MessageType,
    context: UserContext
  ): ContextualMessage["priority"] {
    if (type === "welcome" && context.isFirstLogin) return "critical";
    if (type === "achievement") return "high";
    if (type === "re_engagement") return "high";
    if (["motivation", "milestone"].includes(type)) return "medium";
    return "low";
  }

  private extractTokens(context: UserContext): Record<string, any> {
    return {
      name: context.userName,
      userName: context.userName,
      scriptsCount: context.scriptsCount,
      words: context.totalWordsWritten,
      consecutiveDays: context.consecutiveDays,
      level: context.skillLevel,
      timeOfDay: context.timeOfDay,
    };
  }

  private determineLength(content: string): "short" | "medium" | "long" {
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 20) return "short";
    if (wordCount < 50) return "medium";
    return "long";
  }

  private isNearMilestone(context: UserContext): boolean {
    return context.milestoneProgress.some(
      (m) => m.progress > 0.8 && m.progress < 1
    );
  }

  private shuffleAndLimit<T>(array: T[], limit: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, limit);
  }
}
