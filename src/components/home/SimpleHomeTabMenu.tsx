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
}

const SimpleHomeTabMenu: React.FC<SimpleHomeTabMenuProps> = ({
  activeTab,
  scriptsCount,
  recordingsCount,
  onTabChange,
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
        tw`mx-4 my-3 p-1 rounded-2xl flex-row`,
        {
          backgroundColor: currentTheme.colors.surface,
          borderWidth: 1,
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
              tw`flex-1 px-4 py-3 rounded-xl flex-row items-center justify-center`,
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
              size={20}
              color={
                isActive
                  ? getOptimizedTabColors(true).text
                  : currentTheme.colors.textSecondary
              }
            />
            <UIText
              size="base"
              weight="medium"
              color={
                isActive
                  ? getOptimizedTabColors(true).text
                  : currentTheme.colors.textSecondary
              }
              style={tw`ml-2`}
            >
              {tab.label}
            </UIText>
            <View
              style={[
                tw`ml-2 px-2 py-0.5 rounded-full`,
                {
                  backgroundColor: isActive
                    ? getOptimizedBadgeColors(true).background
                    : currentTheme.colors.background,
                },
              ]}
            >
              <UIText
                size="xs"
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
