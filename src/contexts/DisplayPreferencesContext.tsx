import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('DisplayPreferencesContext');

export type ScriptDisplayStyle = "list" | "library" | "stack";

interface DisplayPreferences {
  scriptDisplayStyle: ScriptDisplayStyle;
  showLibraryHeader: boolean;
}

interface DisplayPreferencesContextType {
  preferences: DisplayPreferences;
  isLoaded: boolean;
  updateScriptDisplayStyle: (style: ScriptDisplayStyle) => Promise<void>;
  updateShowLibraryHeader: (show: boolean) => Promise<void>;
}

const DISPLAY_PREFERENCES_KEY = "@display_preferences";
const MIGRATION_KEY = "@display_preferences_migrated";

const DEFAULT_PREFERENCES: DisplayPreferences = {
  scriptDisplayStyle: "library",
  showLibraryHeader: true,
};

const DisplayPreferencesContext = createContext<
  DisplayPreferencesContextType | undefined
>(undefined);

export const DisplayPreferencesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [preferences, setPreferences] =
    useState<DisplayPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les préférences depuis le stockage
  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(DISPLAY_PREFERENCES_KEY);
      const migrated = await AsyncStorage.getItem(MIGRATION_KEY);

      logger.debug("📚 [Context] Préférences stockées:", stored);
      logger.debug("📚 [Context] Migration effectuée:", migrated);

      if (stored) {
        const parsed = JSON.parse(stored);
        logger.debug("📚 [Context] Préférences parsées:", parsed);

        // Migration: si l'utilisateur avait "stack" et n'a jamais été migré, passer à "library"
        if (!migrated && parsed.scriptDisplayStyle === "stack") {
          logger.debug("📚 [Context] Migration: stack → library");
          const migratedPreferences = {
            ...DEFAULT_PREFERENCES,
            ...parsed,
            scriptDisplayStyle: "library",
          };
          setPreferences(migratedPreferences);
          // Sauvegarder les nouvelles préférences et marquer comme migré
          await AsyncStorage.setItem(
            DISPLAY_PREFERENCES_KEY,
            JSON.stringify(migratedPreferences)
          );
          await AsyncStorage.setItem(MIGRATION_KEY, "true");
        } else {
          // Utiliser les préférences existantes
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        }
      } else {
        logger.debug(
          "📚 [Context] Aucune préférence stockée, utilisation des défauts:",
          DEFAULT_PREFERENCES
        );
        // Marquer comme migré pour les nouveaux utilisateurs
        await AsyncStorage.setItem(MIGRATION_KEY, "true");
      }
    } catch (error) {
      logger.error(
        "Erreur lors du chargement des préférences d'affichage:",
        error
      );
    } finally {
      setIsLoaded(true);
    }
  };

  // Sauvegarder les préférences
  const savePreferences = async (newPreferences: DisplayPreferences) => {
    try {
      logger.debug("📚 [Context] savePreferences - Début avec:", newPreferences);
      // Mettre à jour l'état immédiatement pour une réactivité instantanée
      setPreferences(newPreferences);
      logger.debug("📚 [Context] savePreferences - État mis à jour");
      // Puis sauvegarder en arrière-plan
      await AsyncStorage.setItem(
        DISPLAY_PREFERENCES_KEY,
        JSON.stringify(newPreferences)
      );
      logger.debug(
        "📚 [Context] Préférences sauvegardées dans AsyncStorage:",
        newPreferences
      );
    } catch (error) {
      logger.error(
        "Erreur lors de la sauvegarde des préférences d'affichage:",
        error
      );
    }
  };

  // Mettre à jour le style d'affichage des scripts
  const updateScriptDisplayStyle = async (style: ScriptDisplayStyle) => {
    logger.debug("📚 [Context] Mise à jour du style d'affichage:", style);
    const newPreferences = { ...preferences, scriptDisplayStyle: style };
    logger.debug("📚 [Context] Nouvelles préférences:", newPreferences);
    await savePreferences(newPreferences);
  };

  // Mettre à jour l'affichage de l'en-tête de la bibliothèque
  const updateShowLibraryHeader = async (show: boolean) => {
    logger.debug("📚 [Context] Mise à jour de l'affichage de l'en-tête:", show);
    const newPreferences = { ...preferences, showLibraryHeader: show };
    await savePreferences(newPreferences);
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    logger.debug("📚 [Context] Préférences mises à jour:", preferences);
    logger.debug("📚 [Context] Style actuel:", preferences.scriptDisplayStyle);
    logger.debug("📚 [Context] Chargé:", isLoaded);
  }, [preferences, isLoaded]);

  return (
    <DisplayPreferencesContext.Provider
      value={{
        preferences,
        isLoaded,
        updateScriptDisplayStyle,
        updateShowLibraryHeader,
      }}
    >
      {children}
    </DisplayPreferencesContext.Provider>
  );
};

export const useDisplayPreferences = () => {
  const context = useContext(DisplayPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useDisplayPreferences must be used within a DisplayPreferencesProvider"
    );
  }

  return {
    ...context,
    scriptDisplayStyle: context.preferences.scriptDisplayStyle,
    showLibraryHeader: context.preferences.showLibraryHeader,
  };
};
