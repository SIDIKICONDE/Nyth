import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { UIText } from "../../../components/ui/Typography";
import { TaskModal } from "../../../components/planning/TaskModal";
import { DynamicKanbanBoard } from "../../../components/planning/kanban/DynamicKanbanBoard";
import { useLayoutPreferences } from "../../../contexts/LayoutPreferencesContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTasks } from "../../../hooks/useTasks";
import { useTranslation } from "../../../hooks/useTranslation";
import { Task, TaskFormData } from "../../../types/planning";
import { RootStackParamList } from "../../../types/navigation";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('TasksTabContent');

type NavigationProp = StackNavigationProp<RootStackParamList>;

const TasksTabContentComponent: React.FC = () => {
  const { currentTheme } = useTheme();
  const { preferences } = useLayoutPreferences();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
  } = useTasks();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskToCreate, setTaskToCreate] = useState<string | null>(null);

  // Toujours appeler les hooks (useMemo) avant tout return conditionnel
  const kanbanTasks = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        columnId: task.status,
        status: task.status,
      })),
    [tasks]
  );

  // Handler pour déplacer une tâche entre colonnes
  const handleTaskMove = useCallback(
    async (taskId: string, newColumnId: string) => {
      // Pour la compatibilité, on utilise newColumnId comme status
      const success = await updateTaskStatus(
        taskId,
        newColumnId as Task["status"]
      );
      if (success) {
        logger.debug(`Task ${taskId} moved to ${newColumnId}`);
      }
    },
    [updateTaskStatus]
  );

  // Handler pour changer le statut d'une tâche via le menu contextuel
  const handleTaskStatusChange = useCallback(
    async (task: any, newStatus: string) => {
      logger.debug(
        `🔄 Changement de statut pour la tâche ${task.id}: ${task.status} -> ${newStatus}`
      );
      await handleTaskMove(task.id, newStatus);
    },
    [handleTaskMove]
  );

  // Handler pour appuyer sur une tâche - naviguer vers l'écran de détails
  const handleTaskPress = useCallback(
    (task: any) => {
      navigation.navigate("TaskDetail", { taskId: task.id });
    },
    [navigation]
  );

  // Handler pour créer une nouvelle tâche
  const handleTaskCreate = useCallback((columnId: string) => {
    setTaskToCreate(columnId);
    setSelectedTask(null);
    setShowTaskModal(true);
  }, []);

  // Handler pour éditer une tâche
  const handleTaskEdit = useCallback((task: any) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  }, []);

  // Handler pour supprimer une tâche
  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      Alert.alert(
        t("planning.tasks.deleteTitle", "Supprimer la Tâche"),
        t(
          "planning.tasks.deleteMessage",
          "Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible."
        ),
        [
          {
            text: t("common.cancel", "Annuler"),
            style: "cancel",
          },
          {
            text: t("planning.tasks.deleteConfirm", "Supprimer"),
            style: "destructive",
            onPress: async () => {
              await deleteTask(taskId);
            },
          },
        ]
      );
    },
    [deleteTask, t]
  );

  // Handler pour sauvegarder une tâche
  const handleTaskSave = useCallback(
    async (taskData: TaskFormData) => {
      try {
        if (selectedTask) {
          // Mise à jour d'une tâche existante
          const success = await updateTask(selectedTask.id, taskData);
          if (success) {
            setShowTaskModal(false);
            setSelectedTask(null);
          } else {
            throw new Error("Échec de la mise à jour de la tâche");
          }
        } else {
          // Création d'une nouvelle tâche avec le statut de la colonne
          const taskDataWithStatus = {
            ...taskData,
            status: (taskToCreate || "todo") as Task["status"],
          };
          const taskId = await createTask(taskDataWithStatus);
          logger.debug("🔍 TasksTabContent - createTask returned:", taskId);
          // Fermer le modal si la création a réussi (taskId est une chaîne non vide)
          if (taskId && taskId.length > 0) {
            logger.debug(
              "✅ TasksTabContent - Fermeture du modal après création réussie"
            );
            setShowTaskModal(false);
            setTaskToCreate(null);
          } else {
            logger.debug(
              "❌ TasksTabContent - Échec de la création, modal reste ouvert"
            );
            throw new Error("Échec de la création de la tâche");
          }
        }
      } catch (error) {
        logger.error("Error saving task:", error);
        Alert.alert(
          t("planning.tasks.saveErrorTitle", "Error"),
          t("planning.tasks.saveErrorMessage", "Unable to save the task")
        );
        // Relancer l'erreur pour empêcher la fermeture du modal
        throw error;
      }
    },
    [selectedTask, taskToCreate, updateTask, createTask, t]
  );

  // Handler pour fermer la modal
  const handleCloseModal = useCallback(() => {
    setShowTaskModal(false);
    setSelectedTask(null);
    setTaskToCreate(null);
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <UIText color={currentTheme.colors.textSecondary}>
          {t("planning.tasks.loading", "Chargement des tâches...")}
        </UIText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <UIText color={currentTheme.colors.error}>
          {t("planning.tasks.error", "Impossible de charger les tâches")}
        </UIText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DynamicKanbanBoard
        tasks={kanbanTasks}
        onTaskMove={handleTaskMove}
        onTaskPress={(t) => handleTaskPress(t as unknown as Task)}
        onTaskCreate={handleTaskCreate}
        onTaskEdit={(t) => handleTaskEdit(t as unknown as Task)}
        onTaskDelete={handleTaskDelete}
        onTaskStatusChange={(t, newStatus) =>
          handleTaskStatusChange(t as unknown as Task, newStatus)
        }
      />

      {/* Modal de création/édition de tâches */}
      <TaskModal
        visible={showTaskModal}
        task={selectedTask || undefined}
        initialStatus={(taskToCreate || "todo") as Task["status"]}
        onClose={handleCloseModal}
        onSave={handleTaskSave}
      />
    </View>
  );
};

export const TasksTabContent = React.memo(TasksTabContentComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
