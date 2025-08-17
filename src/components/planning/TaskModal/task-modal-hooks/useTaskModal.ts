import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "../../../../hooks/useTranslation";
import { useTaskForm } from "../hooks/useTaskForm";
import { TabType } from "../task-modal-types";
import { TaskModalProps } from "../types";

export const useTaskModal = (props: TaskModalProps) => {
  const { visible, task, initialStatus, onClose, onSave } = props;
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>("details");

  const {
    formState,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
    hasChanges,
    isValid,
  } = useTaskForm({ task, initialStatus, onSave });

  // Déterminer le titre du modal
  const modalTitle = task
    ? t("planning.tasks.taskModal.editTask", "Modifier la tâche")
    : t("planning.tasks.taskModal.createTask", "Nouvelle tâche");

  // Gestion de la fermeture
  const handleClose = useCallback(() => {
    if (hasChanges) {
      // Demander confirmation si des changements non sauvegardés
      Alert.alert(
        t(
          "planning.tasks.taskModal.unsavedChangesTitle",
          "Changements non sauvegardés"
        ),
        t(
          "planning.tasks.taskModal.unsavedChangesMessage",
          "Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?"
        ),
        [
          {
            text: t("common.cancel", "Annuler"),
            style: "cancel",
          },
          {
            text: t(
              "planning.tasks.taskModal.closeAnyway",
              "Fermer quand même"
            ),
            style: "destructive",
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } else {
      resetForm();
      onClose();
    }
  }, [hasChanges, resetForm, onClose, t]);

  // Gestion de la sauvegarde
  const handleSave = useCallback(async () => {
    try {
      await handleSubmit();
      // La fermeture du modal est gérée par le parent (ex: TasksTabContent)
    } catch (error) {}
  }, [handleSubmit]);

  // Gestion du changement d'onglet
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return {
    // État
    activeTab,
    modalTitle,

    // Form state et actions
    formState,
    isSubmitting,
    hasChanges,
    isValid,
    updateField,

    // Actions du modal
    handleClose,
    handleSave,
    handleTabChange,
  };
};
