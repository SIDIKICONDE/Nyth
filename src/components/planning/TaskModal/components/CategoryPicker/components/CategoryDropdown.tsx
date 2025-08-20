import React from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { CUSTOM_CATEGORY_LABELS } from "../constants";
import { styles } from "../styles";
import { CategoryDropdownProps } from "../types";
import { AddCategoryButton } from "./AddCategoryButton";
import { CategoryOption } from "./CategoryOption";
import { CategorySeparator } from "./CategorySeparator";

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  isOpen,
  defaultCategories,
  customCategories,
  selectedValue,
  onCategorySelect,
  onAddCategory,
  onClose,
}) => {
  const { currentTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <View
      style={[
        styles.dropdown,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        },
      ]}
    >
      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
        {/* Catégories par défaut */}
        {defaultCategories.map((category) => (
          <CategoryOption
            key={category.id}
            category={category}
            isSelected={selectedValue === category.id}
            onSelect={onCategorySelect}
          />
        ))}

        {/* Séparateur si il y a des catégories personnalisées */}
        {customCategories.length > 0 && (
          <CategorySeparator title={CUSTOM_CATEGORY_LABELS.SEPARATOR_TITLE} />
        )}

        {/* Catégories personnalisées */}
        {customCategories.map((category) => (
          <CategoryOption
            key={category.id}
            category={{ ...category, isCustom: true }}
            isSelected={selectedValue === category.id}
            onSelect={onCategorySelect}
          />
        ))}

        {/* Bouton "Ajouter une catégorie" */}
        <AddCategoryButton onPress={onAddCategory} />
      </ScrollView>
    </View>
  );
};
