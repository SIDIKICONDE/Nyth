import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import { PriorityPickerProps } from "../types";

export const PriorityPicker: React.FC<PriorityPickerProps> = ({
  value,
  onValueChange,
  error,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const PRIORITIES = [
    {
      value: "low" as const,
      label: "planning.tasks.taskModal.priorities.low",
      color: "#10B981",
      icon: "flag-outline",
    },
    {
      value: "medium" as const,
      label: "planning.tasks.taskModal.priorities.medium",
      color: "#F59E0B",
      icon: "flag",
    },
    {
      value: "high" as const,
      label: "planning.tasks.taskModal.priorities.high",
      color: "#EF4444",
      icon: "flag",
    },
    {
      value: "urgent" as const,
      label: "planning.tasks.taskModal.priorities.urgent",
      color: "#DC2626",
      icon: "warning",
    },
  ];

  const selectedPriority = value;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UIText
          size="sm"
          weight="semibold"
          color={currentTheme.colors.textSecondary}
        >
          {t("planning.tasks.priority", "Priorité")}
        </UIText>
      </View>

      <View style={styles.optionsContainer}>
        {PRIORITIES.map((priority) => {
          const isSelected = selectedPriority === priority.value;
          return (
            <TouchableOpacity
              key={priority.value}
              style={[
                styles.optionButton,
                {
                  backgroundColor: isSelected
                    ? priority.color + "20"
                    : currentTheme.colors.surface,
                  borderColor: isSelected
                    ? priority.color
                    : currentTheme.colors.border,
                },
              ]}
              onPress={() => onValueChange(priority.value)}
            >
              <Ionicons
                name={priority.icon as any}
                size={16}
                color={
                  isSelected
                    ? priority.color
                    : currentTheme.colors.textSecondary
                }
              />
              <UIText
                size="xs"
                weight={isSelected ? "semibold" : "medium"}
                color={
                  isSelected
                    ? priority.color
                    : currentTheme.colors.textSecondary
                }
                style={styles.optionText}
              >
                {t(priority.label, priority.value)}
              </UIText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  optionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 36,
  },
  optionText: {
    marginLeft: 4,
  },
});
