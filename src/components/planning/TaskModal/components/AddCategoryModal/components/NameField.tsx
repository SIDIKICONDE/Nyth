import React from "react";
import { Text, TextInput, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { VALIDATION_RULES } from "../constants";
import { styles } from "../styles";
import { NameFieldProps } from "../types";

export const NameField: React.FC<NameFieldProps> = ({
  value,
  onChange,
  maxLength = VALIDATION_RULES.NAME_MAX_LENGTH,
  autoFocus = true,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: currentTheme.colors.text }]}>
        Nom de la catégorie *
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder="Ex: Projets personnels"
        placeholderTextColor={currentTheme.colors.textSecondary}
        maxLength={maxLength}
        autoFocus={autoFocus}
        returnKeyType="next"
        blurOnSubmit={false}
      />
      <Text
        style={[styles.charCount, { color: currentTheme.colors.textSecondary }]}
      >
        {value.length}/{maxLength}
      </Text>
    </View>
  );
};
