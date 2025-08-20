import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { styles } from "../styles";
import { IconSelectorProps } from "../types";

export const IconSelector: React.FC<IconSelectorProps> = ({
  selectedIcon,
  onSelect,
  options,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: currentTheme.colors.text }]}>
        Icône
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.emojiScrollContainer}
      >
        <View style={styles.emojiGrid}>
          {options.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiOption,
                {
                  backgroundColor:
                    selectedIcon === emoji
                      ? currentTheme.colors.primary + "20"
                      : currentTheme.colors.surface,
                  borderColor:
                    selectedIcon === emoji
                      ? currentTheme.colors.primary
                      : currentTheme.colors.border,
                },
              ]}
              onPress={() => onSelect(emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
