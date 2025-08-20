import React from "react";
import { View, ViewStyle } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export default function Card({ children, style }: CardProps) {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        tw`mb-2 rounded-lg overflow-hidden`,
        {
          backgroundColor: currentTheme.colors.surface || "#FFFFFF",
          shadowColor: currentTheme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 4,
          borderWidth: 1,
          borderColor: currentTheme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
