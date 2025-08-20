import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "@/utils/optimizedLogger";
import { AsyncStorageValidator } from "@/utils/asyncStorageValidator";

const logger = createLogger("FirestoreErrorNotificationService");

export enum FirestoreErrorType {
  METADATA_SAVE_FAILED = "metadata_save_failed",
  SYNC_FAILED = "sync_failed",
  BACKUP_FAILED = "backup_failed",
  CONNECTION_ISSUE = "connection_issue",
}

export interface FirestoreErrorNotification {
  id: string;
  type: FirestoreErrorType;
  title: string;
  message: string;
  timestamp: number;
  retryAction?: () => Promise<void>;
  dismissed: boolean;
}

export interface FirestoreNotificationOptions {
  showAlert?: boolean;
  persistNotification?: boolean;
  allowRetry?: boolean;
  customTitle?: string;
  customMessage?: string;
}

/**
 * Service de gestion des notifications d'erreur Firestore
 * Affiche des notifications utilisateur quand les métadonnées ne peuvent pas être synchronisées
 */
export class FirestoreErrorNotificationService {
  private static instance: FirestoreErrorNotificationService;
  private readonly STORAGE_KEY = "firestore_error_notifications";
  private notifications: FirestoreErrorNotification[] = [];
  private initialized = false;

  static getInstance(): FirestoreErrorNotificationService {
    if (!FirestoreErrorNotificationService.instance) {
      FirestoreErrorNotificationService.instance = new FirestoreErrorNotificationService();
    }
    return FirestoreErrorNotificationService.instance;
  }

  private constructor() {
    this.loadNotifications();
  }

