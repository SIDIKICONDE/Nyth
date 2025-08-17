import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";

interface TargetUnitRowProps {
  target: string;
  unit: string;
  onTargetChange: (target: string) => void;
  onUnitChange: (unit: string) => void;
}

export const TargetUnitRow: React.FC<TargetUnitRowProps> = ({
  target,
  unit,
  onTargetChange,
  onUnitChange,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        styles.fieldContainer,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <Text style={[styles.fieldLabel, { color: currentTheme.colors.text }]}>
        {t("planning.goals.targetAndUnit", "Target and Unit")}
        <Text style={styles.required}> *</Text>
      </Text>
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Text
            style={[
              styles.inputLabel,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t("planning.goals.target", "Target")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border,
              },
            ]}
            value={target}
            onChangeText={onTargetChange}
            placeholder="5"
            placeholderTextColor={currentTheme.colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputContainer, styles.unitInputContainer]}>
          <Text
            style={[
              styles.inputLabel,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t("planning.goals.unit", "Unit")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border,
              },
            ]}
            value={unit}
            onChangeText={onUnitChange}
            placeholder={t("planning.goals.unitPlaceholder", "scripts")}
            placeholderTextColor={currentTheme.colors.textSecondary}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  required: {
    color: "#ef4444",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  inputContainer: {
    flex: 2,
  },
  unitInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 3,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 40,
  },
});
