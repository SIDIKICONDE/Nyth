import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useCallback } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { SearchFAB } from "../../../screens/PlanningScreen/components/TimelineTabContent/components/SearchFAB";
import { UIText } from "../../ui/Typography";
import { TimelineItem } from "./components/TimelineItem";
import { useEventTimeline } from "./hooks/useEventTimeline";
import { EventTimelineProps } from "./types";

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  onEventPress,
  onEventEdit,
  onEventDelete,
  onEventStatusChange,
  onCreateEvent,
  loading = false,
  emptyStateMessage,
  groupBy = "date",
  filterStatus = [],
  filterType = [],
  sortOrder = "desc",
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const {
    searchTerm,
    processedEvents,
    groupedEvents,
    stats,
    handleSearchChange,
  } = useEventTimeline(events);

  const handleEventPressInternal = useCallback(
    (event: any) => {
      onEventPress?.(event);
    },
    [onEventPress]
  );

  const renderTimelineItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <TimelineItem
        event={item}
        isFirst={index === 0}
        isLast={index === processedEvents.length - 1}
        onPress={handleEventPressInternal}
        showDate={true}
      />
    ),
    [processedEvents.length, handleEventPressInternal]
  );

  const renderStatsHeader = useCallback(
    () => (
      <View
        style={[
          styles.statsContainer,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <UIText
              size="lg"
              weight="bold"
              color={currentTheme.colors.primary}
              style={styles.statValue}
            >
              {stats.total}
            </UIText>
            <UIText
              size="xs"
              weight="semibold"
              color={currentTheme.colors.textSecondary}
              style={styles.statLabel}
            >
              {t("planning.timeline.stats.total", "Total")}
            </UIText>
          </View>
          <View style={styles.statItem}>
            <UIText
              size="lg"
              weight="bold"
              color="#10B981"
              style={styles.statValue}
            >
              {stats.completed}
            </UIText>
            <UIText
              size="xs"
              weight="semibold"
              color={currentTheme.colors.textSecondary}
              style={styles.statLabel}
            >
              {t("planning.timeline.stats.completed", "Terminés")}
            </UIText>
          </View>
          <View style={styles.statItem}>
            <UIText
              size="lg"
              weight="bold"
              color="#F59E0B"
              style={styles.statValue}
            >
              {stats.inProgress}
            </UIText>
            <UIText
              size="xs"
              weight="semibold"
              color={currentTheme.colors.textSecondary}
              style={styles.statLabel}
            >
              {t("planning.timeline.stats.inProgress", "En cours")}
            </UIText>
          </View>
          <View style={styles.statItem}>
            <UIText
              size="lg"
              weight="bold"
              color="#DC2626"
              style={styles.statValue}
            >
              {stats.overdue}
            </UIText>
            <UIText
              size="xs"
              weight="semibold"
              color={currentTheme.colors.textSecondary}
              style={styles.statLabel}
            >
              {t("planning.timeline.stats.overdue", "En retard")}
            </UIText>
          </View>
        </View>
      </View>
    ),
    [currentTheme, stats, t]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Ionicons
          name="calendar-outline"
          size={64}
          color={currentTheme.colors.textSecondary}
        />
        <UIText
          size="xl"
          weight="semibold"
          color={currentTheme.colors.text}
          style={styles.emptyStateTitle}
        >
          {t("planning.timeline.empty.title", "Aucun événement")}
        </UIText>
        <UIText
          size="base"
          color={currentTheme.colors.textSecondary}
          align="center"
          style={styles.emptyStateMessage}
        >
          {emptyStateMessage ||
            t(
              "planning.timeline.empty.message",
              "Aucun événement trouvé pour les critères sélectionnés"
            )}
        </UIText>
      </View>
    ),
    [currentTheme, emptyStateMessage, t]
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <UIText
          size="base"
          color={currentTheme.colors.textSecondary}
          style={styles.loadingText}
        >
          {t("planning.timeline.loading", "Chargement des événements...")}
        </UIText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      {/* Header avec statistiques seulement */}
      <View style={styles.headerContainer}>{renderStatsHeader()}</View>

      <FlatList
        data={processedEvents}
        renderItem={renderTimelineItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        keyboardDismissMode="none"
      />

      {/* SearchFAB flottant */}
      <SearchFAB
        onSearch={handleSearchChange}
        placeholder="Rechercher des événements..."
      />

      {/* FAB pour créer un événement */}
      {onCreateEvent && (
        <TouchableOpacity
          style={[
            styles.createEventFAB,
            { backgroundColor: currentTheme.colors.primary },
          ]}
          onPress={() => onCreateEvent(new Date())}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative", // Pour le positionnement du FAB
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  statsContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    marginBottom: 2,
  },
  statLabel: {
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    lineHeight: 24,
    maxWidth: 280,
  },
  loadingText: {
    marginTop: 16,
  },
  createEventFAB: {
    position: "absolute",
    bottom: 10,
    right: 16,
    width: 36,
    height: 35,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
