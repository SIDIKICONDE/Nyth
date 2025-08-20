import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { calendarService, CalendarInfo } from "../services/calendar";
import { PlanningEvent } from "../types/planning";
import { useGlobalPreferences } from "./useGlobalPreferences";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("useCalendarIntegration");

export interface CalendarIntegrationStatus {
  isEnabled: boolean;
  hasPermissions: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  calendars: CalendarInfo[];
}

export const useCalendarIntegration = () => {
  const { planningPreferences } = useGlobalPreferences();
  const [status, setStatus] = useState<CalendarIntegrationStatus>({
    isEnabled: false,
    hasPermissions: false,
    isInitialized: false,
    isLoading: false,
    calendars: [],
  });

  // Vérifier si l'intégration calendrier est activée
  const isCalendarEnabled =
    planningPreferences?.notificationSettings?.integrations?.calendar
      ?.enabled || false;

  // Initialiser le service calendrier
  const initializeCalendar = useCallback(async () => {
    if (!isCalendarEnabled) {
      setStatus((prev) => ({ ...prev, isEnabled: false }));
      return;
    }

    setStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      logger.info("🔄 Initialisation de l'intégration calendrier...");

      const hasPermissions = await calendarService.initialize();
      let calendars: CalendarInfo[] = [];

      if (hasPermissions) {
        calendars = await calendarService.getCalendars();
        logger.info(`📅 ${calendars.length} calendriers disponibles`);
      }

      setStatus({
        isEnabled: isCalendarEnabled,
        hasPermissions,
        isInitialized: true,
        isLoading: false,
        calendars,
      });

      if (hasPermissions) {
        logger.info("✅ Intégration calendrier initialisée avec succès");
      } else {
        logger.warn("⚠️ Intégration calendrier sans permissions");
      }
    } catch (error) {
      logger.error("❌ Erreur lors de l'initialisation calendrier:", error);
      setStatus({
        isEnabled: isCalendarEnabled,
        hasPermissions: false,
        isInitialized: false,
        isLoading: false,
        calendars: [],
      });
    }
  }, [isCalendarEnabled]);

  // Synchroniser un événement vers le calendrier
  const syncEventToCalendar = useCallback(
    async (event: PlanningEvent): Promise<boolean> => {
      if (!status.hasPermissions) {
        Alert.alert(
          "Permissions requises",
          "L'accès au calendrier est nécessaire pour synchroniser les événements.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Autoriser",
              onPress: () => initializeCalendar(),
            },
          ]
        );
        return false;
      }

      try {
        logger.info(`🔄 Synchronisation événement: ${event.title}`);
        const calendarEventId = await calendarService.syncEventToCalendar(
          event
        );

        if (calendarEventId) {
          logger.info(`✅ Événement synchronisé: ${calendarEventId}`);
          Alert.alert(
            "Synchronisation réussie",
            `L'événement "${event.title}" a été ajouté à votre calendrier.`
          );
          return true;
        } else {
          logger.warn("⚠️ Échec de la synchronisation");
          Alert.alert(
            "Erreur de synchronisation",
            "Impossible d'ajouter l'événement au calendrier."
          );
          return false;
        }
      } catch (error) {
        logger.error("❌ Erreur sync événement:", error);
        Alert.alert(
          "Erreur",
          "Une erreur s'est produite lors de la synchronisation."
        );
        return false;
      }
    },
    [status.hasPermissions, initializeCalendar]
  );

  // Synchroniser plusieurs événements
  const syncMultipleEvents = useCallback(
    async (
      events: PlanningEvent[]
    ): Promise<{ success: number; failed: number }> => {
      if (!status.hasPermissions) {
        Alert.alert(
          "Permissions requises",
          "L'accès au calendrier est nécessaire."
        );
        return { success: 0, failed: events.length };
      }

      try {
        logger.info(`🔄 Synchronisation de ${events.length} événements...`);
        const results = await calendarService.syncMultipleEvents(events);

        const successCount = results.success.length;
        const failedCount = results.failed.length;

        if (successCount > 0) {
          Alert.alert(
            "Synchronisation terminée",
            `${successCount} événement(s) synchronisé(s), ${failedCount} échec(s).`
          );
        }

        return { success: successCount, failed: failedCount };
      } catch (error) {
        logger.error("❌ Erreur sync multiple:", error);
        return { success: 0, failed: events.length };
      }
    },
    [status.hasPermissions]
  );

  // Demander les permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setStatus((prev) => ({ ...prev, isLoading: true }));
      const hasPermissions = await calendarService.requestPermissions();

      setStatus((prev) => ({
        ...prev,
        hasPermissions,
        isLoading: false,
      }));

      return hasPermissions;
    } catch (error) {
      logger.error("❌ Erreur demande permissions:", error);
      setStatus((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  // Rafraîchir la liste des calendriers
  const refreshCalendars = useCallback(async () => {
    if (!status.hasPermissions) return;

    try {
      const calendars = await calendarService.getCalendars();
      setStatus((prev) => ({ ...prev, calendars }));
    } catch (error) {
      logger.error("❌ Erreur refresh calendriers:", error);
    }
  }, [status.hasPermissions]);

  // Initialiser au montage si activé
  useEffect(() => {
    if (isCalendarEnabled && !status.isInitialized) {
      initializeCalendar();
    }
  }, [isCalendarEnabled, status.isInitialized, initializeCalendar]);

  return {
    // État
    status,
    isEnabled: isCalendarEnabled,
    isAvailable: status.hasPermissions,
    calendars: status.calendars,

    // Actions
    initializeCalendar,
    syncEventToCalendar,
    syncMultipleEvents,
    requestPermissions,
    refreshCalendars,

    // Utilitaires
    getServiceStatus: () => calendarService.getStatus(),
  };
};
