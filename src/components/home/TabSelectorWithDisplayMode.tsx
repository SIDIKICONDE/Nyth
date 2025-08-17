import React from "react";
import { View } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useDisplayPreferences } from "../../hooks/useDisplayPreferences";
import { useContrastOptimization } from "../../hooks/useContrastOptimization";

type TabType = "scripts" | "videos";

interface TabSelectorWithDisplayModeProps {
  activeTab: TabType;
  scriptsCount: number;
  recordingsCount: number;
  onTabChange: (tab: TabType) => void;
}

export default function TabSelectorWithDisplayMode({
  activeTab,
  scriptsCount,
  recordingsCount,
  onTabChange,
}: TabSelectorWithDisplayModeProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { scriptDisplayStyle } = useDisplayPreferences();
  const { getOptimizedTabColors } = useContrastOptimization();

  // Icônes dynamiques selon le mode d'affichage
  const getScriptsIcon = () => {
    return scriptDisplayStyle === "library" ? "📚" : "📝";
  };

  const getVideosIcon = () => {
    return scriptDisplayStyle === "library" ? "📼" : "🎬";
  };

  // Labels dynamiques selon le mode d'affichage
  const getScriptsLabel = () => {
    const icon = getScriptsIcon();
    const baseLabel =
      scriptDisplayStyle === "library"
        ? t("home.tabs.scriptsLibrary", t("home.tabs.scripts"))
        : t("home.tabs.scripts");
    return `${icon} ${baseLabel} (${scriptsCount})`;
  };

  const getVideosLabel = () => {
    const icon = getVideosIcon();
    const baseLabel =
      scriptDisplayStyle === "library"
        ? t("home.tabs.videosLibrary", t("home.tabs.videos"))
        : t("home.tabs.videos");
    return `${icon} ${baseLabel} (${recordingsCount})`;
  };

  return (
    <View style={tw`px-4 py-3`}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => onTabChange(value as TabType)}
        buttons={[
          {
            value: "scripts",
            label: getScriptsLabel(),
            style: {
              backgroundColor:
                activeTab === "scripts"
                  ? getOptimizedTabColors(true).background
                  : "transparent",
              borderWidth: scriptDisplayStyle === "library" ? 2 : 1,
              borderColor:
                activeTab === "scripts"
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
            },
            labelStyle: {
              color:
                activeTab === "scripts"
                  ? getOptimizedTabColors(true).text
                  : currentTheme.colors.textSecondary,
              fontWeight: scriptDisplayStyle === "library" ? "bold" : "normal",
            },
          },
          {
            value: "videos",
            label: getVideosLabel(),
            style: {
              backgroundColor:
                activeTab === "videos"
                  ? getOptimizedTabColors(true).background
                  : "transparent",
              borderWidth: scriptDisplayStyle === "library" ? 2 : 1,
              borderColor:
                activeTab === "videos"
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
            },
            labelStyle: {
              color:
                activeTab === "videos"
                  ? getOptimizedTabColors(true).text
                  : currentTheme.colors.textSecondary,
              fontWeight: scriptDisplayStyle === "library" ? "bold" : "normal",
            },
          },
        ]}
      />
    </View>
  );
}
