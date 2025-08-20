import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../../hooks/useTranslation";
import { styles } from "../styles";
import { IconPickerProps } from "../types";

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onIconSelect,
  icons,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {t(
          "planning.tasks.taskModal.customization.titles.cardIcon",
          "✨ Icône de la carte"
        )}
      </Text>
      <View style={styles.iconGrid}>
        {icons.map((icon, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.iconOption,
              {
                backgroundColor:
                  selectedIcon === icon
                    ? currentTheme.colors.primary + "20"
                    : currentTheme.colors.surface,
                borderColor:
                  selectedIcon === icon
                    ? currentTheme.colors.primary
                    : currentTheme.colors.border,
              },
            ]}
            onPress={() => onIconSelect(icon)}
            activeOpacity={0.7}
          >
            <Text style={styles.iconText}>{icon}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
