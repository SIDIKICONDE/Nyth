import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { PRESET_THEMES, getDefaultTheme } from "../constants/themes";
import { useCustomThemes } from "../hooks/useCustomThemes";
import { CustomTheme, ThemeContextType } from "../types/theme";
import { androidThemeSync } from "../utils/androidThemeSync";
import { createLogger } from "../utils/optimizedLogger";
import { themeStorage } from "../utils/themeStorage";
import { useAuth } from "./AuthContext";
import { useGlobalPreferencesContext } from "./GlobalPreferencesContext";
import { useSystemTheme } from "../hooks/useSystemTheme";

const logger = createLogger("ThemeContext");

// Re-export types and constants for backward compatibility
export { CustomTheme, ThemeColors } from "../types/theme";

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme Provider Component
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuth();
  const defaultTheme = getDefaultTheme();
  const [currentTheme, setCurrentTheme] = useState<CustomTheme>(defaultTheme);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [isSystemThemeOverridden, setIsSystemThemeOverridden] = useState(false);

  // Hook pour détecter le thème système
  const { systemTheme, isSystemDark } = useSystemTheme();

  // Charger l'état isSystemThemeOverridden depuis le stockage
  useEffect(() => {
    const loadOverrideState = async () => {
      try {
        const saved = await AsyncStorage.getItem("@system_theme_overridden");
        if (saved === "true") {
          setIsSystemThemeOverridden(true);
        }
      } catch (error) {
        logger.debug("❓ Erreur chargement override state:", error);
      }
    };
    loadOverrideState();
  }, []);

  // Utiliser le système global de préférences via le contexte
  const { theme: savedThemeId, updatePreference } =
    useGlobalPreferencesContext();

  // Utiliser notre nouveau hook
  const {
    loading: firestoreLoading,
    error: firestoreError,
    createTheme,
    createSystemTheme,
    updateTheme,
    deleteTheme,
  } = useCustomThemes();

  // Load theme settings on mount and when user changes
  useEffect(() => {
    loadThemeSettings();
  }, [user]);

  // Charger le thème quand savedThemeId change
  useEffect(() => {
    if (savedThemeId && !isLoading) {
      const allThemes = [...PRESET_THEMES, ...customThemes];
      const foundTheme = allThemes.find((theme) => theme.id === savedThemeId);
      if (foundTheme) {
        setCurrentTheme(foundTheme);
        logger.info(
          `✅ Thème chargé depuis les préférences globales: ${savedThemeId}`
        );
      }
    }
  }, [savedThemeId, customThemes, isLoading]);

  // Log des erreurs Firestore
  useEffect(() => {
    if (firestoreError) {
      logger.error("❌ Erreur Firestore:", firestoreError);
    }
  }, [firestoreError]);

  // Suivi automatique du thème système par défaut
  useEffect(() => {
    if (!isLoading && !isSystemThemeOverridden) {
      const allThemes = [...PRESET_THEMES, ...customThemes];

      // Choisir automatiquement selon le système
      const targetThemeId = isSystemDark ? "dark-default" : "light-default";
      const systemBasedTheme = allThemes.find(
        (theme) => theme.id === targetThemeId
      );

      // Seulement changer si c'est différent du thème actuel
      if (systemBasedTheme && systemBasedTheme.id !== currentTheme.id) {
        setCurrentTheme(systemBasedTheme);
        setSelectedThemeId(systemBasedTheme.id);
        logger.info(
          `📱 Thème automatique: ${systemBasedTheme.name} (système ${
            isSystemDark ? "sombre" : "clair"
          })`
        );
      }
    }
  }, [
    systemTheme,
    isLoading,
    isSystemThemeOverridden,
    customThemes,
    isSystemDark,
    currentTheme.id,
  ]);

  const loadThemeSettings = async () => {
    try {
      setIsLoading(true);

      if (user && !user.isGuest) {
        // Utilisateur connecté : synchroniser avec Firestore
        await syncThemesFromCloud();
      } else {
        // Invité : charger depuis AsyncStorage uniquement
        await loadLocalThemes();
      }
    } catch (error) {
      logger.error("Error loading themes:", error);
      setCurrentTheme(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const syncThemesFromCloud = async () => {
    try {
      // 1. Charger les thèmes depuis Firestore
      const cloudThemes = await loadCloudThemes();

      // 2. Charger les thèmes locaux
      const localThemes = await themeStorage.getCustomThemes();

      // 3. Fusionner les thèmes (privilégier cloud si conflit)
      const mergedThemes = mergeThemes(cloudThemes, localThemes);

      // 4. Sauvegarder localement pour cache
      await themeStorage.saveCustomThemes(mergedThemes);
      setCustomThemes(mergedThemes);

      // 5. Synchroniser les thèmes locaux non présents dans le cloud
      for (const localTheme of localThemes) {
        if (!cloudThemes.find((t) => t.id === localTheme.id)) {
          await createTheme(localTheme);
          logger.info(
            `✅ Thème local ${localTheme.name} synchronisé vers le cloud avec timestamps`
          );
        }
      }

      // 6. Charger le thème sélectionné
      await loadSelectedTheme(mergedThemes);
    } catch (error) {
      logger.error("❌ Erreur lors de la synchronisation des thèmes:", error);
      // En cas d'erreur, utiliser les thèmes locaux
      await loadLocalThemes();
    }
  };

  const loadCloudThemes = async (): Promise<CustomTheme[]> => {
    if (!user) return [];

    try {
      const db = getFirestore(getApp());
      const snapshot = await getDocs(
        query(collection(db, "customThemes"), where("userId", "==", user.uid))
      );

      const themes: CustomTheme[] = [];

      snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = doc.data();
        themes.push({
          id: data.id,
          name: data.name,
          isDark: data.isDark || false,
          colors: {
            background: data.backgroundColor,
            text: data.textColor,
            primary: data.primaryColor || data.textColor,
            secondary: data.secondaryColor || data.textColor,
            accent: data.accentColor || data.highlightColor,
            surface: data.surfaceColor || data.backgroundColor,
            card: data.cardColor || data.backgroundColor,
            textSecondary: data.textSecondaryColor || data.textColor,
            textMuted: data.textMutedColor || data.textColor,
            border: data.borderColor || data.textColor,
            success: data.successColor || "#28a745",
            warning: data.warningColor || "#ffc107",
            error: data.errorColor || "#dc3545",
            gradient: data.gradient || [
              data.backgroundColor,
              data.highlightColor,
            ],
          },
        });
      });

      return themes;
    } catch (error) {
      logger.error("❌ Erreur lors du chargement des thèmes cloud:", error);
      return [];
    }
  };

  const loadLocalThemes = async () => {
    const savedCustomThemes = await themeStorage.getCustomThemes();
    setCustomThemes(savedCustomThemes);
    await loadSelectedTheme(savedCustomThemes);
  };

  const loadSelectedTheme = async (availableCustomThemes: CustomTheme[]) => {
    const themeId = savedThemeId || (await themeStorage.getSelectedTheme());

    if (themeId) {
      let resolvedThemeId = themeId;
      if (themeId === "aurora-dark") resolvedThemeId = "dark-default";
      if (themeId === "energy") resolvedThemeId = "light-default";
      if (resolvedThemeId !== themeId) {
        setSelectedThemeId(resolvedThemeId);
        await updatePreference("theme", resolvedThemeId);
      }
      // Handle legacy purple galaxy theme
      if (themeId === "purple-galaxy") {
        logger.info("🔄 Replacing Purple Galaxy theme with Aurora Dark");
        setCurrentTheme(defaultTheme);
        setSelectedThemeId(defaultTheme.id);
        await updatePreference("theme", defaultTheme.id);
        return;
      }

      setSelectedThemeId(resolvedThemeId);

      // Find theme in presets and custom themes
      const allThemes = [...PRESET_THEMES, ...availableCustomThemes];
      const foundTheme = allThemes.find(
        (theme) => theme.id === resolvedThemeId
      );

      if (foundTheme) {
        // Si c'est le thème automatique, la logique sera gérée par l'useEffect
        if (resolvedThemeId === "system-auto") {
          // Appliquer immédiatement le thème selon le système
          const targetThemeId = isSystemDark ? "dark-default" : "light-default";
          const systemBasedTheme = allThemes.find(
            (theme) => theme.id === targetThemeId
          );

          if (systemBasedTheme) {
            const hybridTheme: CustomTheme = {
              ...systemBasedTheme,
              id: "system-auto",
              name: foundTheme.name,
              isSystemTheme: true,
              isDark: isSystemDark,
            };
            setCurrentTheme(hybridTheme);
            logger.info(
              `🔄 Thème automatique initialisé: ${
                isSystemDark ? "sombre" : "clair"
              }`
            );
          }
        } else {
          setCurrentTheme(foundTheme);
        }
      } else {
        // Theme not found, use default
        logger.warn("⚠️ Thème introuvable, utilisation du thème par défaut");
        setCurrentTheme(defaultTheme);
        setSelectedThemeId(defaultTheme.id);
        await updatePreference("theme", defaultTheme.id);
      }
    } else {
      // No saved theme, initialize with default
      logger.info("🌌 Initialisation avec le thème par défaut");
      setCurrentTheme(defaultTheme);
      setSelectedThemeId(defaultTheme.id);
      await updatePreference("theme", defaultTheme.id);
    }
  };

  const mergeThemes = (
    cloudThemes: CustomTheme[],
    localThemes: CustomTheme[]
  ): CustomTheme[] => {
    const merged = [...cloudThemes];

    // Ajouter les thèmes locaux qui ne sont pas dans le cloud
    for (const localTheme of localThemes) {
      if (!cloudThemes.find((t) => t.id === localTheme.id)) {
        merged.push(localTheme);
      }
    }

    return merged;
  };

  const setTheme = async (theme: CustomTheme) => {
    setCurrentTheme(theme);
    setSelectedThemeId(theme.id);

    // Marquer que l'utilisateur a fait un choix manuel (désactive le suivi automatique)
    setIsSystemThemeOverridden(true);

    try {
      // Synchroniser avec Android
      androidThemeSync.syncTheme(theme);

      // Utiliser le système global de préférences
      await updatePreference("theme", theme.id);

      // Sauvegarder l'état override pour la persistance
      await AsyncStorage.setItem("@system_theme_overridden", "true");

      logger.info(
        `✅ Thème ${theme.id} choisi manuellement (suivi automatique désactivé)`
      );
    } catch (error) {
      logger.error("Error saving theme:", error);
    }
  };

  const toggleDarkMode = () => {
    const targetThemeId = currentTheme.isDark
      ? "light-default"
      : "dark-default";
    const newTheme =
      PRESET_THEMES.find((t: CustomTheme) => t.id === targetThemeId) ||
      defaultTheme;
    setTheme(newTheme);
  };

  const addCustomTheme = async (theme: CustomTheme) => {
    logger.info("📝 Adding custom theme:", theme.name);
    const updatedCustomThemes = [...customThemes, theme];
    setCustomThemes(updatedCustomThemes);

    try {
      // Sauvegarder localement
      await themeStorage.saveCustomThemes(updatedCustomThemes);

      // Synchroniser avec le cloud si connecté (avec timestamps automatiques)
      if (user && !user.isGuest) {
        const success = await createTheme(theme);
        if (success) {
          logger.info("☁️ Theme synchronized to cloud with timestamps");
        } else {
          logger.error("❌ Failed to sync theme to cloud");
        }
      }

      logger.info("💾 Theme saved successfully");
    } catch (error) {
      logger.error("❌ Error saving custom theme:", error);
    }
  };

  const deleteCustomTheme = async (themeId: string) => {
    const updatedCustomThemes = customThemes.filter((t) => t.id !== themeId);
    setCustomThemes(updatedCustomThemes);

    // If deleted theme was current, switch to default
    if (currentTheme.id === themeId) {
      setTheme(defaultTheme);
    }

    try {
      // Supprimer localement
      await themeStorage.saveCustomThemes(updatedCustomThemes);

      // Supprimer du cloud si connecté (avec gestion readOnly)
      if (user && !user.isGuest) {
        const success = await deleteTheme(themeId);
        if (success) {
          logger.info("☁️ Theme deleted from cloud");
        } else {
          logger.warn("⚠️ Could not delete theme (might be readOnly)");
        }
      }
    } catch (error) {
      logger.error("Error deleting custom theme:", error);
    }
  };

  const resetToDefaultTheme = async () => {
    setCurrentTheme(defaultTheme);
    setSelectedThemeId(defaultTheme.id);

    // Réactiver le suivi automatique du système
    setIsSystemThemeOverridden(false);

    // Filtrer les thèmes non-readOnly pour la suppression
    const deletableThemes = customThemes.filter((theme) => !theme.isOfficial);
    setCustomThemes(customThemes.filter((theme) => theme.isOfficial));

    try {
      // Réinitialiser dans les préférences globales
      await updatePreference("theme", defaultTheme.id);
      await themeStorage.clearThemeData();

      // Réinitialiser l'état override pour réactiver le suivi automatique
      await AsyncStorage.removeItem("@system_theme_overridden");

      // Supprimer uniquement les thèmes non-readOnly du cloud
      if (user && !user.isGuest) {
        for (const theme of deletableThemes) {
          await deleteTheme(theme.id);
        }
        logger.info(
          "☁️ User themes deleted from cloud (system themes preserved)"
        );
      }

      logger.info("🌌 Theme reset - suivi automatique du système réactivé");
    } catch (error) {
      logger.error("Error resetting theme:", error);
    }
  };

  // Fonction pour créer les thèmes système au premier lancement
  const initializeSystemThemes = async () => {
    if (!user || user.isGuest) return;

    const darkPreset =
      PRESET_THEMES.find((t) => t.id === "dark-default") ||
      PRESET_THEMES.find((t) => t.isDark) ||
      PRESET_THEMES[0];
    const lightPreset =
      PRESET_THEMES.find((t) => t.id === "light-default") ||
      PRESET_THEMES.find((t) => !t.isDark) ||
      PRESET_THEMES[0];

    const systemThemes = [
      {
        id: "system_aurora_dark",
        name: "Aurora Dark (Système)",
        isDark: true,
        isOfficial: true,
        colors: darkPreset.colors,
      },
      {
        id: "system_aurora_light",
        name: "Aurora Light (Système)",
        isDark: false,
        isOfficial: true,
        colors: lightPreset.colors,
      },
    ];

    for (const theme of systemThemes) {
      try {
        await createSystemTheme(theme as CustomTheme, theme.id);
        logger.info(
          `✅ Thème système ${theme.name} créé avec protection readOnly`
        );
      } catch (error) {
        // Le thème existe peut-être déjà
        logger.debug(`Thème système ${theme.name} déjà existant`);
      }
    }
  };

  const contextValue: ThemeContextType = {
    currentTheme,
    setTheme,
    toggleDarkMode,
    customThemes,
    addCustomTheme,
    deleteCustomTheme,
    resetToDefaultTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
