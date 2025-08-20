import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import { STATUS_COLORS } from "../constants";
import { StatusBadgeProps } from "../types";

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "medium",
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const statusConfig = STATUS_COLORS[status] || {
    background: "#6B7280",
    backgroundLight: "#F3F4F6",
    text: "#6B7280",
    border: "#D1D5DB",
  };

  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    large: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
  };

  const getUITextSize = () => {
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

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusConfig.backgroundLight,
          borderColor: statusConfig.border,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: statusConfig.background,
            width: size === "small" ? 6 : size === "medium" ? 8 : 10,
            height: size === "small" ? 6 : size === "medium" ? 8 : 10,
          },
        ]}
      />
      <UIText
        size={getUITextSize()}
        weight="semibold"
        style={[
          styles.badgeText,
          {
            color: statusConfig.text,
          },
        ]}
      >
        {t(`planning.events.status.${status}`, status)}
      </UIText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusDot: {
    borderRadius: 10,
    marginRight: 6,
  },
  badgeText: {
    textTransform: "capitalize",
    // fontSize et fontWeight supprimés - gérés par UIText
  },
});
