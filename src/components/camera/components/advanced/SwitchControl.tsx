import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";

interface SwitchControlProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const SwitchControl: React.FC<SwitchControlProps> = ({
  label,
  value,
  onValueChange,
  disabled = false,
}) => {
  const { currentTheme } = useTheme();
  return (
    <View style={[styles.switchContainer, disabled && styles.switchDisabled]}>
      <Text
        style={[
          styles.switchLabel,
          {
            color: disabled
              ? currentTheme.colors.textMuted
              : currentTheme.colors.text,
          },
        ]}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: currentTheme.colors.border,
          true: currentTheme.colors.primary,
        }}
        thumbColor={currentTheme.colors.accent}
        ios_backgroundColor={currentTheme.colors.border}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
    borderRadius: 8,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: "transparent",
  },
  switchDisabled: {
    opacity: 0.4,
    backgroundColor: "transparent",
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  switchLabelDisabled: {
    color: "rgba(255, 255, 255, 0.4)",
  },
});
