import messaging, { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import PushNotification from "react-native-push-notification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { getAuth } from "@react-native-firebase/auth";
import { systemLog } from "./SystemLogService";

type NotifeeEventDetail = {
  notification?: { id?: string; data?: Record<string, unknown> };
  pressAction?: { id: string };
};

type NotifeeLike = {
  AndroidImportance: { DEFAULT: number; HIGH: number; LOW: number };
  AndroidStyle: { BIGTEXT: number; BIGPICTURE: number };
  EventType: { DISMISSED: number; PRESS: number; ACTION_PRESS: number };
  RepeatFrequency: { DAILY: number; WEEKLY: number };
  TriggerType: { TIMESTAMP: number };
  createChannel: (config: {
    id: string;
    name: string;
    importance: number;
    sound?: string;
    vibration?: boolean;
    lights?: boolean;
  }) => Promise<string>;
  displayNotification: (config: Record<string, unknown>) => Promise<void>;
  createTriggerNotification: (
    notification: Record<string, unknown>,
    trigger: { type: number; timestamp: number; repeatFrequency?: number }
  ) => Promise<void>;
  onBackgroundEvent: (
    handler: (e: { type: number; detail: NotifeeEventDetail }) => Promise<void>
  ) => void;
};

export interface AppPushNotification {
  id?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  actionUrl?: string;
  priority?: "low" | "default" | "high";
  sound?: boolean;
  vibration?: boolean;
  badge?: number;
  category?: "general" | "promotion" | "update" | "alert" | "message";
  buttons?: NotificationButton[];
  schedule?: {
    date: Date;
    repeatInterval?: "daily" | "weekly" | "monthly";
  };
}

interface NotificationButton {
  id: string;
  title: string;
  action: string;
  data?: Record<string, unknown>;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  title: string;
  body: string;
  targetAudience: "all" | "active" | "inactive" | "premium" | "free" | "custom";
  customFilter?: {
    field: string;
    operator: "==" | "!=" | ">" | "<" | "in" | "not-in";
    value: unknown;
  };
  scheduledAt?: FirebaseFirestoreTypes.Timestamp;
  sentAt?: FirebaseFirestoreTypes.Timestamp;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  recipientCount?: number;
  openCount?: number;
  clickCount?: number;
  createdBy: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

class PushNotificationService {
  private fcmToken: string | null = null;
  private notificationChannelId = "default";
  private isInitialized = false;

  private getNotifee(): NotifeeLike | null {
    try {
      if (Platform.OS === "android") {
        return require("@notifee/react-native") as NotifeeLike;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Initialise le service de notifications
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Demander la permission pour les notifications
      const authStatus = await this.requestPermission();

      if (authStatus) {
        // Créer le canal de notification Android
        if (Platform.OS === "android") {
          await this.createNotificationChannel();
        }

        // Obtenir le token FCM
        await this.getFCMToken();

        // Configurer les listeners
        this.setupMessageHandlers();
        this.setupNotifeeHandlers();

        // Enregistrer le token dans Firestore
        await this.saveTokenToFirestore();

        this.isInitialized = true;
        systemLog.info("system", "Service de notifications initialisé");
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'initialisation des notifications:",
        error
      );
      systemLog.error(
        "system",
        "Erreur initialisation notifications",
        error as Error
      );
    }
  }

  /**
   * Demande la permission pour les notifications
   */
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === FirebaseMessagingTypes.AuthorizationStatus.AUTHORIZED ||
        authStatus === FirebaseMessagingTypes.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log("Permission notifications accordée");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Erreur permission notifications:", error);
      return false;
    }
  }

  /**
   * Crée le canal de notification Android
   */
  async createNotificationChannel(): Promise<void> {
    try {
      const nf = this.getNotifee();
      if (!nf) return;

      await nf.createChannel({
        id: this.notificationChannelId,
        name: "Notifications générales",
        importance: nf.AndroidImportance.HIGH,
        sound: "default",
        vibration: true,
        lights: true,
      });

      await nf.createChannel({
        id: "promotions",
        name: "Promotions",
        importance: nf.AndroidImportance.DEFAULT,
      });

      await nf.createChannel({
        id: "alerts",
        name: "Alertes importantes",
        importance: nf.AndroidImportance.HIGH,
        sound: "alert",
      });

      await nf.createChannel({
        id: "messages",
        name: "Messages",
        importance: nf.AndroidImportance.HIGH,
        sound: "message",
      });
    } catch (error) {
      console.error("Erreur création canal notification:", error);
    }
  }

  /**
   * Obtient le token FCM
   */
  async getFCMToken(): Promise<string | null> {
    try {
      // Vérifier si on a déjà un token en cache
      const cachedToken = await AsyncStorage.getItem("@fcm_token");
      if (cachedToken) {
        this.fcmToken = cachedToken;
        return cachedToken;
      }

      // Obtenir un nouveau token
      const token = await messaging().getToken();
      if (token) {
        this.fcmToken = token;
        await AsyncStorage.setItem("@fcm_token", token);
        return token;
      }

      return null;
    } catch (error) {
      console.error("Erreur obtention token FCM:", error);
      return null;
    }
  }

  /**
   * Sauvegarde le token dans Firestore
   */
  async saveTokenToFirestore(): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (!user || !this.fcmToken) return;

      const tokenData = {
        token: this.fcmToken,
        platform: Platform.OS,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
        deviceInfo: {
          os: Platform.OS,
          version: Platform.Version,
        },
      };

      // Sauvegarder dans le document utilisateur
      await firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          fcmToken: this.fcmToken,
          pushNotifications: true,
          notificationSettings: {
            enabled: true,
            sound: true,
            vibration: true,
            categories: {
              general: true,
              promotion: true,
              update: true,
              alert: true,
              message: true,
            },
          },
        });

      // Sauvegarder aussi dans une collection dédiée pour les campagnes
      await firestore()
        .collection("fcm_tokens")
        .doc(`${user.uid}_${Platform.OS}`)
        .set(tokenData);

      systemLog.info("system", "Token FCM sauvegardé", { userId: user.uid });
    } catch (error) {
      console.error("Erreur sauvegarde token:", error);
    }
  }

  /**
   * Configure les handlers de messages FCM
   */
  setupMessageHandlers(): void {
    // Handler pour les messages quand l'app est ouverte
    messaging().onMessage(async (remoteMessage) => {
      console.log("Message reçu en premier plan:", remoteMessage);
      await this.handleRemoteMessage(remoteMessage);
    });

    // Handler pour le refresh du token
    messaging().onTokenRefresh(async (token) => {
      this.fcmToken = token;
      await AsyncStorage.setItem("@fcm_token", token);
      await this.saveTokenToFirestore();
    });
  }

  /**
   * Configure les handlers Notifee
   */
  setupNotifeeHandlers(): void {
    const nf = this.getNotifee();
    if (!nf) return;

    nf.onBackgroundEvent(async ({ type, detail }) => {
      switch (type) {
        case nf.EventType.DISMISSED:
          console.log("Notification dismissed:", detail.notification);
          break;
        case nf.EventType.PRESS:
          console.log("Notification pressed:", detail.notification);
          if (detail.notification) {
            await this.handleNotificationPress(
              detail.notification as {
                id?: string;
                data?: Record<string, unknown>;
              }
            );
          }
          break;
        case nf.EventType.ACTION_PRESS:
          console.log("Action pressed:", detail.pressAction);
          if (detail.pressAction && detail.notification) {
            await this.handleActionPress(
              detail.pressAction as { id: string },
              detail.notification as { id?: string }
            );
          }
          break;
      }
    });
  }

  /**
   * Gère la réception d'un message distant
   */
  async handleRemoteMessage(remoteMessage: unknown): Promise<void> {
    try {
      const rm = remoteMessage as {
        notification?: {
          title?: string;
          body?: string;
          android?: { imageUrl?: string };
          ios?: { imageUrl?: string };
        };
        data?: Record<string, unknown>;
      };
      const notification = rm?.notification;
      const data = rm?.data;

      // Logger la réception
      await this.logNotificationReceived(notification?.title || "", data);

      // Afficher la notification locale
      await this.displayNotification({
        title: notification?.title || "Nouvelle notification",
        body: notification?.body || "",
        data: data || {},
        imageUrl:
          notification?.android?.imageUrl || notification?.ios?.imageUrl,
      });
    } catch (error) {
      console.error("Erreur traitement message:", error);
    }
  }

  /**
   * Affiche une notification locale
   */
  async displayNotification(notification: AppPushNotification): Promise<void> {
    try {
      if (Platform.OS === "ios") {
        PushNotification.localNotification({
          title: notification.title,
          message: notification.body,
          userInfo: notification.data,
          playSound: notification.sound !== false,
          soundName: notification.sound !== false ? "default" : undefined,
          number: notification.badge,
        });
        return;
      }

      const nf = this.getNotifee();
      if (!nf) return;

      const channelId = this.getChannelId(notification.category);
      const androidStyle = notification.imageUrl
        ? { type: nf.AndroidStyle.BIGPICTURE, picture: notification.imageUrl }
        : { type: nf.AndroidStyle.BIGTEXT, text: notification.body };

      const androidActions = (notification.buttons || []).map((button) => ({
        title: button.title,
        pressAction: { id: button.id, launchActivity: "default" },
      }));

      await nf.displayNotification({
        title: notification.title,
        body: notification.body,
        data: notification.data,
        android: {
          channelId,
          importance:
            notification.priority === "high"
              ? nf.AndroidImportance.HIGH
              : notification.priority === "low"
                ? nf.AndroidImportance.LOW
                : nf.AndroidImportance.DEFAULT,
          pressAction: { id: "default", launchActivity: "default" },
          sound: notification.sound !== false ? "default" : undefined,
          vibrationPattern:
            notification.vibration !== false ? [300, 500] : undefined,
          lights: [0xff0000ff, 300, 600],
          smallIcon: "ic_notification",
          largeIcon: notification.imageUrl,
          style: androidStyle,
          actions: androidActions.length > 0 ? androidActions : undefined,
        },
        ios: {
          sound: notification.sound !== false ? "default" : undefined,
          badge: notification.badge,
          attachments: notification.imageUrl
            ? [{ url: notification.imageUrl }]
            : [],
        },
      });
    } catch (error) {
      console.error("Erreur affichage notification:", error);
    }
  }

  /**
   * Programme une notification
   */
  async scheduleNotification(notification: AppPushNotification): Promise<void> {
    if (!notification.schedule?.date) return;

    try {
      if (Platform.OS === "ios") {
        PushNotification.localNotificationSchedule({
          date: notification.schedule.date,
          title: notification.title,
          message: notification.body,
          userInfo: notification.data,
          allowWhileIdle: true,
        });
        return;
      }

      const nf = this.getNotifee();
      if (!nf) return;

      const trigger = {
        type: nf.TriggerType.TIMESTAMP,
        timestamp: notification.schedule.date.getTime(),
        repeatFrequency: this.getRepeatFrequency(
          notification.schedule.repeatInterval
        ),
      };

      await nf.createTriggerNotification(
        {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          android: { channelId: this.notificationChannelId },
        },
        trigger
      );
    } catch (error) {
      console.error("Erreur programmation notification:", error);
    }
  }

  /**
   * Envoie une notification à un utilisateur spécifique
   */
  async sendToUser(
    userId: string,
    notification: AppPushNotification
  ): Promise<boolean> {
    try {
      // Récupérer le token de l'utilisateur
      const tokenDoc = await firestore()
        .collection("fcm_tokens")
        .where("userId", "==", userId)
        .get();

      if (tokenDoc.empty) {
        console.log("Aucun token trouvé pour l'utilisateur:", userId);
        return false;
      }

      const tokens = tokenDoc.docs.map((d) => d.data().token as string);

      // Envoyer via l'API Admin SDK (nécessite Cloud Functions)
      const notificationData = {
        userId,
        tokens,
        notification,
        timestamp: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection("notification_queue").add(notificationData);

      // Logger l'envoi
      await this.logNotificationSent(userId, notification);

      return true;
    } catch (error) {
      console.error("Erreur envoi notification:", error);
      systemLog.error("system", "Erreur envoi notification", error as Error, {
        userId,
      });
      return false;
    }
  }

  /**
   * Envoie une notification à plusieurs utilisateurs
   */
  async sendToMultipleUsers(
    userIds: string[],
    notification: AppPushNotification
  ): Promise<void> {
    const promises = userIds.map((userId) =>
      this.sendToUser(userId, notification)
    );
    await Promise.allSettled(promises);
  }

  /**
   * Crée et lance une campagne de notifications
   */
  async createCampaign(
    campaign: Omit<NotificationCampaign, "id" | "createdAt">
  ): Promise<string> {
    try {
      const campaignData = {
        ...campaign,
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: campaign.scheduledAt ? "scheduled" : "draft",
      };

      const docRef = await firestore()
        .collection("notification_campaigns")
        .add(campaignData);

      systemLog.info("system", "Campagne créée", {
        campaignId: docRef.id,
        name: campaign.name,
      });

      return docRef.id;
    } catch (error) {
      console.error("Erreur création campagne:", error);
      throw error;
    }
  }

  /**
   * Lance une campagne de notifications
   */
  async launchCampaign(_campaignId: string): Promise<void> {
    try {
      // Récupérer la campagne
      const campaignDocRef = firestore()
        .collection("notification_campaigns")
        .doc(campaignId);
      await campaignDocRef.update({
        status: "sending",
        sentAt: firestore.FieldValue.serverTimestamp(),
      });

      // Récupérer les destinataires selon les critères
      const recipients = await this.getCampaignRecipients(campaignId);

      // Envoyer les notifications
      const notification: AppPushNotification = {
        title: "", // À remplir depuis la campagne
        body: "", // À remplir depuis la campagne
        data: { campaignId },
      };

      await this.sendToMultipleUsers(recipients, notification);

      // Mettre à jour le statut final
      await campaignDocRef.update({
        status: "sent",
        recipientCount: recipients.length,
      });

      systemLog.info("system", "Campagne lancée", {
        campaignId,
        recipientCount: recipients.length,
      });
    } catch (error) {
      console.error("Erreur lancement campagne:", error);

      // Marquer comme échouée
      await firestore()
        .collection("notification_campaigns")
        .doc(campaignId)
        .update({
          status: "failed",
        });

      throw error;
    }
  }

  /**
   * Récupère les destinataires d'une campagne
   */
  private async getCampaignRecipients(campaignId: string): Promise<string[]> {
    // Logique pour récupérer les utilisateurs selon les critères de la campagne
    // À implémenter selon les besoins
    return [];
  }

  /**
   * Gère le clic sur une notification
   */
  private async handleNotificationPress(notification: {
    id?: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    const data = notification.data || {};

    // Logger le clic
    await this.logNotificationClicked(notification.id ?? "unknown", data);

    // Naviguer selon les données
    if (data?.actionUrl) {
      // Navigation à implémenter
      console.log("Navigation vers:", data.actionUrl);
    }
  }

  /**
   * Gère le clic sur une action
   */
  private async handleActionPress(
    action: { id: string },
    notification: { id?: string }
  ): Promise<void> {
    console.log("Action exécutée:", action.id);

    // Logger l'action
    await this.logNotificationAction(
      notification.id ?? "unknown",
      action.id ?? "unknown"
    );
  }

  /**
   * Détermine le canal selon la catégorie
   */
  private getChannelId(category?: string): string {
    switch (category) {
      case "promotion":
        return "promotions";
      case "alert":
        return "alerts";
      case "message":
        return "messages";
      default:
        return this.notificationChannelId;
    }
  }

  /**
   * Détermine l'importance selon la priorité
   */
  private getImportance(priority?: string): number {
    const nf = this.getNotifee();
    if (!nf) {
      if (priority === "high") return 4;
      if (priority === "low") return 2;
      return 3;
    }
    switch (priority) {
      case "high":
        return nf.AndroidImportance.HIGH;
      case "low":
        return nf.AndroidImportance.LOW;
      default:
        return nf.AndroidImportance.DEFAULT;
    }
  }

  /**
   * Détermine la fréquence de répétition
   */
  private getRepeatFrequency(interval?: string): number | undefined {
    const nf = this.getNotifee();
    if (!nf) return undefined;
    switch (interval) {
      case "daily":
        return nf.RepeatFrequency.DAILY;
      case "weekly":
        return nf.RepeatFrequency.WEEKLY;
      default:
        return undefined;
    }
  }

  /**
   * Logger la réception d'une notification
   */
  private async logNotificationReceived(
    title: string,
    data: unknown
  ): Promise<void> {
    try {
      await firestore().collection("notification_analytics").add({
        event: "received",
        title,
        data,
        userId: getAuth().currentUser?.uid,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Erreur log notification:", error);
    }
  }

  /**
   * Logger l'envoi d'une notification
   */
  private async logNotificationSent(
    userId: string,
    notification: AppPushNotification
  ): Promise<void> {
    try {
      await firestore().collection("notification_analytics").add({
        event: "sent",
        userId,
        title: notification.title,
        category: notification.category,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Erreur log envoi:", error);
    }
  }

  /**
   * Logger le clic sur une notification
   */
  private async logNotificationClicked(
    notificationId: string,
    data: unknown
  ): Promise<void> {
    try {
      await firestore()
        .collection("notification_analytics")
        .add({
          event: "clicked",
          notificationId: notificationId || "unknown",
          data,
          userId: getAuth().currentUser?.uid,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Erreur log clic:", error);
    }
  }

  /**
   * Logger une action sur une notification
   */
  private async logNotificationAction(
    notificationId: string,
    actionId: string
  ): Promise<void> {
    try {
      await firestore()
        .collection("notification_analytics")
        .add({
          event: "action",
          notificationId: notificationId || "unknown",
          actionId: actionId || "unknown",
          userId: getAuth().currentUser?.uid,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Erreur log action:", error);
    }
  }

  async sendNotification(
    userId: string,
    notification: AppPushNotification
  ): Promise<boolean> {
    return this.sendToUser(userId, notification);
  }

  async sendSegmentNotification(
    segment: "all" | "free" | "paid" | "inactive",
    notification: AppPushNotification
  ): Promise<void> {
    try {
      let recipients: string[] = [];
      if (segment === "paid") {
        const subs = await firestore()
          .collection("user_subscriptions")
          .where("status", "==", "active")
          .get();
        const ids = new Set<string>();
        subs.forEach((d) => {
          const data = d.data() as Record<string, unknown>;
          const uid = typeof data.userId === "string" ? data.userId : undefined;
          if (uid) ids.add(uid);
        });
        recipients = Array.from(ids);
      } else if (segment === "all") {
        const usersSnap = await firestore().collection("users").get();
        recipients = usersSnap.docs.map((d) => d.id);
      } else {
        recipients = [];
      }

      if (recipients.length > 0) {
        await this.sendToMultipleUsers(recipients, notification);
      }
    } catch (error) {
      console.error("Erreur envoi segment notification:", error);
      throw error;
    }
  }

  /**
   * Désactive les notifications pour l'utilisateur
   */
  async disableNotifications(): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      await firestore().collection("users").doc(user.uid).update({
        pushNotifications: false,
        fcmToken: null,
      });

      // Supprimer le token local
      await AsyncStorage.removeItem("@fcm_token");
      this.fcmToken = null;
    } catch (error) {
      console.error("Erreur désactivation notifications:", error);
    }
  }

  /**
   * Met à jour les préférences de notification
   */
  async updateNotificationPreferences(
    preferences: Record<string, boolean>
  ): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      await firestore().collection("users").doc(user.uid).update({
        "notificationSettings.categories": preferences,
      });
    } catch (error) {
      console.error("Erreur mise à jour préférences:", error);
    }
  }
}

// Export d'une instance unique
export const pushNotificationService = new PushNotificationService();
export default PushNotificationService;
