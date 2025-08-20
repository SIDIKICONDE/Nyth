import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { MAX_VISIBLE_EVENTS } from "../constants";
import { UIText } from "../../../ui/Typography";
import { DayCellProps } from "../types";
import { EventIndicator } from "./EventIndicator";

export const DayCell: React.FC<DayCellProps> = ({
  date,
  isToday,
  isSelected,
  events,
  goals = [],
  tasks = [],
  onPress,
  onLongPress,
  onEventPress,
  onItemPress,
}) => {
  const { currentTheme } = useTheme();

  if (!date) {
    return <View style={styles.emptyDay} />;
  }

  // Calculer le nombre total d'éléments
  const totalItems = events.length + goals.length + tasks.length;

  return (
    <TouchableOpacity
      style={[
        styles.dayCell,
        { backgroundColor: currentTheme.colors.surface },
        isToday && {
          backgroundColor: currentTheme.colors.primary + "20",
        },
        isSelected && {
          backgroundColor: currentTheme.colors.primary + "40",
        },
      ]}
      onPress={() => onPress?.(date)}
      onLongPress={() => onLongPress?.(date)}
    >
      <UIText
        size="sm"
        weight={isToday ? "bold" : "medium"}
        style={[
          styles.dayNumber,
          {
            color: isToday
              ? currentTheme.colors.primary
              : currentTheme.colors.text,
          },
        ]}
      >
        {date.getDate()}
      </UIText>

      {/* Indicateurs pour tous les éléments */}
      {totalItems > 0 && (
        <View style={styles.eventsContainer}>
          {/* Indicateurs d'événements */}
          {events.slice(0, Math.min(events.length, MAX_VISIBLE_EVENTS)).map((event, eventIndex) => (
            <EventIndicator
              key={`event-${eventIndex}`}
              event={event}
              onPress={onEventPress}
            />
          ))}
          
          {/* Indicateurs d'objectifs */}
          {goals.slice(0, Math.max(0, MAX_VISIBLE_EVENTS - events.length)).map((goal, goalIndex) => (
            <View
              key={`goal-${goalIndex}`}
              style={[
                styles.itemIndicator,
                { backgroundColor: '#10B981' }, // Vert pour les objectifs
              ]}
            >
              <UIText size="xs" color="#fff">🎯</UIText>
            </View>
          ))}
          
          {/* Indicateurs de tâches */}
          {tasks.slice(0, Math.max(0, MAX_VISIBLE_EVENTS - events.length - goals.length)).map((task, taskIndex) => (
            <View
              key={`task-${taskIndex}`}
              style={[
                styles.itemIndicator,
                { backgroundColor: '#F59E0B' }, // Orange pour les tâches
              ]}
            >
              <UIText size="xs" color="#fff">✓</UIText>
            </View>
          ))}
          
          {/* Indicateur "plus" si trop d'éléments */}
          {totalItems > MAX_VISIBLE_EVENTS && (
            <View
              style={[
                styles.moreIndicator,
                {
                  backgroundColor: currentTheme.colors.textSecondary,
                },
              ]}
            >
              <UIText
                size="xs"
                weight="bold"
                style={styles.moreText}
                color="#fff"
              >
                +{totalItems - MAX_VISIBLE_EVENTS}
              </UIText>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  emptyDay: {
    flex: 1,
    height: 80,
  },
  dayCell: {
    flex: 1,
    height: 80,
    margin: 1,
    padding: 4,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  dayNumber: {
    // fontSize et fontWeight gérés par UIText
    marginBottom: 4,
  },
  eventsContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    gap: 2,
  },
  itemIndicator: {
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  moreIndicator: {
    width: 20,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    // fontSize et fontWeight gérés par UIText
    color: "white",
  },
});
