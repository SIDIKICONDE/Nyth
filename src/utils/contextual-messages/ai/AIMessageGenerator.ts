import { AIService } from "@/services/ai/AIService";
import { MessageScoringEngine } from "@/utils/contextual-messages/scoring/MessageScoringEngine";
import {
  AIGenerationConfig,
  ContextualMessage,
  MessageType,
  MessageVariation,
  UserContext,
} from "@/utils/contextual-messages/types";
import { getDeviceLanguage } from "@/utils/languageDetector";
import { createLogger } from "@/utils/optimizedLogger";
import i18n from "i18next";

// Import des modules refactorisés
import { FALLBACK_MESSAGES } from "./fallback/FallbackMessages";
import {
  buildContextualPrompt,
  buildSystemPrompt,
} from "./prompts/AIPromptBuilder";
import {
  DEFAULT_MESSAGE_TYPES,
  VARIATION_TONE_KEYS,
} from "./types/MessageConstants";
import {
  calculateExpiration,
  cleanMarkdownText,
  defineExcludeAudience,
  defineTargetAudience,
  determineCategory,
  determineLength,
  determinePriority,
  generateConditions,
  generateMessageId,
  generateTags,
  getDefaultEmoji,
  hasRecentAchievement,
  isNearMilestone,
} from "./utils/MessageUtils";

const logger = createLogger("AIMessageGenerator");

export class AIMessageGenerator {
  private scoringEngine: MessageScoringEngine;

  constructor() {
    this.scoringEngine = new MessageScoringEngine();
  }

  /**
   * Génère un message contextuel personnalisé avec l'IA
   */
  async generateMessage(
    context: UserContext,
    config?: Partial<AIGenerationConfig>
  ): Promise<ContextualMessage> {
    const defaultConfig: AIGenerationConfig = {
      model: "gpt-4",
      temperature: 0.8,
      maxTokens: 150,
      contextWindow: 4000,
      systemPrompt: buildSystemPrompt(
        context.preferredLanguage || getDeviceLanguage()
      ),
      userContextDepth: "detailed",
      includeHistory: true,
      personalizationLevel: 0.8,
    };

    const finalConfig = { ...defaultConfig, ...config };
    // Déterminer le type de message avant le try pour qu'il soit toujours défini
    const messageType = this.selectOptimalMessageType(context);

    try {
      // 2. Construire le prompt contextuel
      const prompt = buildContextualPrompt(context, messageType, finalConfig);

      // 3. Générer le contenu avec l'IA
      const aiResponse = await AIService.simpleChatWithAI(prompt);

      // 4. Parser et structurer la réponse
      const parsedMessage = this.parseAIResponse(
        aiResponse,
        messageType,
        context
      );

      // 5. Générer des variations
      const variations = await this.generateVariations(parsedMessage, context);

      // 6. Enrichir avec métadonnées
      const enrichedMessage = this.enrichMessage(
        parsedMessage,
        variations,
        context
      );

      // 7. Scorer le message
      const score = this.scoringEngine.scoreMessage(enrichedMessage, context);
      enrichedMessage.scoring = score;

      return enrichedMessage;
    } catch (error) {
      logger.error("Erreur génération message IA:", error);
      return this.getFallbackMessage(context, messageType);
    }
  }

  /**
   * Génère plusieurs messages et sélectionne le meilleur
   */
  async generateOptimalMessage(
    context: UserContext,
    count: number = 3
  ): Promise<ContextualMessage> {
    const messages = await Promise.all(
      Array(count)
        .fill(null)
        .map(() => this.generateMessage(context))
    );

    // Scorer tous les messages et retourner le meilleur
    const scoredMessages = messages.map((msg) => ({
      message: msg,
      score: this.scoringEngine.scoreMessage(msg, context),
    }));

    scoredMessages.sort((a, b) => b.score.totalScore - a.score.totalScore);

    return scoredMessages[0].message;
  }

