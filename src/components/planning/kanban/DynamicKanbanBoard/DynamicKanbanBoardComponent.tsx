import React, { useCallback } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLayoutPreferences } from "../../../../contexts/LayoutPreferencesContext";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDynamicKanban } from "../../../../hooks/useDynamicKanban";
import {
  AddColumnButton,
  ColumnList,
  ColumnModalManager,
  LoadingState,
} from "./components";
import { useColumnActions } from "./hooks/useColumnActions";
import { useTaskOrganization } from "./hooks/useTaskOrganization";
import { styles } from "./styles";
import { DynamicKanbanBoardProps } from "./types";
import {
  DynamicKanbanColumn,
  TaskWithDynamicStatus,
} from "../../../../types/planning";

export const DynamicKanbanBoard: React.FC<DynamicKanbanBoardProps> = ({
  tasks: externalTasks,
  onTaskMove: externalOnTaskMove,
  onTaskPress,
  onTaskCreate,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
}) => {
  const { currentTheme } = useTheme();
  const { getKanbanStyles, preferences } = useLayoutPreferences();
  const {
    columns,
    tasks: internalTasks,
    isLoading,
    createColumn,
    updateColumn,
    deleteColumn,
    moveTask,
    getTasksByColumn,
    getNextPresetColor,
    canDeleteColumn,
    PRESET_COLORS,
  } = useDynamicKanban();

  const kanbanStyles = React.useMemo(() => {
    const styles = getKanbanStyles();
    return styles;
  }, [getKanbanStyles, preferences]);

  const handleTaskMove = externalOnTaskMove || moveTask;

  const { getTasksForColumn } = useTaskOrganization({
    externalTasks,
    getTasksByColumn,
  });

  const {
    showColumnModal,
    selectedColumn,
    handleCreateColumn,
    handleEditColumn,
    handleDeleteColumn,
    handleSaveColumn,
    handleCloseModal,
  } = useColumnActions({
    createColumn,
    updateColumn,
    deleteColumn,
    canDeleteColumn,
  });

  const handleCycleColumnColor = useCallback(
    async (column: DynamicKanbanColumn) => {
      const palette = PRESET_COLORS;
      const currentIndex = palette.indexOf(column.color);
      const nextColor =
        currentIndex === -1
          ? palette[0]
          : palette[(currentIndex + 1) % palette.length];
      await updateColumn(column.id, { color: nextColor } as any);
    },
    [PRESET_COLORS, updateColumn]
  );

  const handleSelectColumnColor = useCallback(
    async (column: DynamicKanbanColumn, color: string) => {
      await updateColumn(column.id, { color } as any);
    },
    [updateColumn]
  );

  const getNextColumnId = useCallback(
    (currentColumnId: string): string | undefined => {
      const current = columns.find((c) => c.id === currentColumnId);
      if (!current) return undefined;
      const next = columns.find((c) => c.order === current.order + 1);
      return next?.id;
    },
    [columns]
  );

  const validateTaskForTarget = useCallback(
    (
      task: TaskWithDynamicStatus,
      targetColumn: DynamicKanbanColumn
    ): { valid: boolean; reasons: string[] } => {
      const reasons: string[] = [];

      const targetTasksCount = getTasksForColumn(targetColumn.id).length;
      if (
        typeof targetColumn.maxTasks === "number" &&
        targetTasksCount >= targetColumn.maxTasks
      ) {
        reasons.push("colonne pleine");
      }

      const opts = targetColumn.validationOptions || {};
      if (
        opts.requireAssignee &&
        (!task.assignedTo || task.assignedTo.length === 0)
      ) {
        reasons.push("assigné requis");
      }
      if (opts.requireDueDate && !task.dueDate) {
        reasons.push("date d'échéance requise");
      }
      if (
        opts.requireAttachments &&
        (!task.attachments || task.attachments.length === 0)
      ) {
        reasons.push("pièce jointe requise");
      }
      if (
        opts.requireSubtasks &&
        (!task.subtasks || task.subtasks.length === 0)
      ) {
        reasons.push("au moins une sous-tâche requise");
      }
      if (
        opts.requireDescription &&
        (!task.description || task.description.trim().length === 0)
      ) {
        reasons.push("description requise");
      }
      if (opts.requireTags && (!task.tags || task.tags.length === 0)) {
        reasons.push("tag requis");
      }
      if (opts.minPriority && opts.minPriority !== "none") {
        const order: Record<"low" | "medium" | "high" | "urgent", number> = {
          low: 1,
          medium: 2,
          high: 3,
          urgent: 4,
        };
        const min =
          order[opts.minPriority as "medium" | "high" | "urgent"] || 1;
        const currentPriority =
          (task.priority as "low" | "medium" | "high" | "urgent") || "low";
        const cur = order[currentPriority];
        if (cur < min) reasons.push("priorité insuffisante");
      }

      // Compatibilité règles texte
      const rules = (targetColumn.validationRules || "").toLowerCase();
      if (rules.includes("assignee") || rules.includes("assigné")) {
        if (!task.assignedTo || task.assignedTo.length === 0) {
          if (!reasons.includes("assigné requis"))
            reasons.push("assigné requis");
        }
      }
      if (
        rules.includes("due date") ||
        rules.includes("deadline") ||
        rules.includes("échéance")
      ) {
        if (!task.dueDate) {
          if (!reasons.includes("date d'échéance requise"))
            reasons.push("date d'échéance requise");
        }
      }
      if (rules.includes("attachments") || rules.includes("pièces jointes")) {
        if (!task.attachments || task.attachments.length === 0) {
          if (!reasons.includes("pièce jointe requise"))
            reasons.push("pièce jointe requise");
        }
      }
      if (rules.includes("subtasks") || rules.includes("sous-tâches")) {
        if (!task.subtasks || task.subtasks.length === 0) {
          if (!reasons.includes("au moins une sous-tâche requise"))
            reasons.push("au moins une sous-tâche requise");
        }
      }
      if (rules.includes("description")) {
        if (!task.description || task.description.trim().length === 0) {
          if (!reasons.includes("description requise"))
            reasons.push("description requise");
        }
      }
      if (rules.includes("tags")) {
        if (!task.tags || task.tags.length === 0) {
          if (!reasons.includes("tag requis")) reasons.push("tag requis");
        }
      }
      if (
        rules.includes("priority: high") ||
        rules.includes("priorité: haute")
      ) {
        if (task.priority !== "high" && task.priority !== "urgent") {
          if (!reasons.includes("priorité haute requise"))
            reasons.push("priorité haute requise");
        }
      }

      return { valid: reasons.length === 0, reasons };
    },
    [getTasksForColumn]
  );

  const onTaskStatusChangeInternal = useCallback(
    (task: TaskWithDynamicStatus, newStatus: string) => {
      const currentColumnId = task.columnId || task.status;
      const currentColumn = columns.find((c) => c.id === currentColumnId);
      if (!currentColumn) return;

      // Déterminer la colonne cible
      let targetId: string | undefined = newStatus;
      if (
        (newStatus === "completed" || newStatus === "done") &&
        currentColumn.autoProgress
      ) {
        targetId =
          getNextColumnId(currentColumnId) ||
          columns.find((c) => c.id === "completed")?.id;
      }
      if (!targetId) return;

      const targetColumn = columns.find((c) => c.id === targetId);
      if (!targetColumn) return;

      // Valider les règles d'entrée
      const { valid, reasons } = validateTaskForTarget(task, targetColumn);
      if (!valid) {
        Alert.alert(
          "Validation",
          `Impossible de déplacer la tâche vers "${
            targetColumn.title
          }" :\n- ${reasons.join("\n- ")}`
        );
        return;
      }

      // Appliquer le mouvement
      if (externalOnTaskMove) {
        externalOnTaskMove(task.id, targetId);
      } else {
        handleTaskMove(task.id, targetId);
      }

      // Notifier en aval si un handler est fourni
      onTaskStatusChange?.(task, newStatus);
    },
    [
      columns,
      externalOnTaskMove,
      getNextColumnId,
      handleTaskMove,
      onTaskStatusChange,
      validateTaskForTarget,
    ]
  );

  if (isLoading) {
    return <LoadingState themeColors={currentTheme.colors} />;
  }

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
        contentContainerStyle={[kanbanStyles.scrollContent]}
      >
        <ColumnList
          columns={columns}
          getTasksForColumn={getTasksForColumn}
          handleTaskMove={handleTaskMove}
          onTaskPress={onTaskPress}
          onTaskCreate={onTaskCreate}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onTaskStatusChange={onTaskStatusChangeInternal}
          onColumnEdit={handleEditColumn}
          onColumnDelete={handleDeleteColumn}
          canDeleteColumn={canDeleteColumn}
          kanbanStyles={kanbanStyles}
          onCycleColumnColor={handleCycleColumnColor}
          onSelectColumnColor={handleSelectColumnColor}
          availableColors={PRESET_COLORS}
        />

        <AddColumnButton
          onPress={handleCreateColumn}
          kanbanStyles={kanbanStyles}
          themeColors={currentTheme.colors}
        />
      </ScrollView>

      <ColumnModalManager
        visible={showColumnModal}
        selectedColumn={selectedColumn}
        onClose={handleCloseModal}
        onSave={handleSaveColumn}
        presetColors={PRESET_COLORS}
        suggestedColor={getNextPresetColor()}
      />
    </View>
  );
};
