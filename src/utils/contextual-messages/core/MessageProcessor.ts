import { createLogger } from "@/utils/optimizedLogger";
import { ContextualMessage, MessageVariation, UserContext } from "../types";
import {
  getEmergencyMessage,
  getUserPreferredLanguage,
} from "../utils/LanguageUtils";
import { replacePersonalizationTokens } from "../utils/MessageUtils";
import { cleanMarkdownText } from "../utils/TextCleaner";

const logger = createLogger("MessageProcessor");

/**
 * Processeur de messages contextuels
 * Gère la préparation et le traitement des messages pour l'affichage
 */
export class MessageProcessor {
  /**
   * Prépare le message final pour l'affichage
   */
  async prepareMessageForDisplay(
    message: ContextualMessage,
    context: UserContext
  ): Promise<ContextualMessage> {
    // 1. Sélectionner la meilleure variation
    const bestVariation = this.selectBestVariation(message, context);
    if (bestVariation) {
      message.message = bestVariation.content;
    }

    // 2. Remplacer les tokens de personnalisation (maintenant asynchrone)
    message.message = await replacePersonalizationTokens(
      message.message,
      context
    );
    message.title = await replacePersonalizationTokens(message.title, context);

    // 3. Nettoyer le markdown pour l'affichage en texte simple
    message.message = cleanMarkdownText(message.message);
    message.title = cleanMarkdownText(message.title);

    // 4. Ajouter des métadonnées d'affichage
    message.metadata.lastShown = new Date().toISOString();
    message.metadata.showCount++;

    return message;
  }

  /**
   * Sélectionne la meilleure variation d'un message
   */
  private selectBestVariation(
    message: ContextualMessage,
    context: UserContext
  ): MessageVariation | null {
    if (!message.variations || message.variations.length === 0) return null;

    // Trouver la variation correspondant au ton préféré
    const preferredVariation = message.variations.find(
      (v) => v.tone === context.preferredMessageTone
    );

    if (preferredVariation) return preferredVariation;

    // Sinon, choisir la plus efficace
    return message.variations.reduce((best, current) =>
      current.effectiveness > best.effectiveness ? current : best
    );
  }

  /**
   * Génère un message de fallback d'urgence multilingue
   */
  async getEmergencyFallbackMessage(
    user: any,
    context?: UserContext
  ): Promise<ContextualMessage> {
    let message = "Créez des scripts captivants avec l'aide de notre IA !";
    let title = "Bienvenue sur Nyth";

    // Si on a un contexte, utiliser le message multilingue
    if (context) {
      try {
        const language = await getUserPreferredLanguage(context);
        message = await getEmergencyMessage(context);

        // Titres multilingues
        const titles = {
                fr: "Bienvenue sur Nyth",
      en: "Welcome to Nyth",
      es: "Bienvenido a Nyth",
      ja: "Nythへようこそ",
      de: "Willkommen bei Nyth",
      it: "Benvenuto su Nyth",
      pt: "Bem-vindo ao Nyth",
      ru: "Добро пожаловать в Nyth",
      ko: "Nyth에 오신 것을 환영합니다",
      zh: "欢迎使用Nyth",
      ar: "مرحباً بك في Nyth",
      hi: "Nyth में आपका स्वागत है",
        };

        title = titles[language] || titles.en;
      } catch (error) {
        logger.error(
          "Erreur lors de la génération du message d'urgence multilingue:",
          error
        );
        // Garder les valeurs par défaut
      }
    }

    return {
      id: `fallback_${Date.now()}`,
      title,
      message,
      emoji: "🎬",
      type: "welcome",
      priority: "medium",
      category: "onboarding",
      tags: ["fallback", "emergency"],
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
        relevanceScore: 0.5,
        engagementScore: 0.5,
        personalityMatchScore: 0.5,
        timingScore: 0.5,
        contextScore: 0.5,
        noveltyScore: 1,
        totalScore: 0.5,
        factors: [],
      },
    };
  }
}
