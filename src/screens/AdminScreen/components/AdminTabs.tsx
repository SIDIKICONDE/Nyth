import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { AdminTab } from "../types";
import { MessagingTab } from "./tabs/MessagingTab";

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const tabs: {
  key: AdminTab;
  label: string;
  icon: string;
}[] = [
  { key: "users", label: "Utilisateurs", icon: "people" },
  { key: "stats", label: "Statistiques", icon: "stats-chart" },
  { key: "userActivity", label: "Activité App", icon: "phone-portrait" },
  { key: "subscriptions", label: "Abonnements", icon: "card" },
  { key: "activity", label: "Activité", icon: "pulse" },
  { key: "analytics", label: "Analytics", icon: "analytics" },
  { key: "controls", label: "Contrôles", icon: "settings" },
  { key: "messaging", label: "Messaging", icon: "send" },
  { key: "session", label: "Session", icon: "time" },
  { key: "aiControl", label: "IA", icon: "robot" },
  { key: "networkControl", label: "Réseau", icon: "wifi" },
  { key: "featureControl", label: "Fonctionnalités", icon: "toggle" },
  { key: "dataManagement", label: "Données", icon: "server" },
  { key: "themeControl", label: "Thèmes", icon: "color-palette" },
];

const { width: screenWidth } = Dimensions.get("window");
const CONTAINER_PADDING = 32;
const TAB_GAP = 8; // Augmenté de 4 à 8
const TOTAL_GAPS = (tabs.length - 1) * TAB_GAP;
const MIN_TAB_WIDTH = 110; // Largeur minimale pour chaque onglet
const CALCULATED_TAB_WIDTH =
  (screenWidth - CONTAINER_PADDING - TOTAL_GAPS) / tabs.length;
const TAB_WIDTH = Math.max(MIN_TAB_WIDTH, CALCULATED_TAB_WIDTH);

export const AdminTabs: React.FC<AdminTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { t } = useTranslation();

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const tabIndex = tabs.findIndex((tab) => tab.key === activeTab);
    const position = tabIndex * (TAB_WIDTH + TAB_GAP);
    Animated.spring(slideAnim, {
      toValue: position,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();

    // Auto-scroll to active tab
    if (scrollViewRef.current && tabIndex > 1) {
      scrollViewRef.current.scrollTo({
        x: (tabIndex - 1) * (TAB_WIDTH + TAB_GAP),
        animated: true,
      });
    }
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        <Animated.View
          style={[
            styles.slider,
            {
              backgroundColor: colors.primary,
              transform: [{ translateX: slideAnim }],
              width: TAB_WIDTH - 8, // Ajusté pour le nouveau padding
            },
          ]}
        />
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.key;
            const inputRange = tabs.map((_, i) => i * (TAB_WIDTH + TAB_GAP));
            const scale = slideAnim.interpolate({
              inputRange,
              outputRange: inputRange.map((i) =>
                i === index * (TAB_WIDTH + TAB_GAP) ? 1.1 : 1
              ),
            });
            const opacity = slideAnim.interpolate({
              inputRange,
              outputRange: inputRange.map((i) =>
                i === index * (TAB_WIDTH + TAB_GAP) ? 1 : 0.7
              ),
            });

            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  {
                    width: TAB_WIDTH,
                    marginLeft: index > 0 ? TAB_GAP : 0,
                  },
                ]}
                onPress={() => onTabChange(tab.key)}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.tabContent,
                    { opacity, transform: [{ scale }] },
                  ]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={20} // Augmenté de 18 à 20
                    color={isActive ? colors.background : colors.textSecondary}
                    style={styles.tabIcon}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: isActive
                          ? colors.background
                          : colors.textSecondary,
                        fontWeight: isActive ? "700" : "500",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12, // Augmenté de 8 à 12
    marginBottom: 4, // Ajout d'une marge en bas
  },
  tabsContainer: {
    height: 52, // Augmenté de 48 à 52
    borderRadius: 14, // Augmenté de 12 à 14
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
    paddingHorizontal: 4, // Ajout de padding interne
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: "row",
  },
  slider: {
    position: "absolute",
    top: 6, // Ajusté de 4 à 6
    left: 8, // Ajusté de 4 à 8
    height: 40,
    borderRadius: 10, // Augmenté de 8 à 10
    zIndex: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tab: {
    height: 52, // Ajusté pour correspondre au container
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    paddingHorizontal: 4, // Ajout de padding
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12, // Augmenté de 8 à 12
    gap: 8, // Augmenté de 6 à 8
    minWidth: 90, // Largeur minimale pour le contenu
  },
  tabIcon: {
    marginBottom: 1,
  },
  tabText: {
    fontSize: 14, // Augmenté de 13 à 14
    letterSpacing: -0.1, // Ajusté de -0.2 à -0.1
    textAlign: "center",
  },
});
