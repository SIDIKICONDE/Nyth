import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Goal, PlanningEvent, Task } from "../../types/planning";
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
  deadline?: string;
}

interface WidgetEventData {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  location: string;
  type: string;
  priority: string;
  isCompleted: boolean;
}

interface WidgetTaskData {
  id: string;
  title: string;
  project: string;
  status: string;
  dueDate?: string;
  isCompleted: boolean;
}

interface WidgetData {
  goals: WidgetGoalData[];
  events: WidgetEventData[];
  tasks: WidgetTaskData[];
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
      deadline: goal.deadline?.toISOString(),
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
   * Convertir un événement vers WidgetEventData
   */
  private convertEventToWidgetData(event: PlanningEvent): WidgetEventData {
    return {
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location || "",
      type: event.type,
      priority: event.priority,
      isCompleted: event.status === "completed",
    };
  }

  /**
   * Convertir une tâche vers WidgetTaskData
   */
  private convertTaskToWidgetData(task: Task): WidgetTaskData {
    return {
      id: task.id,
      title: task.title,
      project: task.project || "",
      status: task.status,
      dueDate: task.dueDate,
      isCompleted: task.status === "done",
    };
  }

  /**
   * Mettre à jour toutes les données du planning pour le widget
   */
  async updatePlanningData(
    goals: Goal[],
    events: PlanningEvent[],
    tasks: Task[]
  ): Promise<void> {
    if (Platform.OS !== "ios") {
      logger.info("Widget service uniquement disponible sur iOS");
      return;
    }

    try {
      // Filtrer et convertir les données
      const activeGoals = goals
        .filter(
          (goal) => goal.status === "active" || goal.status === "completed"
        )
        .slice(0, 5)
        .map((goal) => this.convertGoalToWidgetData(goal));

      const todayEvents = events
        .filter((event) => {
          const eventDate = new Date(event.startDate);
          const today = new Date();
          return (
            eventDate.getDate() === today.getDate() &&
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getFullYear() === today.getFullYear()
          );
        })
        .slice(0, 5)
        .map((event) => this.convertEventToWidgetData(event));

      const activeTasks = tasks
        .filter((task) => task.status !== "done" && task.status !== "cancelled")
        .slice(0, 5)
        .map((task) => this.convertTaskToWidgetData(task));

      const widgetData: WidgetData = {
        goals: activeGoals,
        events: todayEvents,
        tasks: activeTasks,
        lastUpdate: new Date().toISOString(),
      };

      // Sauvegarder dans UserDefaults partagés
      const appGroupID = "group.com.nyth.planning";
      if (this.sharedUserDefaults) {
        const jsonData = JSON.stringify(widgetData);
        await this.sharedUserDefaults.setString(
          "widget_planning_data",
          jsonData,
          appGroupID
        );
        logger.info("Données du planning mises à jour pour le widget", {
          goalsCount: activeGoals.length,
          eventsCount: todayEvents.length,
          tasksCount: activeTasks.length,
        });
      } else {
        // Fallback: sauvegarder dans AsyncStorage
        await AsyncStorage.setItem(
          "widget_planning_data",
          JSON.stringify(widgetData)
        );
        logger.info("Données du planning sauvegardées en fallback");
      }

      // Forcer la mise à jour du widget
      await this.reloadWidget();
    } catch (error) {
      logger.error(
        "Erreur lors de la mise à jour des données du planning:",
        error
      );
    }
  }

  /**
   * Vérifier les actions du widget (mise à jour)
   */
  async checkForWidgetActions(): Promise<{
    action: string;
    itemId?: string;
    itemType?: "goal" | "event" | "task";
  } | null> {
    if (Platform.OS !== "ios") return null;

    try {
      let lastAction: string | null = null;
      let actionItemId: string | null = null;

      if (this.sharedUserDefaults) {
        lastAction = await this.sharedUserDefaults.getString(
          "widget_last_action"
        );
        actionItemId = await this.sharedUserDefaults.getString(
          "widget_action_item_id"
        );
      } else {
        // Fallback
        lastAction = await AsyncStorage.getItem("widget_last_action");
        actionItemId = await AsyncStorage.getItem("widget_action_item_id");
      }

      if (lastAction) {
        // Nettoyer les clés après lecture
        if (this.sharedUserDefaults) {
          await this.sharedUserDefaults.removeKey("widget_last_action");
          await this.sharedUserDefaults.removeKey("widget_action_item_id");
        } else {
          await AsyncStorage.removeItem("widget_last_action");
          await AsyncStorage.removeItem("widget_action_item_id");
        }

        logger.info("Action du widget détectée", {
          action: lastAction,
          itemId: actionItemId,
        });

        // Déterminer le type d'action
        if (lastAction.startsWith("goal_")) {
          return {
            action: lastAction.replace("goal_", ""),
            itemId: actionItemId || undefined,
            itemType: "goal",
          };
        } else if (lastAction.startsWith("event_")) {
          return {
            action: lastAction.replace("event_", ""),
            itemId: actionItemId || undefined,
            itemType: "event",
          };
        } else if (lastAction.startsWith("task_")) {
          return {
            action: lastAction.replace("task_", ""),
            itemId: actionItemId || undefined,
            itemType: "task",
          };
        } else {
          return { action: lastAction };
        }
      }

      return null;
    } catch (error) {
      logger.error(
        "Erreur lors de la vérification des actions du widget:",
        error
      );
      return null;
    }
  }

  /**
   * Nettoyer les données du widget
   */
  async clearWidgetData(): Promise<void> {
    if (Platform.OS !== "ios") return;

    try {
      if (this.sharedUserDefaults) {
        await this.sharedUserDefaults.removeKey("widget_planning_data");
        await this.sharedUserDefaults.removeKey("widget_goals_data");
        await this.sharedUserDefaults.removeKey("widget_last_action");
        await this.sharedUserDefaults.removeKey("widget_action_item_id");
        await this.sharedUserDefaults.removeKey("widget_updated_goal_id");
      } else {
        await AsyncStorage.removeItem("widget_planning_data");
        await AsyncStorage.removeItem("widget_goals_data");
        await AsyncStorage.removeItem("widget_last_action");
        await AsyncStorage.removeItem("widget_action_item_id");
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
