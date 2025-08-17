import React from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../../hooks/useCentralizedFont";
import { UIText } from "../../../../../ui/Typography";
import { CUSTOM_CATEGORY_LABELS } from "../constants";
import { styles } from "../styles";
import { AddCategoryButtonProps } from "../types";

export const AddCategoryButton: React.FC<AddCategoryButtonProps> = ({
  onPress,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();

  return (
    <TouchableOpacity
      style={[
        styles.addCategoryButton,
        {
          backgroundColor: currentTheme.colors.primary + "10",
          borderColor: currentTheme.colors.primary,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <UIText size="lg" weight="bold" style={[ui, styles.addIcon]}>
        +
      </UIText>
      <UIText
        size="base"
        weight="medium"
        style={[
          ui,
          styles.addCategoryText,
          { color: currentTheme.colors.primary },
        ]}
      >
        {CUSTOM_CATEGORY_LABELS.ADD_BUTTON_TEXT}
      </UIText>
    </TouchableOpacity>
  );
};
