import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { PlanningEvent } from "../../../../../types/planning";
import { UIText } from "../../../../ui/Typography";
import { formatDuration, formatEventDate, formatEventTime } from "../../utils";

interface EventDetailsProps {
  event: PlanningEvent;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ event }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  const DetailItem: React.FC<{
    icon: string;
    iconColor?: string;
    label: string;
    children: React.ReactNode;
  }> = ({ icon, iconColor, label, children }) => (
    <TouchableOpacity style={styles.detailItem} activeOpacity={0.7}>
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: (iconColor || currentTheme.colors.primary) + "10",
          },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={iconColor || currentTheme.colors.primary}
        />
      </View>
      <View style={styles.detailContent}>
        <UIText
          size="xs"
          weight="semibold"
          style={[
            ui,
            styles.detailLabel,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {label}
        </UIText>
        {children}
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.detailsSection,
        {
          backgroundColor: currentTheme.colors.surface,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
      ]}
    >
      <UIText
        size="lg"
        weight="semibold"
        style={[ui, styles.sectionTitle, { color: currentTheme.colors.text }]}
      >
        {t("planning.timeline.details", "Détails")}
      </UIText>

      {/* Date and Time */}
      <DetailItem
        icon="calendar"
        label={t("planning.events.dateAndTime", "Date et heure")}
      >
        <UIText
          size="base"
          weight="medium"
          style={[ui, styles.detailValue, { color: currentTheme.colors.text }]}
        >
          {formatEventDate(event.startDate)} •{" "}
          {formatEventTime(event.startDate)}
        </UIText>
        {new Date(event.endDate).getTime() !==
          new Date(event.startDate).getTime() && (
          <UIText
            size="sm"
            style={[
              ui,
              styles.detailValueSecondary,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t("planning.events.endDate", "Fin")}:{" "}
            {formatEventDate(event.endDate)} • {formatEventTime(event.endDate)}
          </UIText>
        )}
      </DetailItem>

      {/* Duration */}
      {event.estimatedDuration && (
        <DetailItem
          icon="time"
          label={t("planning.events.estimatedDuration", "Durée estimée")}
        >
          <UIText
            size="base"
            weight="medium"
            style={[
              ui,
              styles.detailValue,
              { color: currentTheme.colors.text },
            ]}
          >
            {formatDuration(event.estimatedDuration)}
          </UIText>
        </DetailItem>
      )}

      {/* Description */}
      {event.description && (
        <View
          style={[
            styles.descriptionCard,
            { backgroundColor: currentTheme.colors.background },
          ]}
        >
          <View style={styles.descriptionHeader}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: currentTheme.colors.primary + "10" },
              ]}
            >
              <Ionicons
                name="document-text"
                size={20}
                color={currentTheme.colors.primary}
              />
            </View>
            <UIText
              size="xs"
              weight="semibold"
              style={[
                ui,
                styles.detailLabel,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t("planning.events.descriptionLabel", "Description")}
            </UIText>
          </View>
          <UIText
            size="sm"
            style={[
              ui,
              styles.descriptionText,
              { color: currentTheme.colors.text },
            ]}
          >
            {event.description}
          </UIText>
        </View>
      )}

      {/* Location */}
      {event.location && (
        <DetailItem
          icon="location"
          iconColor="#10B981"
          label={t("planning.events.locationLabel", "Lieu")}
        >
          <UIText
            size="base"
            weight="medium"
            style={[
              ui,
              styles.detailValue,
              { color: currentTheme.colors.text },
            ]}
          >
            {event.location}
          </UIText>
        </DetailItem>
      )}

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <View style={styles.tagsSectionHeader}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: currentTheme.colors.primary + "10" },
              ]}
            >
              <Ionicons
                name="pricetags"
                size={20}
                color={currentTheme.colors.primary}
              />
            </View>
            <UIText
              size="xs"
              weight="semibold"
              style={[
                ui,
                styles.detailLabel,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t("planning.events.tagsLabel", "Tags")}
            </UIText>
          </View>
          <View style={styles.tagsContainer}>
            {event.tags.map((tag, index) => (
              <View
                key={index}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: currentTheme.colors.primary + "10",
                    borderColor: currentTheme.colors.primary + "30",
                  },
                ]}
              >
                <UIText
                  size="xs"
                  weight="medium"
                  style={[
                    ui,
                    styles.tagText,
                    { color: currentTheme.colors.primary },
                  ]}
                >
                  #{tag}
                </UIText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Reminders */}
      {event.reminders && event.reminders.length > 0 && (
        <View style={styles.remindersSection}>
          <View style={styles.remindersSectionHeader}>
            <View
              style={[styles.iconWrapper, { backgroundColor: "#F59E0B15" }]}
            >
              <Ionicons name="notifications" size={20} color="#F59E0B" />
            </View>
            <UIText
              size="xs"
              weight="semibold"
              style={[
                ui,
                styles.detailLabel,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t("planning.events.remindersLabel", "Rappels")}
            </UIText>
          </View>
          <View style={styles.remindersList}>
            {event.reminders.map((reminder, index) => (
              <View
                key={index}
                style={[
                  styles.reminderItem,
                  { backgroundColor: currentTheme.colors.background },
                ]}
              >
                <Ionicons name="alarm-outline" size={16} color="#F59E0B" />
                <UIText
                  size="sm"
                  style={[
                    ui,
                    styles.reminderText,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {reminder.triggerBefore} min avant •{" "}
                  {t(
                    `planning.events.reminderTypes.${reminder.type}`,
                    reminder.type
                  )}
                </UIText>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  detailsSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  detailValue: {
    lineHeight: 20,
  },
  detailValueSecondary: {
    marginTop: 2,
    lineHeight: 18,
  },
  descriptionCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  descriptionText: {
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  tagsSection: {
    marginBottom: 14,
  },
  tagsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 2,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    letterSpacing: 0.1,
  },
  remindersSection: {
    marginBottom: 2,
  },
  remindersSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  remindersList: {
    gap: 6,
  },
  reminderItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  reminderText: {
    flex: 1,
    lineHeight: 18,
  },
});
