import React from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { UIText } from "../ui/Typography";

interface ExportProgressBarProps {
  progress: number;
  currentStep: string;
}

export function ExportProgressBar({
  progress,
  currentStep,
}: ExportProgressBarProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  return (
    <Animated.View entering={FadeIn.duration(400)} style={tw`mt-1`}>
      <View style={tw`mb-2`}>
        <View
          style={[
            tw`h-3 rounded-full mb-1 overflow-hidden`,
            { backgroundColor: `${currentTheme.colors.border}60` },
          ]}
        >
          <Animated.View
            entering={FadeIn.duration(500)}
            style={[
              tw`h-full rounded-full`,
              {
                backgroundColor: currentTheme.colors.primary,
                width: `${Math.max(2, progress)}%`,
              },
            ]}
          />
        </View>
        <View style={tw`flex-row items-center justify-between`}>
          <UIText
            size="xs"
            weight="medium"
            style={[ui, { color: currentTheme.colors.textSecondary }]}
          >
            {currentStep}
          </UIText>
          <UIText
            size="sm"
            weight="bold"
            style={[ui, { color: currentTheme.colors.primary }]}
          >
            {Math.round(progress)}%
          </UIText>
        </View>
      </View>
    </Animated.View>
  );
}
