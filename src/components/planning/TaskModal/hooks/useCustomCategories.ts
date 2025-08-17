import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  isCustom: true;
}

const STORAGE_KEY = "custom_task_categories";

export const useCustomCategories = () => {
  const { user } = useAuth();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Charger les catégories personnalisées au montage
  useEffect(() => {
    loadCustomCategories();
  }, [user?.uid]);

  const loadCustomCategories = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      const storageKey = `${STORAGE_KEY}_${user.uid}`;
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const categories = JSON.parse(stored) as CustomCategory[];
        setCustomCategories(categories);
      }
    } catch (error) {} finally {
      setLoading(false);
    }
  };

  const saveCustomCategories = async (categories: CustomCategory[]) => {
    if (!user?.uid) return;

    try {
      const storageKey = `${STORAGE_KEY}_${user.uid}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(categories));
      setCustomCategories(categories);
    } catch (error) {
      throw error;
    }
  };

  const addCustomCategory = useCallback(
    async (name: string, icon: string = "📁", description: string = "") => {
      const newCategory: CustomCategory = {
        id: `custom_${Date.now()}`,
        name: name.trim(),
        icon,
        description: description.trim(),
        isCustom: true,
      };

      const updatedCategories = [...customCategories, newCategory];
      await saveCustomCategories(updatedCategories);
      return newCategory.id;
    },
    [customCategories, user?.uid]
  );

  const removeCustomCategory = useCallback(
    async (categoryId: string) => {
      const updatedCategories = customCategories.filter(
        (cat) => cat.id !== categoryId
      );
      await saveCustomCategories(updatedCategories);
    },
    [customCategories, user?.uid]
  );

  const updateCustomCategory = useCallback(
    async (categoryId: string, updates: Partial<CustomCategory>) => {
      const updatedCategories = customCategories.map((cat) =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      );
      await saveCustomCategories(updatedCategories);
    },
    [customCategories, user?.uid]
  );

  return {
    customCategories,
    loading,
    addCustomCategory,
    removeCustomCategory,
    updateCustomCategory,
    refetch: loadCustomCategories,
  };
};
