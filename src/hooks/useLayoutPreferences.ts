import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "layout_preferences";

export interface LayoutPreferences {
  // Marges et espacement
  cardMargins: {
    horizontal: number; // Marge horizontale des cartes (8-32px)
    vertical: number; // Marge verticale des cartes (8-24px)
    between: number; // Espacement entre cartes (4-16px)
  };

  // Espacement des colonnes
  columnSpacing: {
    horizontal: number; // Espacement horizontal entre colonnes (8-24px)
    padding: number; // Padding intérieur des colonnes (8-20px)
  };

  // Tailles des cartes
  cardSizing: {
    minWidth: number; // Largeur minimale des colonnes (240-320px)
    borderRadius: number; // Arrondi des cartes (4-16px)
    compactMode: boolean; // Mode compact pour plus de cartes
  };

  // Préférences d'affichage
  display: {
    showShadows: boolean; // Ombres des cartes
    animationsEnabled: boolean; // Animations de transition
    denseLayout: boolean; // Layout dense
  };
}

const DEFAULT_PREFERENCES: LayoutPreferences = {
  cardMargins: {
    horizontal: 16, // Marge par défaut
    vertical: 12,
    between: 8,
  },
  columnSpacing: {
    horizontal: 16,
    padding: 12,
  },
  cardSizing: {
    minWidth: 280,
    borderRadius: 12,
    compactMode: false,
  },
  display: {
    showShadows: true,
    animationsEnabled: true,
    denseLayout: false,
  },
};

export const useLayoutPreferencesLogic = () => {
  const [preferences, setPreferences] =
    useState<LayoutPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences
  const loadPreferences = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LayoutPreferences;
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed,
          cardMargins: {
            ...DEFAULT_PREFERENCES.cardMargins,
            ...parsed.cardMargins,
          },
          columnSpacing: {
            ...DEFAULT_PREFERENCES.columnSpacing,
            ...parsed.columnSpacing,
          },
          cardSizing: {
            ...DEFAULT_PREFERENCES.cardSizing,
            ...parsed.cardSizing,
          },
          display: {
            ...DEFAULT_PREFERENCES.display,
            ...parsed.display,
          },
        });
      }
    } catch (error) {} finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder les préférences
  const savePreferences = useCallback(
    async (newPreferences: LayoutPreferences) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
        setPreferences(newPreferences);
      } catch (error) {}
    },
    []
  );

  // Mettre à jour les marges des cartes
  const updateCardMargins = useCallback(
    (margins: Partial<LayoutPreferences["cardMargins"]>) => {
      const newPreferences = {
        ...preferences,
        cardMargins: {
          ...preferences.cardMargins,
          ...margins,
        },
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  // Mettre à jour l'espacement des colonnes
  const updateColumnSpacing = useCallback(
    (spacing: Partial<LayoutPreferences["columnSpacing"]>) => {
      const newPreferences = {
        ...preferences,
        columnSpacing: {
          ...preferences.columnSpacing,
          ...spacing,
        },
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  // Mettre à jour les tailles des cartes
  const updateCardSizing = useCallback(
    (sizing: Partial<LayoutPreferences["cardSizing"]>) => {
      const newPreferences = {
        ...preferences,
        cardSizing: {
          ...preferences.cardSizing,
          ...sizing,
        },
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  // Mettre à jour les préférences d'affichage
  const updateDisplayPreferences = useCallback(
    (display: Partial<LayoutPreferences["display"]>) => {
      const newPreferences = {
        ...preferences,
        display: {
          ...preferences.display,
          ...display,
        },
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  // Présets prédéfinis
  const applyPreset = useCallback(
    (preset: "compact" | "comfortable" | "spacious") => {
      let newPreferences: LayoutPreferences;

      switch (preset) {
        case "compact":
          newPreferences = {
            ...preferences,
            cardMargins: { horizontal: 4, vertical: 4, between: 2 },
            columnSpacing: { horizontal: 4, padding: 4 },
            cardSizing: {
              ...preferences.cardSizing,
              minWidth: 220,
              borderRadius: 6,
              compactMode: true,
            },
            display: { ...preferences.display, denseLayout: true },
          };
          break;

        case "comfortable":
          newPreferences = {
            ...preferences,
            cardMargins: { horizontal: 16, vertical: 12, between: 8 },
            columnSpacing: { horizontal: 16, padding: 12 },
            cardSizing: {
              ...preferences.cardSizing,
              minWidth: 280,
              borderRadius: 12,
              compactMode: false,
            },
            display: { ...preferences.display, denseLayout: false },
          };
          break;

        case "spacious":
          newPreferences = {
            ...preferences,
            cardMargins: { horizontal: 24, vertical: 16, between: 12 },
            columnSpacing: { horizontal: 24, padding: 16 },
            cardSizing: {
              ...preferences.cardSizing,
              minWidth: 320,
              borderRadius: 16,
              compactMode: false,
            },
            display: { ...preferences.display, denseLayout: false },
          };
          break;

        default:
          return;
      }

      savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Obtenir les styles calculés pour les composants
  const getKanbanStyles = useCallback(() => {
    const denseFactor = preferences.display.denseLayout ? 0.6 : 1;

    const paddingHorizontal = Math.max(
      4,
      Math.round(preferences.cardMargins.horizontal * denseFactor)
    );
    const paddingVertical = Math.max(
      4,
      Math.round(preferences.cardMargins.vertical * denseFactor)
    );
    const gapBetweenColumns = Math.max(
      4,
      Math.round(preferences.columnSpacing.horizontal * denseFactor)
    );
    const columnPadding = Math.max(
      4,
      Math.round(preferences.columnSpacing.padding * denseFactor)
    );
    const cardGap = Math.max(
      2,
      Math.round(preferences.cardMargins.between * denseFactor)
    );

    const animationsEnabled = preferences.display.animationsEnabled;
    const showShadows = preferences.display.showShadows;

    const styles = {
      scrollContent: {
        paddingHorizontal,
        paddingVertical,
        gap: gapBetweenColumns,
      },
      column: {
        width: preferences.cardSizing.minWidth,
        borderRadius: preferences.cardSizing.borderRadius,
        padding: columnPadding,
        shadowOpacity: showShadows ? 0.1 : 0,
        elevation: showShadows ? 2 : 0,
      },
      card: {
        marginBottom: cardGap,
        borderRadius: preferences.cardSizing.borderRadius,
        shadowOpacity: showShadows ? 0.1 : 0,
        elevation: showShadows ? 2 : 0,
        ...(animationsEnabled
          ? {}
          : {
              transform: [{ scale: 1 }],
              opacity: 1,
            }),
      },
    } as const;

    return styles;
  }, [preferences]);

  // Charger au montage
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,

    // Actions de mise à jour
    updateCardMargins,
    updateColumnSpacing,
    updateCardSizing,
    updateDisplayPreferences,

    // Présets
    applyPreset,
    resetToDefaults,

    // Styles calculés
    getKanbanStyles,

    // Rechargement
    reload: loadPreferences,
  };
};
