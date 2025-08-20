import React from "react";
import { Text, TextInput, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { VALIDATION_RULES } from "../constants";
import { styles } from "../styles";
import { DescriptionFieldProps } from "../types";

export const DescriptionField: React.FC<DescriptionFieldProps> = ({
  value,
  onChange,
  maxLength = VALIDATION_RULES.DESCRIPTION_MAX_LENGTH,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: currentTheme.colors.text }]}>
        Description (optionnel)
      </Text>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder="Décrivez cette catégorie..."
        placeholderTextColor={currentTheme.colors.textSecondary}
        multiline
        numberOfLines={3}
        maxLength={maxLength}
        returnKeyType="done"
        blurOnSubmit={true}
      />
      <Text
        style={[styles.charCount, { color: currentTheme.colors.textSecondary }]}
      >
        {value.length}/{maxLength}
      </Text>
    </View>
  );
};
