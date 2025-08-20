import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Goal } from "../../../../types/planning";
import { PriorityOption } from "../types";

interface PrioritySelectorProps {
  selectedPriority: Goal["priority"];
  onPriorityChange: (priority: Goal["priority"]) => void;
  options: PriorityOption[];
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  selectedPriority,
  onPriorityChange,
  options,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.fieldContainer,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <Text style={[styles.fieldLabel, { color: currentTheme.colors.text }]}>
        {t("planning.goals.priority", "Priority")}
      </Text>
      <View style={styles.optionsRow}>
        {options.map((priority) => (
          <TouchableOpacity
            key={priority.key}
            style={[
              styles.optionButton,
              { backgroundColor: currentTheme.colors.surface },
              selectedPriority === priority.key && {
                backgroundColor: priority.color,
              },
            ]}
            onPress={() => onPriorityChange(priority.key)}
          >
            <Text
              style={[
                styles.optionText,
                { color: currentTheme.colors.text },
                selectedPriority === priority.key && { color: "white" },
              ]}
            >
              {t(`planning.goals.priorities.${priority.key}`, priority.label)}
            </Text>
          </TouchableOpacity>
        ))}
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
  optionsRow: {
    flexDirection: "row",
    gap: 6,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
