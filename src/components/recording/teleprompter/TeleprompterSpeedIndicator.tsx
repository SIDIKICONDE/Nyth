import React from "react";
import { Text, View } from "react-native";
import tw from "twrnc";

interface TeleprompterSpeedIndicatorProps {
  isRecording: boolean;
  scrollSpeed: number;
  currentTheme: any;
}

export function TeleprompterSpeedIndicator({
  isRecording,
  scrollSpeed,
  currentTheme,
}: TeleprompterSpeedIndicatorProps) {
  return (
    <View
      style={[
        tw`absolute top-2 right-2 px-1.5 py-0.5 rounded-full`,
        { zIndex: 2 },
        {
          backgroundColor: isRecording
            ? `${currentTheme.colors.success}CC`
            : `${currentTheme.colors.surface}CC`,
          borderWidth: 0.5,
          borderColor: isRecording
            ? currentTheme.colors.success
            : `${currentTheme.colors.border}80`,
        },
      ]}
    >
      <Text
        style={[
          tw`text-[10px] font-bold text-center`,
          {
            color: isRecording ? "#ffffff" : currentTheme.colors.text,
            lineHeight: 12,
          },
        ]}
      >
        {scrollSpeed}%
      </Text>
    </View>
  );
}
