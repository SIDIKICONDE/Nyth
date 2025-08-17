import React, { useMemo } from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useDisplayPreferences } from "../../hooks/useDisplayPreferences";
import { useTranslation } from "../../hooks/useTranslation";
import { TabItem, TabMenu } from "../ui";

type TabType = "scripts" | "videos";

interface HomeTabMenuProps {
  activeTab: TabType;
  scriptsCount: number;
  recordingsCount: number;
  onTabChange: (tab: TabType) => void;
}

const HomeTabMenu: React.FC<HomeTabMenuProps> = ({
  activeTab,
  scriptsCount,
  recordingsCount,
  onTabChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { scriptDisplayStyle } = useDisplayPreferences();

  const isLibraryMode = scriptDisplayStyle === "library";

  const activeTabIndex = activeTab === "scripts" ? 0 : 1;

  const handleTabChange = (index: number) => {
    onTabChange(index === 0 ? "scripts" : "videos");
  };

  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: "scripts",
        label: t("home.tabs.scripts"),
        icon: isLibraryMode ? "bookshelf" : "file-document-multiple",
        badge: scriptsCount,
      },
      {
        id: "videos",
        label: t("home.tabs.videos"),
        icon: isLibraryMode ? "cassette" : "video-vintage",
        badge: recordingsCount,
      },
    ],
    [t, isLibraryMode, scriptsCount, recordingsCount]
  );

  return (
    <View style={tw`px-4`}>
      <TabMenu
        containerStyle={{
          backgroundColor: currentTheme.colors.surface,
          borderRadius: 16,
          padding: 4,
        }}
        tabs={tabs}
        activeTab={activeTabIndex}
        onTabChange={handleTabChange}
        variant="pills"
        showIndicator={true}
        enableSwipe={true}
        enableAnimation={true}
        showIcons={true}
        iconPosition="left"
        centered={true}
        activeTabStyle={{ backgroundColor: currentTheme.colors.primary }}
        activeLabelStyle={{
          color: currentTheme.isDark ? "#ffffff" : "#000000",
          fontWeight: "bold",
        }}
        indicatorStyle={{
          backgroundColor: currentTheme.colors.primary,
          borderRadius: 26,
        }}
        tabStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
        }}
        labelStyle={{
          marginLeft: 8,
          fontWeight: "500",
          color: currentTheme.colors.textSecondary,
        }}
      />
    </View>
  );
};

export default HomeTabMenu;
