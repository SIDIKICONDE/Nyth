import React from "react";
import { View } from "react-native";
import { AddCategoryModal } from "../AddCategoryModal";
import {
  CategoryDropdown,
  DropdownOverlay,
  SelectedCategoryDisplay,
} from "./components";
import { useCategoryPicker } from "./hooks";
import { styles } from "./styles";
import { CategoryPickerProps } from "./types";

export const CategoryPickerComponent: React.FC<CategoryPickerProps> = (
  props
) => {
  const {
    isOpen,
    showAddModal,
    selectedCategory,
    isSelectedCustom,
    error,
    defaultCategories,
    customCategories,
    handleToggleDropdown,
    handleCloseDropdown,
    handleCategorySelect,
    handleOpenAddModal,
    handleCloseAddModal,
    handleAddCategory,
  } = useCategoryPicker(props);

  return (
    <View style={styles.container}>
      <SelectedCategoryDisplay
        selectedCategory={selectedCategory}
        isCustomCategory={isSelectedCustom}
        onPress={handleToggleDropdown}
        isOpen={isOpen}
        error={error}
      />

      <CategoryDropdown
        isOpen={isOpen}
        defaultCategories={defaultCategories}
        customCategories={customCategories}
        selectedValue={props.value}
        onCategorySelect={handleCategorySelect}
        onAddCategory={handleOpenAddModal}
        onClose={handleCloseDropdown}
      />

      <DropdownOverlay visible={isOpen} onPress={handleCloseDropdown} />

      <AddCategoryModal
        visible={showAddModal}
        onClose={handleCloseAddModal}
        onAdd={handleAddCategory}
      />
    </View>
  );
};
