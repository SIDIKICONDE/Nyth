import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTasks } from "../../../hooks/useTasks";
import { useTranslation } from "../../../hooks/useTranslation";
import { PlanningScreenTabsProps } from "../types";

const PlanningScreenTabsComponent: React.FC<PlanningScreenTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Hook pour obtenir les données des tâches
  const { getTaskStats } = useTasks();
  const taskStats = getTaskStats();

  // Fonction pour obtenir le badge de chaque onglet
  const getTabBadge = (tabKey: string) => {
    switch (tabKey) {
      case "tasks":
        const pendingTasks = taskStats.todo + taskStats.inProgress;
        return pendingTasks > 0 ? pendingTasks : null;

      default:
        return null;
    }
  };

  // Fonction pour obtenir l'indicateur d'urgence
  const getUrgencyIndicator = (tabKey: string) => {
    switch (tabKey) {
      case "tasks":
        return taskStats.overdue > 0 ? "error" : null;

      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.tabsContainer,
        {
          backgroundColor: currentTheme.colors.surface,
          borderBottomColor: currentTheme.colors.border,
        },
      ]}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;
        const badge = getTabBadge(tab.key);
        const urgency = getUrgencyIndicator(tab.key);

        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && [
                styles.activeTab,
                {
                  backgroundColor: currentTheme.colors.primary + "10",
                  borderBottomColor: currentTheme.colors.primary,
                },
              ],
            ]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              {/* Icône avec indicateur d'urgence */}
              <View style={styles.iconContainer}>
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={
                    isActive
                      ? currentTheme.colors.primary
                      : urgency === "error"
                      ? currentTheme.colors.error
                      : currentTheme.colors.textSecondary
                  }
                />

                {/* Point d'urgence */}
                {urgency === "error" && (
                  <View
                    style={[
                      styles.urgencyDot,
                      { backgroundColor: currentTheme.colors.error },
                    ]}
                  />
                )}
              </View>

              {/* Texte de l'onglet */}
              <UIText
                style={[
                  styles.tabText,
                  {
                    color: isActive
                      ? currentTheme.colors.primary
                      : currentTheme.colors.textSecondary,
                  },
                  ...(isActive ? [styles.activeTabText] : []),
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
                size="xs"
                weight={isActive ? "semibold" : "medium"}
              >
                {t(tab.title, tab.key)}
              </UIText>

              {/* Badge avec nombre */}
              {badge && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        urgency === "error"
                          ? currentTheme.colors.error
                          : isActive
                          ? currentTheme.colors.primary
                          : currentTheme.colors.textSecondary,
                    },
                  ]}
                >
                  <UIText
                    style={[styles.badgeText, { color: "white" }]}
                    size="xs"
                    weight="bold"
                  >
                    {badge > 99 ? "99+" : badge}
                  </UIText>
                </View>
              )}
            </View>

            {/* Indicateur de progression pour l'onglet actif */}
            {isActive && (
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: currentTheme.colors.primary },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const PlanningScreenTabs = React.memo(PlanningScreenTabsComponent);

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingTop: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 2,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  activeTab: {
    borderBottomWidth: 0,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    position: "relative",
    width: "100%",
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  urgencyDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "white",
  },
  tabText: {
    textAlign: "center",
    width: "100%",
    flexShrink: 1,
  },
  activeTabText: {},
  badge: {
    position: "absolute",
    top: -2,
    right: 10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: "white",
  },
  badgeText: {
    lineHeight: 10,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 6,
    right: 6,
    height: 2,
    borderRadius: 1,
  },
});
