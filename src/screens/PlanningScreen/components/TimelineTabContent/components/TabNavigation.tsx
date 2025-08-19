import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { TAB_STYLES, tabConfig } from "../constants";
import { TabNavigationProps } from "../types";
import { TabButton } from "./TabButton";

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  eventsCount,
  goalsCount,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <TabButton
        tab={tabConfig.events.key}
        icon={tabConfig.events.icon}
        label={t(
          tabConfig.events.translationKey,
          tabConfig.events.defaultLabel
        )}
        count={eventsCount}
        isActive={activeTab === tabConfig.events.key}
        onPress={onTabChange}
      />

      <TabButton
        tab={tabConfig.goals.key}
        icon={tabConfig.goals.icon}
        label={t(tabConfig.goals.translationKey, tabConfig.goals.defaultLabel)}
        count={goalsCount}
        isActive={activeTab === tabConfig.goals.key}
        onPress={onTabChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: TAB_STYLES.navigationPadding.horizontal,
    paddingVertical: TAB_STYLES.navigationPadding.vertical,
    gap: 4,
  },
});
