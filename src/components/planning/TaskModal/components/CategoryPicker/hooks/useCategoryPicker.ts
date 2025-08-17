import { useState } from "react";
import { CategoryPickerProps } from "../types";
import { useCategoryData } from "./useCategoryData";

export const useCategoryPicker = (props: CategoryPickerProps) => {
  const { value, onCategoryChange, error } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const {
    defaultCategories,
    customCategories,
    findCategoryById,
    isCustomCategory,
    handleAddCustomCategory,
  } = useCategoryData();

  // Catégorie sélectionnée
  const selectedCategory = value ? findCategoryById(value) : undefined;
  const isSelectedCustom = value ? isCustomCategory(value) : false;

  // Gestion de l'ouverture/fermeture du dropdown
  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseDropdown = () => {
    setIsOpen(false);
  };

  // Gestion de la sélection de catégorie
  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    handleCloseDropdown();
  };

  // Gestion de l'ajout de nouvelle catégorie
  const handleOpenAddModal = () => {
    handleCloseDropdown();
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleAddCategory = async (
    name: string,
    icon: string,
    description: string
  ) => {
    const newCategoryId = await handleAddCustomCategory(
      name,
      icon,
      description
    );
    onCategoryChange(newCategoryId);
    handleCloseAddModal();
  };

  return {
    // État
    isOpen,
    showAddModal,
    selectedCategory,
    isSelectedCustom,
    error,

    // Données
    defaultCategories,
    customCategories,

    // Actions
    handleToggleDropdown,
    handleCloseDropdown,
    handleCategorySelect,
    handleOpenAddModal,
    handleCloseAddModal,
    handleAddCategory,
  };
};
