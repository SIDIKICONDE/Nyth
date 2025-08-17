import React from "react";
import { View, StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useHomeTabMenu } from "../../hooks/useHomeTabMenu";
import { TabMenu } from "../ui";

type TabType = "scripts" | "videos";

interface HomeTabMenuOptimizedProps {
  activeTab: TabType;
  scriptsCount: number;
  recordingsCount: number;
  onTabChange: (tab: TabType) => void;
}

const HomeTabMenuOptimized: React.FC<HomeTabMenuOptimizedProps> = ({
  activeTab,
  scriptsCount,
  recordingsCount,
  onTabChange,
}) => {
  const { currentTheme } = useTheme();

  const { tabMenuProps, isLibraryMode } = useHomeTabMenu({
    initialTab: activeTab,
    scriptsCount,
    recordingsCount,
    onTabChange,
  });

  // Styles personnalisés selon le mode
  const containerStyle = React.useMemo<ViewStyle>(() => {
    const baseStyle = tw`mx-4 my-3`;

    if (isLibraryMode) {
      return StyleSheet.flatten<ViewStyle>([
        baseStyle,
        {
          backgroundColor: `${currentTheme.colors.background}95`,
          borderWidth: 1,
          borderColor: currentTheme.colors.border,
          borderRadius: 16,
          padding: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
      ]);
    }

    return StyleSheet.flatten<ViewStyle>([
      baseStyle,
      {
        backgroundColor: currentTheme.colors.surface,
        borderRadius: 16,
        padding: 4,
      },
    ]);
  }, [isLibraryMode, currentTheme]);

  const indicatorStyle = React.useMemo(() => {
    const baseStyle = {
      backgroundColor: currentTheme.colors.primary,
      borderRadius: 12,
    };

    if (isLibraryMode) {
      return {
        ...baseStyle,
        shadowColor: currentTheme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
      };
    }

    return baseStyle;
  }, [isLibraryMode, currentTheme]);

  return (
    <View>
      <TabMenu
        {...tabMenuProps}
        variant={isLibraryMode ? "pills" : "default"}
        enableSwipe={true}
        enableAnimation={true}
        showIndicator={true}
        showIcons={true}
        iconPosition="left"
        centered={true}
        containerStyle={containerStyle}
        activeTabStyle={{
          backgroundColor: currentTheme.colors.primary,
        }}
        activeLabelStyle={{
          color: "white",
          fontWeight: isLibraryMode ? "bold" : "600",
        }}
        indicatorStyle={indicatorStyle}
        tabStyle={tw`px-4 py-3`}
        labelStyle={{
          marginLeft: 8,
          fontWeight: "500",
          color: currentTheme.colors.textSecondary,
        }}
      />
    </View>
  );
};

export default HomeTabMenuOptimized;
