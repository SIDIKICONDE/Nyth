import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { UIText } from "../../../../../ui/Typography";
import { CUSTOM_CATEGORY_LABELS } from "../constants";
import { styles } from "../styles";
import { CategoryOptionProps } from "../types";

export const CategoryOption: React.FC<CategoryOptionProps> = ({
  category,
  isSelected,
  onSelect,
}) => {
  const { currentTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.categoryOption,
        {
          backgroundColor: isSelected
            ? currentTheme.colors.primary + "15"
            : currentTheme.colors.surface,
          borderColor: isSelected
            ? currentTheme.colors.primary
            : currentTheme.colors.border,
        },
      ]}
      onPress={() => onSelect(category.id)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryContent}>
        <UIText style={styles.categoryIcon} size="lg">
          {category.icon}
        </UIText>
        <View style={styles.categoryInfo}>
          {category.isCustom ? (
            <View style={styles.customCategoryHeader}>
              <UIText
                style={[
                  styles.categoryName,
                  {
                    color: isSelected
                      ? currentTheme.colors.primary
                      : currentTheme.colors.text,
                  },
                ]}
                size="sm"
                weight="medium"
              >
                {category.name}
              </UIText>
              <View
                style={[
                  styles.customBadgeSmall,
                  { backgroundColor: currentTheme.colors.warning + "20" },
                ]}
              >
                <UIText
                  style={[
                    styles.customBadgeSmallText,
                    { color: currentTheme.colors.warning },
                  ]}
                  size="xs"
                >
                  {CUSTOM_CATEGORY_LABELS.BADGE_TEXT}
                </UIText>
              </View>
            </View>
          ) : (
            <UIText
              style={[
                styles.categoryName,
                {
                  color: isSelected
                    ? currentTheme.colors.primary
                    : currentTheme.colors.text,
                },
              ]}
              size="sm"
              weight="medium"
            >
              {category.name}
            </UIText>
          )}
          {category.description && (
            <UIText
              style={[
                styles.categoryDescription,
                { color: currentTheme.colors.textSecondary },
              ]}
              size="xs"
            >
              {category.description}
            </UIText>
          )}
        </View>
      </View>
      {isSelected && (
        <UIText
          style={[styles.checkIcon, { color: currentTheme.colors.primary }]}
          size="lg"
        >
          ✓
        </UIText>
      )}
    </TouchableOpacity>
  );
};