  /**
   * Vérifie si le service est initialisé
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Initialise le service en chargeant les notifications depuis le stockage
   * Inclut la validation de corruption
   */
  private async loadNotifications(): Promise<void> {
    try {
      if (this.initialized) return;

      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        try {
          const parsed: FirestoreErrorNotification[] = JSON.parse(storedData);

          // Valider et réparer les données corrompues
          const validationResult = await AsyncStorageValidator.validateAndRepair({
            keys: [this.STORAGE_KEY],
            autoRepair: true,
            removeCorrupted: false
          });

          if (!validationResult.isValid && validationResult.repairedKeys.length === 0) {
            logger.warn("Données de notifications corrompues et non réparables, réinitialisation", validationResult.errors);
            this.notifications = [];
          } else {
            // Filtrer les notifications de plus de 24h et non rejetées
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            this.notifications = parsed.filter(notification =>
              !notification.dismissed && (now - notification.timestamp) < oneDay
            );

            logger.debug("Notifications Firestore chargées", {
              total: this.notifications.length,
              wasRepaired: validationResult.repairedKeys.length > 0
            });
          }
        } catch (parseError) {
          logger.warn("Données de notifications corrompues, réinitialisation", parseError);
          this.notifications = [];

          // Tenter de réparer la clé corrompue
          await AsyncStorageValidator.validateAndRepair({
            keys: [this.STORAGE_KEY],
            autoRepair: true,
            removeCorrupted: true
          });
        }
      } else {
        this.notifications = [];
      }

      this.initialized = true;
    } catch (error) {
      logger.error("Erreur lors du chargement des notifications", error);
      this.notifications = [];
      this.initialized = true;
    }
  }

  /**
   * Sauvegarde les notifications dans AsyncStorage
   */
  private async saveNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde des notifications", error);
    }
  }

  /**
   * Notifie d'une erreur Firestore avec possibilité d'alerte utilisateur
   */
  async notifyError(
    type: FirestoreErrorType,
    error: Error | string,
    options: FirestoreNotificationOptions = {}
  ): Promise<void> {
    await this.loadNotifications();

    const {
      showAlert = true,
      persistNotification = true,
      allowRetry = true,
      customTitle,
      customMessage
    } = options;

    const errorMessage = error instanceof Error ? error.message : error;
    const notificationId = `firestore_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notification: FirestoreErrorNotification = {
      id: notificationId,
      type,
      title: customTitle || this.getDefaultTitle(type),
      message: customMessage || this.getDefaultMessage(type, errorMessage),
      timestamp: Date.now(),
      dismissed: false,
    };

    // Ajouter l'action de retry si demandé
    if (allowRetry) {
      notification.retryAction = async () => {
        logger.info("Tentative de retry pour notification", { id: notificationId });
        await this.dismissNotification(notificationId);
      };
    }

    // Ajouter à la liste
    this.notifications.unshift(notification); // Plus récent en premier
    await this.saveNotifications();

    // Afficher l'alerte si demandé
    if (showAlert) {
      this.showAlert(notification);
    }

    logger.warn("Erreur Firestore notifiée", {
      type,
      id: notificationId,
      message: errorMessage
    });
  }

  /**
   * Affiche une alerte pour la notification
   */
  private showAlert(notification: FirestoreErrorNotification): void {
    const buttons = [{ text: "OK" }];

    // Ajouter le bouton retry si disponible
    if (notification.retryAction) {
      buttons.unshift({
        text: "Réessayer",
        onPress: () => {
          if (notification.retryAction) {
            notification.retryAction().catch(error => {
              logger.error("Erreur lors du retry", error);
            });
          }
        }
      } as any);
    }

    Alert.alert(notification.title, notification.message, buttons);
  }

  /**
   * Rejette une notification
   */
  async dismissNotification(id: string): Promise<void> {
    await this.loadNotifications();

    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.dismissed = true;
      await this.saveNotifications();

      logger.debug("Notification rejetée", { id });
    }
  }

  /**
   * Obtient toutes les notifications actives
   */
  async getActiveNotifications(): Promise<FirestoreErrorNotification[]> {
    await this.loadNotifications();
    return this.notifications.filter(n => !n.dismissed);
  }

  /**
   * Nettoie toutes les notifications
   */
  async clearAllNotifications(): Promise<void> {
    this.notifications = [];
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    logger.debug("Toutes les notifications nettoyées");
  }

  /**
   * Obtient le titre par défaut selon le type d'erreur
   */
  private getDefaultTitle(type: FirestoreErrorType): string {
    switch (type) {
      case FirestoreErrorType.METADATA_SAVE_FAILED:
        return "Synchronisation partielle";
      case FirestoreErrorType.SYNC_FAILED:
        return "Erreur de synchronisation";
      case FirestoreErrorType.BACKUP_FAILED:
        return "Sauvegarde cloud échouée";
      case FirestoreErrorType.CONNECTION_ISSUE:
        return "Problème de connexion";
      default:
        return "Erreur cloud";
    }
  }

  /**
   * Obtient le message par défaut selon le type d'erreur
   */
  private getDefaultMessage(type: FirestoreErrorType, errorMessage: string): string {
    const baseMessage = "Votre enregistrement a été sauvegardé localement mais n'a pas pu être synchronisé avec le cloud.";

    switch (type) {
      case FirestoreErrorType.METADATA_SAVE_FAILED:
        return `${baseMessage}\n\nDétails: ${errorMessage}\n\nVous pouvez continuer à utiliser l'application normalement.`;
      case FirestoreErrorType.SYNC_FAILED:
        return `${baseMessage}\n\nErreur: ${errorMessage}\n\nLes données seront synchronisées automatiquement quand la connexion sera rétablie.`;
      case FirestoreErrorType.BACKUP_FAILED:
        return `La sauvegarde automatique dans le cloud a échoué.\n\nErreur: ${errorMessage}\n\nVos données sont en sécurité localement.`;
      case FirestoreErrorType.CONNECTION_ISSUE:
        return `Problème de connexion au service cloud.\n\n${errorMessage}\n\nVérifiez votre connexion internet.`;
      default:
        return `${baseMessage}\n\nErreur: ${errorMessage}`;
    }
  }

  /**
   * Vérifie s'il y a des notifications actives
   */
  async hasActiveNotifications(): Promise<boolean> {
    const active = await this.getActiveNotifications();
    return active.length > 0;
  }

  /**
   * Obtient le nombre de notifications actives
   */
  async getNotificationCount(): Promise<number> {
    const active = await this.getActiveNotifications();
    return active.length;
  }

  /**
   * Affiche un résumé des notifications actives
   */
  async showNotificationSummary(): Promise<void> {
    const activeNotifications = await this.getActiveNotifications();

    if (activeNotifications.length === 0) {
      return;
    }

    const count = activeNotifications.length;
    const title = `${count} problème${count > 1 ? 's' : ''} de synchronisation`;

    let message = "Certains enregistrements n'ont pas pu être synchronisés avec le cloud:\n\n";

    activeNotifications.slice(0, 3).forEach((notification, index) => {
      message += `${index + 1}. ${notification.title}\n`;
    });

    if (activeNotifications.length > 3) {
      message += `... et ${activeNotifications.length - 3} autres`;
    }

    message += "\n\nVous pouvez continuer à utiliser l'application normalement.";

    Alert.alert(title, message, [
      { text: "OK" },
      {
        text: "Voir détails",
        onPress: () => this.showDetailedNotifications()
      }
    ]);
  }

  /**
   * Affiche les détails de toutes les notifications
   */
  private async showDetailedNotifications(): Promise<void> {
    const activeNotifications = await this.getActiveNotifications();

    if (activeNotifications.length === 0) {
      return;
    }

    let message = "";
    activeNotifications.forEach((notification, index) => {
      message += `${index + 1}. ${notification.title}\n${notification.message}\n\n`;
    });

    Alert.alert("Détails des problèmes", message, [
      { text: "OK" },
      {
        text: "Tout marquer comme lu",
        onPress: async () => {
          for (const notification of activeNotifications) {
            await this.dismissNotification(notification.id);
          }
        }
      }
    ]);
  }

  /**
   * Méthodes publiques pour la validation AsyncStorage
   */
  static async validateStorage(): Promise<void> {
    const validator = this.getInstance();
    await validator.validateStorage();
  }

  private async validateStorage(): Promise<void> {
    try {
      logger.info("Validation manuelle d'AsyncStorage demandée");

      const result = await AsyncStorageValidator.validateAndRepair({
        autoRepair: true,
        removeCorrupted: true,
        onProgress: (key, status) => {
          logger.debug("Validation AsyncStorage", { key, status });
        }
      });

      if (!result.isValid) {
        const message = `AsyncStorage contient ${result.corruptedKeys.length} clé(s) corrompue(s). ${result.repairedKeys.length} clé(s) ont été réparée(s).\n\nErreurs: ${result.errors.join(', ')}`;

        Alert.alert("Validation AsyncStorage", message, [
          { text: "OK" },
          {
            text: "Voir détails",
            onPress: () => {
              const details = `Clés corrompues: ${result.corruptedKeys.join(', ')}\nClés réparées: ${result.repairedKeys.join(', ')}\nErreurs: ${result.errors.join(', ')}`;
              Alert.alert("Détails de la validation", details);
            }
          }
        ]);
      } else {
        Alert.alert("Validation AsyncStorage", "✅ AsyncStorage est en bon état. Aucune corruption détectée.");
      }

      logger.info("Validation AsyncStorage terminée", result.stats);

    } catch (error) {
      logger.error("Erreur lors de la validation AsyncStorage", error);
      Alert.alert("Erreur", "Impossible de valider AsyncStorage");
    }
  }
}
