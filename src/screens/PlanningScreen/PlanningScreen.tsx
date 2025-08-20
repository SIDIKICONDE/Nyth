import React, { useCallback, useEffect, useReducer } from "react";
import { Alert, SafeAreaView, View, StatusBar, Platform } from "react-native";
import { CreateEventModal } from "../../components/planning/CreateEventModal";
import { LayoutSettingsButton } from "../../components/planning/LayoutSettingsButton";
import { PlanningCalendar } from "../../components/planning/PlanningCalendar";
import { PlanningSettingsModal } from "../../components/planning/PlanningSettingsModal";
import { TaskModal } from "../../components/planning/TaskModal";
import { GoalModal } from "../../components/planning/create-goal-modal";
import { EventDetailModal } from "../../components/planning/event-timeline/components/EventDetailModal";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { planningService } from "../../services/firebase/planning";
import { Goal, TaskFormData } from "../../types/planning";
import {
  AnalyticsTabContent,
  PlanningScreenHeader,
  PlanningScreenTabs,
  TasksTabContent,
  TimelineTabContent,
} from "./components";
import { PLANNING_TABS } from "./constants";
import { useGlobalPreferencesContext } from "../../contexts/GlobalPreferencesContext";
import { usePlanningScreen } from "./hooks/usePlanningScreen";
import { styles } from "./styles";
import { useWidgetSync } from "../../hooks/useWidgetSync";
import { usePlanning } from "../../hooks/usePlanning";
import { useNotificationSync } from "../../hooks/useNotificationSync";
import { enhancedNotificationService } from "../../services/notifications/EnhancedNotificationService";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('PlanningScreen');

// Reducer pour gérer l'état des modals de manière centralisée
type ModalState = {
  showEditGoalModal: boolean;
  selectedGoal: Goal | undefined;
  showTaskModal: boolean;
  taskInitialStatus: string;
  activeSubTab: string;
};

type ModalAction = 
  | { type: 'OPEN_EDIT_GOAL'; goal: Goal }
  | { type: 'CLOSE_EDIT_GOAL' }
  | { type: 'OPEN_TASK_MODAL'; status: string }
  | { type: 'CLOSE_TASK_MODAL' }
  | { type: 'SET_SUB_TAB'; tab: string };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'OPEN_EDIT_GOAL':
      return { ...state, showEditGoalModal: true, selectedGoal: action.goal };
    case 'CLOSE_EDIT_GOAL':
      return { ...state, showEditGoalModal: false, selectedGoal: undefined };
    case 'OPEN_TASK_MODAL':
      return { ...state, showTaskModal: true, taskInitialStatus: action.status };
    case 'CLOSE_TASK_MODAL':
      return { ...state, showTaskModal: false };
    case 'SET_SUB_TAB':
      return { ...state, activeSubTab: action.tab };
    default:
      return state;
  }
};

const initialModalState: ModalState = {
  showEditGoalModal: false,
  selectedGoal: undefined,
  showTaskModal: false,
  taskInitialStatus: "todo",
  activeSubTab: "events",
};

