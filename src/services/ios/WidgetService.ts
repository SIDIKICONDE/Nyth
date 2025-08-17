import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Goal } from "../../types/planning";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("WidgetService");

// Interface pour les données du widget
interface WidgetGoalData {
  id: string;
  title: string;
  current: number;
  target: number;
  progress: number;
  status: string;
  priority: string;
  unit: string;
}

interface WidgetData {
  goals: WidgetGoalData[];
  lastUpdate: string;
}

class WidgetService {
  private static instance: WidgetService;
  private sharedUserDefaults: any;

  private constructor() {
    // Initialiser les UserDefaults partagés pour iOS
    if (Platform.OS === "ios") {
      try {
        this.sharedUserDefaults = NativeModules.SharedUserDefaults;
      } catch (error) {
        logger.warn("SharedUserDefaults module non disponible:", error);
      }
    }
  }

  static getInstance(): WidgetService {
    if (!WidgetService.instance) {
      WidgetService.instance = new WidgetService();
    }
    return WidgetService.instance;
  }

  /**
   * Convertir un objectif du type Goal vers WidgetGoalData
   */
  private convertGoalToWidgetData(goal: Goal): WidgetGoalData {
    return {
      id: goal.id,
      title: goal.title,
      current: goal.current,
      target: goal.target,
      progress: goal.progress,
      status: goal.status,
      priority: goal.priority,
      unit: goal.unit,
    };
  }

  /**
   * Mettre à jour les données des objectifs pour le widget
   */
  async updateWidgetData(goals: Goal[]): Promise<void> {
    if (Platform.OS !== "ios") {
      logger.info("Widget service uniquement disponible sur iOS");
      return;
    }

    try {
      // Filtrer les objectifs actifs et les limiter à 5 pour le widget
      const activeGoals = goals
        .filter(
          (goal) => goal.status === "active" || goal.status === "completed"
        )
        .slice(0, 5)
        .map((goal) => this.convertGoalToWidgetData(goal));

      const widgetData: WidgetData = {
        goals: activeGoals,
        lastUpdate: new Date().toISOString(),
      };

      // Sauvegarder dans UserDefaults partagés
      if (this.sharedUserDefaults) {
        const jsonData = JSON.stringify(widgetData);
        await this.sharedUserDefaults.setString("widget_goals_data", jsonData);
        logger.info("Données du widget mises à jour", {
          goalsCount: activeGoals.length,
        });
      } else {
        // Fallback: sauvegarder dans AsyncStorage
        await AsyncStorage.setItem(
          "widget_goals_data",
          JSON.stringify(widgetData)
        );
        logger.info("Données du widget sauvegardées en fallback");
      }

      // Forcer la mise à jour du widget
      await this.reloadWidget();
    } catch (error) {
      logger.error(
        "Erreur lors de la mise à jour des données du widget:",
        error
      );
    }
  }

  /**
   * Forcer le rechargement du widget
   */
  async reloadWidget(): Promise<void> {
    if (Platform.OS !== "ios") return;

    try {
      if (this.sharedUserDefaults) {
        await this.sharedUserDefaults.reloadWidget("VisionsGoalsWidget");
        logger.info("Widget rechargé");
      }
    } catch (error) {
      logger.warn("Impossible de recharger le widget:", error);
    }
  }

  /**
   * Écouter les changements depuis le widget
   */
  async checkForWidgetUpdates(): Promise<{
    goalId: string;
    action: "increment" | "decrement";
  } | null> {
    if (Platform.OS !== "ios") return null;

    try {
      let lastAction: string | null = null;
      let updatedGoalId: string | null = null;

      if (this.sharedUserDefaults) {
        lastAction = await this.sharedUserDefaults.getString(
          "widget_last_action"
        );
        updatedGoalId = await this.sharedUserDefaults.getString(
          "widget_updated_goal_id"
        );
      } else {
        // Fallback: vérifier dans AsyncStorage
        lastAction = await AsyncStorage.getItem("widget_last_action");
        updatedGoalId = await AsyncStorage.getItem("widget_updated_goal_id");
      }

      if (lastAction && updatedGoalId) {
        // Nettoyer les clés après lecture
        if (this.sharedUserDefaults) {
          await this.sharedUserDefaults.removeKey("widget_last_action");
          await this.sharedUserDefaults.removeKey("widget_updated_goal_id");
        } else {
          await AsyncStorage.removeItem("widget_last_action");
          await AsyncStorage.removeItem("widget_updated_goal_id");
        }

        logger.info("Action du widget détectée", { goalId: updatedGoalId });

        // Pour l'instant, on retourne toujours 'increment'
        // La logique réelle sera dans le widget
        return { goalId: updatedGoalId, action: "increment" };
      }

      return null;
    } catch (error) {
      logger.error(
        "Erreur lors de la vérification des mises à jour du widget:",
        error
      );
      return null;
    }
  }

  /**
   * Initialiser la synchronisation avec le widget
   */
  async initializeWidgetSync(goals: Goal[]): Promise<void> {
    logger.info("Initialisation de la synchronisation du widget");
    await this.updateWidgetData(goals);
  }

  /**
   * Nettoyer les données du widget
   */
  async clearWidgetData(): Promise<void> {
    if (Platform.OS !== "ios") return;

    try {
      if (this.sharedUserDefaults) {
        await this.sharedUserDefaults.removeKey("widget_goals_data");
        await this.sharedUserDefaults.removeKey("widget_last_action");
        await this.sharedUserDefaults.removeKey("widget_updated_goal_id");
      } else {
        await AsyncStorage.removeItem("widget_goals_data");
        await AsyncStorage.removeItem("widget_last_action");
        await AsyncStorage.removeItem("widget_updated_goal_id");
      }

      logger.info("Données du widget nettoyées");
    } catch (error) {
      logger.error("Erreur lors du nettoyage des données du widget:", error);
    }
  }
}

// Exporter l'instance singleton
export const widgetService = WidgetService.getInstance();
