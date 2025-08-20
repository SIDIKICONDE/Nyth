import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { EventIndicatorProps } from "../types";
import { getEventTypeIcon, getPriorityColor } from "../utils";

export const EventIndicator: React.FC<EventIndicatorProps> = ({
  event,
  onPress,
}) => {
  const { currentTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.eventIndicator,
        {
          backgroundColor: getPriorityColor(
            event.priority,
            currentTheme.colors.textSecondary
          ),
        },
      ]}
      onPress={() => onPress?.(event)}
    >
      <Ionicons
        name={getEventTypeIcon(event.type) as any}
        size={8}
        color="white"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  eventIndicator: {
    width: 20,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
