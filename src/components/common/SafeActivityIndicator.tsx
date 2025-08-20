import React from "react";
import { View, Text } from "react-native";

interface SafeActivityIndicatorProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
  textColor?: string;
}

export const SafeActivityIndicator: React.FC<SafeActivityIndicatorProps> = ({
  size = "large",
  color = "#007AFF",
  text,
  textColor = "#FFFFFF",
}) => {
  const indicatorSize = size === "large" ? 40 : 24;
  const borderWidth = size === "large" ? 3 : 2;

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: indicatorSize,
          height: indicatorSize,
          borderRadius: indicatorSize / 2,
          borderWidth: borderWidth,
          borderColor: color,
          borderTopColor: "transparent",
          // Note: L'animation sera gérée par des bibliothèques tierces si nécessaire
        }}
      />
      {text && (
        <Text
          style={{
            marginTop: 8,
            color: textColor,
            textAlign: "center",
            fontSize: 14,
          }}
        >
          {text}
        </Text>
      )}
    </View>
  );
};
