import React from "react";
import { TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AddColumnButtonProps } from "../types";

export const AddColumnButton: React.FC<AddColumnButtonProps> = ({
  onPress,
  kanbanStyles,
  themeColors,
}) => {
  return (
    <TouchableOpacity
      style={{
        width: 50,
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        marginHorizontal: 8,
      }}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Ionicons name="add" size={28} color={themeColors.primary} />
    </TouchableOpacity>
  );
};
