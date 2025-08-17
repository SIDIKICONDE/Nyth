import { useState } from "react";
import { Alert } from "react-native";
import { DEFAULT_VALUES, VALIDATION_RULES } from "../constants";
import { CategoryFormData } from "../types";

export const useCategoryForm = () => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: DEFAULT_VALUES.NAME,
    description: DEFAULT_VALUES.DESCRIPTION,
    selectedIcon: DEFAULT_VALUES.ICON,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateName = (name: string) => {
    setFormData((prev) => ({ ...prev, name }));
  };

  const updateDescription = (description: string) => {
    setFormData((prev) => ({ ...prev, description }));
  };

  const updateIcon = (selectedIcon: string) => {
    setFormData((prev) => ({ ...prev, selectedIcon }));
  };

  const validateName = (name: string): boolean => {
    return (
      name.trim().length >= VALIDATION_RULES.NAME_MIN_LENGTH &&
      name.trim().length <= VALIDATION_RULES.NAME_MAX_LENGTH
    );
  };

  const isValidName = validateName(formData.name);

  const validateForm = (): { isValid: boolean; errorMessage?: string } => {
    if (!formData.name.trim()) {
      return {
        isValid: false,
        errorMessage: "Le nom de la catégorie est requis",
      };
    }

    if (formData.name.trim().length < VALIDATION_RULES.NAME_MIN_LENGTH) {
      return {
        isValid: false,
        errorMessage: `Le nom doit contenir au moins ${VALIDATION_RULES.NAME_MIN_LENGTH} caractères`,
      };
    }

    if (formData.name.trim().length > VALIDATION_RULES.NAME_MAX_LENGTH) {
      return {
        isValid: false,
        errorMessage: `Le nom ne peut pas dépasser ${VALIDATION_RULES.NAME_MAX_LENGTH} caractères`,
      };
    }

    return { isValid: true };
  };

  const handleSubmit = async (
    onAdd: (name: string, icon: string, description: string) => Promise<void>
  ): Promise<boolean> => {
    const validation = validateForm();

    if (!validation.isValid) {
      Alert.alert("Erreur", validation.errorMessage);
      return false;
    }

    try {
      setIsSubmitting(true);
      await onAdd(
        formData.name.trim(),
        formData.selectedIcon,
        formData.description.trim()
      );
      return true;
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter la catégorie");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: DEFAULT_VALUES.NAME,
      description: DEFAULT_VALUES.DESCRIPTION,
      selectedIcon: DEFAULT_VALUES.ICON,
    });
    setIsSubmitting(false);
  };

  return {
    formData,
    isSubmitting,
    isValidName,
    updateName,
    updateDescription,
    updateIcon,
    handleSubmit,
    resetForm,
  };
};
