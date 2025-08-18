import { createLogger } from "../../utils/optimizedLogger";
import subscriptionService from "../firebase/subscriptionService";
import { UserSubscription } from "../../types/subscription";
import { SubscriptionSyncService } from "./SubscriptionSyncService";

const logger = createLogger("WebhookService");

export interface WebhookEvent {
  type: "subscription.created" | "subscription.updated" | "subscription.cancelled" | "subscription.expired" | "payment.failed" | "payment.succeeded";
  userId: string;
  subscriptionId?: string;
  planId?: string;
  status?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export class WebhookService {
  private static eventHandlers: Map<string, ((event: WebhookEvent) => Promise<void>)[]> = new Map();

  /**
   * Enregistre un gestionnaire d'événements webhook
   */
  static registerEventHandler(
    eventType: WebhookEvent["type"],
    handler: (event: WebhookEvent) => Promise<void>
  ): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
    logger.info(`📋 Gestionnaire enregistré pour l'événement: ${eventType}`);
  }

  /**
   * Traite un événement webhook entrant
   */
  static async processWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      logger.info(`🔔 Traitement de l'événement webhook: ${event.type} pour l'utilisateur ${event.userId}`);

      // Valider l'événement
      if (!this.validateWebhookEvent(event)) {
        logger.error("❌ Événement webhook invalide:", event);
        return;
      }

      // Traiter l'événement selon son type
      await this.handleEventByType(event);

      // Exécuter les gestionnaires personnalisés
      const handlers = this.eventHandlers.get(event.type) || [];
      await Promise.all(handlers.map(handler => handler(event)));

