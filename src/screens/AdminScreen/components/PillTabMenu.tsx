import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../contexts/ThemeContext";
import { AdminTab } from "../types";

interface PillTabMenuProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const { width: screenWidth } = Dimensions.get("window");

const tabs: {
  key: AdminTab;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "dashboard", label: "Dashboard", icon: "grid", color: "#6366F1" },
  { key: "users", label: "Users", icon: "people", color: "#3B82F6" },
  { key: "stats", label: "Stats", icon: "stats-chart", color: "#8B5CF6" },
  { key: "analytics", label: "Analytics", icon: "analytics", color: "#10B981" },
  { key: "userActivity", label: "Activity", icon: "pulse", color: "#F59E0B" },
  { key: "subscriptions", label: "Premium", icon: "diamond", color: "#EF4444" },
  {
    key: "banManagement",
    label: "Ban",
    icon: "shield-checkmark",
    color: "#DC2626",
  },
  { key: "appLock", label: "App Lock", icon: "lock-closed", color: "#059669" },
  { key: "systemLogs", label: "Logs", icon: "document-text", color: "#7C3AED" },
  { key: "controls", label: "Controls", icon: "settings", color: "#6B7280" },
  { key: "messaging", label: "Messaging", icon: "send", color: "#2563EB" },
  { key: "session", label: "Session", icon: "time", color: "#F97316" },
  { key: "aiControl", label: "IA", icon: "robot", color: "#8B5CF6" },
  { key: "networkControl", label: "Réseau", icon: "wifi", color: "#06B6D4" },
  { key: "featureControl", label: "Fonctionnalités", icon: "toggle", color: "#10B981" },
  { key: "dataManagement", label: "Données", icon: "server", color: "#6366F1" },
  { key: "themeControl", label: "Thèmes", icon: "color-palette", color: "#8B5CF6" },
];

export const PillTabMenu: React.FC<PillTabMenuProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const activeTabIndex = tabs.findIndex((tab) => tab.key === activeTab);
  const tabWidth = (screenWidth - 32) / tabs.length; // compacter les marges

  useEffect(() => {
    // Animation du slider
    Animated.spring(slideAnim, {
      toValue: activeTabIndex * tabWidth,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();

    // Animation de scale pour feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab, activeTabIndex, tabWidth]);

  const getTabColor = (tab: (typeof tabs)[0], isActive: boolean) => {
    return isActive ? tab.color : colors.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        {/* Background animé */}
        <Animated.View
          style={[
            styles.activeBackground,
            {
              backgroundColor: tabs[activeTabIndex]?.color + "15",
              borderColor: tabs[activeTabIndex]?.color,
              width: tabWidth - 4,
              transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        />

        {/* Onglets */}
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          const tabColor = getTabColor(tab, isActive);

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={tabColor}
                  style={styles.tabIcon}
                />
              </View>

              {/* Indicateur actif */}
              {isActive && (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: tab.color },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 2,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  activeBackground: {
    position: "absolute",
    top: 1,
    left: 1,
    bottom: 1,
    borderRadius: 10,
    borderWidth: 1,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 1,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    marginBottom: 0,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 3,
    width: 16,
    height: 2,
    borderRadius: 2,
  },
});
