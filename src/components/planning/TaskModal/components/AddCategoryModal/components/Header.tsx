import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../../hooks/useCentralizedFont";
import { HeadingText, UIText } from "../../../../../ui/Typography";
import { styles } from "../styles";
import { HeaderProps } from "../types";

export const Header: React.FC<HeaderProps> = ({
  onClose,
  onSubmit,
  isValidName,
  isSubmitting,
}) => {
  const { currentTheme } = useTheme();
  const { ui, heading } = useCentralizedFont();

  return (
    <View
      style={[styles.header, { borderBottomColor: currentTheme.colors.border }]}
    >
      <TouchableOpacity onPress={onClose} style={styles.headerButton}>
        <UIText
          size="base"
          weight="medium"
          style={[
            ui,
            styles.headerButtonText,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          Annuler
        </UIText>
      </TouchableOpacity>

      <HeadingText
        size="lg"
        weight="semibold"
        style={[heading, styles.title, { color: currentTheme.colors.text }]}
      >
        Nouvelle catégorie
      </HeadingText>

      <TouchableOpacity
        onPress={onSubmit}
        style={[
          styles.headerButton,
          styles.saveButton,
          {
            backgroundColor: isValidName
              ? currentTheme.colors.primary
              : currentTheme.colors.border,
          },
        ]}
        disabled={!isValidName || isSubmitting}
      >
        <UIText
          size="base"
          weight="semibold"
          style={[
            ui,
            styles.headerButtonText,
            styles.saveButtonText,
            {
              color: isValidName ? "white" : currentTheme.colors.textSecondary,
            },
          ]}
        >
          {isSubmitting ? "..." : "Ajouter"}
        </UIText>
      </TouchableOpacity>
    </View>
  );
};
