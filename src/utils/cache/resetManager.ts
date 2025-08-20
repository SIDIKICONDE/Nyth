import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import RNFS from "react-native-fs";
import { Platform } from "react-native";
import { useTranslation } from "../../hooks/useTranslation";
import { clearAllCache } from "./cacheOperations";
import { cleanAllDirectories } from "./directoryManager";

// Déclaration du type global pour éviter les erreurs TypeScript
declare const global: any;

// Fonction pour obtenir l'instance de traduction
let translationInstance: ReturnType<typeof useTranslation>["t"] | null = null;

export const setTranslationInstance = (
  t: ReturnType<typeof useTranslation>["t"]
) => {
  translationInstance = t;
};

const t = (key: string, params?: any) => {
  if (translationInstance) {
    return translationInstance(key, params);
  }
  // Fallback si pas d'instance de traduction
  return key;
};

/**
 * Réinitialise complètement l'application à son état initial
 * @returns {Promise<void>}
 */
export const resetApplication = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    await clearAllCache();
    await cleanAllDirectories();

    // 4. Réinitialiser les paramètres système
    if (Platform.OS === "ios") {
      try {
        // Sur iOS, nettoyer tous les dossiers possibles
        const systemDirs = [
          `${RNFS.DocumentDirectoryPath}../Library/Preferences/`,
          `${RNFS.DocumentDirectoryPath}../Library/Application Support/`,
          `${RNFS.DocumentDirectoryPath}../tmp/`,
        ];

        // Obtenir l'ID de l'application
        const applicationId = await DeviceInfo.getBundleId();

        for (const dir of systemDirs) {
          try {
            const files = await RNFS.readDir(dir);
            for (const file of files) {
              try {
                if (file.name.includes(applicationId || "")) {
                  const filePath = `${dir}${file.name}`;
                  await RNFS.unlink(filePath);
                }
              } catch (error) {}
            }
          } catch (error) {}
        }
      } catch (error) {}
    }

    // Force la fermeture des services ouverts (important)
    try {
      // Vider tout autre cache mémoire
      if (typeof global !== "undefined" && global.gc) {
        global.gc();
      }
    } catch (error) {}

    return;
  } catch (error) {
    throw new Error(
      String(
        Platform.OS === "ios"
          ? t("cacheManager.errors.iosResetError")
          : t("cacheManager.errors.androidResetError")
      )
    );
  }
};

/**
 * Réinitialise seulement les paramètres et préférences de l'application
 * Préserve les scripts et vidéos enregistrées
 * @returns {Promise<void>}
 */
export const resetApplicationSettings = async (): Promise<void> => {
  try {
    // Listes des clés à préserver (scripts et vidéos)
    const keysToPreserve = [
      "scripts",
      "recordings",
      "userProfile",
      "customThemes",
      "userPreferences",
    ];

    // Récupérer les données à préserver
    const preservedData: { [key: string]: string | null } = {};
    for (const key of keysToPreserve) {
      try {
        preservedData[key] = await AsyncStorage.getItem(key);
      } catch (error) {}
    }

    await AsyncStorage.clear();
    for (const [key, value] of Object.entries(preservedData)) {
      if (value !== null) {
        try {
          await AsyncStorage.setItem(key, value);
        } catch (error) {}
      }
    }
    await clearTempCache();

    // 4. Réinitialiser les paramètres d'onboarding seulement
    await AsyncStorage.multiSet([
      ["hasAcceptedPrivacy", "false"],
      ["hasCompletedOnboarding", "false"],
      ["permissionsRequested", "false"],
      ["permissionsStatus", "pending"],
      ["recordingSettings", "{}"],
      ["themePreferences", "{}"],
      ["aiSettings", "{}"],
      ["autoSaveConfig", "{}"],
    ]);

    return;
  } catch (error) {
    throw new Error(
      String(
        Platform.OS === "ios"
          ? t("cacheManager.errors.iosSettingsResetError")
          : t("cacheManager.errors.androidSettingsResetError")
      )
    );
  }
};

/**
 * Nettoie seulement les caches temporaires
 */
const clearTempCache = async (): Promise<void> => {
  try {
    // Nettoyer seulement les dossiers de cache temporaire
    const tempDirs = [
      `${RNFS.CachesDirectoryPath}`,
      `${RNFS.DocumentDirectoryPath}cache/`,
      `${RNFS.DocumentDirectoryPath}tmp/`,
    ];

    for (const dir of tempDirs) {
      try {
        const dirInfo = await RNFS.stat(dir);
        if (dirInfo.isDirectory()) {
          const files = await RNFS.readDir(dir);
          for (const file of files) {
            // Ne pas supprimer les dossiers de vidéos
            if (!file.name.includes("videos") && !file.name.includes("recordings")) {
              try {
                await RNFS.unlink(`${dir}${file.name}`);
              } catch (error) {}
            }
          }
        }
      } catch (error) {}
    }
  } catch (error) {}
};
