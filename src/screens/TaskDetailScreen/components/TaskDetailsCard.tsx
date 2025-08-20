import React from "react";
import { View } from "react-native";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { Task } from "../../../types/planning";
import { styles } from "../styles";
import { PRIORITY_LABELS } from "../constants";
import { TaskDetailsCardProps } from "../types";
import { getPriorityColor, formatDate } from "../utils";

export const TaskDetailsCard: React.FC<TaskDetailsCardProps> = ({ task }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const getPriorityLabel = (priority: Task["priority"]) => {
    return PRIORITY_LABELS[priority] || priority;
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        },
      ]}
    >
      {/* Description */}
      {task.description && (
        <View style={styles.descriptionContainer}>
          <UIText size="base" style={styles.descriptionText}>
            {task.description}
          </UIText>
        </View>
      )}

      {/* Priority */}
      <View style={styles.detailRow}>
        <UIText
          size="sm"
          weight="semibold"
          color={currentTheme.colors.textSecondary}
        >
          {t("planning.tasks.priority", "Priorité")}
        </UIText>
        <View style={styles.priorityContainer}>
          <View
            style={[
              styles.priorityDot,
              {
                backgroundColor: getPriorityColor(
                  task.priority,
                  currentTheme.colors
                ),
              },
            ]}
          />
          <UIText size="base" weight="medium">
            {getPriorityLabel(task.priority)}
          </UIText>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.detailRow}>
        <UIText
          size="sm"
          weight="semibold"
          color={currentTheme.colors.textSecondary}
        >
          {t("planning.tasks.startDate", "Date de début")}
        </UIText>
        <UIText size="base">{formatDate(task.startDate, "fr-FR")}</UIText>
      </View>

      <View style={styles.detailRow}>
        <UIText
          size="sm"
          weight="semibold"
          color={currentTheme.colors.textSecondary}
        >
          {t("planning.tasks.dueDate", "Date d'échéance")}
        </UIText>
        <UIText
          size="base"
          color={
            task.dueDate && new Date(task.dueDate) < new Date()
              ? currentTheme.colors.error
              : currentTheme.colors.text
          }
        >
          {formatDate(task.dueDate, "fr-FR")}
        </UIText>
      </View>

      {/* Estimated Hours */}
      {task.estimatedHours && (
        <View style={styles.detailRow}>
          <UIText
            size="sm"
            weight="semibold"
            color={currentTheme.colors.textSecondary}
          >
            {t("planning.tasks.estimatedHours", "Heures estimées")}
          </UIText>
          <UIText size="base">{task.estimatedHours}h</UIText>
        </View>
      )}

      {/* Category */}
      {task.category && (
        <View style={styles.detailRow}>
          <UIText
            size="sm"
            weight="semibold"
            color={currentTheme.colors.textSecondary}
          >
            {t("planning.tasks.category", "Catégorie")}
          </UIText>
          <UIText size="base">{task.category}</UIText>
        </View>
      )}
    </View>
  );
};
