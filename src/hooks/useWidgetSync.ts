import { useCallback, useEffect } from "react";
import { AppState, AppStateStatus, Linking } from "react-native";
import { widgetService } from "../services/ios/WidgetService";
import { Goal, PlanningEvent, Task } from "../types/planning";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("useWidgetSync");

interface UseWidgetSyncProps {
  goals: Goal[];
  events: PlanningEvent[];
  tasks: Task[];
  onWidgetAction?: (action: {
    action: string;
    itemId?: string;
    itemType?: "goal" | "event" | "task";
  }) => void;
}

export const useWidgetSync = ({
  goals,
  events,
  tasks,
  onWidgetAction,
}: UseWidgetSyncProps) => {
  // Synchroniser les données avec le widget quand elles changent
  useEffect(() => {
    widgetService.updatePlanningData(goals, events, tasks);
  }, [goals, events, tasks]);

  // Vérifier les actions du widget quand l'app devient active
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        try {
          const widgetAction = await widgetService.checkForWidgetActions();
          if (widgetAction && onWidgetAction) {
            logger.info("Action du widget détectée", widgetAction);
            onWidgetAction(widgetAction);
          }
        } catch (error) {
          logger.error(
            "Erreur lors de la vérification des actions du widget:",
            error
          );
        }
      }
    },
    [onWidgetAction]
  );

  // Écouter les changements d'état de l'app
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  // Fonctions utilitaires
  const forceWidgetUpdate = useCallback(async () => {
    try {
      await widgetService.updateWidgetData(goals);
      await widgetService.reloadWidget();
      logger.info("Widget mis à jour manuellement");
    } catch (error) {
      logger.error("Erreur lors de la mise à jour manuelle du widget:", error);
    }
  }, [goals]);

  const clearWidgetData = useCallback(async () => {
    try {
      await widgetService.clearWidgetData();
      logger.info("Données du widget nettoyées");
    } catch (error) {
      logger.error("Erreur lors du nettoyage des données du widget:", error);
    }
  }, []);

  return {
    forceWidgetUpdate,
    clearWidgetData,
  };
};
