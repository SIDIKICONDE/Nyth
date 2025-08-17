import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "@/contexts/ThemeContext";
import { useCentralizedFont } from "@/hooks/useCentralizedFont";
import { useTranslation } from "@/hooks/useTranslation";
import { UIText } from "@/components/ui/Typography";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('VideoOptionsSection');

interface VideoOptionsSectionProps {
  exportQuality: "480p" | "720p" | "1080p" | "4K";
  exportFormat: "mp4" | "mov";
  onQualityChange: (value: "480p" | "720p" | "1080p" | "4K") => void;
  onFormatChange: (value: "mp4" | "mov") => void;
  sourceQuality?: "480p" | "720p" | "1080p" | "4K" | "unknown";
}

export function VideoOptionsSection({
  exportQuality,
  exportFormat,
  onQualityChange,
  onFormatChange,
  sourceQuality,
}: VideoOptionsSectionProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  // Vérifier si une qualité est de l'upscaling
  const isQualityUpscaling = (quality: string): boolean => {
    if (!sourceQuality || sourceQuality === "unknown") return false;

    const qualityOrder: Record<string, number> = {
      "480p": 1,
      "720p": 2,
      "1080p": 3,
      "4K": 4,
    };

    const sourceLevel = qualityOrder[sourceQuality] || 0;
    const targetLevel = qualityOrder[quality] || 0;

    return targetLevel > sourceLevel;
  };

  // Conversion pour s'assurer que la valeur est une des valeurs supportées
  const ensureValidQuality = (
    quality: string
  ): "480p" | "720p" | "1080p" | "4K" => {
    if (
      quality === "480p" ||
      quality === "720p" ||
      quality === "1080p" ||
      quality === "4K"
    ) {
      return quality as "480p" | "720p" | "1080p" | "4K";
    }
    // Par défaut, on retourne 720p si la valeur n'est pas reconnue
    logger.debug("⚠️ Qualité non reconnue:", quality, "- fallback vers 720p");
    return "720p";
  };

  const safeQuality = ensureValidQuality(exportQuality);

  // Debug pour voir la valeur reçue
  logger.debug(
    "🎬 VideoOptionsSection - Qualité reçue:",
    exportQuality,
    "- Qualité sécurisée:",
    safeQuality
  );

  // Quality colors for badges
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "480p":
        return "#ef4444"; // Rouge pour SD
      case "720p":
        return "#3b82f6"; // Bleu pour HD
      case "1080p":
        return "#10b981"; // Vert pour FHD
      case "4K":
        return "#f59e0b"; // Orange/Jaune pour 4K
      default:
        return "#3b82f6"; // Bleu par défaut
    }
  };

  const qualityColor = getQualityColor(safeQuality);

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(400)}
      style={tw`mt-0.5 mx-2`}
    >
      <View
        style={[
          tw`rounded-xl overflow-hidden border`,
          {
            backgroundColor: currentTheme.isDark
              ? currentTheme.colors.surface
              : currentTheme.colors.background,
            borderColor: currentTheme.colors.border,
            // Déplacer les propriétés d'ombre vers un conteneur séparé pour éviter les conflits
          },
        ]}
      >
        <View
          style={{
            shadowColor: qualityColor,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <LinearGradient
            colors={[`${qualityColor}15`, "transparent"]}
            style={tw`absolute top-0 left-0 right-0 h-0.5`}
          />

          <View style={tw`p-2 px-3`}>
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <View style={tw`flex-row items-center`}>
                <View
                  style={[
                    tw`w-4 h-4 rounded-full items-center justify-center mr-1`,
                    { backgroundColor: `${qualityColor}15` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="video-outline"
                    size={12}
                    color={qualityColor}
                  />
                </View>
                <UIText
                  size="xs"
                  weight="semibold"
                  style={[ui, { color: currentTheme.colors.text }]}
                >
                  {t("preview.videoSettings.title")}
                </UIText>
              </View>

              {sourceQuality && sourceQuality !== "unknown" && (
                <View
                  style={[
                    tw`px-1.5 py-0.5 rounded-full flex-row items-center`,
                    { backgroundColor: `${currentTheme.colors.primary}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="camera"
                    size={10}
                    color={currentTheme.colors.primary}
                    style={tw`mr-0.5`}
                  />
                  <UIText
                    size="xs"
                    weight="medium"
                    style={[ui, { color: currentTheme.colors.primary }]}
                  >
                    Source: {sourceQuality}
                  </UIText>
                </View>
              )}
            </View>

            <View style={tw`mb-1.5`}>
              <View style={tw`flex-row justify-between items-center mb-0.5`}>
                <UIText
                  size="xs"
                  weight="medium"
                  style={[ui, { color: currentTheme.colors.textSecondary }]}
                >
                  {t("preview.videoSettings.quality")}
                </UIText>
                <View
                  style={[
                    tw`px-1.5 py-0.5 rounded-full`,
                    { backgroundColor: `${qualityColor}15` },
                  ]}
                >
                  <UIText
                    size="xs"
                    weight="medium"
                    style={[ui, { color: qualityColor }]}
                  >
                    {safeQuality === "480p"
                      ? "SD"
                      : safeQuality === "720p"
                      ? "HD"
                      : safeQuality === "1080p"
                      ? "FHD"
                      : "4K"}
                  </UIText>
                </View>
              </View>

              <SegmentedButtons
                value={safeQuality}
                onValueChange={(value) => {
                  logger.debug("🎬 Qualité sélectionnée:", value);
                  onQualityChange(value as "480p" | "720p" | "1080p" | "4K");
                }}
                buttons={[
                  {
                    value: "480p",
                    label: isQualityUpscaling("480p") ? "SD ⚠️" : "SD",
                    disabled: false,
                    style: isQualityUpscaling("480p") ? { opacity: 0.7 } : {},
                  },
                  {
                    value: "720p",
                    label: isQualityUpscaling("720p") ? "HD ⚠️" : "HD",
                    disabled: false,
                    style: isQualityUpscaling("720p") ? { opacity: 0.7 } : {},
                  },
                  {
                    value: "1080p",
                    label: isQualityUpscaling("1080p") ? "FHD ⚠️" : "FHD",
                    disabled: false,
                    style: isQualityUpscaling("1080p") ? { opacity: 0.7 } : {},
                  },
                  {
                    value: "4K",
                    label: isQualityUpscaling("4K") ? "4K ⚠️" : "4K",
                    disabled: false,
                    style: isQualityUpscaling("4K") ? { opacity: 0.7 } : {},
                  },
                ]}
                theme={{
                  colors: {
                    primary: qualityColor,
                  },
                }}
              />
            </View>

            <View style={tw`mb-0.5`}>
              <View style={tw`flex-row justify-between items-center mb-0.5`}>
                <UIText
                  size="xs"
                  weight="medium"
                  style={[ui, { color: currentTheme.colors.textSecondary }]}
                >
                  {t("preview.videoSettings.format")}
                </UIText>
                <View
                  style={[
                    tw`px-1.5 py-0.5 rounded-full`,
                    { backgroundColor: `${currentTheme.colors.primary}15` },
                  ]}
                >
                  <UIText
                    size="xs"
                    weight="medium"
                    style={[ui, { color: currentTheme.colors.primary }]}
                  >
                    {exportFormat.toUpperCase()}
                  </UIText>
                </View>
              </View>

              <View style={tw`flex-row gap-1`}>
                <TouchableOpacity
                  onPress={() => onFormatChange("mp4")}
                  style={[
                    tw`flex-1 py-1.5 rounded-md items-center justify-center`,
                    {
                      backgroundColor:
                        exportFormat === "mp4"
                          ? `${currentTheme.colors.primary}10`
                          : currentTheme.colors.background,
                      borderWidth: 1,
                      borderColor:
                        exportFormat === "mp4"
                          ? currentTheme.colors.primary
                          : currentTheme.colors.border,
                    },
                  ]}
                >
                  <View style={tw`flex-row items-center`}>
                    {exportFormat === "mp4" && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={12}
                        color={currentTheme.colors.primary}
                        style={tw`mr-0.5`}
                      />
                    )}
                    <UIText
                      size="xs"
                      weight="medium"
                      style={[
                        ui,
                        {
                          color:
                            exportFormat === "mp4"
                              ? currentTheme.colors.primary
                              : currentTheme.colors.text,
                        },
                      ]}
                    >
                      MP4
                    </UIText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onFormatChange("mov")}
                  style={[
                    tw`flex-1 py-1.5 rounded-md items-center justify-center`,
                    {
                      backgroundColor:
                        exportFormat === "mov"
                          ? `${currentTheme.colors.primary}10`
                          : currentTheme.colors.background,
                      borderWidth: 1,
                      borderColor:
                        exportFormat === "mov"
                          ? currentTheme.colors.primary
                          : currentTheme.colors.border,
                    },
                  ]}
                >
                  <View style={tw`flex-row items-center`}>
                    {exportFormat === "mov" && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={12}
                        color={currentTheme.colors.primary}
                        style={tw`mr-0.5`}
                      />
                    )}
                    <UIText
                      size="xs"
                      weight="medium"
                      style={[
                        ui,
                        {
                          color:
                            exportFormat === "mov"
                              ? currentTheme.colors.primary
                              : currentTheme.colors.text,
                        },
                      ]}
                    >
                      MOV
                    </UIText>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
