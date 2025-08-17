import { useEffect } from "react";
import { useGlobalPreferences } from "./useGlobalPreferences";
import { enhancedNotificationService } from "../services/notifications/EnhancedNotificationService";
import { DEFAULT_EXTENDED_NOTIFICATION_SETTINGS } from "../components/planning/settings/constants";
import { createLogger } from "../utils/optimizedLogger";

// Fonction utilitaire pour fusionner les objets de manière sûre
const mergeSettings = (defaults: any, overrides: any): any => {
  if (!overrides) return defaults;
  
  const result = { ...defaults };
  for (const key in overrides) {
    if (overrides[key] !== undefined) {
      if (typeof overrides[key] === 'object' && overrides[key] !== null && !Array.isArray(overrides[key])) {
        result[key] = mergeSettings(defaults[key] || {}, overrides[key]);
      } else {
        result[key] = overrides[key];
      }
    }
  }
  return result;
};

const logger = createLogger("useNotificationSync");

/**
 * Hook pour synchroniser les paramètres de notification avec le service étendu
 */
export const useNotificationSync = () => {
  const { planningPreferences } = useGlobalPreferences();

  useEffect(() => {
    const syncSettings = async () => {
      try {
        // Récupérer les paramètres de notification depuis les préférences de planning
        const notificationSettings = mergeSettings(
          DEFAULT_EXTENDED_NOTIFICATION_SETTINGS,
          planningPreferences?.notificationSettings
        );

        // Synchroniser avec le service de notification étendu
        await enhancedNotificationService.updateSettings(notificationSettings);

        logger.info(
          "✅ Paramètres de notification synchronisés avec le service"
        );
      } catch (error) {
        logger.error(
          "❌ Erreur lors de la synchronisation des paramètres de notification:",
          error
        );
      }
    };

    // Synchroniser si des préférences sont disponibles
    if (planningPreferences) {
      syncSettings();
    }
  }, [planningPreferences]);

  return {
    isInitialized: !!planningPreferences,
  };
};
