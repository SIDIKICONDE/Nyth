import React from "react";
import { Text, View } from "react-native";
import { styles } from "../styles";
import { TaskCardFooterProps } from "../types";

export const TaskCardFooter: React.FC<TaskCardFooterProps> = ({
  task,
  themeColors,
}) => {
  if (!task.estimatedHours) return null;

  return (
    <View style={[styles.footer, { paddingTop: 2, marginTop: 4 }]}>
      <Text
        style={[styles.estimatedHours, { color: themeColors.textSecondary }]}
      >
        ⏱️ {task.estimatedHours}h
      </Text>
    </View>
  );
};
