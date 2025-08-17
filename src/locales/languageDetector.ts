import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceLanguage, getDeviceLocales } from "../utils/languageDetector";

/**
 * Détecteur de langue personnalisé pour i18next
 * Gère la détection automatique et la sauvegarde des préférences utilisateur
 */
export const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  init: () => {},
  detect: async (callback: (lng: string) => void) => {
    try {
      const deviceLanguage = getDeviceLanguage();

      const savedLanguage = await AsyncStorage.getItem("userLanguage");
      const hasUserSelection = await AsyncStorage.getItem(
        "userLanguageSelection"
      );

      if (savedLanguage && hasUserSelection === "true") {
        callback(savedLanguage);
        return;
      }

      const localeInfo = getDeviceLocales();
      if (localeInfo) {}

      callback(deviceLanguage);
    } catch (error) {
      callback("en");
    }
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem("userLanguage", lng);
      await AsyncStorage.setItem("userLanguageSelection", "true");
    } catch (error) {}
  },
};
