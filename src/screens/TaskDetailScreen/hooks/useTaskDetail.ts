import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "../../../hooks/useTranslation";
import { useTasks } from "../../../hooks/useTasks";
import { Task } from "../../../types/planning";

export const useTaskDetail = (taskId: string) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { tasks, updateTaskStatus, updateTask, deleteTask } = useTasks();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusSection, setShowStatusSection] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Trouver la tâche
  const task = tasks.find((t) => t.id === taskId);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleEdit = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(() => {
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
            navigation.goBack();
          },
        },
      ]
    );
  }, [taskId, deleteTask, navigation, t]);

  const handleStatusChange = useCallback(
    async (newStatus: Task["status"]) => {
      await updateTaskStatus(taskId, newStatus);
    },
    [taskId, updateTaskStatus]
  );

  const handleTaskSave = useCallback(
    async (taskData: any) => {
      try {
        await updateTask(taskId, taskData);
        setShowEditModal(false);
      } catch (error) {}
    },
    [taskId, updateTask]
  );

  const handleMenuPress = useCallback(() => {
    setShowMenu(!showMenu);
  }, [showMenu]);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleToggleStatusSection = useCallback(() => {
    setShowStatusSection(!showStatusSection);
  }, [showStatusSection]);

  const handleToggleSubtask = useCallback(
    async (subtaskId: string) => {
      if (!task) return;

      const subtaskIndex = task.subtasks?.findIndex((s) => s.id === subtaskId);
      if (subtaskIndex === undefined || subtaskIndex === -1) return;

      const subtask = task.subtasks![subtaskIndex];
      const newStatus = subtask.status === "completed" ? "todo" : "completed";

      const updatedSubtasks = [...(task.subtasks || [])];
      const updatedSubtask = {
        ...subtask,
        status: newStatus as "todo" | "completed",
        updatedAt: new Date().toISOString(),
      };

      // Ajouter completedAt seulement si la tâche est terminée
      if (newStatus === "completed") {
        updatedSubtask.completedAt = new Date().toISOString();
      } else {
        // Retirer le champ completedAt si la tâche n'est plus terminée
        delete updatedSubtask.completedAt;
      }

      updatedSubtasks[subtaskIndex] = updatedSubtask;

      try {
        await updateTask(taskId, {
          ...task,
          subtasks: updatedSubtasks,
        });
      } catch (error) {}
    },
    [task, taskId, updateTask]
  );

  return {
    task,
    showEditModal,
    showStatusSection,
    showMenu,
    handleGoBack,
    handleEdit,
    handleDelete,
    handleStatusChange,
    handleTaskSave,
    handleMenuPress,
    handleCloseMenu,
    handleToggleStatusSection,
    handleToggleSubtask,
    setShowEditModal,
  };
};
