import React from "react";
import { TouchableOpacity, Text } from "react-native";
import tw from "twrnc";
import { OptionItem } from "../types";

interface OptionButtonProps {
  option: OptionItem;
  isSelected: boolean;
  onPress: () => void;
  isDarkMode: boolean;
}

export function OptionButton({
  option,
  isSelected,
  onPress,
  isDarkMode,
}: OptionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`px-3 py-2 rounded-lg`,
        {
          backgroundColor: isSelected
            ? option.color || "#8b5cf6"
            : isDarkMode
            ? "#2a2a2a"
            : "#f1f5f9",
          borderWidth: 1,
          borderColor: isSelected ? option.color || "#8b5cf6" : "transparent",
        },
      ]}
    >
      <Text
        style={[
          tw`text-xs font-semibold`,
          {
            color: isSelected ? "#ffffff" : isDarkMode ? "#ffffff" : "#1e293b",
          },
        ]}
      >
        {option.label}
      </Text>
      {option.description && (
        <Text
          style={[
            tw`text-xs mt-1`,
            {
              color: isSelected
                ? "#ffffff"
                : isDarkMode
                ? "#cccccc"
                : "#6b7280",
            },
          ]}
        >
          {option.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}
