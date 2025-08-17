import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { UIText } from "../../../ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { PlanningEvent } from "../../../../types/planning";
import { PRIORITIES } from "../constants";

interface PrioritySelectorProps {
  selectedPriority: PlanningEvent["priority"];
  onPriorityChange: (priority: PlanningEvent["priority"]) => void;
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  selectedPriority,
  onPriorityChange,
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
      <UIText size="base" weight="semibold" color={currentTheme.colors.text}>
        {t("planning.events.priorityLabel", "Priority")}
      </UIText>
      <View style={styles.priorityContainer}>
        {PRIORITIES.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[
              styles.priorityButton,
              {
                backgroundColor:
                  selectedPriority === p.value
                    ? p.color + "20"
                    : currentTheme.colors.background,
                borderColor:
                  selectedPriority === p.value
                    ? p.color
                    : currentTheme.colors.border,
              },
            ]}
            onPress={() =>
              onPriorityChange(p.value as PlanningEvent["priority"])
            }
          >
            <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
            <UIText
              size="sm"
              weight="medium"
              color={
                selectedPriority === p.value
                  ? p.color
                  : currentTheme.colors.text
              }
            >
              {t(p.label, p.value)}
            </UIText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  priorityContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
