import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileDesignType, ProfileDisplayPreferences } from "../types/user";

// Constantes pour le stockage local
const PROFILE_PREFERENCES_KEY = "@profile_display_preferences";

// Préférences par défaut
const DEFAULT_PREFERENCES: ProfileDisplayPreferences = {
  showAnalytics: true,
  showAchievements: true,
  profileDesign: "classic",
};

export const useProfilePreferencesSync = () => {
  const [preferences, setPreferences] =
    useState<ProfileDisplayPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences depuis le stockage local
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);

      // Charger depuis AsyncStorage
      const localPrefsString = await AsyncStorage.getItem(
        PROFILE_PREFERENCES_KEY
      );

      if (localPrefsString) {
        const localPreferences = JSON.parse(localPrefsString);

        // Toujours forcer le design classique
        const updatedPreferences = {
          ...DEFAULT_PREFERENCES,
          ...localPreferences,
          profileDesign: "classic" as ProfileDesignType,
        };

        setPreferences(updatedPreferences);

        // Sauvegarder les préférences mises à jour
        await AsyncStorage.setItem(
          PROFILE_PREFERENCES_KEY,
          JSON.stringify(updatedPreferences)
        );
      } else {
        // Utiliser les préférences par défaut
        setPreferences(DEFAULT_PREFERENCES);
        await AsyncStorage.setItem(
          PROFILE_PREFERENCES_KEY,
          JSON.stringify(DEFAULT_PREFERENCES)
        );
      }
    } catch (error) {
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour une préférence d'affichage
  const updateDisplayPreference = async (
    key: keyof Omit<ProfileDisplayPreferences, "profileDesign">,
    value: boolean
  ) => {
    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      await AsyncStorage.setItem(
        PROFILE_PREFERENCES_KEY,
        JSON.stringify(newPreferences)
      );
    } catch (error) {}
  };

  // Le design est toujours classique maintenant
  const updateDesign = async (design: ProfileDesignType) => {};

  return {
    preferences,
    isLoading,
    updateDisplayPreference,
    updateDesign,
    loadPreferences,
  };
};
