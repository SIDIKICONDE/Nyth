import Slider from "react-native-slider-x";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";

interface CreativitySliderProps {
  creativity: number;
  onCreativityChange: (value: number) => void;
}

export const CreativitySlider: React.FC<CreativitySliderProps> = ({
  creativity,
  onCreativityChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        tw`mt-4 p-4 rounded-lg`,
        { backgroundColor: currentTheme.colors.card },
      ]}
    >
      <View style={tw`flex-row justify-between mb-2`}>
        <UIText size="xs" color={currentTheme.colors.textSecondary}>
          {t("ai.parameters.creativity")}
        </UIText>
        <UIText size="sm" weight="semibold" color={currentTheme.colors.text}>
          {Math.round(creativity * 100)}%
        </UIText>
      </View>

      <View style={tw`flex-row items-center`}>
        <UIText size="sm" color={currentTheme.colors.textSecondary}>
          {t("ai.parameters.factual")}
        </UIText>
        <Slider
          style={tw`flex-1 mx-2 h-8`}
          minimumValue={0}
          maximumValue={1}
          value={creativity}
          onValueChange={onCreativityChange}
          minimumTrackTintColor={currentTheme.colors.primary}
          maximumTrackTintColor={`${currentTheme.colors.textSecondary}50`}
          thumbTintColor={currentTheme.colors.primary}
        />
        <UIText size="sm" color={currentTheme.colors.textSecondary}>
          {t("ai.parameters.creative")}
        </UIText>
      </View>
    </View>
  );
};
