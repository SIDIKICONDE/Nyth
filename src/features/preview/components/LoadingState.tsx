import * as React from "react";
import { ActivityIndicator, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "@/contexts/ThemeContext";
import { useCentralizedFont } from "@/hooks/useCentralizedFont";
import { useTranslation } from "@/hooks/useTranslation";
import BackButton from "@/components/common/BackButton";
import { UIText } from "@/components/ui/Typography";

export function LoadingState() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  return (
    <View
      style={[
        tw`flex-1 pt-12`,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <BackButton />

      <Animated.View
        entering={FadeIn.duration(600)}
        style={tw`flex-1 justify-center items-center px-6`}
      >
        <Animated.View
          entering={FadeInDown.duration(800).delay(300)}
          style={[
            tw`p-8 rounded-3xl w-11/12 max-w-sm items-center justify-center`,
            {
              backgroundColor: currentTheme.colors.surface,
              borderWidth: 1,
              borderColor: `${currentTheme.colors.primary}20`,
              shadowColor: currentTheme.colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={currentTheme.colors.primary}
            style={tw`mb-6`}
          />

          <UIText
            size="xl"
            weight="semibold"
            style={[
              ui,
              tw`text-center mb-2`,
              { color: currentTheme.colors.text },
            ]}
          >
            {t("preview.loading.title")}
          </UIText>

          <UIText
            style={[
              ui,
              tw`text-center`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t("preview.loading.message")}
          </UIText>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
