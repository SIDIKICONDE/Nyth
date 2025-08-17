import { createLogger } from "@/utils/optimizedLogger";
import { AIMessageGenerator } from "../ai/AIMessageGenerator";
import { MessageTemplateEngine } from "../templates/MessageTemplateEngine";
import { ContextualMessage, MessageType, UserContext } from "../types";

const logger = createLogger("MessageCandidateGenerator");

/**
 * Générateur de candidats de messages
 * Responsable de créer différentes options de messages
 */
export class MessageCandidateGenerator {
  private aiGenerator: AIMessageGenerator;
  private templateEngine: MessageTemplateEngine;

  constructor() {
    this.aiGenerator = new AIMessageGenerator();
    this.templateEngine = new MessageTemplateEngine();
  }

  /**
   * Génère plusieurs candidats de messages
   */
  async generateCandidates(
    context: UserContext,
    preferAI: boolean,
    specificType?: MessageType,
    maxCandidates: number = 5
  ): Promise<ContextualMessage[]> {
    const candidates: ContextualMessage[] = [];

    // 1. Messages générés par l'IA
    if (preferAI || !specificType) {
      try {
        const aiMessages = await Promise.all([
          this.aiGenerator.generateMessage(context),
          this.aiGenerator.generateMessage(context, { temperature: 0.9 }),
          this.aiGenerator.generateMessage(context, { temperature: 0.7 }),
        ]);
        candidates.push(...aiMessages);
      } catch (error) {
        logger.error("Erreur génération IA:", error);
      }
    }

    // 2. Messages basés sur les templates
    const templateMessages = await this.templateEngine.generateMessages(
      context,
      specificType,
      Math.max(3, maxCandidates - candidates.length)
    );
    candidates.push(...templateMessages);

    // 3. Messages hybrides (template + IA)
    if (candidates.length < maxCandidates) {
      try {
        const hybridMessage = await this.generateHybridMessage(
          context,
          specificType
        );
        if (hybridMessage) candidates.push(hybridMessage);
      } catch (error) {
        logger.error("Erreur génération hybride:", error);
      }
    }

    return candidates.slice(0, maxCandidates);
  }

  /**
   * Génère un message hybride combinant template et IA
   */
  private async generateHybridMessage(
    context: UserContext,
    type?: MessageType
  ): Promise<ContextualMessage | null> {
    try {
      // Obtenir un template de base
      const templateBase = await this.templateEngine.getBaseTemplate(
        context,
        type
      );
      if (!templateBase) return null;

      // Enrichir avec l'IA
      const enrichPrompt = `Améliore ce message en gardant son essence mais en le rendant plus personnalisé:

Message original: "${templateBase.message}"
Contexte: L'utilisateur a créé ${context.scriptsCount} scripts et est de niveau ${context.skillLevel}.

Génère une version améliorée qui reste concise (2-3 phrases max).`;

      const enrichedContent = await this.aiGenerator.generateMessage(context, {
        systemPrompt: enrichPrompt,
        temperature: 0.7,
        maxTokens: 100,
      });

      return {
        ...templateBase,
        ...enrichedContent,
        id: `hybrid_${Date.now()}`,
        tags: [...templateBase.tags, "hybrid"],
      };
    } catch (error) {
      logger.error("Erreur génération hybride:", error);
      return null;
    }
  }
}
