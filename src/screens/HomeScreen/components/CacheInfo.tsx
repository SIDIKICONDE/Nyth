import { UIText } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { formatCacheSize } from "../../../utils/cacheManager";

interface CacheInfoProps {
  cacheSize: number;
}

export function CacheInfo({ cacheSize }: CacheInfoProps) {
  const { currentTheme } = useTheme();

  if (cacheSize <= 0) {
    return null;
  }

  return (
    <View style={tw`mb-2 mt-1`}>
      <UIText
        size="xs"
        style={[tw`text-center`, { color: currentTheme.colors.textSecondary }]}
      >
        {formatCacheSize(cacheSize)}
      </UIText>
    </View>
  );
}
