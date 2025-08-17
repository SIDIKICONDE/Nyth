import { Platform } from "react-native";
import PushNotification from "react-native-push-notification";
import { Task } from "../../types/planning";
import { enhancedNotificationService } from "./EnhancedNotificationService";

// Configuration des notifications
PushNotification.configure({
  onNotification: function (notification) {},
  requestPermissions: Platform.OS === "ios",
});

export class TaskNotificationService {
  private static instance: TaskNotificationService;
  private permissionGranted: boolean = false;

  private constructor() {
    this.initializeNotifications();
  }

  static getInstance(): TaskNotificationService {
    if (!TaskNotificationService.instance) {
      TaskNotificationService.instance = new TaskNotificationService();
    }
    return TaskNotificationService.instance;
  }

  /**
   * Initialiser les notifications
   */
  private initializeNotifications(): void {
    if (Platform.OS === "android") {
      PushNotification.createChannel(
        {
          channelId: "tasks",
          channelName: "Rappels de tâches",
          channelDescription: "Notifications pour les rappels de tâches",
          importance: 4, // HIGH
          vibrate: true,
        },
        (created) => void 0
      );
    }
  }

  /**
   * Demander les permissions de notification
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === "ios") {
        const permissions = await PushNotification.requestPermissions();
        this.permissionGranted = !!(
          permissions.alert ||
          permissions.badge ||
          permissions.sound
        );
      } else {
        this.permissionGranted = true; // Android gère automatiquement
      }

      return this.permissionGranted;
    } catch (error) {
      return false;
    }
  }

  /**
   * Programmer une notification pour une tâche
   */
  async scheduleTaskReminder(
    task: Task,
    reminderDate: Date,
    type: "due" | "start" | "custom" = "due"
  ): Promise<string | null> {
    if (!this.permissionGranted) {
      const granted = await this.requestPermissions();
      if (!granted) return null;
    }

    try {
      const notificationId = Math.random().toString(36).substr(2, 9);

      PushNotification.localNotificationSchedule({
        id: notificationId,
        title: this.getNotificationTitle(type),
        message: this.getNotificationBody(task, type),
        date: reminderDate,
        soundName: "default",
        channelId: "tasks",
        userInfo: {
          taskId: task.id,
          type,
          task: {
            id: task.id,
            title: task.title,
            priority: task.priority,
          },
        },
        priority: this.getNotificationPriority(task.priority),
      });

      try {
        await enhancedNotificationService.registerTaskNotificationId(
          task.id,
          notificationId
        );
      } catch {}
      return notificationId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Programmer plusieurs rappels pour une tâche
   */
  async scheduleMultipleReminders(
    task: Task,
    reminders: { date: Date; type: "due" | "start" | "custom" }[]
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const reminder of reminders) {
      const id = await this.scheduleTaskReminder(
        task,
        reminder.date,
        reminder.type
      );
      if (id) {
        notificationIds.push(id);
      }
    }

    return notificationIds;
  }

  /**
   * Programmer des rappels automatiques basés sur les dates de la tâche
   */
  async scheduleAutoReminders(task: Task): Promise<string[]> {
    const reminders: { date: Date; type: "due" | "start" | "custom" }[] = [];
    const now = new Date();

    // Rappel pour la date de début (1 heure avant)
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      const startReminder = new Date(startDate.getTime() - 60 * 60 * 1000); // 1h avant

      if (startReminder > now) {
        reminders.push({ date: startReminder, type: "start" });
      }
    }

    // Rappels pour la date d'échéance
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);

      // 1 jour avant (pour tâches importantes)
      if (task.priority === "high" || task.priority === "urgent") {
        const dayBefore = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
        if (dayBefore > now) {
          reminders.push({ date: dayBefore, type: "due" });
        }
      }

      // 2 heures avant
      const twoHoursBefore = new Date(dueDate.getTime() - 2 * 60 * 60 * 1000);
      if (twoHoursBefore > now) {
        reminders.push({ date: twoHoursBefore, type: "due" });
      }

      // 30 minutes avant (pour tâches urgentes)
      if (task.priority === "urgent") {
        const thirtyMinBefore = new Date(dueDate.getTime() - 30 * 60 * 1000);
        if (thirtyMinBefore > now) {
          reminders.push({ date: thirtyMinBefore, type: "due" });
        }
      }
    }

    return this.scheduleMultipleReminders(task, reminders);
  }

  /**
   * Annuler une notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      PushNotification.cancelLocalNotifications({ id: notificationId });
    } catch (error) {}
  }

  /**
   * Annuler toutes les notifications d'une tâche
   */
  async cancelTaskNotifications(taskId: string): Promise<void> {
    try {
      await enhancedNotificationService.cancelRegisteredNotifications(
        "task",
        taskId
      );
    } catch (error) {}
  }

  /**
   * Programmer des rappels quotidiens pour les tâches en retard
   */
  async scheduleOverdueReminders(): Promise<void> {
    try {
      // Programmer un rappel quotidien à 9h00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      PushNotification.localNotificationSchedule({
        title: "📋 Tâches en retard",
        message: "Vous avez des tâches en retard. Consultez votre planning.",
        date: tomorrow,
        repeatType: "day",
        channelId: "tasks",
        userInfo: { type: "overdue_check" },
      });
    } catch (error) {}
  }

  /**
   * Obtenir le badge count des notifications (iOS uniquement)
   */
  async getBadgeCount(): Promise<number> {
    try {
      if (Platform.OS === "ios") {
        return new Promise((resolve) => {
          PushNotification.getApplicationIconBadgeNumber((number) => {
            resolve(number);
          });
        });
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Mettre à jour le badge count (iOS uniquement)
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      if (Platform.OS === "ios") {
        PushNotification.setApplicationIconBadgeNumber(count);
      }
    } catch (error) {}
  }

  // Méthodes privées pour les messages

  private getNotificationTitle(type: "due" | "start" | "custom"): string {
    switch (type) {
      case "start":
        return "🚀 Tâche à commencer";
      case "due":
        return "⏰ Échéance approche";
      case "custom":
        return "📋 Rappel de tâche";
      default:
        return "📋 Rappel";
    }
  }

  private getNotificationBody(
    task: Task,
    type: "due" | "start" | "custom"
  ): string {
    const priorityEmoji = this.getPriorityEmoji(task.priority);

    switch (type) {
      case "start":
        return `${priorityEmoji} Il est temps de commencer: ${task.title}`;
      case "due":
        return `${priorityEmoji} Échéance proche: ${task.title}`;
      case "custom":
        return `${priorityEmoji} N'oubliez pas: ${task.title}`;
      default:
        return `${priorityEmoji} ${task.title}`;
    }
  }

  private getPriorityEmoji(priority: Task["priority"]): string {
    switch (priority) {
      case "urgent":
        return "🚨";
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "📋";
    }
  }

  private getNotificationPriority(
    priority: Task["priority"]
  ): "max" | "high" | "default" | "low" {
    switch (priority) {
      case "urgent":
        return "max";
      case "high":
        return "high";
      case "medium":
        return "default";
      case "low":
        return "low";
      default:
        return "default";
    }
  }
}

// Instance singleton
export const taskNotificationService = TaskNotificationService.getInstance();
