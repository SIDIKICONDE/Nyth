import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../../hooks/useTranslation";
import { styles } from "../styles";
import { StylePickerProps } from "../types";

export const StylePicker: React.FC<StylePickerProps> = ({
  selectedStyle,
  onStyleSelect,
  styles: cardStyles,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {t(
          "planning.tasks.taskModal.customization.titles.cardStyle",
          "🎭 Style de carte"
        )}
      </Text>
      {cardStyles.map((style) => (
        <TouchableOpacity
          key={style.id}
          style={[
            styles.styleOption,
            {
              backgroundColor:
                selectedStyle === style.id
                  ? currentTheme.colors.primary + "10"
                  : currentTheme.colors.surface,
              borderColor:
                selectedStyle === style.id
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
            },
          ]}
          onPress={() => onStyleSelect(style.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.stylePreview}>{style.preview}</Text>
          <View style={styles.styleInfo}>
            <Text
              style={[
                styles.styleName,
                {
                  color:
                    selectedStyle === style.id
                      ? currentTheme.colors.primary
                      : currentTheme.colors.text,
                },
              ]}
            >
              {style.name}
            </Text>
            <Text
              style={[
                styles.styleDescription,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {style.description}
            </Text>
          </View>
          {selectedStyle === style.id && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={currentTheme.colors.primary}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};
