import React from "react";
import { View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  AddTaskButton,
  ColumnHeader,
  LimitWarning,
  TasksList,
} from "./components";
import { styles } from "./styles";
import { KanbanColumnProps } from "./types";

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  color,
  tasks,
  onTaskMove,
  onTaskPress,
  onTaskCreate,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  customStyles,
  onColumnEdit,
  onColumnDelete,
  onCycleColor,
  availableColors,
  onSelectColor,
  canDelete = false,
  description,
  maxTasks,
  icon,
  borderStyle,
}) => {
  const { currentTheme } = useTheme();

  const handleTaskDrop = (taskId: string) => {
    onTaskMove(taskId, id);
  };

  const isAtMaxCapacity = maxTasks ? tasks.length >= maxTasks : false;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: currentTheme.colors.surface,
          justifyContent: "space-between",
          flex: 1,
        },
        customStyles?.column,
      ]}
    >
      <View style={{ flex: 1 }}>
        <ColumnHeader
          title={title}
          color={color}
          description={description}
          tasksCount={tasks.length}
          maxTasks={maxTasks}
          onColumnEdit={onColumnEdit}
          onColumnDelete={onColumnDelete}
          onCycleColor={onCycleColor}
          availableColors={availableColors}
          onSelectColor={onSelectColor}
          themeColors={currentTheme.colors}
          icon={icon}
          borderStyle={borderStyle}
        />

        <LimitWarning
          color={color}
          maxTasks={maxTasks || 0}
          isVisible={isAtMaxCapacity}
        />

        <TasksList
          tasks={tasks}
          onTaskPress={onTaskPress}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onTaskStatusChange={onTaskStatusChange}
          customStyles={customStyles}
        />
      </View>

      <AddTaskButton
        onTaskCreate={onTaskCreate}
        color={color}
        isAtMaxCapacity={isAtMaxCapacity}
        themeColors={currentTheme.colors}
      />
    </View>
  );
};
