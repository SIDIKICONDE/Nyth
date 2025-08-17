import LinearGradient from "react-native-linear-gradient";
import React, { useMemo } from "react";
import { Image } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { UIText } from "./Typography";

interface OptimizedAvatarProps {
  userId?: string | null;
  photoURL?: string | null;
  displayName?: string | null;
  size?: "small" | "medium" | "large" | "xlarge";
  style?: any;
}

const sizeMap = {
  small: { container: "w-8 h-8", textSize: "xs" as const },
  medium: { container: "w-12 h-12", textSize: "base" as const },
  large: { container: "w-20 h-20", textSize: "2xl" as const },
  xlarge: { container: "w-28 h-28", textSize: "3xl" as const },
};

export default function OptimizedAvatar({
  userId,
  photoURL,
  displayName,
  size = "medium",
  style,
}: OptimizedAvatarProps) {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();

  const initials = useMemo(() => {
    if (!displayName) return "?";
    return displayName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [displayName]);

  const { container, textSize } = sizeMap[size];

  if (photoURL) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={[tw`${container} rounded-full`, style]}
      />
    );
  }

  return (
    <LinearGradient
      colors={[
        currentTheme.colors.primary + "40",
        currentTheme.colors.secondary + "40",
      ]}
      style={[tw`${container} rounded-full items-center justify-center`, style]}
    >
      <UIText
        size={textSize}
        weight="bold"
        style={[ui, { color: currentTheme.colors.primary }]}
      >
        {initials}
      </UIText>
    </LinearGradient>
  );
}
