import { createLogger } from "@/utils/optimizedLogger";
import { MessageAnalytics } from "../analytics/MessageAnalytics";
import { ContextAnalyzer } from "../analyzers/ContextAnalyzer";
import { MessageScoringEngine } from "../scoring/MessageScoringEngine";
import {
  ContextualMessage,
  MessageInteraction,
  MessageType,
  UserContext,
} from "../types";
import { InteractionManager } from "./InteractionManager";
import { MessageCacheManager } from "./MessageCacheManager";
import { MessageCandidateGenerator } from "./MessageCandidateGenerator";
import { MessageProcessor } from "./MessageProcessor";

const logger = createLogger("ContextualMessageSystem");

/**
 * Système de messages contextuels sophistiqué
 * Utilise l'IA, le scoring avancé et l'analyse comportementale
 */
export class ContextualMessageSystem {
  private static instance: ContextualMessageSystem;

  private contextAnalyzer: ContextAnalyzer;
  private scoringEngine: MessageScoringEngine;
  private analytics: MessageAnalytics;
  private candidateGenerator: MessageCandidateGenerator;
  private messageProcessor: MessageProcessor;
  private cacheManager: MessageCacheManager;
  private interactionManager: InteractionManager;

  private constructor() {
    this.contextAnalyzer = ContextAnalyzer.getInstance();
    this.analytics = new MessageAnalytics();
    this.interactionManager = new InteractionManager(this.analytics);
    this.scoringEngine = new MessageScoringEngine(
      this.interactionManager.getInteractionHistory()
    );
    this.candidateGenerator = new MessageCandidateGenerator();
    this.messageProcessor = new MessageProcessor();
    this.cacheManager = new MessageCacheManager();
  }

  static getInstance(): ContextualMessageSystem {
    if (!this.instance) {
      this.instance = new ContextualMessageSystem();
    }
    return this.instance;
  }

  /**
   * Génère le meilleur message contextuel pour l'utilisateur
   */
  async generateOptimalMessage(
    user: any,
    scripts: any[],
    recordings: any[],
    options?: {
      preferAI?: boolean;
      messageType?: MessageType;
      maxCandidates?: number;
      useCache?: boolean;
      context?: UserContext;
    }
  ): Promise<ContextualMessage> {
    let context: UserContext | undefined;

    try {
      logger.info("Génération de message contextuel optimal", {
        userId: user?.id,
        scriptsCount: scripts?.length,
        options,
      });

      // 1. Construire le contexte utilisateur complet (sauf si déjà fourni)
      context =
        options?.context ||
        (await this.contextAnalyzer.buildUserContext(
          user,
          scripts,
          recordings
        ));

      // 2. Vérifier le cache si activé
      if (options?.useCache) {
        const cachedMessage = await this.cacheManager.getCachedMessage(context);
        if (cachedMessage) {
          logger.info("Message trouvé dans le cache");
          return cachedMessage;
        }
      }

      // 3. Charger l'historique d'interactions
      await this.interactionManager.loadInteractionHistory(context.userId);

      // 4. Générer des candidats de messages
      const candidates = await this.candidateGenerator.generateCandidates(
        context,
        options?.preferAI ?? true,
        options?.messageType,
        options?.maxCandidates ?? 5
      );

      // 5. Scorer et classer les candidats
      const scoredCandidates = this.scoreAndRankCandidates(candidates, context);

      // 6. Sélectionner le meilleur message
      const optimalMessage = scoredCandidates[0];

      // 7. Enregistrer l'analytics
      await this.analytics.trackMessageGeneration(optimalMessage, context);

      // 8. Mettre en cache
      if (options?.useCache) {
        await this.cacheManager.cacheMessage(context, optimalMessage);
      }

      // 9. Préparer le message pour l'affichage
      const finalMessage = await this.messageProcessor.prepareMessageForDisplay(
        optimalMessage,
        context
      );

      // 10. Enregistrer l'impression
      await this.interactionManager.recordMessageImpression(finalMessage.id);

      logger.info("Message optimal généré", {
        messageId: finalMessage.id,
        type: finalMessage.type,
        score: finalMessage.scoring.totalScore,
      });

      return finalMessage;
    } catch (error) {
      logger.error("Erreur lors de la génération du message optimal:", error);
      // Passer le contexte au message d'urgence pour le support multilingue
      return await this.messageProcessor.getEmergencyFallbackMessage(
        user,
        context
      );
    }
  }

  /**
   * Score et classe les candidats
   */
  private scoreAndRankCandidates(
    candidates: ContextualMessage[],
    context: UserContext
  ): ContextualMessage[] {
    // Mettre à jour le scoring engine avec l'historique récent
    this.scoringEngine = new MessageScoringEngine(
      this.interactionManager.getInteractionHistory()
    );

    // Scorer chaque candidat
    const scoredCandidates = candidates.map((candidate) => {
      const score = this.scoringEngine.scoreMessage(candidate, context);
      return {
        ...candidate,
        scoring: score,
      };
    });

    // Trier par score total décroissant
    scoredCandidates.sort(
      (a, b) => b.scoring.totalScore - a.scoring.totalScore
    );

    // Appliquer une diversification si les scores sont proches
    return this.applyDiversification(scoredCandidates);
  }

  /**
   * Applique une diversification pour éviter la monotonie
   */
  private applyDiversification(
    messages: ContextualMessage[]
  ): ContextualMessage[] {
    if (messages.length <= 1) return messages;

    // Si le top message a été montré récemment, pénaliser légèrement
    const recentTypes = this.interactionManager.getRecentMessageTypes(5);

    return messages
      .map((msg, index) => {
        if (index === 0 && recentTypes.includes(msg.type)) {
          // Réduire légèrement le score pour favoriser la diversité
          msg.scoring.totalScore *= 0.9;
          msg.scoring.noveltyScore *= 0.8;
        }
        return msg;
      })
      .sort((a, b) => b.scoring.totalScore - a.scoring.totalScore);
  }

  /**
   * Enregistre une interaction avec un message
   */
  async recordInteraction(
    messageId: string,
    action: MessageInteraction["action"],
    additionalData?: {
      engagementDuration?: number;
      feedback?: MessageInteraction["feedback"];
    }
  ): Promise<void> {
    await this.interactionManager.recordInteraction(
      messageId,
      action,
      additionalData
    );
  }

  /**
   * Obtient les statistiques du système
   */
  getSystemStats() {
    return {
      cacheSize: this.cacheManager.getCacheSize(),
      interactionHistory:
        this.interactionManager.getInteractionHistory().length,
      recentMessageTypes: this.interactionManager.getRecentMessageTypes(),
    };
  }

  /**
   * Réinitialise le cache
   */
  clearCache(): void {
    this.cacheManager.clearCache();
  }
}
