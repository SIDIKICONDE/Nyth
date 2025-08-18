import { createLogger } from "../../utils/optimizedLogger";
import { PaymentService } from "./PaymentService";
import subscriptionService from "../firebase/subscriptionService";
import { UserSubscription } from "../../types/subscription";

const logger = createLogger("SubscriptionSyncService");

export class SubscriptionSyncService {
  private static syncInterval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Démarre la synchronisation automatique des abonnements
   */
  static startAutoSync(userId: string, intervalMinutes: number = 30): void {
    if (this.isRunning) {
      logger.info("⚠️ Synchronisation déjà en cours");
      return;
    }

    this.isRunning = true;
    logger.info("🔄 Démarrage de la synchronisation automatique des abonnements");

    // Synchronisation immédiate
    this.syncSubscription(userId);

    // Synchronisation périodique
    this.syncInterval = setInterval(
      () => this.syncSubscription(userId),
      intervalMinutes * 60 * 1000
    );
  }

  /**
   * Arrête la synchronisation automatique
   */
  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    logger.info("⏹️ Synchronisation automatique arrêtée");
  }

  /**
   * Synchronise l'abonnement d'un utilisateur
   */
  static async syncSubscription(userId: string): Promise<boolean> {
    try {
      logger.info("🔄 Synchronisation de l'abonnement pour l'utilisateur:", userId);

      // Récupérer l'état local
      const localSubscription = await subscriptionService.getSubscription(userId);
      
      // Vérifier l'état dans RevenueCat
      const restoreResult = await PaymentService.restorePurchases(userId);
      
      if (restoreResult.success) {
        // Récupérer l'abonnement mis à jour après restauration
        const remoteSubscription = await subscriptionService.getSubscription(userId);
        
        // Comparer et résoudre les différences
        const syncedSubscription = this.resolveSubscriptionConflicts(
          localSubscription as UserSubscription | null,
          remoteSubscription as UserSubscription | null
        );

        if (syncedSubscription && this.hasSubscriptionChanged(localSubscription as UserSubscription | null, syncedSubscription)) {
          await subscriptionService.createOrUpdateSubscription(userId, syncedSubscription);
          logger.info("✅ Abonnement synchronisé avec succès");
          return true;
        }
      }

      // Vérifier l'expiration
      await this.checkSubscriptionExpiration(userId, localSubscription as UserSubscription | null);
      
      return true;
    } catch (error) {
      logger.error("❌ Erreur lors de la synchronisation de l'abonnement:", error);
      return false;
    }
  }

  /**
   * Résout les conflits entre les abonnements local et distant
   */
  private static resolveSubscriptionConflicts(
    local: UserSubscription | null,
    remote: UserSubscription | null
  ): UserSubscription | null {
    // Si aucun abonnement n'existe
    if (!local && !remote) return null;

    // Si seul l'abonnement distant existe
    if (!local && remote) return remote;

    // Si seul l'abonnement local existe
    if (local && !remote) return local;

    // Si les deux existent, prioriser le plus récent ou l'actif
    if (local && remote) {
      // Prioriser l'abonnement actif
      if (local.status === "active" && remote.status !== "active") {
        return local;
      }
      if (remote.status === "active" && local.status !== "active") {
        return remote;
      }

      // Si les deux sont actifs ou inactifs, prioriser le plus récent
      const localDate = new Date(local.startDate);
      const remoteDate = new Date(remote.startDate);
      
      return localDate > remoteDate ? local : remote;
    }

    return null;
  }

  /**
   * Vérifie si l'abonnement a changé
   */
  private static hasSubscriptionChanged(
    old: UserSubscription | null,
    current: UserSubscription | null
  ): boolean {
    if (!old && !current) return false;
    if (!old || !current) return true;

    return (
      old.planId !== current.planId ||
      old.status !== current.status ||
      old.endDate !== current.endDate
    );
  }

  /**
   * Vérifie l'expiration de l'abonnement
   */
  private static async checkSubscriptionExpiration(
    userId: string,
    subscription: UserSubscription | null
  ): Promise<void> {
    if (!subscription || !subscription.endDate) return;

    const now = new Date();
    const endDate = new Date(subscription.endDate);

    if (now > endDate && subscription.status === "active") {
      logger.info("⏰ Abonnement expiré détecté, mise à jour du statut");
      
      const expiredSubscription: UserSubscription = {
        ...subscription,
        status: "expired",
      };

      await subscriptionService.createOrUpdateSubscription(userId, expiredSubscription);
    }
  }

  /**
   * Vérifie la validité d'un abonnement et le synchronise si nécessaire
   */
  static async validateAndSync(userId: string): Promise<UserSubscription | null> {
    try {
      await this.syncSubscription(userId);
      return await subscriptionService.getSubscription(userId) as UserSubscription | null;
    } catch (error) {
      logger.error("❌ Erreur lors de la validation et synchronisation:", error);
      return null;
    }
  }

  /**
   * Force une synchronisation complète
   */
  static async forceSyncSubscription(userId: string): Promise<boolean> {
    try {
      logger.info("🔄 Synchronisation forcée de l'abonnement");
      
      // Effacer le cache local temporairement pour forcer la mise à jour
      const restoreResult = await PaymentService.restorePurchases(userId);
      
      if (restoreResult.success) {
        logger.info("✅ Synchronisation forcée réussie");
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error("❌ Erreur lors de la synchronisation forcée:", error);
      return false;
    }
  }

  /**
   * Obtient le statut de synchronisation
   */
  static getSyncStatus(): { isRunning: boolean; lastSync?: Date } {
    return {
      isRunning: this.isRunning,
      // TODO: Ajouter le timestamp de la dernière synchronisation
    };
  }
}
