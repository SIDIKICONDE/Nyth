import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { H1, UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { usePlanningAI } from "../../../hooks/usePlanningAI";
import { useTranslation } from "../../../hooks/useTranslation";
import { RootStackParamList } from "../../../types/navigation";
import { PlanningScreenHeaderProps } from "../types";

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PlanningScreenHeaderComponent: React.FC<PlanningScreenHeaderProps> = ({
  activeTab,
  activeSubTab,
  onCreateEvent,
  onCreateGoal,
  onOpenSettings,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const {
    systemPrompt,
    insights,
    eventMetrics,
    hasOverdueEvents,
    quickSuggestions,
  } = usePlanningAI();

  const handleAIAssistant = useCallback(() => {
    navigation.navigate("AIChat", {
      initialMessage: t(
        "planning.header.aiAssistantMessage",
        "Aide-moi avec ma planification"
      ),
      invisibleContext: systemPrompt,
    });
  }, [navigation, systemPrompt, t]);

  const handleHomePress = useCallback(() => {
    navigation.navigate("Home");
  }, [navigation]);

  const hasData = eventMetrics.total > 0;
  const hasSuggestions = insights.suggestions.length > 0;

  // Fonction pour obtenir l'action principale selon l'onglet actif
  const getPrimaryAction = () => {
    switch (activeTab) {
      case "timeline":
        // Ne pas afficher d'icône pour les objectifs
        if (activeSubTab === "goals") {
          return null; // Pas d'action pour les objectifs
        }
        return null; // Pas d'action pour le sous-onglet "events"
      case "tasks":
        return null; // Pas d'action principale pour les tâches
      case "analytics":
        return null; // Pas d'action principale pour les analytics
      case "calendar":
        return null; // Pas d'icône pour l'onglet calendrier
      default:
        return {
          icon: "add" as const,
          color: currentTheme.colors.primary,
          action: onCreateEvent,
          label: t("planning.header.actions.new", "Nouveau"),
        };
    }
  };

  const primaryAction = getPrimaryAction();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: currentTheme.colors.surface,
          borderBottomColor: currentTheme.colors.border,
        },
      ]}
    >
      <View style={styles.headerContent}>
        {/* Section titre avec indicateurs */}
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            {/* Icône home */}
            <TouchableOpacity
              onPress={handleHomePress}
              style={[
                styles.homeButton,
                { backgroundColor: currentTheme.colors.primary + "15" },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="home"
                size={24}
                color={currentTheme.colors.primary}
              />
            </TouchableOpacity>

            <H1
              style={[styles.headerTitle, { color: currentTheme.colors.text }]}
            >
              {t("planning.title", "Planification")}
            </H1>

            {/* Badge avec nombre d'éléments selon l'onglet */}
            {hasData && (
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: currentTheme.colors.primary + "15" },
                ]}
              >
                <UIText
                  style={[
                    styles.countBadgeText,
                    { color: currentTheme.colors.primary },
                  ]}
                  size="xs"
                  weight="semibold"
                >
                  {eventMetrics.total}
                </UIText>
              </View>
            )}

            {/* Indicateurs d'état compacts sur la même ligne */}
            {hasOverdueEvents && (
              <View
                style={[
                  styles.statusBadge,
                  styles.urgentBadge,
                  { backgroundColor: currentTheme.colors.error + "15" },
                ]}
              >
                <Ionicons
                  name="warning"
                  size={10}
                  color={currentTheme.colors.error}
                />
              </View>
            )}

            {hasSuggestions && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: currentTheme.colors.warning + "15" },
                ]}
              >
                <Ionicons
                  name="bulb"
                  size={10}
                  color={currentTheme.colors.warning}
                />
              </View>
            )}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={[styles.headerActions, { marginTop: -12 }]}>
          {/* Assistant IA - toujours visible mais style adaptatif */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.aiButton,
              {
                backgroundColor: hasOverdueEvents
                  ? currentTheme.colors.error + "15"
                  : currentTheme.colors.primary + "15",
                borderColor: hasOverdueEvents
                  ? currentTheme.colors.error + "30"
                  : currentTheme.colors.primary + "30",
              },
            ]}
            onPress={handleAIAssistant}
          >
            <Ionicons
              name="sparkles"
              size={18}
              color={
                hasOverdueEvents
                  ? currentTheme.colors.error
                  : currentTheme.colors.primary
              }
            />
            {(hasOverdueEvents || hasSuggestions) && (
              <View
                style={[
                  styles.notificationDot,
                  {
                    backgroundColor: hasOverdueEvents
                      ? currentTheme.colors.error
                      : currentTheme.colors.warning,
                  },
                ]}
              />
            )}
          </TouchableOpacity>

          {/* Action principale contextuelle */}
          {primaryAction && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.primaryButton,
                { backgroundColor: primaryAction.color + "15" },
              ]}
              onPress={primaryAction.action}
            >
              <Ionicons
                name={primaryAction.icon}
                size={20}
                color={primaryAction.color}
              />
            </TouchableOpacity>
          )}

          {/* Menu contextuel */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: currentTheme.colors.surface },
            ]}
            onPress={onOpenSettings}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={currentTheme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barre de progression globale (optionnelle) */}
      {hasData && eventMetrics.completed > 0 && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: currentTheme.colors.border },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: currentTheme.colors.success,
                  width: `${
                    (eventMetrics.completed / eventMetrics.total) * 100
                  }%`,
                },
              ]}
            />
          </View>
          <UIText
            style={[
              styles.progressText,
              { color: currentTheme.colors.textSecondary },
            ]}
            size="xs"
            weight="medium"
          >
            {eventMetrics.completed}/{eventMetrics.total}{" "}
            {t("planning.header.completed", "terminés")}
          </UIText>
        </View>
      )}
    </View>
  );
};

export const PlanningScreenHeader = React.memo(PlanningScreenHeaderComponent);

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingTop: 4,
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    letterSpacing: -0.5,
  },
  homeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  countBadgeText: {},
  statusIndicators: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  urgentBadge: {
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusBadgeText: {},
  headerActions: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  aiButton: {
    borderWidth: 1,
  },
  primaryButton: {
    transform: [{ scale: 1.1 }],
  },
  notificationDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressContainer: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 2,
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  progressText: {},
});