  private selectOptimalMessageType(context: UserContext): MessageType {
    // Logique de sélection basée sur le contexte
    if (context.isFirstLogin) return "welcome";

    if (context.daysSinceLastLogin > 14) return "re_engagement";

    if (hasRecentAchievement(context)) return "achievement";

    if (isNearMilestone(context)) return "milestone";

    if (context.productivityTrend === "decreasing") return "motivation";

    if (context.timeOfDay === "morning" && Math.random() < 0.3) return "tip";

    if (context.skillLevel === "beginner" && Math.random() < 0.4)
      return "educational";

    if (context.isHoliday) return "seasonal";

    // Par défaut, varier entre différents types
    return DEFAULT_MESSAGE_TYPES[
      Math.floor(Math.random() * DEFAULT_MESSAGE_TYPES.length)
    ];
  }

  private parseAIResponse(
    response: string,
    messageType: MessageType,
    context: UserContext
  ): ContextualMessage {
    // Nettoyer la réponse de tout formatage ou caractères indésirables
    const cleanedResponse = cleanMarkdownText(response.trim());

    try {
      // Essayer d'abord de parser comme JSON au cas où l'IA retournerait encore du JSON
      const parsed = JSON.parse(response);
      if (parsed && typeof parsed === "object" && parsed.message) {
        return {
          id: generateMessageId(),
          title: cleanMarkdownText(parsed.title || "Message CamPrompt AI"),
          message: cleanMarkdownText(parsed.message),
          emoji: parsed.emoji || getDefaultEmoji(messageType),
          type: messageType,
          priority: determinePriority(messageType, context),
          category: determineCategory(messageType),
          tags: generateTags(messageType, context),
          metadata: {
            createdAt: new Date().toISOString(),
            showCount: 0,
            effectiveness: 0,
            targetAudience: [context.skillLevel],
            excludeAudience: [],
          },
          personalizationTokens: {
            userName: context.userName,
            scriptsCount: context.scriptsCount,
            achievement: parsed.achievement,
          },
          variations: [],
          conditions: generateConditions(messageType, context),
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
    } catch (error) {}

    // Traiter la réponse comme du texte simple (comportement principal maintenant)
    return this.createBasicMessage(cleanedResponse, messageType, context);
  }

  private async generateVariations(
    message: ContextualMessage,
    context: UserContext
  ): Promise<MessageVariation[]> {
    const variations: MessageVariation[] = [];
    const language = context.preferredLanguage || getDeviceLanguage();

    for (const tone of VARIATION_TONE_KEYS) {
      if (tone === context.preferredMessageTone) {
        // Utiliser le message original pour le ton préféré
        variations.push({
          id: `${message.id}_${tone}`,
          content: message.message,
          tone,
          length: determineLength(message.message),
          effectiveness: 0.8,
        });
      } else {
        // Générer une variation pour les autres tons
        try {
          const t = i18n.getFixedT(language, ["prompts", "tones"]);
          const variationPrompt = t("prompts:contextual.variationPrompt", {
            tone: t(`tones:${tone}`),
            message: message.message,
          });

          const variation = await AIService.simpleChatWithAI(variationPrompt);

          variations.push({
            id: `${message.id}_${tone}`,
            content: variation,
            tone,
            length: determineLength(variation),
            effectiveness: 0.6,
          });
        } catch (error) {
          logger.error(`Erreur génération variation ${tone}:`, error);
        }
      }
    }

    return variations;
  }

  private enrichMessage(
    message: ContextualMessage,
    variations: MessageVariation[],
    context: UserContext
  ): ContextualMessage {
    return {
      ...message,
      variations,
      metadata: {
        ...message.metadata,
        targetAudience: defineTargetAudience(message, context),
        excludeAudience: defineExcludeAudience(message, context),
        expiresAt: calculateExpiration(message.type),
      },
    };
  }

  private createBasicMessage(
    content: string,
    type: MessageType,
    context: UserContext
  ): ContextualMessage {
    return {
      id: generateMessageId(),
      title: "Message CamPrompt AI",
      message: content,
      emoji: getDefaultEmoji(type),
      type,
      priority: "medium",
      category: determineCategory(type),
      tags: generateTags(type, context),
      metadata: {
        createdAt: new Date().toISOString(),
        showCount: 0,
        effectiveness: 0,
        targetAudience: [],
        excludeAudience: [],
      },
      personalizationTokens: {},
      variations: [],
      conditions: [],
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

  private getFallbackMessage(
    context: UserContext,
    type: MessageType
  ): ContextualMessage {
    const fallback = FALLBACK_MESSAGES[type];
    return this.createBasicMessage(fallback.message, type, context);
  }
}
