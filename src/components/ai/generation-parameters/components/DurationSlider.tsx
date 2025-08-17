import Slider from "@react-native-community/slider";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import {
  SCRIPT_DURATION,
  secondsToDurationType,
} from "../../../../config/aiConfig";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";

interface DurationSliderProps {
  duration?: number;
  onDurationChange: (value: number) => void;
  wordCount?: number; // Pour afficher si le nombre de mots a priorité
}

export const DurationSlider: React.FC<DurationSliderProps> = ({
  duration,
  onDurationChange,
  wordCount,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={tw`mt-4`}>
      <View style={tw`flex-row items-center justify-between mb-2`}>
        <UIText size="base" color={currentTheme.colors.text}>
          {t("ai.parameters.duration")}
        </UIText>
        <View style={tw`flex-row items-center`}>
          <UIText size="base" weight="bold" color={currentTheme.colors.text}>
            {duration} {t("common.seconds")}
          </UIText>
          <UIText size="xs" color={currentTheme.colors.textSecondary}>
            ({secondsToDurationType(duration || 60)})
          </UIText>
        </View>
      </View>

      <View style={tw`flex-row items-center justify-between mb-1`}>
        <UIText size="xs" color={currentTheme.colors.textSecondary}>
          {SCRIPT_DURATION.SHORT.seconds}s
        </UIText>
        <UIText size="xs" color={currentTheme.colors.textSecondary}>
          {SCRIPT_DURATION.MEDIUM.seconds}s
        </UIText>
        <UIText size="xs" color={currentTheme.colors.textSecondary}>
          {SCRIPT_DURATION.LONG.seconds}s
        </UIText>
      </View>

      <Slider
        style={tw`w-full h-6`}
        minimumValue={SCRIPT_DURATION.SHORT.seconds}
        maximumValue={SCRIPT_DURATION.LONG.seconds}
        value={duration || SCRIPT_DURATION.MEDIUM.seconds}
        onValueChange={onDurationChange}
        minimumTrackTintColor={currentTheme.colors.primary}
        maximumTrackTintColor={`${currentTheme.colors.text}30`}
        thumbTintColor={currentTheme.colors.primary}
        step={15}
      />

      <View style={tw`flex-row items-center justify-between mt-1`}>
        <UIText size="xs" color={currentTheme.colors.textSecondary}>
          ~{SCRIPT_DURATION.SHORT.minWords}-{SCRIPT_DURATION.SHORT.maxWords}{" "}
          {t("common.words")}
        </UIText>
        <UIText size="xs" color={currentTheme.colors.textSecondary}>
          ~{SCRIPT_DURATION.MEDIUM.minWords}-{SCRIPT_DURATION.MEDIUM.maxWords}{" "}
          {t("common.words")}
        </UIText>
        <UIText size="xs" color={currentTheme.colors.textSecondary}>
          ~{SCRIPT_DURATION.LONG.minWords}-{SCRIPT_DURATION.LONG.maxWords}{" "}
          {t("common.words")}
        </UIText>
      </View>

      {/* Note explicative sur la priorité */}
      {wordCount ? (
        <View
          style={[
            tw`mt-2 p-2 rounded-lg`,
            {
              backgroundColor: currentTheme.colors.surface,
              borderWidth: 1,
              borderColor: currentTheme.colors.border,
            },
          ]}
        >
          <UIText
            size="xs"
            color={currentTheme.colors.textSecondary}
            align="center"
          >
            💡 Le nombre de mots défini ({wordCount}) a priorité sur la durée
          </UIText>
        </View>
      ) : (
        <View
          style={[
            tw`mt-2 p-2 rounded-lg`,
            {
              backgroundColor: currentTheme.colors.surface,
              borderWidth: 1,
              borderColor: currentTheme.colors.border,
            },
          ]}
        >
          <UIText
            size="xs"
            color={currentTheme.colors.textSecondary}
            align="center"
          >
            ℹ️ La durée détermine automatiquement le nombre de mots (~2.75
            mots/seconde)
          </UIText>
        </View>
      )}
    </View>
  );
};
