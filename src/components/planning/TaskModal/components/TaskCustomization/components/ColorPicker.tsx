import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../../hooks/useTranslation";
import { styles } from "../styles";
import { ColorPickerProps } from "../types";

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  colors,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {t(
          "planning.tasks.taskModal.customization.titles.cardColor",
          "🎨 Couleur de la carte"
        )}
      </Text>
      <View style={styles.colorGrid}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color.id}
            style={[
              styles.colorOption,
              {
                backgroundColor: color.color,
                borderColor:
                  selectedColor === color.color
                    ? currentTheme.colors.text
                    : "transparent",
                borderWidth: selectedColor === color.color ? 3 : 0,
              },
            ]}
            onPress={() => onColorSelect(color.color)}
            activeOpacity={0.8}
          >
            {selectedColor === color.color && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
