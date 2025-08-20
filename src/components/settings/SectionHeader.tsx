import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useContrastOptimization } from "../../hooks/useContrastOptimization";
import { Label } from "../ui/Typography";

interface SectionHeaderProps {
  title: string;
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  const { currentTheme } = useTheme();
  const { getOptimizedButtonColors } = useContrastOptimization();

  return (
    <View style={tw`px-3 py-0.5 pt-1.5`}>
      <Label
        size={12}
        weight="bold"
        color={getOptimizedButtonColors().text}
        style={[tw`uppercase text-xs text-center`, { letterSpacing: 1.2 }]}
      >
        {title}
      </Label>
    </View>
  );
}
