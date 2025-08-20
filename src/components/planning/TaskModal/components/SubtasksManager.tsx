import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Subtask } from "../../../../types/planning";
import { styles } from "../task-modal-styles";

interface SubtasksManagerProps {
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
}

export const SubtasksManager: React.FC<SubtasksManagerProps> = ({
  subtasks,
  onSubtasksChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: `subtask-${Date.now()}`,
      taskId: "temp",
      title: newSubtaskTitle.trim(),
      status: "todo",
      priority: "medium",
      order: subtasks.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubtasksChange([...subtasks, newSubtask]);
    setNewSubtaskTitle("");
  };

  const updateSubtask = (id: string, updates: Partial<Subtask>) => {
    const updatedSubtasks = subtasks.map((subtask) =>
      subtask.id === id
        ? { ...subtask, ...updates, updatedAt: new Date().toISOString() }
        : subtask
    );
    onSubtasksChange(updatedSubtasks);
  };

  const deleteSubtask = (id: string) => {
    Alert.alert(
      t("planning.tasks.subtasks.deleteTitle", "Supprimer la sous-tâche"),
      t(
        "planning.tasks.subtasks.deleteMessage",
        "Êtes-vous sûr de vouloir supprimer cette sous-tâche ?"
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("common.delete", "Supprimer"),
          style: "destructive",
          onPress: () => {
            const filteredSubtasks = subtasks.filter(
              (subtask) => subtask.id !== id
            );
            onSubtasksChange(filteredSubtasks);
          },
        },
      ]
    );
  };

  const toggleSubtaskStatus = (id: string) => {
    const subtask = subtasks.find((s) => s.id === id);
    if (!subtask) return;

    const newStatus: Subtask["status"] =
      subtask.status === "completed" ? "todo" : "completed";

    updateSubtask(id, {
      status: newStatus,
      completedAt:
        newStatus === "completed" ? new Date().toISOString() : undefined,
    });
  };

  const getStatusColor = (status: Subtask["status"]) => {
    switch (status) {
      case "completed":
        return currentTheme.colors.success;
      case "in_progress":
        return currentTheme.colors.primary;
      default:
        return currentTheme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: Subtask["status"]) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "in_progress":
        return "play-circle";
      default:
        return "radio-button-off";
    }
  };

  return (
    <View style={styles.subtasksContainer}>
      {/* Liste des sous-tâches */}
      <ScrollView
        style={styles.subtasksList}
        showsVerticalScrollIndicator={false}
      >
        {subtasks.map((subtask) => (
          <View
            key={subtask.id}
            style={[
              styles.subtaskItem,
              {
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.subtaskStatusButton}
              onPress={() => toggleSubtaskStatus(subtask.id)}
            >
              <Ionicons
                name={getStatusIcon(subtask.status) as any}
                size={20}
                color={getStatusColor(subtask.status)}
              />
            </TouchableOpacity>

            <View style={styles.subtaskContent}>
              <UIText
                size="base"
                style={[
                  styles.subtaskTitle,
                  {
                    color:
                      subtask.status === "completed"
                        ? currentTheme.colors.textSecondary
                        : currentTheme.colors.text,
                    textDecorationLine:
                      subtask.status === "completed" ? "line-through" : "none",
                  },
                ]}
              >
                {subtask.title}
              </UIText>
            </View>

            <TouchableOpacity
              style={styles.subtaskDeleteButton}
              onPress={() => deleteSubtask(subtask.id)}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={currentTheme.colors.error}
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Champ pour ajouter une nouvelle sous-tâche */}
      <View style={styles.addSubtaskContainer}>
        <View
          style={[
            styles.addSubtaskInput,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={currentTheme.colors.textSecondary}
          />
          <TextInput
            style={[
              styles.addSubtaskTextInput,
              { color: currentTheme.colors.text },
            ]}
            value={newSubtaskTitle}
            onChangeText={setNewSubtaskTitle}
            placeholder={t(
              "planning.tasks.subtasks.addPlaceholder",
              "Ajouter une sous-tâche"
            )}
            placeholderTextColor={currentTheme.colors.textSecondary}
            onSubmitEditing={addSubtask}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>
      </View>
    </View>
  );
};
