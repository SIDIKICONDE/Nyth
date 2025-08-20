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
      // Toujours prioriser la langue du système
      const deviceLanguage = getDeviceLanguage();

      // Seulement utiliser la langue sauvée si l'utilisateur l'a explicitement choisie
      const savedLanguage = await AsyncStorage.getItem("userLanguage");
      const hasUserSelection = await AsyncStorage.getItem(
        "userLanguageSelection"
      );

      // Si l'utilisateur a fait un choix explicite, l'utiliser
      if (savedLanguage && hasUserSelection === "true") {
        callback(savedLanguage);
        return;
      }

      // Sinon, toujours utiliser la langue du système
      callback(deviceLanguage);
    } catch (error) {
      // En cas d'erreur, utiliser la langue du système par défaut
      callback(getDeviceLanguage());
    }
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem("userLanguage", lng);
      await AsyncStorage.setItem("userLanguageSelection", "true");
    } catch (error) {}
  },
};
