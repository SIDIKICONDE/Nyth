import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { UIText } from "@/components/ui";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useDisplayPreferences } from "../../hooks/useDisplayPreferences";
import { useTranslation } from "../../hooks/useTranslation";
import { useContrastOptimization } from "../../hooks/useContrastOptimization";

type TabType = "scripts" | "videos";

interface SimpleHomeTabMenuProps {
  activeTab: TabType;
  scriptsCount: number;
  recordingsCount: number;
  onTabChange: (tab: TabType) => void;
  variant?: "default" | "compact";
  showLabels?: boolean;
}

const SimpleHomeTabMenu: React.FC<SimpleHomeTabMenuProps> = ({
  activeTab,
  scriptsCount,
  recordingsCount,
  onTabChange,
  variant = "default",
  showLabels = true,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { scriptDisplayStyle } = useDisplayPreferences();
  const { getOptimizedTabColors, getOptimizedBadgeColors } =
    useContrastOptimization();

  const isLibraryMode = scriptDisplayStyle === "library";

  const tabs = [
    {
      id: "scripts" as TabType,
      label: t("home.tabs.scripts"),
      icon: isLibraryMode ? "bookshelf" : "file-document-multiple",
      count: scriptsCount,
    },
    {
      id: "videos" as TabType,
      label: t("home.tabs.videos"),
      icon: isLibraryMode ? "cassette" : "video-vintage",
      count: recordingsCount,
    },
  ];

  return (
    <View
      style={[
        variant === "compact"
          ? tw`p-0.5 rounded-lg flex-row`
          : tw`mx-4 my-3 p-1 rounded-2xl flex-row`,
        {
          backgroundColor:
            variant === "compact" ? "transparent" : currentTheme.colors.surface,
          borderWidth: variant === "compact" ? 0 : 1,
          borderColor: currentTheme.colors.border,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={[
              variant === "compact"
                ? tw`px-2 py-1 rounded-lg flex-row items-center justify-center`
                : tw`flex-1 px-4 py-3 rounded-xl flex-row items-center justify-center`,
              {
                backgroundColor: isActive
                  ? getOptimizedTabColors(true).background
                  : "transparent",
              },
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={variant === "compact" ? 12 : 20}
              color={
                isActive
                  ? getOptimizedTabColors(true).text
                  : currentTheme.colors.textSecondary
              }
            />
            {showLabels && (
              <UIText
                size={variant === "compact" ? "xs" : "base"}
                weight="medium"
                color={
                  isActive
                    ? getOptimizedTabColors(true).text
                    : currentTheme.colors.textSecondary
                }
                style={variant === "compact" ? tw`ml-1` : tw`ml-2`}
              >
                {tab.label}
              </UIText>
            )}
            <View
              style={[
                variant === "compact"
                  ? tw`${showLabels ? "ml-1" : "ml-1"} px-1 py-0 rounded-full`
                  : tw`ml-2 px-2 py-0.5 rounded-full`,
                {
                  backgroundColor: isActive
                    ? getOptimizedBadgeColors(true).background
                    : currentTheme.colors.background,
                },
              ]}
            >
              <UIText
                size={variant === "compact" ? "xs" : "xs"}
                weight="bold"
                color={
                  isActive
                    ? getOptimizedBadgeColors(true).text
                    : currentTheme.colors.textSecondary
                }
              >
                {tab.count}
              </UIText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default SimpleHomeTabMenu;
