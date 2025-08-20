import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../ui/Typography";
import { TaskFormFieldProps } from "../types";

export const TaskFormField: React.FC<TaskFormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  error,
  required = false,
  style,
  numberOfLines,
  ...props
}) => {
  const { currentTheme } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <UIText
          size="sm"
          weight="semibold"
          color={currentTheme.colors.text}
          style={styles.label}
        >
          {label}
          {required && (
            <UIText size="sm" weight="semibold" color="#EF4444">
              {" *"}
            </UIText>
          )}
        </UIText>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
          },
          error && { borderColor: "#EF4444" },
          style,
        ]}
        placeholderTextColor={currentTheme.colors.textSecondary}
        multiline={multiline}
        numberOfLines={numberOfLines}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        returnKeyType={multiline ? "default" : "next"}
        blurOnSubmit={!multiline}
        enablesReturnKeyAutomatically={false}
        textAlignVertical={multiline ? "top" : "center"}
        autoCorrect={true}
        autoCapitalize="sentences"
        {...props}
      />
      {error && (
        <UIText size="xs" color="#EF4444" style={styles.errorText}>
          {error}
        </UIText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
  },
  errorText: {
    marginTop: 2,
  },
});
