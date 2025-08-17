import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { styles } from "../styles";
import { AddTaskButtonProps } from "../types";

export const AddTaskButton: React.FC<AddTaskButtonProps> = ({
  onTaskCreate,
  color,
  isAtMaxCapacity,
  themeColors,
}) => {
  return (
    <TouchableOpacity
      style={[
        {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          alignItems: "center",
          marginBottom: 0,
          opacity: isAtMaxCapacity ? 0.5 : 1,
        },
      ]}
      onPress={onTaskCreate}
      disabled={isAtMaxCapacity}
      activeOpacity={isAtMaxCapacity ? 1 : 0.8}
    >
      <Ionicons
        name="add"
        size={24}
        color={isAtMaxCapacity ? themeColors.textSecondary : color}
      />
    </TouchableOpacity>
  );
};
