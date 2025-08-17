import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useMemo } from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { UIText } from "../ui/Typography";
import { FormatSection } from "./components/FormatSection";
import { QualitySection } from "./components/QualitySection";
import { useFormatHandler } from "./hooks/useFormatHandler";
import { useVideoSettingsSync } from "./hooks/useVideoSettingsSync";
import { ExportOptionsProps } from "./types";
import { calculateDimensions } from "./utils/dimensionsCalculator";

export default function ExportOptions({
  exportQuality,
  setExportQuality,
  exportFormat,
  setExportFormat,
  aspectRatio,
  isAutoDetected = false,
}: ExportOptionsProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  const { handleFormatChange } = useFormatHandler({
    isProResSelected: false,
    setExportFormat,
  });

  // Synchronisation avec les paramètres vidéo
  useVideoSettingsSync({
    exportQuality,
    exportFormat,
    setExportQuality,
    setExportFormat,
  });

  // Calcul des dimensions (memoized pour éviter les recalculs)
  const dimensions = useMemo(
    () => calculateDimensions(exportQuality, aspectRatio),
    [exportQuality, aspectRatio]
  );

  return (
    <View style={tw`p-4`}>
      {/* Header avec design moderne */}
      <View style={tw`flex-row items-center mb-5`}>
        <View
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
            { backgroundColor: `${currentTheme.colors.primary}15` },
          ]}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={22}
            color={currentTheme.colors.primary}
          />
        </View>
        <View style={tw`flex-1`}>
          <UIText
            size="lg"
            weight="bold"
            style={[ui, { color: currentTheme.colors.text }]}
          >
            {t("exportOptions.title", "Options d'Export")}
          </UIText>
          <UIText
            size="sm"
            style={[
              ui,
              tw`mt-0.5`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t("exportOptions.subtitle", "Personnalisez votre export")}
          </UIText>
        </View>
      </View>

      {/* Section Qualité avec design amélioré */}
      <View style={tw`mb-5`}>
        <QualitySection
          exportQuality={exportQuality}
          setExportQuality={setExportQuality}
          dimensions={dimensions}
          isAutoDetected={isAutoDetected}
        />
      </View>

      {/* Section Format avec design amélioré */}
      <View>
        <FormatSection
          exportFormat={exportFormat}
          handleFormatChange={handleFormatChange}
        />
      </View>
    </View>
  );
}
