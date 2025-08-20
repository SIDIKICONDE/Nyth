import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { AdminTab } from "../types";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const { width: screenWidth } = Dimensions.get("window");

const tabs: {
  key: AdminTab;
  label: string;
  icon: string;
  color?: string;
}[] = [
  { key: "users", label: "Utilisateurs", icon: "people" },
  {
    key: "stats",
    label: "Statistiques",
    icon: "stats-chart",
    color: "#3B82F6",
  },
  {
    key: "userActivity",
    label: "Activité App",
    icon: "phone-portrait",
    color: "#10B981",
  },
  {
    key: "subscriptions",
    label: "Abonnements",
    icon: "card",
    color: "#F59E0B",
  },
  { key: "activity", label: "Activité", icon: "pulse", color: "#EF4444" },
  { key: "analytics", label: "analytics", icon: "analytics", color: "#8B5CF6" },
  { key: "controls", label: "Contrôles", icon: "settings", color: "#6B7280" },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { t } = useTranslation();

  const slideAnim = useRef(new Animated.Value(isCollapsed ? 0 : 1)).current;
  const [hoveredTab, setHoveredTab] = useState<AdminTab | null>(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isCollapsed ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isCollapsed]);

  const sidebarWidth = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [70, 260],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const renderTabItem = (tab: (typeof tabs)[0]) => {
    const isActive = activeTab === tab.key;
    const tabColor = tab.color || colors.primary;

    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tabItem,
          {
            backgroundColor: isActive ? tabColor + "15" : "transparent",
            borderLeftWidth: isActive ? 4 : 0,
            borderLeftColor: isActive ? tabColor : "transparent",
          },
        ]}
        onPress={() => onTabChange(tab.key)}
        activeOpacity={0.7}
        onPressIn={() => setHoveredTab(tab.key)}
        onPressOut={() => setHoveredTab(null)}
      >
        <View style={styles.tabIconContainer}>
          <Ionicons
            name={tab.icon as any}
            size={24}
            color={isActive ? tabColor : colors.textSecondary}
          />
        </View>

        {!isCollapsed && (
          <Animated.View style={[styles.tabLabelContainer, { opacity }]}>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? tabColor : colors.textSecondary,
                  fontWeight: isActive ? "600" : "500",
                },
              ]}
            >
              {tab.label}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.surface,
          width: sidebarWidth,
          shadowColor: colors.text + "20",
        },
      ]}
    >
      {/* Header du sidebar */}
      <View
        style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}
      >
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={colors.background}
            />
          </View>
          {!isCollapsed && (
            <Animated.View style={[styles.logoTextContainer, { opacity }]}>
              <Text style={[styles.logoText, { color: colors.text }]}>
                Admin Panel
              </Text>
            </Animated.View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.collapseButton,
            { backgroundColor: colors.background },
          ]}
          onPress={onToggleCollapse}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isCollapsed ? "chevron-forward" : "chevron-back"}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {!isCollapsed && (
          <Animated.View style={[styles.sectionHeader, { opacity }]}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Navigation
            </Text>
          </Animated.View>
        )}

        <View style={styles.tabsList}>{tabs.map(renderTabItem)}</View>
      </View>

      {/* Footer */}
      <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
        {!isCollapsed && (
          <Animated.View style={[styles.footerContent, { opacity }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              v1.0.0
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
    zIndex: 1000,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoTextContainer: {
    marginLeft: 12,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  collapseButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  navigation: {
    flex: 1,
    paddingTop: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabsList: {
    paddingHorizontal: 8,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    minHeight: 52,
  },
  tabIconContainer: {
    position: "relative",
    width: 32,
    alignItems: "center",
  },

  tabLabelContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 16,
  },
  tabLabel: {
    fontSize: 15,
    letterSpacing: -0.2,
  },

  sidebarFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerContent: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
