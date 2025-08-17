import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../hooks/useTranslation";
import { UIText } from "../../ui/Typography";
import { getQualityOptions } from "../constants";
import { ExportQuality, VideoDimensions } from "../types";

interface QualitySectionProps {
  exportQuality: ExportQuality;
  setExportQuality: (quality: ExportQuality) => void;
  dimensions: VideoDimensions;
  isAutoDetected?: boolean;
}

export const QualitySection: React.FC<QualitySectionProps> = ({
  exportQuality,
  setExportQuality,
  dimensions,
  isAutoDetected = false,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  // Obtenir les options de qualité avec traductions
  const qualityOptions = getQualityOptions(t);

  return (
    <View style={tw`mb-4`}>
      <UIText
        size="sm"
        weight="medium"
        style={[ui, tw`mb-3`, { color: currentTheme.colors.textSecondary }]}
      >
        {t("exportOptions.quality.title", "Qualité")} • {dimensions.width}x
        {dimensions.height}
      </UIText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`flex-row gap-2`}
      >
        {qualityOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setExportQuality(option.value)}
            style={[
              tw`px-4 py-3 rounded-lg min-w-16`,
              {
                backgroundColor:
                  exportQuality === option.value
                    ? currentTheme.colors.primary
                    : currentTheme.colors.surface,
                borderWidth: 1,
                borderColor:
                  exportQuality === option.value
                    ? currentTheme.colors.primary
                    : currentTheme.colors.border,
              },
            ]}
          >
            <UIText
              weight="medium"
              style={[
                ui,
                tw`text-center`,
                {
                  color:
                    exportQuality === option.value
                      ? "#fff"
                      : currentTheme.colors.text,
                },
              ]}
            >
              {option.label}
            </UIText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
