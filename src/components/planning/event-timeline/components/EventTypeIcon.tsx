import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { EVENT_TYPE_ICONS } from "../constants";
import { EventTypeIconProps } from "../types";

export const EventTypeIcon: React.FC<EventTypeIconProps> = ({
  type,
  size = 24,
  color,
}) => {
  const typeConfig = EVENT_TYPE_ICONS[type] || {
    solidIcon: "calendar",
    outlineIcon: "calendar-outline",
    color: "#6B7280",
    background: "#F3F4F6",
  };
  const iconColor = color || typeConfig.color;

  return (
    <View
      style={[
        styles.iconContainer,
        {
          backgroundColor: typeConfig.background,
          width: size + 16,
          height: size + 16,
        },
      ]}
    >
      <Ionicons name={typeConfig.solidIcon} size={size} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