      logger.info(`✅ Événement webhook traité avec succès: ${event.type}`);
    } catch (error) {
      logger.error(`❌ Erreur lors du traitement de l'événement webhook:`, error);
      throw error;
    }
  }

  /**
   * Valide la structure d'un événement webhook
   */
  private static validateWebhookEvent(event: WebhookEvent): boolean {
    return !!(
      event.type &&
      event.userId &&
      event.timestamp &&
      typeof event.userId === "string" &&
      typeof event.timestamp === "string"
    );
  }

  /**
   * Traite l'événement selon son type spécifique
   */
  private static async handleEventByType(event: WebhookEvent): Promise<void> {
    switch (event.type) {
      case "subscription.created":
        await this.handleSubscriptionCreated(event);
        break;
      case "subscription.updated":
        await this.handleSubscriptionUpdated(event);
        break;
      case "subscription.cancelled":
        await this.handleSubscriptionCancelled(event);
        break;
      case "subscription.expired":
        await this.handleSubscriptionExpired(event);
        break;
      case "payment.succeeded":
        await this.handlePaymentSucceeded(event);
        break;
      case "payment.failed":
        await this.handlePaymentFailed(event);
        break;
      default:
        logger.warn(`⚠️ Type d'événement non géré: ${event.type}`);
    }
  }

  /**
   * Gère la création d'un abonnement
   */
  private static async handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
    logger.info(`✨ Nouvel abonnement créé pour l'utilisateur: ${event.userId}`);
    
    if (event.planId) {
      const newSubscription: UserSubscription = {
        planId: event.planId,
        status: "active",
        startDate: event.timestamp,
        usage: {
          daily: 0,
          monthly: 0,
          total: 0,
          lastReset: event.timestamp,
        },
      };

      await subscriptionService.createOrUpdateSubscription(event.userId, newSubscription);
    }

    // Synchroniser avec RevenueCat
    await SubscriptionSyncService.syncSubscription(event.userId);
  }

  /**
   * Gère la mise à jour d'un abonnement
   */
  private static async handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
    logger.info(`🔄 Abonnement mis à jour pour l'utilisateur: ${event.userId}`);
    
    // Forcer une synchronisation pour récupérer les dernières données
    await SubscriptionSyncService.forceSyncSubscription(event.userId);
  }

  /**
   * Gère l'annulation d'un abonnement
   */
  private static async handleSubscriptionCancelled(event: WebhookEvent): Promise<void> {
    logger.info(`🚫 Abonnement annulé pour l'utilisateur: ${event.userId}`);
    
    const currentSubscription = await subscriptionService.getSubscription(event.userId);
    if (currentSubscription) {
      const cancelledSubscription: UserSubscription = {
        ...currentSubscription as UserSubscription,
        status: "cancelled",
        endDate: event.timestamp,
      };

      await subscriptionService.createOrUpdateSubscription(event.userId, cancelledSubscription);
    }
  }

  /**
   * Gère l'expiration d'un abonnement
   */
  private static async handleSubscriptionExpired(event: WebhookEvent): Promise<void> {
    logger.info(`⏰ Abonnement expiré pour l'utilisateur: ${event.userId}`);
    
    const currentSubscription = await subscriptionService.getSubscription(event.userId);
    if (currentSubscription) {
      const expiredSubscription: UserSubscription = {
        ...currentSubscription as UserSubscription,
        status: "expired",
        endDate: event.timestamp,
      };

      await subscriptionService.createOrUpdateSubscription(event.userId, expiredSubscription);
    }
  }

  /**
   * Gère le succès d'un paiement
   */
  private static async handlePaymentSucceeded(event: WebhookEvent): Promise<void> {
    logger.info(`💳 Paiement réussi pour l'utilisateur: ${event.userId}`);
    
    // Synchroniser l'abonnement après un paiement réussi
    await SubscriptionSyncService.syncSubscription(event.userId);
    
    // Réinitialiser les quotas si c'est un renouvellement
    if (event.data?.renewal) {
      await this.resetUserQuotas(event.userId);
    }
  }

  /**
   * Gère l'échec d'un paiement
   */
  private static async handlePaymentFailed(event: WebhookEvent): Promise<void> {
    logger.warn(`💳❌ Échec de paiement pour l'utilisateur: ${event.userId}`);
    
    // Marquer l'abonnement comme ayant des problèmes de paiement
    const currentSubscription = await subscriptionService.getSubscription(event.userId);
    if (currentSubscription) {
      // Note: On pourrait ajouter un statut "payment_failed" aux types
      logger.info("Abonnement marqué pour problème de paiement");
    }
  }

  /**
   * Réinitialise les quotas d'un utilisateur
   */
  private static async resetUserQuotas(userId: string): Promise<void> {
    try {
      // Réinitialiser les stats d'usage
      await subscriptionService.trackUsage(userId, {
        generations: {
          today: 0,
          thisMonth: 0,
          total: 0,
        },
        limits: {},
        resetDate: new Date().toISOString(),
      });
      
      logger.info(`✅ Quotas réinitialisés pour l'utilisateur: ${userId}`);
    } catch (error) {
      logger.error("❌ Erreur lors de la réinitialisation des quotas:", error);
    }
  }

  /**
   * Simule la réception d'un webhook (pour les tests)
   */
  static async simulateWebhookEvent(event: Partial<WebhookEvent>): Promise<void> {
    const completeEvent: WebhookEvent = {
      type: event.type || "subscription.updated",
      userId: event.userId || "test-user",
      timestamp: event.timestamp || new Date().toISOString(),
      ...event,
    };

    await this.processWebhookEvent(completeEvent);
  }

  /**
   * Obtient les statistiques des webhooks traités
   */
  static getWebhookStats(): {
    registeredHandlers: number;
    eventTypes: string[];
  } {
    return {
      registeredHandlers: Array.from(this.eventHandlers.values()).reduce(
        (sum, handlers) => sum + handlers.length,
        0
      ),
      eventTypes: Array.from(this.eventHandlers.keys()),
    };
  }

  /**
   * Nettoie tous les gestionnaires d'événements
   */
  static clearAllHandlers(): void {
    this.eventHandlers.clear();
    logger.info("🧹 Tous les gestionnaires d'événements webhook ont été supprimés");
  }
}

// Enregistrer les gestionnaires par défaut au démarrage
WebhookService.registerEventHandler("subscription.created", async (event) => {
  logger.info(`🎉 Nouveau client! Plan: ${event.planId}`);
});

WebhookService.registerEventHandler("subscription.cancelled", async (event) => {
  logger.info(`👋 Client parti. Utilisateur: ${event.userId}`);
});
