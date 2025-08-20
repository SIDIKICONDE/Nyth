import { Platform } from "react-native";
import PushNotification from "react-native-push-notification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ExtendedNotificationSettings } from "../../components/planning/settings/types";
import { PlanningEvent, Goal, Task } from "../../types/planning";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("EnhancedNotificationService");

interface ScheduledNotification {
  id: string;
  fireDate: Date;
  type: string;
  title: string;
  message: string;
  data: any;
}

export class EnhancedNotificationService {
  private static instance: EnhancedNotificationService;
  private settings: ExtendedNotificationSettings | null = null;
  private permissionGranted = false;
  private isInitialized = false;
  private static REGISTRY_PREFIX = "@notif_ids";

  // Note: Actuellement seules les notifications PUSH sont implémentées
  // Les options Email et SMS sont temporairement désactivées dans l'interface

  private constructor() {
    // Ne pas initialiser immédiatement pour éviter les dépendances circulaires
  }

  static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService();
    }
    return EnhancedNotificationService.instance;
  }

  /**
   * Initialiser le service de manière explicite
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await this.initializeService();
  }

  /**
   * Vérifier si le service est initialisé, sinon l'initialiser
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async initializeService() {
    if (this.isInitialized) return;

    try {
      // Configuration des notifications (iOS uniquement)
      if (Platform.OS === "ios") {
        PushNotification.configure({
          onNotification: (notification) => {
            logger.info("Notification reçue:", notification);
            this.handleNotificationReceived(notification);
          },
          // Ne pas demander la permission automatiquement ici
          requestPermissions: false,
        });
      }

      // Créer les canaux de notification pour Android (via Notifee)
      if (Platform.OS === "android") {
        await this.createNotificationChannels();
      }

      // Ne pas demander les permissions automatiquement; sera fait depuis la PlanningScreen

      // Charger les paramètres
      await this.loadSettings();

      this.isInitialized = true;
      logger.info("✅ Service de notification étendu initialisé");
    } catch (error) {
      logger.error("❌ Erreur lors de l'initialisation du service:", error);
    }
  }

  private async createNotificationChannels() {
    const channels = [
      {
        channelId: "events",
        channelName: "Événements",
        channelDescription: "Notifications pour les événements",
        soundName: "default",
        importance: 4,
        vibrate: true,
      },
      {
        channelId: "goals",
        channelName: "Objectifs",
        channelDescription: "Notifications pour les objectifs",
        soundName: "achievement",
        importance: 3,
        vibrate: true,
      },
      {
        channelId: "tasks",
        channelName: "Tâches",
        channelDescription: "Notifications pour les tâches",
        soundName: "reminder",
        importance: 3,
        vibrate: true,
      },
      {
        channelId: "achievements",
        channelName: "Réussites",
        channelDescription: "Notifications de célébration",
        soundName: "celebration",
        importance: 4,
        vibrate: true,
      },
    ];

    if (Platform.OS === "android") {
      try {
        const nf = await import("@notifee/react-native");
        for (const channel of channels) {
          await nf.default.createChannel({
            id: channel.channelId,
            name: channel.channelName,
            sound: channel.soundName,
            importance:
              channel.importance === 4
                ? nf.AndroidImportance.HIGH
                : nf.AndroidImportance.DEFAULT,
            vibration: channel.vibrate,
          });
        }
      } catch (e) {}
    } else {
      channels.forEach((channel) => {
        PushNotification.createChannel(channel, () => {
          logger.info(`Canal ${channel.channelId} créé`);
        });
      });
    }
  }

  // Méthode publique pour demander la permission côté UI (PlanningScreen)
  async requestUserPermission(): Promise<boolean> {
    await this.ensureInitialized();
    return this.requestPermissions();
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        try {
          const nf = await import("@notifee/react-native");
          await nf.default.requestPermission();
          this.permissionGranted = true;
        } catch {
          this.permissionGranted = true;
        }
      } else {
        const permissions = await PushNotification.requestPermissions();
        this.permissionGranted = permissions.alert === true;
      }

      if (this.permissionGranted) {
        logger.info("✅ Permissions de notification accordées");
      } else {
        logger.warn("⚠️ Permissions de notification refusées");
      }

      return this.permissionGranted;
    } catch (error) {
      logger.error("❌ Erreur lors de la demande de permissions:", error);
      return false;
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem(
        "@planning_notification_settings"
      );
      if (savedSettings) {
        this.settings = JSON.parse(savedSettings);
        logger.info("📋 Paramètres de notification chargés");
      }
    } catch (error) {
      logger.error("❌ Erreur lors du chargement des paramètres:", error);
    }
  }

  async updateSettings(
    newSettings: ExtendedNotificationSettings
  ): Promise<void> {
    try {
      await this.ensureInitialized(); // Assure que le service est initialisé
      this.settings = newSettings;
      await AsyncStorage.setItem(
        "@planning_notification_settings",
        JSON.stringify(newSettings)
      );
      logger.info("✅ Paramètres de notification mis à jour");
    } catch (error) {
      logger.error("❌ Erreur lors de la sauvegarde des paramètres:", error);
    }
  }

  private async getRegistryKey(
    entity: "event" | "goal" | "task",
    targetId: string
  ): Promise<string> {
    return `${EnhancedNotificationService.REGISTRY_PREFIX}_${entity}_${targetId}`;
  }

  private async registerNotificationId(
    entity: "event" | "goal" | "task",
    targetId: string,
    notificationId: string
  ): Promise<void> {
    try {
      const key = await this.getRegistryKey(entity, targetId);
      const raw = await AsyncStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(notificationId)) {
        list.push(notificationId);
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    } catch (error) {
      logger.warn("Impossible d'enregistrer l'ID de notification", { error });
    }
  }

  private async getRegisteredNotificationIds(
    entity: "event" | "goal" | "task",
    targetId: string
  ): Promise<string[]> {
    try {
      const key = await this.getRegistryKey(entity, targetId);
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private async clearRegisteredNotificationIds(
    entity: "event" | "goal" | "task",
    targetId: string
  ): Promise<void> {
    try {
      const key = await this.getRegistryKey(entity, targetId);
      await AsyncStorage.removeItem(key);
    } catch {}
  }

  async cancelRegisteredNotifications(
    entity: "event" | "goal" | "task",
    targetId: string
  ): Promise<void> {
    try {
      const ids = await this.getRegisteredNotificationIds(entity, targetId);
      for (const id of ids) {
        try {
          PushNotification.cancelLocalNotification(id);
        } catch {}
      }
      await this.clearRegisteredNotificationIds(entity, targetId);
    } catch (error) {
      logger.warn("Annulation ciblée des notifications échouée", { error });
    }
  }

  async registerTaskNotificationId(
    taskId: string,
    notificationId: string
  ): Promise<void> {
    await this.registerNotificationId("task", taskId, notificationId);
  }

  async hasRegisteredNotifications(
    entity: "event" | "goal" | "task",
    targetId: string
  ): Promise<boolean> {
    const ids = await this.getRegisteredNotificationIds(entity, targetId);
    return ids.length > 0;
  }

  private shouldShowNotification(type: string, priority: string): boolean {
    if (!this.settings) return true;

    // Vérifier les filtres de priorité
    switch (priority) {
      case "low":
        if (!this.settings.priorities.showLowPriority) return false;
        break;
      case "medium":
        if (!this.settings.priorities.showMediumPriority) return false;
        break;
      case "high":
        if (!this.settings.priorities.showHighPriority) return false;
        break;
      case "urgent":
        if (this.settings.priorities.showUrgentOnly) return true;
        break;
    }

    // Vérifier les heures de tranquillité
    if (this.settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;

      if (!this.settings.quietHours.weekendsOnly || isWeekend) {
        if (
          currentTime >= this.settings.quietHours.startTime &&
          currentTime <= this.settings.quietHours.endTime
        ) {
          return false;
        }
      }
    }

    return true;
  }

  private getNotificationSound(type: string): string {
    if (!this.settings?.soundSettings.enabled) return "";

    switch (type) {
      case "event":
        return this.settings.soundSettings.customSounds.events;
      case "goal":
        return this.settings.soundSettings.customSounds.goals;
      case "task":
        return this.settings.soundSettings.customSounds.tasks;
      case "achievement":
        return this.settings.soundSettings.customSounds.achievements;
      default:
        return this.settings.soundSettings.defaultSound;
    }
  }

  private getVibrationPattern(_category: string): number {
    if (!this.settings?.soundSettings.vibration) return 0;

    switch (this.settings.soundSettings.vibrationPattern) {
      case "short":
        return 200;
      case "long":
        return 500;
      case "custom":
        return 300;
      default:
        return 300;
    }
  }

  private formatNotificationMessage(template: string, data: any): string {
    let message = template;

    // Remplacer les variables dans le template
    Object.keys(data).forEach((key) => {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, "g"), data[key]);
    });

    return message;
  }

  // Programmer une notification d'événement
  async scheduleEventNotification(
    event: PlanningEvent,
    minutesBefore: number
  ): Promise<string | null> {
    await this.ensureInitialized(); // Assure que le service est initialisé
    if (!this.permissionGranted || !this.settings?.eventReminders.enabled) {
      return null;
    }

    try {
      const fireDate = new Date(
        new Date(event.startDate).getTime() - minutesBefore * 60 * 1000
      );

      if (fireDate <= new Date()) {
        logger.warn("Date de notification dans le passé, ignorée");
        return null;
      }

      if (!this.shouldShowNotification("event", event.priority)) {
        return null;
      }

      const notificationId = `event_${event.id}_${minutesBefore}`;
      const timeText = this.formatTimeUntilEvent(minutesBefore);

      let message = `Rappel : ${event.title} dans ${timeText}`;
      if (this.settings.customMessages.enabled) {
        message = this.formatNotificationMessage(
          this.settings.customMessages.templates.eventReminder,
          { title: event.title, time: timeText }
        );
      }

      if (Platform.OS === "android") {
        try {
          const nf = await import("@notifee/react-native");
          await nf.default.createTriggerNotification(
            {
              id: notificationId,
              title: "📅 Événement à venir",
              body: message,
              android: {
                channelId: "events",
                importance:
                  event.priority === "urgent"
                    ? nf.AndroidImportance.HIGH
                    : nf.AndroidImportance.DEFAULT,
              },
              data: { type: "event", eventId: event.id, minutesBefore },
            },
            { type: nf.TriggerType.TIMESTAMP, timestamp: fireDate.getTime() }
          );
        } catch {}
      } else {
        PushNotification.localNotificationSchedule({
          id: notificationId,
          title: "📅 Événement à venir",
          message,
          date: fireDate,
          soundName: this.getNotificationSound("event"),
          channelId: "events",
          priority: event.priority === "urgent" ? "max" : "high",
          vibration: this.getVibrationPattern("event"),
          userInfo: {
            type: "event",
            eventId: event.id,
            minutesBefore,
          },
        });
      }

      await this.registerNotificationId("event", event.id, notificationId);
      logger.info(`📅 Notification d'événement programmée: ${notificationId}`);
      return notificationId;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la programmation de notification d'événement:",
        error
      );
      return null;
    }
  }

  // Programmer une notification d'objectif
  async scheduleGoalNotification(
    goal: Goal,
    type: "progress" | "overdue" | "achievement"
  ): Promise<string | null> {
    await this.ensureInitialized(); // Assure que le service est initialisé
    if (!this.permissionGranted || !this.settings?.goalReminders.enabled) {
      return null;
    }

    try {
      const notificationId = `goal_${goal.id}_${type}_${Date.now()}`;

      let title = "";
      let message = "";

      switch (type) {
        case "progress":
          if (!this.settings.goalReminders.dailyProgress) return null;
          title = "🎯 Progrès de l'objectif";
          message = `Objectif "${goal.title}" : ${goal.progress}% terminé`;
          if (this.settings.customMessages.enabled) {
            message = this.formatNotificationMessage(
              this.settings.customMessages.templates.goalProgress,
              { title: goal.title, progress: goal.progress }
            );
          }
          break;

        case "overdue":
          if (!this.settings.goalReminders.overdueAlerts) return null;
          title = "⚠️ Objectif en retard";
          message = `L'objectif "${goal.title}" nécessite votre attention`;
          break;

        case "achievement":
          if (!this.settings.goalReminders.achievementCelebrations) return null;
          title = "🎉 Objectif atteint !";
          message = `Félicitations ! Vous avez atteint : ${goal.title}`;
          if (this.settings.customMessages.enabled) {
            message = this.formatNotificationMessage(
              this.settings.customMessages.templates.achievement,
              { title: goal.title }
            );
          }
          break;
      }

      if (Platform.OS === "android") {
        try {
          const nf = await import("@notifee/react-native");
          await nf.default.displayNotification({
            id: notificationId,
            title,
            body: message,
            android: {
              channelId: "goals",
              importance:
                type === "achievement"
                  ? nf.AndroidImportance.HIGH
                  : nf.AndroidImportance.DEFAULT,
            },
            data: {
              type: "goal",
              goalId: goal.id,
              notificationType: type,
            },
          });
        } catch {}
      } else {
        PushNotification.localNotification({
          id: notificationId,
          title,
          message,
          soundName: this.getNotificationSound("goal"),
          channelId: "goals",
          priority: type === "achievement" ? "max" : "default",
          vibration: this.getVibrationPattern("goal"),
          userInfo: {
            type: "goal",
            goalId: goal.id,
            notificationType: type,
          },
        });
      }

      await this.registerNotificationId("goal", goal.id, notificationId);
      logger.info(`🎯 Notification d'objectif envoyée: ${notificationId}`);
      return notificationId;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de l'envoi de notification d'objectif:",
        error
      );
      return null;
    }
  }

  // Rappels quotidiens progress
  async scheduleDailyGoalProgressReminder(
    goal: Goal,
    hour: number = 18,
    minute: number = 0
  ): Promise<string | null> {
    await this.ensureInitialized(); // Assure que le service est initialisé
    if (!this.permissionGranted || !this.settings?.goalReminders.enabled) {
      return null;
    }
    if (!this.settings.goalReminders.dailyProgress) return null;

    const now = new Date();
    const first = new Date();
    first.setHours(hour, minute, 0, 0);
    if (first <= now) first.setDate(first.getDate() + 1);

    try {
      const notificationId = `goal_${goal.id}_progress_daily`;
      if (Platform.OS === "android") {
        try {
          const nf = await import("@notifee/react-native");
          await nf.default.createTriggerNotification(
            {
              id: notificationId,
              title: "🎯 Progrès quotidien",
              body: `N'oubliez pas de mettre à jour: ${goal.title}`,
              android: { channelId: "goals" },
              data: { type: "goal", goalId: goal.id, notificationType: "progress" },
            },
            {
              type: nf.TriggerType.TIMESTAMP,
              timestamp: first.getTime(),
              repeatFrequency: nf.RepeatFrequency.DAILY,
            }
          );
        } catch {}
      } else {
        PushNotification.localNotificationSchedule({
          id: notificationId,
          title: "🎯 Progrès quotidien",
          message: `N'oubliez pas de mettre à jour: ${goal.title}`,
          date: first,
          repeatType: "day",
          soundName: this.getNotificationSound("goal"),
          channelId: "goals",
          priority: "default",
          vibration: this.getVibrationPattern("goal"),
          userInfo: {
            type: "goal",
            goalId: goal.id,
            notificationType: "progress",
          },
        });
      }
      await this.registerNotificationId("goal", goal.id, notificationId);
      return notificationId;
    } catch (error) {
      logger.error("Erreur rappel quotidien objectif:", error);
      return null;
    }
  }

  // Rappel hebdomadaire revue
  async scheduleWeeklyGoalReviewReminder(
    goal: Goal,
    weekday: number = 1,
    hour: number = 9,
    minute: number = 0
  ): Promise<string | null> {
    await this.ensureInitialized(); // Assure que le service est initialisé
    if (!this.permissionGranted || !this.settings?.goalReminders.enabled) {
      return null;
    }
    if (!this.settings.goalReminders.weeklyReview) return null;

    const now = new Date();
    const first = new Date();
    const currentWeekday = first.getDay();
    const delta = (weekday - currentWeekday + 7) % 7 || 7;
    first.setDate(first.getDate() + delta);
    first.setHours(hour, minute, 0, 0);
    if (first <= now) first.setDate(first.getDate() + 7);

    try {
      const notificationId = `goal_${goal.id}_review_weekly`;
      if (Platform.OS === "android") {
        try {
          const nf = await import("@notifee/react-native");
          await nf.default.createTriggerNotification(
            {
              id: notificationId,
              title: "📅 Revue hebdomadaire",
              body: `Faites le point sur: ${goal.title}`,
              android: { channelId: "goals" },
              data: { type: "goal", goalId: goal.id, notificationType: "progress" },
            },
            {
              type: nf.TriggerType.TIMESTAMP,
              timestamp: first.getTime(),
              repeatFrequency: nf.RepeatFrequency.WEEKLY,
            }
          );
        } catch {}
      } else {
        PushNotification.localNotificationSchedule({
          id: notificationId,
          title: "📅 Revue hebdomadaire",
          message: `Faites le point sur: ${goal.title}`,
          date: first,
          repeatType: "week",
          soundName: this.getNotificationSound("goal"),
          channelId: "goals",
          priority: "default",
          vibration: this.getVibrationPattern("goal"),
          userInfo: {
            type: "goal",
            goalId: goal.id,
            notificationType: "progress",
          },
        });
      }
      await this.registerNotificationId("goal", goal.id, notificationId);
      return notificationId;
    } catch (error) {
      logger.error("Erreur rappel hebdomadaire objectif:", error);
      return null;
    }
  }

  // Alerte à l'échéance
  async scheduleGoalOverdueReminder(goal: Goal): Promise<string | null> {
    await this.ensureInitialized(); // Assure que le service est initialisé
    if (!this.permissionGranted || !this.settings?.goalReminders.enabled) {
      return null;
    }
    if (!this.settings.goalReminders.overdueAlerts) return null;
    if (!goal.endDate) return null;

    const now = new Date();
    const due = new Date(goal.endDate);
    const date = due > now ? due : new Date(now.getTime() + 5 * 60 * 1000);

    try {
      const notificationId = `goal_${goal.id}_overdue_once`;
      if (Platform.OS === "android") {
        try {
          const nf = await import("@notifee/react-native");
        await nf.default.createTriggerNotification(
            {
              id: notificationId,
              title: "⚠️ Objectif en retard",
              body: `L'objectif "${goal.title}" nécessite votre attention`,
              android: { channelId: "goals", importance: nf.AndroidImportance.HIGH },
              data: { type: "goal", goalId: goal.id, notificationType: "overdue" },
            },
            { type: nf.TriggerType.TIMESTAMP, timestamp: date.getTime() }
          );
        } catch {}
      } else {
        PushNotification.localNotificationSchedule({
          id: notificationId,
          title: "⚠️ Objectif en retard",
          message: `L'objectif "${goal.title}" nécessite votre attention`,
          date,
          soundName: this.getNotificationSound("goal"),
          channelId: "goals",
          priority: "high",
          vibration: this.getVibrationPattern("goal"),
          userInfo: {
            type: "goal",
            goalId: goal.id,
            notificationType: "overdue",
          },
        });
      }
      await this.registerNotificationId("goal", goal.id, notificationId);
      return notificationId;
    } catch (error) {
      logger.error("Erreur alerte échéance objectif:", error);
      return null;
    }
  }

  async cancelGoalNotifications(goalId: string): Promise<void> {
    await this.cancelRegisteredNotifications("goal", goalId);
  }

  // Programmer une notification de tâche
  async scheduleTaskNotification(
    task: Task,
    type: "due" | "start" | "overdue"
  ): Promise<string | null> {
    await this.ensureInitialized(); // Assure que le service est initialisé
    if (!this.permissionGranted || !this.settings?.taskReminders.enabled) {
      return null;
    }

    try {
      const notificationId = `task_${task.id}_${type}_${Date.now()}`;

      let title = "";
      let message = "";
      let fireDate: Date | null = null;

      switch (type) {
        case "due":
          if (!this.settings.taskReminders.dueDateAlerts || !task.dueDate)
            return null;
          title = "📋 Tâche à terminer";
          message = `Tâche "${task.title}" à terminer aujourd'hui`;
          fireDate = new Date(task.dueDate);
          break;

        case "start":
          if (!this.settings.taskReminders.startDateAlerts || !task.startDate)
            return null;
          title = "▶️ Tâche à commencer";
          message = `Il est temps de commencer : ${task.title}`;
          fireDate = new Date(task.startDate);
          break;

        case "overdue":
          if (!this.settings.taskReminders.overdueAlerts) return null;
          title = "🔴 Tâche en retard";
          message = `La tâche "${task.title}" est en retard`;
          break;
      }

      if (this.settings.customMessages.enabled && type === "due") {
        message = this.formatNotificationMessage(
          this.settings.customMessages.templates.taskDue,
          {
            title: task.title,
            dueDate: task.dueDate
              ? new Date(task.dueDate).toLocaleDateString()
              : "Non définie",
          }
        );
      }

      if (fireDate) {
        PushNotification.localNotificationSchedule({
          id: notificationId,
          title,
          message,
          date: fireDate,
          soundName: this.getNotificationSound("task"),
          channelId: "tasks",
          priority: task.priority === "urgent" ? "max" : "default",
          vibration: this.getVibrationPattern("task"),
          userInfo: {
            type: "task",
            taskId: task.id,
            notificationType: type,
          },
        });
      } else {
        PushNotification.localNotification({
          id: notificationId,
          title,
          message,
          soundName: this.getNotificationSound("task"),
          channelId: "tasks",
          priority: task.priority === "urgent" ? "max" : "default",
          vibration: this.getVibrationPattern("task"),
          userInfo: {
            type: "task",
            taskId: task.id,
            notificationType: type,
          },
        });
      }

      logger.info(`📋 Notification de tâche programmée: ${notificationId}`);
      return notificationId;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la programmation de notification de tâche:",
        error
      );
      return null;
    }
  }

  // Annuler une notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      if (Platform.OS === "android") {
        try {
          const nf = await import("@notifee/react-native");
          await nf.default.cancelNotification(notificationId);
        } catch {}
      } else {
        PushNotification.cancelLocalNotification(notificationId);
      }
      logger.info(`🗑️ Notification annulée: ${notificationId}`);
    } catch (error) {
      logger.error("❌ Erreur lors de l'annulation de notification:", error);
    }
  }

  // Annuler toutes les notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      if (Platform.OS === "android") {
        try {
          const nf = await import("@notifee/react-native");
          await nf.default.cancelAllNotifications();
        } catch {}
      } else {
        PushNotification.cancelAllLocalNotifications();
      }
      logger.info("🗑️ Toutes les notifications annulées");
    } catch (error) {
      logger.error(
        "❌ Erreur lors de l'annulation de toutes les notifications:",
        error
      );
    }
  }

  // Obtenir les notifications programmées
  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    await this.ensureInitialized(); // Assure que le service est initialisé
    if (Platform.OS === "android") {
      try {
        const nf = await import("@notifee/react-native");
        const scheduled = await nf.default.getTriggerNotifications();
        return scheduled.map((n: any) => ({
          id: n.notification.id,
          fireDate: new Date(n.trigger?.timestamp ?? Date.now()),
          type: n.notification?.data?.type ?? "unknown",
          title: n.notification?.title ?? "",
          message: n.notification?.body ?? "",
          data: n.notification?.data ?? {},
        }));
      } catch {
        return [];
      }
    }
    return new Promise((resolve) => {
      PushNotification.getScheduledLocalNotifications((notifications) => {
        const scheduledNotifications: ScheduledNotification[] =
          notifications.map((notif) => ({
            id: notif.id,
            fireDate: new Date(notif.date),
            type: (notif as any).userInfo?.type || "unknown",
            title: notif.title || "",
            message: notif.message || "",
            data: (notif as any).userInfo || {},
          }));
        resolve(scheduledNotifications);
      });
    });
  }

  private formatTimeUntilEvent(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} heure${hours > 1 ? "s" : ""}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} jour${days > 1 ? "s" : ""}`;
    }
  }

  private handleNotificationReceived(notification: any): void {
    logger.info("📱 Notification reçue et traitée:", {
      type: notification.userInfo?.type,
      id: notification.id,
      title: notification.title,
    });

    // Ici, on pourrait ajouter des actions spécifiques selon le type de notification
    // Par exemple, ouvrir l'écran approprié, mettre à jour des données, etc.
  }
}

// Export d'une instance singleton
export const enhancedNotificationService =
  EnhancedNotificationService.getInstance();
