import React from "react";
import { View } from "react-native";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { HeadingText, UIText } from "../../../../ui/Typography";
import { styles } from "../styles";
import { PresetsSectionProps } from "../types";
import { PresetCard } from "./PresetCard";

export const PresetsSection: React.FC<PresetsSectionProps> = ({
  themeColors,
  onPresetSelect,
  presets,
  selectedPreset,
  isApplyingPreset,
}) => {
  const { t } = useTranslation();
  const { ui, heading } = useCentralizedFont();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
      ]}
    >
      <HeadingText
        size="lg"
        weight="semibold"
        style={[heading, styles.sectionTitle, { color: themeColors.text }]}
      >
        🎯 {t("planning.settings.layout.presets.title", "Présets rapides")}
      </HeadingText>

      <UIText
        size="sm"
        weight="medium"
        style={[
          ui,
          styles.sectionDescription,
          { color: themeColors.textSecondary },
        ]}
      >
        {t(
          "planning.settings.layout.presets.description",
          "Configurations prédéfinies pour différents besoins d'espacement"
        )}
      </UIText>

      {presets.map((preset) => (
        <PresetCard
          key={preset.id}
          preset={preset}
          onPress={onPresetSelect}
          themeColors={themeColors}
          isSelected={selectedPreset === preset.id}
          isApplying={isApplyingPreset && selectedPreset === preset.id}
        />
      ))}
    </View>
  );
};
