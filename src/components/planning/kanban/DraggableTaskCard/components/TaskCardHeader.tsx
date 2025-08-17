import React from "react";
import { Text, View } from "react-native";
import { styles } from "../styles";
import { TaskCardHeaderProps } from "../types";
import { formatDate } from "../utils";

export const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({
  task,
  priorityIcon,
  isOverdue,
  themeColors,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.priorityContainer}>
        <Text style={styles.priorityIcon}>{priorityIcon}</Text>
      </View>
      {task.dueDate && (
        <Text
          style={[
            styles.dueDate,
            {
              color: isOverdue ? "#EF4444" : themeColors.textSecondary,
            },
          ]}
        >
          {formatDate(task.dueDate)}
        </Text>
      )}
    </View>
  );
};
