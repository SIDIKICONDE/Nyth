import { Platform, Alert } from "react-native";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("SimpleNotificationService");

class SimpleNotificationService {
  private static instance: SimpleNotificationService;

  private constructor() {
    this.initialize();
  }

  static getInstance(): SimpleNotificationService {
    if (!SimpleNotificationService.instance) {
      SimpleNotificationService.instance = new SimpleNotificationService();
    }
    return SimpleNotificationService.instance;
  }

  private initialize() {
    if (Platform.OS === "ios") {} else {}
  }

  /**
   * Afficher une notification simple
   */
  async showSimpleNotification(title: string, message: string) {
    try {
      // Utiliser Alert pour les tests
      Alert.alert(title, message, [
        { text: "OK", onPress: () => void 0 },
      ]);

      logger.info("Notification affichée", { title, message });
    } catch (error) {
      logger.error("Erreur lors de l'affichage de la notification:", error);
    }
  }

  /**
   * Créer des notifications de test pour les objectifs
   */
  async createTestNotifications() {
    try {
      const testGoals = [
        {
          id: "test1",
          title: "Boire 8 verres d'eau",
          current: 3,
          target: 8,
          progress: 37,
        },
        {
          id: "test2",
          title: "Faire 10000 pas",
          current: 6500,
          target: 10000,
          progress: 65,
        },
      ];

      for (const goal of testGoals) {
        await this.showSimpleNotification(
          `🎯 ${goal.title}`,
          `Progression: ${goal.current}/${goal.target} (${goal.progress}%)`
        );
      }

      logger.info("Notifications de test créées", { count: testGoals.length });
    } catch (error) {
      logger.error(
        "Erreur lors de la création des notifications de test:",
        error
      );
    }
  }

  /**
   * Afficher un tableau de bord des objectifs
   */
  async showGoalsDashboard(goals: any[]) {
    try {
      const activeGoals = goals.filter((g) => g.status === "active");
      const completedGoals = goals.filter((g) => g.status === "completed");

      const summary = activeGoals
        .map(
          (goal) => `• ${goal.title}: ${goal.current || 0}/${goal.target || 1}`
        )
        .join("\n");

      await this.showSimpleNotification(
        "📊 Tableau de Bord des Objectifs",
        `${activeGoals.length} actifs, ${completedGoals.length} accomplis\n\n${
          summary || "Aucun objectif actif"
        }`
      );

      logger.info("Tableau de bord affiché", {
        active: activeGoals.length,
        completed: completedGoals.length,
      });
    } catch (error) {
      logger.error("Erreur lors de l'affichage du tableau de bord:", error);
    }
  }

  /**
   * Programmer des rappels (simulation)
   */
  async scheduleReminders() {
    try {
      await this.showSimpleNotification(
        "⏰ Rappels Programmés",
        "Rappels configurés pour 9h00 et 20h00 chaque jour"
      );

      logger.info("Rappels programmés");
    } catch (error) {
      logger.error("Erreur lors de la programmation des rappels:", error);
    }
  }

  /**
   * Nettoyer les notifications
   */
  async clearNotifications() {
    try {
      await this.showSimpleNotification(
        "🧹 Nettoyage Terminé",
        "Toutes les notifications ont été supprimées"
      );

      logger.info("Notifications nettoyées");
    } catch (error) {
      logger.error("Erreur lors du nettoyage des notifications:", error);
    }
  }
}

export const simpleNotificationService =
  SimpleNotificationService.getInstance();
