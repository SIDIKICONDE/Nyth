import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { COLORS, ICONS, LABELS, UI_CONFIG } from "../constants";
import { styles } from "../styles";
import { EditEventHeaderProps } from "../types";

export const EditEventHeader: React.FC<EditEventHeaderProps> = ({
  title,
  isLoading,
  isValid,
  onClose,
  onSave,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: currentTheme.colors.surface,
          borderBottomColor: currentTheme.colors.border,
        },
      ]}
    >
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={[
            styles.closeButton,
            { backgroundColor: currentTheme.colors.background },
          ]}
          onPress={onClose}
        >
          <Ionicons
            name={ICONS.CLOSE}
            size={UI_CONFIG.CLOSE_ICON_SIZE}
            color={currentTheme.colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.colors.text }]}>
          {t("planning.events.editTitle", LABELS.EDIT_EVENT)}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          {
            backgroundColor: currentTheme.colors.primary,
            opacity: !isValid || isLoading ? 0.5 : 1,
          },
        ]}
        onPress={onSave}
        disabled={!isValid || isLoading}
      >
        <Text style={[styles.saveButtonText, { color: COLORS.WHITE }]}>
          {isLoading ? LABELS.SAVING : t("common.save", LABELS.SAVE)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
