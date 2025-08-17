import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "./optimizedLogger";

const logger = createLogger("ForceEnableMedia");

/**
 * Force l'activation du micro et de la caméra dans tous les paramètres sauvegardés
 */
export const forceEnableMediaSettings = async (): Promise<void> => {
  try {
    logger.info("🎤📹 Forçage de l'activation du micro et de la caméra...");

    // 1. Paramètres d'enregistrement
    const recordingSettingsKey = "recordingSettings";
    const recordingSettings = await AsyncStorage.getItem(recordingSettingsKey);

    if (recordingSettings) {
      const parsed = JSON.parse(recordingSettings);
      const updated = {
        ...parsed,
        isMicEnabled: true,
        isVideoEnabled: true,
        audioEnabled: true,
        videoEnabled: true,
      };

      await AsyncStorage.setItem(recordingSettingsKey, JSON.stringify(updated));
      logger.info("✅ Paramètres d'enregistrement mis à jour");
    }

    // 2. Paramètres globaux (si différents)
    const globalSettingsKey = "@global_recording_settings";
    const globalSettings = await AsyncStorage.getItem(globalSettingsKey);

    if (globalSettings) {
      const parsed = JSON.parse(globalSettings);
      const updated = {
        ...parsed,
        isMicEnabled: true,
        isVideoEnabled: true,
        audioEnabled: true,
        videoEnabled: true,
      };

      await AsyncStorage.setItem(globalSettingsKey, JSON.stringify(updated));
      logger.info("✅ Paramètres globaux mis à jour");
    }

    // 3. Vérifier aussi les clés utilisateur spécifiques
    const allKeys = await AsyncStorage.getAllKeys();
    const userSettingsKeys = allKeys.filter(
      (key) =>
        key.includes("recording_settings") || key.includes("recordingSettings")
    );

    for (const key of userSettingsKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          const updated = {
            ...parsed,
            isMicEnabled: true,
            isVideoEnabled: true,
            audioEnabled: true,
            videoEnabled: true,
          };

          await AsyncStorage.setItem(key, JSON.stringify(updated));
          logger.info(`✅ Paramètres utilisateur ${key} mis à jour`);
        }
      } catch (error) {
        logger.error(`❌ Erreur mise à jour ${key}:`, error);
      }
    }

    logger.info("✅ Activation forcée du micro et de la caméra terminée");
  } catch (error) {
    logger.error("❌ Erreur lors du forçage des paramètres média:", error);
    throw error;
  }
};

/**
 * Vérifie si les paramètres média sont activés
 */
export const checkMediaSettings = async (): Promise<{
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
}> => {
  try {
    const recordingSettings = await AsyncStorage.getItem("recordingSettings");

    if (recordingSettings) {
      const parsed = JSON.parse(recordingSettings);
      return {
        isMicEnabled:
          parsed.isMicEnabled !== false && parsed.audioEnabled !== false,
        isVideoEnabled:
          parsed.isVideoEnabled !== false && parsed.videoEnabled !== false,
      };
    }

    // Par défaut, tout est activé
    return {
      isMicEnabled: true,
      isVideoEnabled: true,
    };
  } catch (error) {
    logger.error("❌ Erreur vérification paramètres média:", error);
    // En cas d'erreur, on retourne true par défaut
    return {
      isMicEnabled: true,
      isVideoEnabled: true,
    };
  }
};
