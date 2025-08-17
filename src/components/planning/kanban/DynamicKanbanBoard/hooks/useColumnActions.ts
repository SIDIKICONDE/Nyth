import { useState } from "react";
import { Alert } from "react-native";
import {
  ColumnFormData,
  DynamicKanbanColumn,
} from "../../../../../types/planning";
import { UseColumnActionsProps } from "../types";

export const useColumnActions = ({
  createColumn,
  updateColumn,
  deleteColumn,
  canDeleteColumn,
}: UseColumnActionsProps) => {
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<
    DynamicKanbanColumn | undefined
  >();

  // Handlers pour les colonnes
  const handleCreateColumn = () => {
    setSelectedColumn(undefined);
    setShowColumnModal(true);
  };

  const handleEditColumn = (column: DynamicKanbanColumn) => {
    setSelectedColumn(column);
    setShowColumnModal(true);
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!canDeleteColumn(columnId)) {
      Alert.alert(
        "Suppression impossible",
        "Cette colonne ne peut pas être supprimée car elle est par défaut ou c'est la dernière colonne."
      );
      return;
    }

    Alert.alert(
      "Supprimer la colonne",
      "Êtes-vous sûr de vouloir supprimer cette colonne ? Les tâches seront déplacées vers la première colonne.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteColumn(columnId);
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la colonne");
            }
          },
        },
      ]
    );
  };

  const handleSaveColumn = async (formData: ColumnFormData) => {
    if (selectedColumn) {
      // Mode édition
      await updateColumn(selectedColumn.id, formData);
    } else {
      // Mode création
      await createColumn(formData);
    }
  };

  const handleCloseModal = () => {
    setShowColumnModal(false);
    setSelectedColumn(undefined);
  };

  return {
    showColumnModal,
    selectedColumn,
    handleCreateColumn,
    handleEditColumn,
    handleDeleteColumn,
    handleSaveColumn,
    handleCloseModal,
  };
};
