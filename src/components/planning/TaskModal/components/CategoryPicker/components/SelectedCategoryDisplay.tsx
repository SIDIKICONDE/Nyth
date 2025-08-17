import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../../hooks/useTranslation";
import { UIText } from "../../../../../ui/Typography";
import { ANIMATION_CONFIG } from "../constants";
import { styles } from "../styles";
import { SelectedCategoryDisplayProps } from "../types";

export const SelectedCategoryDisplay: React.FC<
  SelectedCategoryDisplayProps
> = ({ selectedCategory, isCustomCategory, onPress, isOpen, error }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  return (
    <>
      <UIText
        size="sm"
        weight="semibold"
        style={[ui, styles.label, { color: currentTheme.colors.text }]}
      >
        {t("planning.tasks.taskModal.categoryLabel", "Catégorie")}
      </UIText>

      <TouchableOpacity
        style={[
          styles.picker,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: error ? "#EF4444" : currentTheme.colors.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.selectedContainer}>
          {selectedCategory ? (
            <>
              <UIText
                size="base"
                weight="medium"
                style={[ui, styles.categoryIcon]}
              >
                {selectedCategory.icon}
              </UIText>
              <UIText
                size="base"
                weight="medium"
                style={[
                  ui,
                  styles.selectedText,
                  { color: currentTheme.colors.text },
                ]}
              >
                {selectedCategory.name}
              </UIText>
              {isCustomCategory && (
                <View
                  style={[
                    styles.customBadge,
                    { backgroundColor: currentTheme.colors.primary + "20" },
                  ]}
                >
                  <UIText
                    size="xs"
                    weight="semibold"
                    style={[
                      ui,
                      styles.customBadgeText,
                      { color: currentTheme.colors.primary },
                    ]}
                  >
                    {t(
                      "planning.tasks.taskModal.categoryPicker.badge",
                      "Perso"
                    )}
                  </UIText>
                </View>
              )}
            </>
          ) : (
            <UIText
              size="base"
              weight="medium"
              style={[
                ui,
                styles.placeholderText,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                "planning.tasks.taskModal.categoryPicker.placeholder",
                "Choisir une catégorie"
              )}
            </UIText>
          )}
        </View>

        <UIText
          size="base"
          weight="medium"
          style={[
            ui,
            styles.chevron,
            {
              color: currentTheme.colors.textSecondary,
              transform: [
                {
                  rotate: isOpen
                    ? ANIMATION_CONFIG.CHEVRON_ROTATION_OPEN
                    : ANIMATION_CONFIG.CHEVRON_ROTATION_CLOSED,
                },
              ],
            },
          ]}
        >
          ▼
        </UIText>
      </TouchableOpacity>

      {error && (
        <UIText size="xs" weight="medium" style={[ui, styles.errorText]}>
          {error}
        </UIText>
      )}
    </>
  );
};
