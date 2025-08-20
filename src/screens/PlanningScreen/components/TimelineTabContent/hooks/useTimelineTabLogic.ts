import React, { useCallback, useMemo, useState } from "react";
import { usePlanning } from "../../../../../hooks/usePlanning";
import { Goal, PlanningEvent } from "../../../../../types/planning";
import { TabType } from "../types";
import { eventUtils } from "../utils/eventUtils";

interface UseTimelineTabLogicProps {
  onEventPress?: (event: PlanningEvent) => void;
  onEventEdit?: (event: PlanningEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onEventStatusChange?: (
    eventId: string,
    newStatus: PlanningEvent["status"]
  ) => void;
  onCreateEvent?: (date?: Date) => void;
  onGoalPress?: (goal: Goal) => void;
  onGoalProgressUpdate?: (goalId: string, newCurrent: number) => void;
  onGoalComplete?: (goalId: string) => void;
  onGoalDelete?: (goalId: string) => void;
  onGoalReactivate?: (goalId: string) => void;
  onCancelReminders?: (goalId: string) => void;
  onSubTabChange?: (subTab: string) => void;
}

export const useTimelineTabLogic = ({
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
  onCancelReminders,
}: UseTimelineTabLogicProps) => {
  const { events, goals } = usePlanning();
  const [activeTab, setActiveTab] = useState<TabType>("events");

  // Notifier le parent du sous-onglet initial
  React.useEffect(() => {
    onSubTabChange?.("events");
  }, [onSubTabChange]);

  // Mémoriser les événements sûrs
  const safeEvents = useMemo(() => {
    return eventUtils.filterSafeEvents(events);
  }, [events]);

  // Handlers pour les objectifs
  const handleGoalPress = useCallback(
    (goal: Goal) => {
      onGoalPress?.(goal);
    },
    [onGoalPress]
  );

  const handleGoalEdit = useCallback(
    (goal: Goal) => {
      onGoalPress?.(goal);
    },
    [onGoalPress]
  );

  const handleGoalDelete = useCallback(
    (goalId: string) => {
      onGoalDelete?.(goalId);
    },
    [onGoalDelete]
  );

  const handleGoalProgressUpdate = useCallback(
    (goalId: string, newCurrent: number) => {
      onGoalProgressUpdate?.(goalId, newCurrent);
    },
    [onGoalProgressUpdate]
  );

  const handleGoalComplete = useCallback(
    (goalId: string) => {
      onGoalComplete?.(goalId);
    },
    [onGoalComplete]
  );

  const handleGoalReactivate = useCallback(
    (goalId: string) => {
      onGoalReactivate?.(goalId);
    },
    [onGoalReactivate]
  );

  const handleCancelReminders = useCallback(
    (goalId: string) => {
      onCancelReminders?.(goalId);
    },
    [onCancelReminders]
  );

  const goalHandlers = useMemo(
    () => ({
      onGoalPress: handleGoalPress,
      onGoalEdit: handleGoalEdit,
      onGoalDelete: handleGoalDelete,
      onGoalProgressUpdate: handleGoalProgressUpdate,
      onGoalComplete: handleGoalComplete,
      onGoalReactivate: handleGoalReactivate,
      onCancelReminders: handleCancelReminders,
    }),
    [
      handleGoalPress,
      handleGoalEdit,
      handleGoalDelete,
      handleGoalProgressUpdate,
      handleGoalComplete,
      handleGoalReactivate,
      handleCancelReminders,
    ]
  );

  // Handlers pour les événements
  const eventHandlers = useMemo(
    () => ({
      onEventPress,
      onEventEdit,
      onEventDelete,
      onEventStatusChange,
      onCreateEvent,
    }),
    [
      onEventPress,
      onEventEdit,
      onEventDelete,
      onEventStatusChange,
      onCreateEvent,
    ]
  );

  // Handler pour changer d'onglet
  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      onSubTabChange?.(tab);
    },
    [onSubTabChange]
  );

  return {
    activeTab,
    safeEvents,
    goals,
    eventHandlers,
    goalHandlers,
    handleTabChange,
  };
};
