import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { PlanningEvent } from "../../../../../types/planning";
import { UIText } from "../../../../ui/Typography";
import { getEventColor, isEventOverdue, isEventToday } from "../../utils";
import { EventTypeIcon } from "../EventTypeIcon";
import { PriorityIndicator } from "../PriorityIndicator";
import { StatusBadge } from "../StatusBadge";

interface EventHeaderProps {
  event: PlanningEvent;
}

export const EventHeader: React.FC<EventHeaderProps> = ({ event }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const eventColor = getEventColor(event);
  const isOverdue = isEventOverdue(event);
  const isToday = isEventToday(event);

  return (
    <View
      style={[
        styles.eventHeader,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: eventColor + "40",
        },
        isOverdue && styles.eventHeaderOverdue,
        isToday && styles.eventHeaderToday,
      ]}
    >
      {/* Fond coloré subtil */}
      <View
        style={[
          styles.gradientBackground,
          { backgroundColor: eventColor + "10" },
        ]}
      />

      <View style={styles.eventHeaderTop}>
        <View
          style={[styles.iconContainer, { backgroundColor: eventColor + "15" }]}
        >
          <EventTypeIcon type={event.type} size={32} />
        </View>

        <View style={styles.eventHeaderInfo}>
          <UIText
            size="xl"
            weight="bold"
            color={isOverdue ? "#DC2626" : currentTheme.colors.text}
            style={styles.eventTitle}
            numberOfLines={2}
          >
            {event.title}
          </UIText>
          <UIText
            size="sm"
            weight="medium"
            color={currentTheme.colors.textSecondary}
            style={styles.eventType}
          >
            {t(
              `planning.events.types.${event.type}`,
              event.type ? event.type.replace("_", " ") : "meeting"
            )}
          </UIText>
        </View>

        <View style={styles.priorityContainer}>
          <PriorityIndicator priority={event.priority} size="large" />
        </View>
      </View>

      <View style={styles.eventHeaderBottom}>
        <View style={styles.statusContainer}>
          <StatusBadge status={event.status} size="medium" />
        </View>

        {isOverdue && (
          <View style={[styles.indicator, styles.overdueIndicator]}>
            <Ionicons name="warning" size={16} color="#DC2626" />
            <UIText
              size="xs"
              weight="semibold"
              color="#DC2626"
              style={styles.indicatorText}
            >
              {t("planning.events.overdue", "En retard")}
            </UIText>
          </View>
        )}

        {isToday && !isOverdue && (
          <View style={[styles.indicator, styles.todayIndicator]}>
            <Ionicons name="today" size={16} color="#1E40AF" />
            <UIText
              size="xs"
              weight="semibold"
              color="#1E40AF"
              style={styles.indicatorText}
            >
              {t("planning.events.today", "Aujourd'hui")}
            </UIText>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  eventHeader: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  eventHeaderOverdue: {
    borderColor: "#DC2626" + "40",
    borderWidth: 2,
  },
  eventHeaderToday: {
    borderColor: "#3B82F6" + "40",
    borderWidth: 2,
  },
  eventHeaderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  eventHeaderInfo: {
    flex: 1,
    marginRight: 8,
  },
  eventTitle: {
    marginBottom: 4,
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  eventType: {
    letterSpacing: 0.1,
  },
  priorityContainer: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
  eventHeaderBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  statusContainer: {
    marginRight: 2,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  overdueIndicator: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  todayIndicator: {
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  indicatorText: {
    letterSpacing: 0.1,
  },
});
