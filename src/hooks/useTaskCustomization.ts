import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { TaskCustomization } from "../types/planning";

const STORAGE_KEY = "task_customization_preferences";

interface TaskCustomizationPreferences {
  defaultCustomization: TaskCustomization;
  categoryCustomizations: Record<string, TaskCustomization>;
  userPreferences: {
    autoApplyToNewTasks: boolean;
    showCustomizationTips: boolean;
    enableAnimations: boolean;
  };
}

const DEFAULT_PREFERENCES: TaskCustomizationPreferences = {
  defaultCustomization: {
    cardColor: "#3B82F6",
    cardIcon: "💼",
    cardStyle: "default",
    showEstimatedTime: true,
    showProgress: true,
    showAttachments: false,
    showSubtasks: false,
  },
  categoryCustomizations: {},
  userPreferences: {
    autoApplyToNewTasks: true,
    showCustomizationTips: true,
    enableAnimations: true,
  },
};

export const useTaskCustomization = () => {
  const [preferences, setPreferences] =
    useState<TaskCustomizationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences depuis le stockage
  const loadPreferences = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TaskCustomizationPreferences;
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed,
          defaultCustomization: {
            ...DEFAULT_PREFERENCES.defaultCustomization,
            ...parsed.defaultCustomization,
          },
          userPreferences: {
            ...DEFAULT_PREFERENCES.userPreferences,
            ...parsed.userPreferences,
          },
        });
      }
    } catch (error) {} finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder les préférences
  const savePreferences = useCallback(
    async (newPreferences: TaskCustomizationPreferences) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
        setPreferences(newPreferences);
      } catch (error) {}
    },
    []
  );

  // Mettre à jour la personnalisation par défaut
  const updateDefaultCustomization = useCallback(
    (customization: Partial<TaskCustomization>) => {
      const newPreferences = {
        ...preferences,
        defaultCustomization: {
          ...preferences.defaultCustomization,
          ...customization,
        },
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  // Mettre à jour la personnalisation pour une catégorie
  const updateCategoryCustomization = useCallback(
    (category: string, customization: TaskCustomization) => {
      const newPreferences = {
        ...preferences,
        categoryCustomizations: {
          ...preferences.categoryCustomizations,
          [category]: customization,
        },
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  // Supprimer la personnalisation d'une catégorie
  const removeCategoryCustomization = useCallback(
    (category: string) => {
      const { [category]: removed, ...rest } =
        preferences.categoryCustomizations;
      const newPreferences = {
        ...preferences,
        categoryCustomizations: rest,
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  // Obtenir la personnalisation pour une tâche
  const getTaskCustomization = useCallback(
    (category?: string): TaskCustomization => {
      if (category && preferences.categoryCustomizations[category]) {
        return {
          ...preferences.defaultCustomization,
          ...preferences.categoryCustomizations[category],
        };
      }
      return preferences.defaultCustomization;
    },
    [preferences]
  );

  // Mettre à jour les préférences utilisateur
  const updateUserPreferences = useCallback(
    (userPrefs: Partial<typeof preferences.userPreferences>) => {
      const newPreferences = {
        ...preferences,
        userPreferences: {
          ...preferences.userPreferences,
          ...userPrefs,
        },
      };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Exporter les préférences
  const exportPreferences = useCallback(async (): Promise<string> => {
    return JSON.stringify(preferences, null, 2);
  }, [preferences]);

  // Importer les préférences
  const importPreferences = useCallback(
    async (data: string) => {
      try {
        const parsed = JSON.parse(data) as TaskCustomizationPreferences;
        await savePreferences(parsed);
        return true;
      } catch (error) {
        return false;
      }
    },
    [savePreferences]
  );

  // Obtenir des suggestions de couleurs basées sur la catégorie
  const getSuggestedColors = useCallback((category?: string): string[] => {
    const colorSuggestions: Record<string, string[]> = {
      work: ["#3B82F6", "#1E40AF", "#1D4ED8"],
      personal: ["#10B981", "#059669", "#047857"],
      urgent: ["#EF4444", "#DC2626", "#B91C1C"],
      creative: ["#8B5CF6", "#7C3AED", "#6D28D9"],
      health: ["#F59E0B", "#D97706", "#B45309"],
      learning: ["#06B6D4", "#0891B2", "#0E7490"],
    };

    if (category && colorSuggestions[category.toLowerCase()]) {
      return colorSuggestions[category.toLowerCase()];
    }

    return ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"];
  }, []);

  // Obtenir des suggestions d'icônes basées sur la catégorie
  const getSuggestedIcons = useCallback((category?: string): string[] => {
    const iconSuggestions: Record<string, string[]> = {
      work: ["💼", "📊", "💻", "📋", "🎯"],
      personal: ["🏠", "❤️", "🌟", "🎨", "📱"],
      urgent: ["🚨", "⚡", "🔥", "⏰", "🚀"],
      creative: ["🎨", "🎭", "🎪", "🌈", "✨"],
      health: ["💪", "🏃", "🧘", "🍎", "⚕️"],
      learning: ["📚", "🎓", "🧠", "💡", "📖"],
    };

    if (category && iconSuggestions[category.toLowerCase()]) {
      return iconSuggestions[category.toLowerCase()];
    }

    return ["💼", "📋", "🎯", "⚡", "🔥", "💡", "🚀", "⭐", "🎨", "🔧"];
  }, []);

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,

    // Actions de base
    updateDefaultCustomization,
    updateCategoryCustomization,
    removeCategoryCustomization,
    updateUserPreferences,

    // Utilitaires
    getTaskCustomization,
    getSuggestedColors,
    getSuggestedIcons,

    // Import/Export
    exportPreferences,
    importPreferences,
    resetToDefaults,

    // Rechargement
    reload: loadPreferences,
  };
};
