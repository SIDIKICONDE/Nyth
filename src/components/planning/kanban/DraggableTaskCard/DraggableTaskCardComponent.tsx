import React from "react";
import { View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  TaskCardContent,
  TaskCardFooter,
  TaskCardHeader,
  TaskCardTags,
} from "./components";
import { useDragGesture } from "./hooks/useDragGesture";
import { styles } from "./styles";
import { DraggableTaskCardProps } from "./types";
import { getPriorityColor, getPriorityIcon, isTaskOverdue } from "./utils";

export const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  onDragStart,
  onDragEnd,
  onTaskPress,
}) => {
  const { currentTheme } = useTheme();

  const { gestureHandler, animatedStyle } = useDragGesture({
    _taskId: task.id,
    _onDragStart: onDragStart,
    _onDragEnd: onDragEnd,
  });

  const priorityColor = getPriorityColor(task.priority);
  const priorityIcon = getPriorityIcon(task.priority);
  const isOverdue = isTaskOverdue(task.dueDate);

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[animatedStyle]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              borderLeftColor: priorityColor,
            },
          ]}
        >
          <TaskCardHeader
            task={task}
            priorityColor={priorityColor}
            priorityIcon={priorityIcon}
            isOverdue={isOverdue}
            themeColors={currentTheme.colors}
          />

          <TaskCardContent task={task} themeColors={currentTheme.colors} />

          <TaskCardTags
            tags={task.tags || []}
            themeColors={currentTheme.colors}
            primaryColor={currentTheme.colors.primary}
          />

          <TaskCardFooter task={task} themeColors={currentTheme.colors} />
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};
