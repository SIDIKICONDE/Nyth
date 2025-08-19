import React, { useCallback, useEffect, useReducer, useState } from "react";
import { Alert, SafeAreaView, View, StatusBar, Platform, ScrollView, ActivityIndicator } from "react-native";
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
import { Goal, TaskFormData, Task } from "../../types/planning";
import {
  AnalyticsTabContent,
  PlanningScreenHeader,
  PlanningScreenTabs,
  TasksTabContent,
  TimelineTabContent,
} from "./components";
import { TeamsTabContent } from "./components/teams/TeamsTabContent";
import { PLANNING_TABS } from "./constants";
import { useGlobalPreferencesContext } from "../../contexts/GlobalPreferencesContext";
import { usePlanningScreen } from "./hooks/usePlanningScreen";
import { styles } from "./styles";
import { useWidgetSync } from "../../hooks/useWidgetSync";
import { usePlanning } from "../../hooks/usePlanning";
import { useNotificationSync } from "../../hooks/useNotificationSync";
import { enhancedNotificationService } from "../../services/notifications/EnhancedNotificationService";
import { UIText } from "../../components/ui/Typography";
import Icon from "react-native-vector-icons/Ionicons";
import { createOptimizedLogger } from '../../utils/optimizedLogger';

const logger = createOptimizedLogger('PlanningScreenEnhanced');

// Ajout de types pour les filtres et les vues
type FilterOptions = {
  priority: 'all' | 'high' | 'medium' | 'low';
  status: 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  customDateRange?: { start: Date; end: Date };
  categories: string[];
  team?: string;
};

type ViewMode = 'list' | 'kanban' | 'calendar' | 'timeline' | 'gantt';

// Enhanced PLANNING_TABS with teams
const ENHANCED_PLANNING_TABS = [
  ...PLANNING_TABS,
  { id: "teams", label: "planning.tabs.teams", icon: "people-outline" },
];

// Reducer pour gérer l'état des modals et des filtres
type ModalState = {
  showEditGoalModal: boolean;
  selectedGoal: Goal | undefined;
  showTaskModal: boolean;
  taskInitialStatus: string;
  activeSubTab: string;
  showFilterModal: boolean;
  filters: FilterOptions;
  viewMode: ViewMode;
  showSearchModal: boolean;
  searchQuery: string;
  showBulkActionModal: boolean;
  selectedItems: string[];
  showTemplateModal: boolean;
  showImportExportModal: boolean;
};

type ModalAction = 
  | { type: 'OPEN_EDIT_GOAL'; goal: Goal }
  | { type: 'CLOSE_EDIT_GOAL' }
  | { type: 'OPEN_TASK_MODAL'; status: string }
  | { type: 'CLOSE_TASK_MODAL' }
  | { type: 'SET_SUB_TAB'; tab: string }
  | { type: 'TOGGLE_FILTER_MODAL' }
  | { type: 'UPDATE_FILTERS'; filters: Partial<FilterOptions> }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'TOGGLE_SEARCH_MODAL' }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'TOGGLE_BULK_ACTION_MODAL' }
  | { type: 'SET_SELECTED_ITEMS'; items: string[] }
  | { type: 'TOGGLE_TEMPLATE_MODAL' }
  | { type: 'TOGGLE_IMPORT_EXPORT_MODAL' };

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
    case 'TOGGLE_FILTER_MODAL':
      return { ...state, showFilterModal: !state.showFilterModal };
    case 'UPDATE_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };
    case 'TOGGLE_SEARCH_MODAL':
      return { ...state, showSearchModal: !state.showSearchModal };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    case 'TOGGLE_BULK_ACTION_MODAL':
      return { ...state, showBulkActionModal: !state.showBulkActionModal };
    case 'SET_SELECTED_ITEMS':
      return { ...state, selectedItems: action.items };
    case 'TOGGLE_TEMPLATE_MODAL':
      return { ...state, showTemplateModal: !state.showTemplateModal };
    case 'TOGGLE_IMPORT_EXPORT_MODAL':
      return { ...state, showImportExportModal: !state.showImportExportModal };
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
  showFilterModal: false,
  filters: {
    priority: 'all',
    status: 'all',
    dateRange: 'all',
    categories: [],
  },
  viewMode: 'list',
  showSearchModal: false,
  searchQuery: '',
  showBulkActionModal: false,
  selectedItems: [],
  showTemplateModal: false,
  showImportExportModal: false,
};

