import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import { PRIORITY_COLORS } from "../constants";
import { PriorityIndicatorProps } from "../types";

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  priority,
  size = "medium",
}) => {
  const { t } = useTranslation();
  const priorityConfig = PRIORITY_COLORS[priority] || {
    gradient: ["#6B7280", "#9CA3AF"],
    text: "#6B7280",
    background: "#F3F4F6",
  };

  const sizeStyles = {
    small: {
      width: 16,
      height: 16,
    },
    medium: {
      width: 20,
      height: 20,
    },
    large: {
      width: 24,
      height: 24,
    },
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return "xs" as const;
      case "medium":
        return "sm" as const;
      case "large":
        return "base" as const;
      default:
        return "sm" as const;
    }
  };

  const priorityIcons = {
    low: "•",
    medium: "••",
    high: "•••",
    urgent: "⚡",
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.indicator,
          {
            width: sizeStyles[size].width,
            height: sizeStyles[size].height,
            backgroundColor: priorityConfig.gradient[0],
          },
        ]}
      >
        <UIText
          size={getIconSize()}
          weight="bold"
          style={[
            styles.icon,
            {
              color: "white",
            },
          ]}
        >
          {priorityIcons[priority]}
        </UIText>
      </View>

      {size === "large" && (
        <UIText
          size="xs"
          weight="semibold"
          style={[styles.label, { color: priorityConfig.text }]}
        >
          {t(`planning.events.priorities.${priority}`, priority)}
        </UIText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 4,
  },
  indicator: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    textAlign: "center",
    // fontSize et fontWeight supprimés - gérés par UIText
  },
  label: {
    textAlign: "center",
    // fontSize et fontWeight supprimés - gérés par UIText
  },
});
