import { Alert, Platform } from "react-native";
import PushNotification from "react-native-push-notification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Goal } from "../types/planning";
import { planningService } from "./firebase/planning";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("GoalsControlService");

interface GoalNotificationData {
  goalId: string;
  action: "increment" | "decrement" | "complete";
  title: string;
}

class GoalsControlService {
  private static instance: GoalsControlService;

  private constructor() {
    this.initializeNotifications();
  }

  static getInstance(): GoalsControlService {
    if (!GoalsControlService.instance) {
      GoalsControlService.instance = new GoalsControlService();
    }
    return GoalsControlService.instance;
  }

  /**
   * Initialiser les notifications interactives
   */
  private initializeNotifications() {
    PushNotification.configure({
      onNotification: (notification) => {
        logger.info("Notification reçue:", notification);

        if (notification.userInteraction) {
          this.handleNotificationAction(notification);
        }
      },

      onAction: (notification) => {
        logger.info("Action de notification:", notification);
        this.handleNotificationAction(notification);
      },

      onRegistrationError: (err) => {
        logger.error("Erreur d'enregistrement des notifications:", err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === "ios",
    });

    // Créer les catégories d'actions pour iOS
    if (Platform.OS === "ios") {
      PushNotification.setApplicationIconBadgeNumber(0);
    }
  }

  /**
   * Gérer les actions des notifications
   */
  private async handleNotificationAction(notification: any) {
    try {
      const data: GoalNotificationData = notification.data || {};

      if (!data.goalId || !data.action) {
        logger.warn("Données de notification invalides:", data);
        return;
      }

      switch (data.action) {
        case "increment":
          await this.incrementGoal(data.goalId);
          break;
        case "decrement":
          await this.decrementGoal(data.goalId);
          break;
        case "complete":
          await this.completeGoal(data.goalId);
          break;
      }

      // Afficher un feedback à l'utilisateur
      this.showActionFeedback(data.action, data.title);
    } catch (error) {
      logger.error("Erreur lors du traitement de l'action:", error);
    }
  }

  /**
   * Incrémenter un objectif
   */
  private async incrementGoal(goalId: string) {
    try {
      // Charger l'objectif actuel
      const goalsData = await AsyncStorage.getItem("current_goals");
      if (!goalsData) return;

      const goals: Goal[] = JSON.parse(goalsData);
      const goal = goals.find((g) => g.id === goalId);

      if (!goal) return;

      const newCurrent = Math.min(goal.current + 1, goal.target);
      await planningService.updateGoalProgress(goalId, newCurrent);

      logger.info("Objectif incrémenté via notification:", {
        goalId,
        newCurrent,
      });
    } catch (error) {
      logger.error("Erreur lors de l'incrémentation:", error);
    }
  }

  /**
   * Décrémenter un objectif
   */
  private async decrementGoal(goalId: string) {
    try {
      const goalsData = await AsyncStorage.getItem("current_goals");
      if (!goalsData) return;

      const goals: Goal[] = JSON.parse(goalsData);
      const goal = goals.find((g) => g.id === goalId);

      if (!goal) return;

      const newCurrent = Math.max(goal.current - 1, 0);
      await planningService.updateGoalProgress(goalId, newCurrent);

      logger.info("Objectif décrémenté via notification:", {
        goalId,
        newCurrent,
      });
    } catch (error) {
      logger.error("Erreur lors de la décrémentation:", error);
    }
  }

  /**
   * Marquer un objectif comme accompli
   */
  private async completeGoal(goalId: string) {
    try {
      await planningService.updateGoal(goalId, {
        status: "completed",
        progress: 100,
        completedAt: new Date().toISOString(),
      });

      logger.info("Objectif marqué comme accompli via notification:", {
        goalId,
      });
    } catch (error) {
      logger.error("Erreur lors du marquage comme accompli:", error);
    }
  }

  /**
   * Afficher un feedback à l'utilisateur
   */
  private showActionFeedback(action: string, goalTitle: string) {
    let message = "";

    switch (action) {
      case "increment":
        message = `✅ Progression de "${goalTitle}" incrémentée !`;
        break;
      case "decrement":
        message = `↩️ Progression de "${goalTitle}" décrémentée`;
        break;
      case "complete":
        message = `🎉 "${goalTitle}" marqué comme accompli !`;
        break;
    }

    // Afficher une notification de feedback
    PushNotification.localNotification({
      title: "Objectif mis à jour",
      message,
      playSound: false,
      vibrate: false,
    });
  }

  /**
   * Créer des notifications de contrôle pour les objectifs actifs
   */
  async createGoalControlNotifications(goals: Goal[]) {
    try {
      // Vérifier les permissions de notifications
      const checkPermissions = () => {
        return new Promise((resolve) => {
          PushNotification.checkPermissions((permissions) => {
            resolve(permissions);
          });
        });
      };

      const permissions: any = await checkPermissions();

      // Demander les permissions si nécessaire
      if (!permissions?.alert) {
        PushNotification.requestPermissions(["alert", "badge", "sound"]);
      }

      // Annuler les notifications précédentes
      PushNotification.cancelAllLocalNotifications();

      // Sauvegarder les objectifs pour les actions
      await AsyncStorage.setItem("current_goals", JSON.stringify(goals));

      const activeGoals = goals
        .filter((g) => g.status === "active")
        .slice(0, 3);

      if (activeGoals.length === 0) {
        // Créer des objectifs de test si aucun n'est actif
        const testGoals = [
          {
            id: "test1",
            title: "Boire 8 verres d'eau",
            current: 3,
            target: 8,
            unit: "verres",
            progress: 37,
            status: "active",
          },
          {
            id: "test2",
            title: "Faire 10000 pas",
            current: 6500,
            target: 10000,
            unit: "pas",
            progress: 65,
            status: "active",
          },
        ];

        for (const goal of testGoals) {
          const notificationId = `goal_control_${goal.id}`;

          PushNotification.localNotification({
            id: notificationId,
            title: `🎯 ${goal.title}`,
            message: `Progression: ${goal.current}/${goal.target} ${goal.unit} (${goal.progress}%)`,
            bigText: `Contrôlez votre objectif directement depuis cette notification.\n\nProgression actuelle: ${goal.current}/${goal.target} ${goal.unit}\nPourcentage: ${goal.progress}%`,
            subText: "Contrôles rapides",
            actions: [
              "➕ +1",
              "➖ -1",
              goal.progress >= 100 ? "✅ Accompli" : "🎯 Voir",
            ],
            userInfo: {
              goalId: goal.id,
              title: goal.title,
            },
            ongoing: true, // Notification persistante
            priority: "high",
            visibility: "public",
            invokeApp: false,
            autoCancel: false,
            playSound: true,
            vibrate: true,
            importance: "high",
          });
        }
      } else {
        for (const goal of activeGoals) {
          // Notification principale avec actions
          const notificationId = `goal_control_${goal.id}`;

          PushNotification.localNotification({
            id: notificationId,
            title: `🎯 ${goal.title}`,
            message: `Progression: ${goal.current}/${goal.target} ${goal.unit} (${goal.progress}%)`,
            bigText: `Contrôlez votre objectif directement depuis cette notification.\n\nProgression actuelle: ${goal.current}/${goal.target} ${goal.unit}\nPourcentage: ${goal.progress}%`,
            subText: "Contrôles rapides",
            actions: [
              "➕ +1",
              "➖ -1",
              goal.progress >= 100 ? "✅ Accompli" : "🎯 Voir",
            ],
            userInfo: {
              goalId: goal.id,
              title: goal.title,
            },
            ongoing: true, // Notification persistante
            priority: "high",
            visibility: "public",
            invokeApp: false,
            autoCancel: false,
            playSound: true,
            vibrate: true,
            importance: "high",
          });
        }
      }

      // Créer une notification de test simple pour vérifier
      PushNotification.localNotification({
        id: "test_notification",
        title: "🧪 Test Notification",
        message: "Si vous voyez cette notification, le système fonctionne !",
        playSound: true,
        vibrate: true,
        priority: "high",
        importance: "high",
      });

      logger.info("Notifications de contrôle créées pour", {
        count: activeGoals.length || 2,
      });
    } catch (error) {
      logger.error("Erreur lors de la création des notifications:", error);
    }
  }

  /**
   * Créer des raccourcis rapides pour les objectifs
   */
  async createQuickActions(goals: Goal[]) {
    if (Platform.OS !== "ios") return;

    try {
      const activeGoals = goals
        .filter((g) => g.status === "active")
        .slice(0, 4);

      const shortcuts = activeGoals.map((goal) => ({
        type: `increment_goal_${goal.id}`,
        title: `+1 ${goal.title}`,
        subtitle: `${goal.current}/${goal.target} ${goal.unit}`,
        icon: "UIApplicationShortcutIconTypeAdd",
        userInfo: {
          goalId: goal.id,
          action: "increment",
        },
      }));

      // Utiliser le module natif pour définir les raccourcis
      // Note: Ceci nécessiterait un module natif iOS
      logger.info("Raccourcis créés pour", { count: shortcuts.length });
    } catch (error) {
      logger.error("Erreur lors de la création des raccourcis:", error);
    }
  }

  /**
   * Programmer des rappels quotidiens pour les objectifs
   */
  async scheduleGoalReminders(goals: Goal[]) {
    try {
      const activeGoals = goals.filter((g) => g.status === "active");

      for (const goal of activeGoals) {
        // Rappel quotidien à 9h00
        PushNotification.localNotificationSchedule({
          id: `reminder_${goal.id}`,
          title: `🌅 Rappel: ${goal.title}`,
          message: `N'oubliez pas votre objectif ! Progression: ${goal.current}/${goal.target} ${goal.unit}`,
          date: this.getNextReminderDate(9, 0), // 9h00
          repeatType: "day",
          actions: ["➕ +1", "📊 Voir progrès"],
          userInfo: {
            goalId: goal.id,
            action: "reminder",
            title: goal.title,
          },
        });

        // Rappel du soir à 20h00 si pas de progrès
        PushNotification.localNotificationSchedule({
          id: `evening_reminder_${goal.id}`,
          title: `🌙 Bilan du jour: ${goal.title}`,
          message: `Comment s'est passée votre progression aujourd'hui ?`,
          date: this.getNextReminderDate(20, 0), // 20h00
          repeatType: "day",
          actions: ["➕ Ajouter", "✅ Fait"],
          userInfo: {
            goalId: goal.id,
            action: "evening_check",
            title: goal.title,
          },
        });
      }

      logger.info("Rappels programmés pour", { count: activeGoals.length });
    } catch (error) {
      logger.error("Erreur lors de la programmation des rappels:", error);
    }
  }

  /**
   * Obtenir la prochaine date de rappel
   */
  private getNextReminderDate(hour: number, minute: number): Date {
    const now = new Date();
    const reminder = new Date();
    reminder.setHours(hour, minute, 0, 0);

    // Si l'heure est déjà passée aujourd'hui, programmer pour demain
    if (reminder <= now) {
      reminder.setDate(reminder.getDate() + 1);
    }

    return reminder;
  }

  /**
   * Nettoyer toutes les notifications et rappels
   */
  async clearAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
    await AsyncStorage.removeItem("current_goals");
    logger.info("Toutes les notifications ont été supprimées");
  }

  /**
   * Afficher le tableau de bord des objectifs via notification
   */
  async showGoalsDashboard(goals: Goal[]) {
    const activeGoals = goals.filter((g) => g.status === "active");
    const completedGoals = goals.filter((g) => g.status === "completed");

    const summary = activeGoals
      .map(
        (goal) =>
          `🎯 ${goal.title}: ${goal.current}/${goal.target} ${goal.unit} (${goal.progress}%)`
      )
      .join("\n");

    PushNotification.localNotification({
      title: "📊 Tableau de bord des objectifs",
      message: `${activeGoals.length} actifs, ${completedGoals.length} accomplis`,
      bigText: `Objectifs actifs:\n\n${summary}\n\n✅ ${completedGoals.length} objectifs accomplis`,
      actions: ["🎯 Ouvrir app", "➕ Nouveau"],
      userInfo: {
        action: "dashboard",
      },
    });
  }
}

export const goalsControlService = GoalsControlService.getInstance();