// Composant pour afficher les statistiques en temps réel
const QuickStats: React.FC<{ goals: Goal[], tasks: Task[] }> = ({ goals, tasks }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <View style={[statsStyles.container, { backgroundColor: currentTheme.colors.surface }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={statsStyles.statItem}>
          <Icon name="flag-outline" size={20} color={currentTheme.colors.primary} />
          <UIText style={statsStyles.statValue}>{activeGoals}</UIText>
          <UIText style={statsStyles.statLabel}>{t("planning.stats.activeGoals", "Active Goals")}</UIText>
        </View>
        <View style={statsStyles.statItem}>
          <Icon name="checkmark-circle-outline" size={20} color={currentTheme.colors.success} />
          <UIText style={statsStyles.statValue}>{completedGoals}</UIText>
          <UIText style={statsStyles.statLabel}>{t("planning.stats.completedGoals", "Completed")}</UIText>
        </View>
        <View style={statsStyles.statItem}>
          <Icon name="list-outline" size={20} color={currentTheme.colors.warning} />
          <UIText style={statsStyles.statValue}>{pendingTasks}</UIText>
          <UIText style={statsStyles.statLabel}>{t("planning.stats.pendingTasks", "Pending")}</UIText>
        </View>
        <View style={statsStyles.statItem}>
          <Icon name="time-outline" size={20} color={currentTheme.colors.info} />
          <UIText style={statsStyles.statValue}>{inProgressTasks}</UIText>
          <UIText style={statsStyles.statLabel}>{t("planning.stats.inProgress", "In Progress")}</UIText>
        </View>
      </ScrollView>
    </View>
  );
};

// Composant principal amélioré
export const PlanningScreenEnhanced: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { goals, deleteGoal, tasks } = usePlanning();
  useNotificationSync();
  const { planningPreferences, updatePlanningPreferences } =
    useGlobalPreferencesContext();

  // États supplémentaires
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

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

  // Handler pour la synchronisation manuelle
  const handleManualSync = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      // Implémenter la logique de synchronisation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulation
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (error) {
      setSyncStatus('error');
      Alert.alert(
        t("planning.sync.error", "Sync Error"),
        t("planning.sync.errorMessage", "Unable to sync data")
      );
    }
  }, [t]);

  // Handler pour les actions en masse
  const handleBulkAction = useCallback(async (action: string) => {
    const { selectedItems } = modalState;
    
    if (selectedItems.length === 0) {
      Alert.alert(
        t("planning.bulk.noSelection", "No Selection"),
        t("planning.bulk.selectItems", "Please select items first")
      );
      return;
    }

    switch (action) {
      case 'delete':
        Alert.alert(
          t("planning.bulk.confirmDelete", "Delete Items"),
          t("planning.bulk.deleteMessage", `Delete ${selectedItems.length} items?`),
          [
            { text: t("common.cancel", "Cancel"), style: "cancel" },
            {
              text: t("common.delete", "Delete"),
              style: "destructive",
              onPress: async () => {
                // Implémenter la suppression en masse
                dispatch({ type: 'SET_SELECTED_ITEMS', items: [] });
                dispatch({ type: 'TOGGLE_BULK_ACTION_MODAL' });
              }
            }
          ]
        );
        break;
      case 'complete':
        // Implémenter la complétion en masse
        break;
      case 'reschedule':
        // Implémenter le rééchelonnement en masse
        break;
    }
  }, [modalState.selectedItems, t]);

  // Handler pour l'import/export
  const handleExport = useCallback(async (format: 'json' | 'csv' | 'pdf') => {
    try {
      // Implémenter l'export selon le format
      Alert.alert(
        t("planning.export.success", "Export Successful"),
        t("planning.export.message", "Data exported successfully")
      );
    } catch (error) {
      Alert.alert(
        t("planning.export.error", "Export Error"),
        t("planning.export.errorMessage", "Unable to export data")
      );
    }
  }, [t]);

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

  // Vérifier la connexion réseau
  useEffect(() => {
    // Implémenter la détection du mode hors ligne
    const checkConnection = async () => {
      // Logique de vérification de connexion
    };
    checkConnection();
  }, []);

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
      
      {/* Header amélioré avec plus d'actions */}
      <View style={enhancedStyles.headerContainer}>
        <PlanningScreenHeader
          activeTab={activeTab}
          activeSubTab={activeTab === "timeline" ? modalState.activeSubTab : undefined}
          onCreateEvent={handleCreateEventFromHeader}
          onCreateGoal={handleOpenGoalModal}
          onOpenSettings={handleOpenSettingsModal}
        />
        
        {/* Barre d'actions supplémentaires */}
        <View style={enhancedStyles.actionBar}>
          <Pressable 
            style={enhancedStyles.actionButton}
            onPress={() => dispatch({ type: 'TOGGLE_SEARCH_MODAL' })}
          >
            <Icon name="search-outline" size={20} color={currentTheme.colors.text} />
          </Pressable>
          
          <Pressable 
            style={enhancedStyles.actionButton}
            onPress={() => dispatch({ type: 'TOGGLE_FILTER_MODAL' })}
          >
            <Icon name="filter-outline" size={20} color={currentTheme.colors.text} />
            {Object.values(modalState.filters).some(f => f !== 'all' && f.length !== 0) && (
              <View style={enhancedStyles.filterBadge} />
            )}
          </Pressable>
          
          <Pressable 
            style={enhancedStyles.actionButton}
            onPress={handleManualSync}
          >
            <Icon 
              name={syncStatus === 'syncing' ? 'sync' : 'sync-outline'} 
              size={20} 
              color={syncStatus === 'error' ? currentTheme.colors.error : currentTheme.colors.text} 
            />
            {syncStatus === 'syncing' && (
              <ActivityIndicator size="small" style={enhancedStyles.syncIndicator} />
            )}
          </Pressable>
          
          <Pressable 
            style={enhancedStyles.actionButton}
            onPress={() => dispatch({ type: 'TOGGLE_IMPORT_EXPORT_MODAL' })}
          >
            <Icon name="download-outline" size={20} color={currentTheme.colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Statistiques rapides */}
      <QuickStats goals={goals} tasks={tasks || []} />

      {/* Indicateur de mode hors ligne */}
      {isOfflineMode && (
        <View style={[enhancedStyles.offlineIndicator, { backgroundColor: currentTheme.colors.warning }]}>
          <Icon name="cloud-offline-outline" size={16} color={currentTheme.colors.background} />
          <UIText style={enhancedStyles.offlineText}>
            {t("planning.offline.mode", "Offline Mode")}
          </UIText>
        </View>
      )}

      {/* Tabs améliorés */}
      <PlanningScreenTabs
        tabs={ENHANCED_PLANNING_TABS}
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

      {/* Content avec support de différentes vues */}
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

        {activeTab === "tasks" && (
          <View style={styles.content}>
            {/* Sélecteur de vue pour les tâches */}
            <View style={enhancedStyles.viewModeSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(['kanban', 'list', 'calendar'] as ViewMode[]).map((mode) => (
                  <Pressable
                    key={mode}
                    style={[
                      enhancedStyles.viewModeButton,
                      modalState.viewMode === mode && enhancedStyles.viewModeButtonActive,
                      { borderColor: currentTheme.colors.primary }
                    ]}
                    onPress={() => dispatch({ type: 'SET_VIEW_MODE', mode })}
                  >
                    <UIText
                      color={modalState.viewMode === mode ? currentTheme.colors.primary : currentTheme.colors.text}
                    >
                      {t(`planning.viewMode.${mode}`, mode)}
                    </UIText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            
            <TasksTabContent />
          </View>
        )}

        {activeTab === "teams" && <TeamsTabContent />}

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

      {/* Bouton d'action flottant contextuel */}
      <View style={enhancedStyles.fabContainer}>
        <Pressable
          style={[enhancedStyles.fab, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => {
            switch (activeTab) {
              case 'timeline':
                modalState.activeSubTab === 'events' ? handleCreateEventFromHeader() : handleOpenGoalModal();
                break;
              case 'tasks':
                handleCreateTask();
                break;
              case 'calendar':
                handleCreateEvent(selectedDate || new Date());
                break;
              case 'teams':
                // Ouvrir modal de création d'équipe
                break;
            }
          }}
        >
          <Icon 
            name={
              activeTab === 'timeline' && modalState.activeSubTab === 'goals' 
                ? 'flag-outline' 
                : activeTab === 'teams' 
                ? 'people-outline'
                : 'add-outline'
            } 
            size={24} 
            color={currentTheme.colors.background} 
          />
        </Pressable>
        
        {/* Actions secondaires */}
        {modalState.selectedItems.length > 0 && (
          <Pressable
            style={[enhancedStyles.secondaryFab, { backgroundColor: currentTheme.colors.secondary }]}
            onPress={() => dispatch({ type: 'TOGGLE_BULK_ACTION_MODAL' })}
          >
            <UIText color={currentTheme.colors.background}>
              {modalState.selectedItems.length}
            </UIText>
          </Pressable>
        )}
      </View>

      {/* Modals existants */}
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
      
      {/* Nouveaux modals */}
      {/* Modal de filtres avancés */}
      {modalState.showFilterModal && (
        <FilterModal
          visible={modalState.showFilterModal}
          filters={modalState.filters}
          onClose={() => dispatch({ type: 'TOGGLE_FILTER_MODAL' })}
          onApply={(filters) => {
            dispatch({ type: 'UPDATE_FILTERS', filters });
            dispatch({ type: 'TOGGLE_FILTER_MODAL' });
          }}
        />
      )}
      
      {/* Modal de recherche globale */}
      {modalState.showSearchModal && (
        <SearchModal
          visible={modalState.showSearchModal}
          query={modalState.searchQuery}
          onClose={() => dispatch({ type: 'TOGGLE_SEARCH_MODAL' })}
          onSearch={(query) => dispatch({ type: 'SET_SEARCH_QUERY', query })}
        />
      )}
      
      {/* Modal d'actions en masse */}
      {modalState.showBulkActionModal && (
        <BulkActionModal
          visible={modalState.showBulkActionModal}
          selectedCount={modalState.selectedItems.length}
          onClose={() => dispatch({ type: 'TOGGLE_BULK_ACTION_MODAL' })}
          onAction={handleBulkAction}
        />
      )}
      
      {/* Modal de templates */}
      {modalState.showTemplateModal && (
        <TemplateModal
          visible={modalState.showTemplateModal}
          onClose={() => dispatch({ type: 'TOGGLE_TEMPLATE_MODAL' })}
          onSelectTemplate={(template) => {
            // Appliquer le template
            dispatch({ type: 'TOGGLE_TEMPLATE_MODAL' });
          }}
        />
      )}
      
      {/* Modal d'import/export */}
      {modalState.showImportExportModal && (
        <ImportExportModal
          visible={modalState.showImportExportModal}
          onClose={() => dispatch({ type: 'TOGGLE_IMPORT_EXPORT_MODAL' })}
          onExport={handleExport}
          onImport={(file) => {
            // Implémenter l'import
          }}
        />
      )}
    </View>
  );
};

// Styles additionnels
const enhancedStyles = StyleSheet.create({
  headerContainer: {
    // Styles pour le conteneur du header
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
  syncIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewModeSelector: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewModeButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  secondaryFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 70,
    right: 8,
  },
});

const statsStyles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  statItem: {
    marginRight: 24,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});

// Placeholder pour les modals personnalisés (à implémenter)
const FilterModal: React.FC<any> = () => null;
const SearchModal: React.FC<any> = () => null;
const BulkActionModal: React.FC<any> = () => null;
const TemplateModal: React.FC<any> = () => null;
const ImportExportModal: React.FC<any> = () => null;