export const PlanningScreen: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { goals, deleteGoal } = usePlanning();
  useNotificationSync();
  const { planningPreferences, updatePlanningPreferences } =
    useGlobalPreferencesContext();

  // Synchronisation avec le widget iOS
  const { forceWidgetUpdate } = useWidgetSync(goals);
  const {
    // État
    activeTab,
    showEventModal,
    showGoalModal,
    showSettingsModal,
    selectedEvent,
    selectedDate,
    showEventDetailModal,

    // Setters
    setActiveTab,
    setShowEventModal,
    setShowGoalModal,
    setShowSettingsModal,
    setSelectedEvent,

    // Handlers
    handleEventPress,
    handleEventEdit,
    handleEventSave,
    handleEventDelete,
    handleEventStatusChange,
    handleDatePress,
    handleCreateEvent,
    handleEventCreate,
    handleGoalCreated,
    handleCreateEventFromHeader,
    handleOpenGoalModal,
    handleOpenSettingsModal,
    handleCloseEventModal,
    handleCloseEventDetailModal,
  } = usePlanningScreen();

  // Utiliser useReducer pour gérer l'état des modals de manière centralisée
  const [modalState, dispatch] = useReducer(modalReducer, initialModalState);

  // Handlers pour les objectifs
  const handleGoalPress = useCallback((goal: Goal) => {
    dispatch({ type: 'OPEN_EDIT_GOAL', goal });
  }, []);

  const handleGoalUpdated = useCallback((updatedGoal: Goal) => {
    logger.debug("Goal updated:", updatedGoal);
    dispatch({ type: 'CLOSE_EDIT_GOAL' });
  }, []);

  // Handlers pour les tâches
  const handleCreateTask = useCallback((initialStatus: string = "todo") => {
    dispatch({ type: 'OPEN_TASK_MODAL', status: initialStatus });
  }, []);

  const handleTaskSave = useCallback((taskData: TaskFormData) => {
    logger.debug("Task saved:", taskData);
    dispatch({ type: 'CLOSE_TASK_MODAL' });
  }, []);

  // Handler pour le changement de sous-onglet
  const handleSubTabChange = useCallback((subTab: string) => {
    dispatch({ type: 'SET_SUB_TAB', tab: subTab });
  }, []);

  // Handlers pour la progression des objectifs
  const handleGoalProgressUpdate = useCallback(
    async (goalId: string, newCurrent: number) => {
      try {
        await planningService.updateGoalProgress(goalId, newCurrent);
        logger.debug("Goal progress updated:", goalId, newCurrent);
      } catch (error) {
        logger.error("Error updating goal progress:", error);
        Alert.alert(
          t("common.error", "Error"),
          t(
            "planning.events.errors.updateProgressFailed",
            "Unable to update goal progress"
          )
        );
      }
    },
    []
  );

  const handleGoalComplete = useCallback(async (goalId: string) => {
    try {
      await planningService.updateGoal(goalId, {
        status: "completed",
        progress: 100,
        completedAt: new Date().toISOString(),
      });
      logger.debug("Goal marked as completed:", goalId);
    } catch (error) {
      logger.error("Error completing goal:", error);
      Alert.alert(
        t("common.error", "Error"),
        t(
          "planning.events.errors.markCompletedFailed",
          "Unable to mark goal as completed"
        )
      );
    }
  }, []);

  const handleGoalDelete = useCallback(
    async (goalId: string) => {
      try {
        await deleteGoal(goalId);
        logger.debug("Goal deleted:", goalId);
        Alert.alert(
          t("common.success", "Success"),
          t("planning.success.goalDeleted", "Goal deleted successfully")
        );
      } catch (error) {
        logger.error("Error deleting goal:", error);
        Alert.alert(
          t("common.error", "Error"),
          t("planning.events.errors.deleteFailed", "Unable to delete goal")
        );
      }
    },
    [t, deleteGoal]
  );

  const handleGoalReactivate = useCallback(
    async (goalId: string) => {
      try {
        await planningService.updateGoal(goalId, { status: "active" });
        logger.debug("Goal reactivated:", goalId);
        Alert.alert(
          t("common.success", "Success"),
          t("planning.success.goalReactivated", "Goal reactivated successfully")
        );
      } catch (error) {
        logger.error("Error reactivating goal:", error);
        Alert.alert(
          t("common.error", "Error"),
          t(
            "planning.events.errors.reactivateFailed",
            "Unable to reactivate goal"
          )
        );
      }
    },
    [t]
  );

  const handleGoalCancelReminders = useCallback(async (goalId: string) => {
    try {
      await enhancedNotificationService.cancelGoalNotifications(goalId);
      Alert.alert(
        t("common.success", "Success"),
        t(
          "planning.success.goalRemindersCancelled",
          "Rappels de l'objectif annulés"
        )
      );
    } catch (error) {
      Alert.alert(t("common.error", "Error"), t("common.retry", "Réessayer"));
    }
  }, []);

  // Demander la permission de notification uniquement sur cet écran
  useEffect(() => {
    const initNotifications = async () => {
      try {
        const { enhancedNotificationService } = await import(
          "../../services/notifications/EnhancedNotificationService"
        );
        await enhancedNotificationService.initialize();
        await enhancedNotificationService.requestUserPermission();
      } catch (error) {
        // Ignorer les erreurs; l'utilisateur pourra activer plus tard
      }
    };
    initNotifications();
  }, []);

  // Rendre toutes les vues montées et masquer/afficher par style pour éviter les délais de re-montage

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <StatusBar
        barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.colors.surface}
        translucent
      />
      
      {/* Header */}
      <PlanningScreenHeader
        activeTab={activeTab}
        activeSubTab={activeTab === "timeline" ? modalState.activeSubTab : undefined}
        onCreateEvent={handleCreateEventFromHeader}
        onCreateGoal={handleOpenGoalModal}
        onOpenSettings={handleOpenSettingsModal}
      />

      {/* Tabs */}
      <PlanningScreenTabs
        tabs={PLANNING_TABS}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          // Réinitialiser le sous-onglet quand on change d'onglet principal
          if (tab !== "timeline") {
            dispatch({ type: 'SET_SUB_TAB', tab: "events" });
          }
          try {
            const next = { ...(planningPreferences || {}), defaultTab: tab };
            updatePlanningPreferences(next);
          } catch (e) {}
        }}
      />

      {/* Content: montage conditionnel pour optimiser la mémoire */}
      <View style={styles.content}>
        {activeTab === "timeline" && (
          <TimelineTabContent
            onEventPress={handleEventPress}
            onEventEdit={handleEventEdit}
            onEventDelete={handleEventDelete}
            onEventStatusChange={handleEventStatusChange}
            onCreateEvent={(date?: Date) =>
              handleCreateEvent(date || new Date())
            }
            onGoalPress={handleGoalPress}
            onGoalProgressUpdate={handleGoalProgressUpdate}
            onGoalComplete={handleGoalComplete}
            onGoalDelete={handleGoalDelete}
            onGoalReactivate={handleGoalReactivate}
            onCancelReminders={handleGoalCancelReminders}
            onSubTabChange={handleSubTabChange}
            onCreateGoal={handleOpenGoalModal}
          />
        )}

        {activeTab === "tasks" && <TasksTabContent />}

        

        {activeTab === "calendar" && (
          <PlanningCalendar
            onEventPress={handleEventPress}
            onDatePress={handleDatePress}
            onCreateEvent={handleCreateEvent}
            onCreateGoal={handleOpenGoalModal}
            onCreateTask={() => handleCreateTask("todo")}
          />
        )}

        {activeTab === "analytics" && <AnalyticsTabContent />}
      </View>

      {/* Bouton de paramètres de layout */}
      <LayoutSettingsButton activeTab={activeTab} />

      {/* Modals */}
      <CreateEventModal
        visible={showEventModal}
        event={selectedEvent}
        onClose={handleCloseEventModal}
        onCreate={handleEventCreate}
        onSave={handleEventSave}
        selectedDate={selectedDate}
      />

      <EventDetailModal
        visible={showEventDetailModal}
        event={selectedEvent}
        onClose={handleCloseEventDetailModal}
        onEdit={handleEventEdit}
        onDelete={handleEventDelete}
        onStatusChange={handleEventStatusChange}
      />

      <GoalModal
        visible={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onGoalCreated={
          handleGoalCreated ||
          (() => logger.debug("handleGoalCreated not available"))
        }
      />

      {/* Modal d'édition d'objectif */}
      <GoalModal
        visible={modalState.showEditGoalModal}
        goal={modalState.selectedGoal}
        onClose={() => dispatch({ type: 'CLOSE_EDIT_GOAL' })}
        onGoalUpdated={handleGoalUpdated}
      />

      {/* Modal de création/édition de tâches */}
      <TaskModal
        visible={modalState.showTaskModal}
        initialStatus={modalState.taskInitialStatus as any}
        onClose={() => dispatch({ type: 'CLOSE_TASK_MODAL' })}
        onSave={handleTaskSave}
      />

      <PlanningSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </View>
  );
};
