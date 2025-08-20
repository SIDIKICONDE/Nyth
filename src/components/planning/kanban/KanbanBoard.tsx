import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLayoutPreferences } from "../../../contexts/LayoutPreferencesContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { KanbanBoardProps, Task } from "../../../types/planning";
import { KanbanColumn } from "./KanbanColumn";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('KanbanBoard');

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskMove,
  onTaskPress,
  onTaskCreate,
  onTaskEdit,
  onTaskDelete,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getKanbanStyles, preferences } = useLayoutPreferences();

  // Définir les colonnes avec traductions
  const KANBAN_COLUMNS = React.useMemo(
    () => [
      {
        id: "todo" as const,
        title: t("planning.tasks.kanban.defaultColumns.todo", "To Do"),
        color: "#6B7280",
      },
      {
        id: "in_progress" as const,
        title: t(
          "planning.tasks.kanban.defaultColumns.inProgress",
          "In Progress"
        ),
        color: "#3B82F6",
      },
      {
        id: "review" as const,
        title: t("planning.tasks.kanban.defaultColumns.review", "Review"),
        color: "#F59E0B",
      },
      {
        id: "completed" as const,
        title: t("planning.tasks.kanban.defaultColumns.completed", "Completed"),
        color: "#10B981",
      },
      {
        id: "blocked" as const,
        title: t("planning.tasks.kanban.defaultColumns.blocked", "Blocked"),
        color: "#EF4444",
      },
    ],
    [t]
  );

  // Recalculer les styles à chaque changement de préférences
  const kanbanStyles = React.useMemo(() => {
    const styles = getKanbanStyles();
    logger.debug("🔄 KanbanBoard styles recalculated:", styles);
    return styles;
  }, [getKanbanStyles, preferences]);

  // Organiser les tâches par statut
  const tasksByStatus = React.useMemo(() => {
    const organized: Record<Task["status"], Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      completed: [],
      blocked: [],
    };

    tasks.forEach((task) => {
      organized[task.status].push(task);
    });

    return organized;
  }, [tasks]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          kanbanStyles.scrollContent,
        ]}
      >
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            tasks={tasksByStatus[column.id]}
            onTaskMove={(taskId, newStatus) =>
              onTaskMove(taskId, newStatus as Task["status"])
            }
            onTaskPress={onTaskPress}
            onTaskCreate={() => onTaskCreate(column.id)}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
            customStyles={kanbanStyles}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
});
