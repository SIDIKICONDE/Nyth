import React from "react";
import { Text } from "react-native";
import { styles } from "../styles";
import { TaskCardContentProps } from "../types";

export const TaskCardContent: React.FC<TaskCardContentProps> = ({
  task,
  themeColors,
}) => {
  return (
    <>
      {/* Titre */}
      <Text
        style={[styles.title, { color: themeColors.text }]}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {/* Description */}
      {task.description && (
        <Text
          style={[styles.description, { color: themeColors.textSecondary }]}
          numberOfLines={2}
        >
          {task.description}
        </Text>
      )}
    </>
  );
};
