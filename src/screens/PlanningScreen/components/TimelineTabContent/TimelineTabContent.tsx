import React from "react";
import { StyleSheet, View } from "react-native";
import { TabContent, TabNavigation } from "./components";
import { useTimelineTabLogic } from "./hooks/useTimelineTabLogic";
import { TimelineTabContentProps } from "./types";

const TimelineTabContentComponent: React.FC<TimelineTabContentProps> = ({
  onEventPress,
  onEventEdit,
  onEventDelete,
  onEventStatusChange,
  onCreateEvent,
  onGoalPress,
  onGoalProgressUpdate,
  onGoalComplete,
  onGoalDelete,
  onGoalReactivate,
  onSubTabChange,
  onCreateGoal,
}) => {
  const {
    activeTab,
    safeEvents,
    goals,
    eventHandlers,
    goalHandlers,
    handleTabChange,
  } = useTimelineTabLogic({
    onEventPress,
    onEventEdit,
    onEventDelete,
    onEventStatusChange,
    onCreateEvent,
    onGoalPress,
    onGoalProgressUpdate,
    onGoalComplete,
    onGoalDelete,
    onGoalReactivate,
    onSubTabChange,
  });

  return (
    <View style={styles.container}>
      {/* Navigation par onglets */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        eventsCount={safeEvents.length}
        goalsCount={goals.length}
      />

      {/* Contenu de l'onglet actif */}
      <TabContent
        activeTab={activeTab}
        events={safeEvents}
        goals={goals}
        eventHandlers={eventHandlers}
        goalHandlers={goalHandlers}
        onCreateGoal={onCreateGoal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const TimelineTabContent = React.memo(TimelineTabContentComponent);
