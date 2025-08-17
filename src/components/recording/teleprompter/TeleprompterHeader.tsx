import React from "react";
import { View, PanResponderInstance } from "react-native";
import tw from "twrnc";

interface TeleprompterHeaderProps {
  isDragging: boolean;
  panHandlers: PanResponderInstance["panHandlers"];
  currentTheme: { colors: { accent: string } };
}

export function TeleprompterHeader({
  isDragging,
  panHandlers,
  currentTheme,
}: TeleprompterHeaderProps) {
  return (
    <View
      {...panHandlers}
      style={[
        tw`absolute top-0 left-0 right-0 h-10`,
        { zIndex: 2 },
        {
          backgroundColor: isDragging
            ? `${currentTheme.colors.accent}30`
            : "rgba(255, 255, 255, 0)",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255, 255, 255, 0)",
        },
      ]}
    >
      <View
        style={tw`w-16 h-1 rounded-full bg-white opacity-60 mx-auto mt-4`}
      />
    </View>
  );
}
