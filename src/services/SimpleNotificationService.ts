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
      Alert.alert(title, message, [
        { text: "OK", onPress: () => void 0 },
      ]);

      logger.info("Notification affichée", { title, message });
    } catch (error) {
      logger.error("Erreur lors de l'affichage de la notification:", error);
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


}

export const simpleNotificationService =
  SimpleNotificationService.getInstance();
