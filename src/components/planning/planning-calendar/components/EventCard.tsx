import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../ui/Typography";
import { EventCardProps } from "../types";
import { formatEventTime, getEventTypeIcon, getPriorityColor } from "../utils";

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { currentTheme } = useTheme();

  const handlePress = () => {
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      style={[
        styles.eventCard,
        { backgroundColor: currentTheme.colors.background },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.eventHeader}>
        <Ionicons
          name={getEventTypeIcon(event.type) as any}
          size={16}
          color={getPriorityColor(
            event.priority,
            currentTheme.colors.textSecondary
          )}
        />
        <UIText
          size="xs"
          style={[
            styles.eventTime,
            { color: currentTheme.colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {formatEventTime(event.startDate)}
        </UIText>
      </View>
      <UIText
        size="sm"
        weight="medium"
        style={[styles.eventTitle, { color: currentTheme.colors.text }]}
        numberOfLines={2}
      >
        {event.title}
      </UIText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    width: 150,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  eventTime: {
    // fontSize géré par UIText
  },
  eventTitle: {
    // fontSize et fontWeight gérés par UIText
  },
});
