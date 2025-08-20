import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useTranslation } from "../../../../hooks/useTranslation";
import { useGlobalPreferences } from "../../../../hooks/useGlobalPreferences";
import { DEFAULT_PLANNING_SETTINGS } from "../constants";
import { PlanningSettings, ExtendedNotificationSettings } from "../types";
import { calendarService } from "../../../../services/calendar/CalendarIntegrationService";
import { usePlanning } from "../../../../hooks/usePlanning";

// Fonction utilitaire pour fusionner les objets de manière sûre
const mergeSettings = (defaults: any, overrides: any): any => {
  if (!overrides) return defaults;

  const result = { ...defaults };
  for (const key in overrides) {
    if (overrides[key] !== undefined) {
      if (
        typeof overrides[key] === "object" &&
        overrides[key] !== null &&
        !Array.isArray(overrides[key])
      ) {
        result[key] = mergeSettings(defaults[key] || {}, overrides[key]);
      } else {
        result[key] = overrides[key];
      }
    }
  }
  return result;
};

export const usePlanningSettings = (onClose: () => void) => {
  const { t } = useTranslation();
  const { updatePreference, planningPreferences } = useGlobalPreferences();
  const { events } = usePlanning();

  // Charger les paramètres depuis les préférences globales ou utiliser les défauts
  const initialSettings: PlanningSettings = mergeSettings(
    DEFAULT_PLANNING_SETTINGS,
    planningPreferences
  );
  const [settings, setSettings] = useState<PlanningSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const updateSetting = <K extends keyof PlanningSettings>(
    key: K,
    value: PlanningSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Fonction pour mettre à jour les paramètres imbriqués (notification settings)
  const updateNotificationSetting = useCallback((path: string, value: any) => {
    const pathParts = path.split(".");

    setSettings((prev) => {
      const newSettings = { ...prev };
      let current: any = newSettings.notificationSettings;

      // Naviguer jusqu'au bon niveau
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }

      // Définir la valeur finale
      current[pathParts[pathParts.length - 1]] = value;

      return newSettings;
    });
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Sauvegarder dans les préférences globales
      await updatePreference("planningPreferences", settings);

      try {
        const prevEnabled =
          planningPreferences?.notificationSettings?.integrations?.calendar
            ?.enabled === true;
        const nextEnabled =
          settings.notificationSettings.integrations.calendar.enabled === true;
        if (!prevEnabled && nextEnabled) {
          await calendarService.initialize();
          const result = await calendarService.syncMultipleEvents(events);
          Alert.alert(
            t("planning.settings.sync", "Synchronization"),
            `${result.success.length} ${t("common.success", "Success")} / ${
              result.failed.length
            } ${t("common.error", "Error")}`
          );
        }
      } catch (syncError) {}

      Alert.alert(
        t("planning.settings.saved", "Paramètres sauvegardés"),
        t(
          "planning.settings.savedDescription",
          "Vos préférences ont été mises à jour avec succès."
        )
      );
      onClose();
    } catch (error) {
      Alert.alert(
        t("common.error", "Erreur"),
        t(
          "planning.settings.saveError",
          "Impossible de sauvegarder les paramètres"
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      t("planning.settings.reset", "Réinitialiser"),
      t(
        "planning.settings.resetDescription",
        "Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?"
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("common.confirm", "Confirmer"),
          style: "destructive",
          onPress: async () => {
            try {
              setSettings(DEFAULT_PLANNING_SETTINGS);
              await updatePreference(
                "planningPreferences",
                DEFAULT_PLANNING_SETTINGS
              );
            } catch (error) {}
          },
        },
      ]
    );
  };

  return {
    settings,
    updateSetting,
    updateNotificationSetting,
    handleSave,
    handleReset,
    isSaving,
  };
};
