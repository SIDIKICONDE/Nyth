import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import { COMPONENT_SIZES } from "../constants";
import { TimelineItemProps } from "../types";
import {
  formatEventDate,
  formatEventTime,
  getEventColor,
  isEventOverdue,
  isEventToday,
} from "../utils";
import { EventTypeIcon } from "./EventTypeIcon";
import { PriorityIndicator } from "./PriorityIndicator";
import { StatusBadge } from "./StatusBadge";

export const TimelineItem: React.FC<TimelineItemProps> = ({
  event,
  isFirst = false,
  isLast = false,
  onPress,
  showDate = true,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const eventColor = getEventColor(event);
  const isOverdue = isEventOverdue(event);
  const isToday = isEventToday(event);

  return (
    <View style={styles.container}>
      {/* Timeline Line */}
      <View style={styles.timelineColumn}>
        {!isFirst && (
          <View
            style={[
              styles.timelineLine,
              styles.timelineLineTop,
              { backgroundColor: currentTheme.colors.border },
            ]}
          />
        )}

        {/* Timeline Dot */}
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor: eventColor,
              borderColor: currentTheme.colors.surface,
              shadowColor: eventColor,
            },
            isToday && styles.timelineDotToday,
          ]}
        />

        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              styles.timelineLineBottom,
              { backgroundColor: currentTheme.colors.border },
            ]}
          />
        )}
      </View>

      {/* Event Card */}
      <TouchableOpacity
        style={[
          styles.eventCard,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: isOverdue
              ? "#DC2626"
              : isToday
              ? eventColor
              : currentTheme.colors.border,
            shadowColor: currentTheme.colors.textSecondary,
          },
          isOverdue && styles.eventCardOverdue,
          isToday && styles.eventCardToday,
        ]}
        onPress={() => onPress?.(event)}
        activeOpacity={0.7}
      >
        {/* Header with Icon and Status */}
        <View style={styles.eventHeader}>
          <View style={styles.eventHeaderLeft}>
            <EventTypeIcon type={event.type} size={20} />
            <View style={styles.eventTitleContainer}>
              <UIText
                size="base"
                weight="semibold"
                style={[
                  styles.eventTitle,
                  {
                    color: isOverdue ? "#DC2626" : currentTheme.colors.text,
                  },
                ]}
                numberOfLines={1}
              >
                {event.title}
              </UIText>
              {showDate && (
                <UIText
                  size="xs"
                  weight="medium"
                  style={[
                    styles.eventDate,
                    { color: currentTheme.colors.textSecondary },
                  ]}
                >
                  {formatEventDate(event.startDate)} •{" "}
                  {formatEventTime(event.startDate)}
                </UIText>
              )}
            </View>
          </View>

          <View style={styles.eventHeaderRight}>
            <PriorityIndicator priority={event.priority} size="small" />
          </View>
        </View>

        {/* Description */}
        {event.description && (
          <UIText
            size="sm"
            style={[
              styles.eventDescription,
              { color: currentTheme.colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {event.description}
          </UIText>
        )}

        {/* Footer with Status and Duration */}
        <View style={styles.eventFooter}>
          <StatusBadge status={event.status} size="small" />

          {event.estimatedDuration && (
            <UIText
              size="xs"
              weight="medium"
              style={[
                styles.eventDuration,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {Math.floor(event.estimatedDuration / 60)}h
              {event.estimatedDuration % 60}min
            </UIText>
          )}

          {isOverdue && (
            <View style={styles.overdueIndicator}>
              <UIText
                size="xs"
                weight="semibold"
                style={styles.overdueText}
                color="#DC2626"
              >
                {t("planning.events.overdue", "Overdue")}
              </UIText>
            </View>
          )}

          {isToday && (
            <View style={styles.todayIndicator}>
              <UIText
                size="xs"
                weight="semibold"
                style={styles.todayText}
                color="#1E40AF"
              >
                {t("planning.events.today", "Today")}
              </UIText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 8,
  },
  timelineColumn: {
    width: COMPONENT_SIZES.timelineMargin + COMPONENT_SIZES.timelineDotSize,
    alignItems: "center",
    marginRight: 16,
  },
  timelineLine: {
    width: COMPONENT_SIZES.timelineLineWidth,
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  timelineLineTop: {
    // Pas de marge pour que la ligne touche le point
  },
  timelineLineBottom: {
    // Pas de marge pour que la ligne touche le point
  },
  timelineDot: {
    width: COMPONENT_SIZES.timelineDotSize,
    height: COMPONENT_SIZES.timelineDotSize,
    borderRadius: COMPONENT_SIZES.timelineDotSize / 2,
    borderWidth: 4,
    borderColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineDotToday: {
    width: COMPONENT_SIZES.timelineDotSize + 4,
    height: COMPONENT_SIZES.timelineDotSize + 4,
    borderRadius: (COMPONENT_SIZES.timelineDotSize + 4) / 2,
    borderWidth: 4,
  },
  eventCard: {
    flex: 1,
    borderRadius: COMPONENT_SIZES.cardBorderRadius,
    padding: 16,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventCardOverdue: {
    borderWidth: 2,
  },
  eventCardToday: {
    borderWidth: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  eventHeaderRight: {
    marginLeft: 12,
  },
  eventTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    // fontSize et fontWeight gérés par UIText
    marginBottom: 2,
  },
  eventDate: {
    // fontSize et fontWeight gérés par UIText
  },
  eventDescription: {
    // fontSize géré par UIText
    lineHeight: 20,
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  eventDuration: {
    // fontSize et fontWeight gérés par UIText
  },
  overdueIndicator: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  overdueText: {
    color: "#DC2626",
    // fontSize et fontWeight gérés par UIText
  },
  todayIndicator: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  todayText: {
    color: "#1E40AF",
    // fontSize et fontWeight gérés par UIText
  },
});
