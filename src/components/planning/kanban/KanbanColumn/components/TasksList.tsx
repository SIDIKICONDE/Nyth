import React from "react";
import { ScrollView } from "react-native";
import { TaskCardWithContextMenu } from "../../TaskCard";
import { styles } from "../styles";
import { TasksListProps } from "../types";

export const TasksList: React.FC<TasksListProps> = ({
  tasks,
  onTaskPress,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  customStyles,
}) => {
  return (
    <ScrollView
      style={styles.tasksList}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.tasksContent,
        {
          padding: customStyles?.column?.padding || 12,
          gap: customStyles?.card?.marginBottom || 8,
        },
      ]}
    >
      {tasks.map((task) => (
        <TaskCardWithContextMenu
          key={task.id}
          task={task}
          onPress={() => onTaskPress?.(task)}
          onEdit={() => onTaskEdit(task)}
          onDelete={() => onTaskDelete(task.id)}
          onStatusChange={onTaskStatusChange}
          customStyles={customStyles?.card}
          enableContextMenu={true}
        />
      ))}
    </ScrollView>
  );
};
