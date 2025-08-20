import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";
import { Tip } from "../types";

interface TipCardProps {
  tip: Tip;
  index: number;
}

export const TipCard: React.FC<TipCardProps> = ({ tip, index }) => {
  const { currentTheme } = useTheme();

  return (
    <Animated.View
      key={tip.id}
      entering={FadeInDown.delay(index * 100).duration(600)}
      style={[
        tw`mb-3 p-4 rounded-xl flex-row items-center`,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <Text style={tw`text-2xl mr-3`}>{tip.icon}</Text>
      <Text style={[tw`flex-1`, { color: currentTheme.colors.text }]}>
        {tip.text}
      </Text>
    </Animated.View>
  );
};
