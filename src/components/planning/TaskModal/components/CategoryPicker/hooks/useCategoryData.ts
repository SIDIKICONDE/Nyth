import { useMemo } from "react";
import { TASK_CATEGORIES } from "../../../constants";
import { useCustomCategories } from "../../../hooks/useCustomCategories";
import { Category } from "../types";

export const useCategoryData = () => {
  const { customCategories, addCustomCategory } = useCustomCategories();

  // Convertir les catégories par défaut au format unifié
  const defaultCategories: Category[] = useMemo(
    () =>
      TASK_CATEGORIES.map((category) => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        description: category.description,
        isCustom: false,
      })),
    []
  );

  // Convertir les catégories personnalisées au format unifié
  const customCategoriesFormatted: Category[] = useMemo(
    () =>
      customCategories.map((category) => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        description: category.description,
        isCustom: true,
      })),
    [customCategories]
  );

  // Combiner toutes les catégories
  const allCategories = useMemo(
    () => [...defaultCategories, ...customCategoriesFormatted],
    [defaultCategories, customCategoriesFormatted]
  );

  // Fonction pour trouver une catégorie par ID
  const findCategoryById = (categoryId: string): Category | undefined => {
    return allCategories.find((cat) => cat.id === categoryId);
  };

  // Fonction pour vérifier si une catégorie est personnalisée
  const isCustomCategory = (categoryId: string): boolean => {
    return customCategoriesFormatted.some((cat) => cat.id === categoryId);
  };

  // Fonction pour ajouter une nouvelle catégorie personnalisée
  const handleAddCustomCategory = async (
    name: string,
    icon: string,
    description: string
  ): Promise<string> => {
    return await addCustomCategory(name, icon, description);
  };

  return {
    defaultCategories,
    customCategories: customCategoriesFormatted,
    allCategories,
    findCategoryById,
    isCustomCategory,
    handleAddCustomCategory,
  };
};
