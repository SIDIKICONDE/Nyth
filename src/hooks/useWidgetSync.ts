import { useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { widgetService } from "../services/ios/WidgetService";
import { Goal } from "../types/planning";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("useWidgetSync");

export const useWidgetSync = (goals: Goal[]) => {
  // Synchroniser les données avec le widget quand les objectifs changent
  useEffect(() => {
    if (goals.length > 0) {
      widgetService.updateWidgetData(goals);
    }
  }, [goals]);

  // Vérifier les actions du widget quand l'app devient active
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        try {
          const widgetUpdate = await widgetService.checkForWidgetUpdates();
          if (widgetUpdate) {
            logger.info("Action du widget détectée", widgetUpdate);
            // Ici vous pouvez déclencher une action pour mettre à jour l'objectif
            // Par exemple, appeler une fonction de callback passée en paramètre
          }
        } catch (error) {
          logger.error(
            "Erreur lors de la vérification des mises à jour du widget:",
            error
          );
        }
      }
    },
    []
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
