import React from "react";
import { View, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { Subtask } from "../../../types/planning";
import { styles } from "../styles";

interface SubtasksSectionProps {
  subtasks: Subtask[];
  onToggleSubtask: (subtaskId: string) => Promise<void>;
}

export const SubtasksSection: React.FC<SubtasksSectionProps> = ({
  subtasks,
  onToggleSubtask,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  const completedCount = subtasks.filter(
    (s) => s.status === "completed"
  ).length;
  const progressPercentage = Math.round(
    (completedCount / subtasks.length) * 100
  );

  return (
    <View
      style={[
        styles.subtasksCard,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        },
      ]}
    >
      {/* Header avec progress */}
      <View style={styles.subtasksHeader}>
        <View style={styles.subtasksHeaderLeft}>
          <View
            style={[
              styles.subtasksIcon,
              { backgroundColor: currentTheme.colors.primary + "15" },
            ]}
          >
            <Ionicons
              name="list"
              size={18}
              color={currentTheme.colors.primary}
            />
          </View>
          <View>
            <UIText size="base" weight="semibold">
              {t("planning.tasks.subtasks", "Sous-tâches")}
            </UIText>
            <UIText size="xs" color={currentTheme.colors.textSecondary}>
              {completedCount} / {subtasks.length} terminées
            </UIText>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <UIText
            size="sm"
            weight="semibold"
            color={
              progressPercentage === 100
                ? currentTheme.colors.success
                : currentTheme.colors.primary
            }
          >
            {progressPercentage}%
          </UIText>
        </View>
      </View>

      {/* Barre de progression */}
      <View
        style={[
          styles.progressBar,
          { backgroundColor: currentTheme.colors.border },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor:
                progressPercentage === 100
                  ? currentTheme.colors.success
                  : currentTheme.colors.primary,
            },
          ]}
        />
      </View>

      {/* Liste des sous-tâches */}
      <View style={styles.subtasksList}>
        {subtasks.map((subtask, index) => (
          <View key={subtask.id}>
            <TouchableOpacity
              style={[
                styles.subtaskItemModern,
                {
                  backgroundColor:
                    subtask.status === "completed"
                      ? currentTheme.colors.success + "08"
                      : "transparent",
                },
              ]}
              onPress={() => onToggleSubtask(subtask.id)}
              activeOpacity={0.7}
            >
              <View style={styles.subtaskCheckboxModern}>
                <Ionicons
                  name={
                    subtask.status === "completed"
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={24}
                  color={
                    subtask.status === "completed"
                      ? currentTheme.colors.success
                      : currentTheme.colors.textSecondary
                  }
                />
              </View>

              <View style={styles.subtaskContent}>
                <UIText
                  size="base"
                  weight={subtask.status === "completed" ? "normal" : "medium"}
                  style={{
                    textDecorationLine:
                      subtask.status === "completed" ? "line-through" : "none",
                    color:
                      subtask.status === "completed"
                        ? currentTheme.colors.textSecondary
                        : currentTheme.colors.text,
                  }}
                >
                  {subtask.title}
                </UIText>

                {subtask.description && (
                  <UIText
                    size="sm"
                    color={currentTheme.colors.textSecondary}
                    style={{
                      marginTop: 2,
                      textDecorationLine:
                        subtask.status === "completed"
                          ? "line-through"
                          : "none",
                    }}
                  >
                    {subtask.description}
                  </UIText>
                )}

                <View style={styles.subtaskMeta}>
                  {subtask.priority && (
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor:
                            subtask.priority === "high"
                              ? currentTheme.colors.error + "15"
                              : subtask.priority === "medium"
                              ? currentTheme.colors.warning + "15"
                              : currentTheme.colors.textSecondary + "15",
                        },
                      ]}
                    >
                      <UIText
                        size="xs"
                        weight="medium"
                        color={
                          subtask.priority === "high"
                            ? currentTheme.colors.error
                            : subtask.priority === "medium"
                            ? currentTheme.colors.warning
                            : currentTheme.colors.textSecondary
                        }
                      >
                        {subtask.priority === "high"
                          ? "Haute"
                          : subtask.priority === "medium"
                          ? "Moyenne"
                          : "Basse"}
                      </UIText>
                    </View>
                  )}

                  {subtask.estimatedHours && (
                    <View style={styles.timeBadge}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={currentTheme.colors.textSecondary}
                      />
                      <UIText
                        size="xs"
                        color={currentTheme.colors.textSecondary}
                      >
                        {subtask.estimatedHours}h
                      </UIText>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Séparateur */}
            {index < subtasks.length - 1 && (
              <View
                style={[
                  styles.subtaskSeparator,
                  { backgroundColor: currentTheme.colors.border },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};
