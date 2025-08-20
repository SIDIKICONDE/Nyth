import { createLogger } from "@/utils/optimizedLogger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MessageAnalytics } from "../analytics/MessageAnalytics";
import { MessageInteraction, MessageType } from "../types";
import { getCurrentUserId, getMessageTypeFromId } from "../utils/MessageUtils";

const logger = createLogger("InteractionManager");

/**
 * Gestionnaire des interactions avec les messages
 */
export class InteractionManager {
  private interactionHistory: MessageInteraction[] = [];
  private analytics: MessageAnalytics;

  constructor(analytics: MessageAnalytics) {
    this.analytics = analytics;
  }

  /**
   * Charge l'historique des interactions
   */
  async loadInteractionHistory(userId: string): Promise<void> {
    try {
      const key = `@message_interactions_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        this.interactionHistory = JSON.parse(stored);
        logger.info("Historique chargé", {
          count: this.interactionHistory.length,
        });
      }
    } catch (error) {
      logger.error("Erreur chargement historique:", error);
    }
  }

  /**
   * Sauvegarde l'historique des interactions
   */
  async saveInteractionHistory(userId: string): Promise<void> {
    try {
      const key = `@message_interactions_${userId}`;
      // Garder seulement les 100 dernières interactions
      const toSave = this.interactionHistory.slice(-100);
      await AsyncStorage.setItem(key, JSON.stringify(toSave));
      logger.info("Historique sauvegardé", { count: toSave.length });
    } catch (error) {
      logger.error("Erreur sauvegarde historique:", error);
    }
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
    try {
      const interaction: MessageInteraction = {
        messageId,
        timestamp: new Date().toISOString(),
        action,
        ...additionalData,
      };

      // Ajouter à l'historique local
      this.interactionHistory.push(interaction);

      // Persister
      const userId = await getCurrentUserId();
      if (userId) {
        await this.saveInteractionHistory(userId);
      }

      // Analytics
      await this.analytics.trackInteraction(interaction);

      logger.info("Interaction enregistrée", { messageId, action });
    } catch (error) {
      logger.error("Erreur enregistrement interaction:", error);
    }
  }

  /**
   * Enregistre une impression de message
   */
  async recordMessageImpression(messageId: string): Promise<void> {
    await this.recordInteraction(messageId, "viewed");
  }

  /**
   * Obtient l'historique des interactions
   */
  getInteractionHistory(): MessageInteraction[] {
    return this.interactionHistory;
  }

  /**
   * Obtient les types de messages récemment affichés
   */
  getRecentMessageTypes(count: number = 5): MessageType[] {
    return this.interactionHistory
      .slice(-count)
      .map((i) => getMessageTypeFromId(i.messageId));
  }

  /**
   * Vérifie si un type de message a été affiché récemment
   */
  wasRecentlyShown(messageType: MessageType, withinCount: number = 5): boolean {
    const recentTypes = this.getRecentMessageTypes(withinCount);
    return recentTypes.includes(messageType);
  }
}
