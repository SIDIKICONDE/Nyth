import { useTheme } from "@/contexts/ThemeContext";
import { useCentralizedFont } from "@/hooks/useCentralizedFont";
import { useTranslation } from "@/hooks/useTranslation";
import { useAdaptiveDimensions } from "@/hooks/useAdaptiveDimensions";
import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { HeadingText, UIText } from "../../../../../components/ui/Typography";
import { LocalAnalytics, PeriodType } from "../types";
import { MetricCard } from "./MetricCard";

interface AnalyticsContentProps {
  localAnalytics: LocalAnalytics;
  selectedPeriod: PeriodType;
}

const { width: screenWidth } = Dimensions.get("window");

export const AnalyticsContent: React.FC<AnalyticsContentProps> = ({
  localAnalytics,
  selectedPeriod,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui, heading } = useCentralizedFont();
  const adaptiveDimensions = useAdaptiveDimensions();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const numberFormatter = React.useMemo(() => new Intl.NumberFormat(), []);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [localAnalytics]);

  // Fonction pour obtenir le texte de la période
  const getPeriodText = (period: PeriodType) => {
    switch (period) {
      case "week":
        return t("planning.analytics.events.analysisWeekly", "Weekly analysis");
      case "month":
        return t(
          "planning.analytics.events.analysisMonthly",
          "Monthly analysis"
        );
      case "quarter":
        return t(
          "planning.analytics.events.analysisQuarterly",
          "Quarterly analysis"
        );
      case "year":
        return t("planning.analytics.events.analysisYearly", "Yearly analysis");
      default:
        return t(
          "planning.analytics.events.overviewComplete",
          "Complete overview"
        );
    }
  };

  const renderMiniChart = () => (
    <View style={styles.miniChartContainer}>
      <View style={styles.chartBars}>
        {[
          {
            value: localAnalytics.eventsCompleted,
            color: currentTheme.colors.success,
          },
          {
            value: localAnalytics.eventsInProgress,
            color: currentTheme.colors.warning,
          },
          {
            value: localAnalytics.eventsPlanned,
            color: currentTheme.colors.secondary,
          },
        ].map((item, index) => {
          const maxValue = Math.max(
            localAnalytics.eventsCompleted,
            localAnalytics.eventsInProgress,
            localAnalytics.eventsPlanned,
            1
          );
          const height = (item.value / maxValue) * 60;
          return (
            <Animated.View
              key={index}
              style={[
                styles.chartBar,
                {
                  backgroundColor: item.color,
                  height,
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );

  const renderEventsSection = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.sectionGradient,
          { backgroundColor: currentTheme.colors.primary + "08" },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIconContainer,
              { backgroundColor: currentTheme.colors.primary + "15" },
            ]}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={currentTheme.colors.primary}
            />
          </View>
          <View style={styles.sectionTitleContainer}>
            <HeadingText
              size="xl"
              weight="bold"
              style={[
                heading,
                styles.sectionTitle,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("planning.analytics.events.title", "Events")}
            </HeadingText>
            <UIText
              size="sm"
              weight="medium"
              style={[
                ui,
                styles.sectionSubtitle,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {getPeriodText(selectedPeriod)}
            </UIText>
          </View>
          {renderMiniChart()}
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            title={t("planning.analytics.events.total", "Total")}
            value={numberFormatter.format(localAnalytics.totalEvents)}
            color={currentTheme.colors.primary}
            icon="calendar"
            trend={localAnalytics.totalEvents > 0 ? "up" : "neutral"}
          />
          <MetricCard
            title={t("planning.analytics.events.completed", "Completed")}
            value={numberFormatter.format(localAnalytics.eventsCompleted)}
            subtitle={`${numberFormatter.format(
              localAnalytics.completionRate
            )}%`}
            color={currentTheme.colors.success}
            icon="checkmark-circle"
            trend={localAnalytics.completionRate > 50 ? "up" : "down"}
          />
          <MetricCard
            title={t("planning.analytics.events.inProgress", "In Progress")}
            value={numberFormatter.format(localAnalytics.eventsInProgress)}
            color={currentTheme.colors.warning}
            icon="play-circle"
          />
          <MetricCard
            title={t("planning.analytics.events.planned", "Planned")}
            value={numberFormatter.format(localAnalytics.eventsPlanned)}
            color={currentTheme.colors.secondary}
            icon="time"
          />
        </View>

        {localAnalytics.eventsOverdue > 0 && (
          <Animated.View
            style={[
              styles.alertCard,
              {
                backgroundColor: currentTheme.colors.error + "10",
                borderColor: currentTheme.colors.error + "30",
                borderLeftColor: currentTheme.colors.error,
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.alertIconContainer}>
              <Ionicons
                name="warning"
                size={20}
                color={currentTheme.colors.error}
              />
            </View>
            <View style={styles.alertContent}>
              <UIText
                size="base"
                weight="bold"
                style={[
                  ui,
                  styles.alertTitle,
                  { color: currentTheme.colors.error },
                ]}
              >
                {t(
                  "planning.analytics.events.alertTitle",
                  "Attention required"
                )}
              </UIText>
              <UIText
                size="sm"
                weight="medium"
                style={[
                  ui,
                  styles.alertText,
                  { color: currentTheme.colors.error },
                ]}
              >
                {numberFormatter.format(localAnalytics.eventsOverdue)}{" "}
                {localAnalytics.eventsOverdue > 1
                  ? t(
                      "planning.analytics.events.alertOverdueMultiple",
                      "events overdue"
                    )
                  : t(
                      "planning.analytics.events.alertOverdue",
                      "event overdue"
                    )}
              </UIText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={currentTheme.colors.error}
            />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );

  const renderGoalsSection = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.sectionGradient,
          { backgroundColor: currentTheme.colors.warning + "08" },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIconContainer,
              { backgroundColor: currentTheme.colors.warning + "15" },
            ]}
          >
            <Ionicons
              name="flag"
              size={20}
              color={currentTheme.colors.warning}
            />
          </View>
          <View style={styles.sectionTitleContainer}>
            <HeadingText
              size="xl"
              weight="bold"
              style={[
                heading,
                styles.sectionTitle,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("planning.analytics.goals.title", "Goals")}
            </HeadingText>
            <UIText
              size="sm"
              weight="medium"
              style={[
                ui,
                styles.sectionSubtitle,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                "planning.analytics.goals.globalPerformance",
                "Global performance"
              )}
            </UIText>
          </View>
          {/* Indicateur de progression circulaire */}
          <View style={styles.circularProgress}>
            <HeadingText
              size="base"
              weight="bold"
              style={[
                heading,
                styles.circularProgressText,
                { color: currentTheme.colors.warning },
              ]}
            >
              {numberFormatter.format(localAnalytics.goalCompletionRate)}%
            </HeadingText>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            title={t("planning.analytics.goals.total", "Total")}
            value={numberFormatter.format(localAnalytics.totalGoals)}
            color={currentTheme.colors.warning}
            icon="flag"
          />
          <MetricCard
            title={t("planning.analytics.goals.completed", "Completed")}
            value={numberFormatter.format(localAnalytics.goalsCompleted)}
            subtitle={`${numberFormatter.format(
              localAnalytics.goalCompletionRate
            )}%`}
            color={currentTheme.colors.success}
            icon="trophy"
            trend={localAnalytics.goalCompletionRate > 50 ? "up" : "down"}
          />
          <MetricCard
            title={t("planning.analytics.goals.active", "Active")}
            value={numberFormatter.format(localAnalytics.goalsActive)}
            color={currentTheme.colors.secondary}
            icon="flash"
          />
        </View>

        {/* Statistiques rapides */}
        <View style={styles.quickStats}>
          <View
            style={[
              styles.quickStatItem,
              { borderColor: currentTheme.colors.border },
            ]}
          >
            <Ionicons
              name="trending-up"
              size={16}
              color={currentTheme.colors.success}
            />
            <UIText
              size="sm"
              weight="medium"
              style={[
                ui,
                styles.quickStatText,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                "planning.analytics.goals.averageProgress",
                "Average progress"
              )}
            </UIText>
            <HeadingText
              size="base"
              weight="bold"
              style={[
                heading,
                styles.quickStatValue,
                { color: currentTheme.colors.text },
              ]}
            >
              {numberFormatter.format(
                Math.round(
                  (localAnalytics.goalCompletionRate +
                    localAnalytics.completionRate) /
                    2
                )
              )}
              %
            </HeadingText>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderTasksSection = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.sectionGradient,
          { backgroundColor: currentTheme.colors.accent + "08" },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIconContainer,
              { backgroundColor: currentTheme.colors.accent + "15" },
            ]}
          >
            <Ionicons
              name="checkbox"
              size={20}
              color={currentTheme.colors.accent}
            />
          </View>
          <View style={styles.sectionTitleContainer}>
            <HeadingText
              size="xl"
              weight="bold"
              style={[
                heading,
                styles.sectionTitle,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("planning.analytics.tasks.title", "Tasks")}
            </HeadingText>
            <UIText
              size="sm"
              weight="medium"
              style={[
                ui,
                styles.sectionSubtitle,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t("planning.analytics.tasks.taskManagement", "Task management")}
            </UIText>
          </View>
          {/* Indicateur de progression circulaire */}
          <View style={styles.circularProgress}>
            <HeadingText
              size="base"
              weight="bold"
              style={[
                heading,
                styles.circularProgressText,
                { color: currentTheme.colors.accent },
              ]}
            >
              {numberFormatter.format(localAnalytics.taskCompletionRate)}%
            </HeadingText>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            title={t("planning.analytics.tasks.total", "Total")}
            value={numberFormatter.format(localAnalytics.totalTasks)}
            color={currentTheme.colors.accent}
            icon="checkbox"
          />
          <MetricCard
            title={t("planning.analytics.tasks.completed", "Completed")}
            value={numberFormatter.format(localAnalytics.tasksCompleted)}
            subtitle={`${numberFormatter.format(
              localAnalytics.taskCompletionRate
            )}%`}
            color={currentTheme.colors.success}
            icon="checkmark-circle"
            trend={localAnalytics.taskCompletionRate > 50 ? "up" : "down"}
          />
          <MetricCard
            title={t("planning.analytics.tasks.inProgress", "In Progress")}
            value={numberFormatter.format(localAnalytics.tasksInProgress)}
            color={currentTheme.colors.warning}
            icon="play-circle"
          />
          <MetricCard
            title={t("planning.analytics.tasks.todo", "To Do")}
            value={numberFormatter.format(localAnalytics.tasksTodo)}
            color={currentTheme.colors.secondary}
            icon="time"
          />
          <MetricCard
            title={t("planning.analytics.tasks.blocked", "Blocked")}
            value={numberFormatter.format(localAnalytics.tasksBlocked)}
            color={currentTheme.colors.error}
            icon="alert-circle"
          />
          <MetricCard
            title={t("planning.analytics.tasks.overdue", "Overdue")}
            value={numberFormatter.format(localAnalytics.tasksOverdue)}
            color={currentTheme.colors.error}
            icon="warning"
          />
        </View>

        {/* Alertes pour les tâches en retard */}
        {localAnalytics.tasksOverdue > 0 && (
          <View
            style={[
              styles.alertCard,
              {
                borderColor: currentTheme.colors.error,
                backgroundColor: currentTheme.colors.error + "10",
              },
            ]}
          >
            <View style={styles.alertIconContainer}>
              <Ionicons
                name="warning"
                size={20}
                color={currentTheme.colors.error}
              />
            </View>
            <View style={styles.alertContent}>
              <UIText
                size="sm"
                weight="bold"
                style={[
                  ui,
                  styles.alertTitle,
                  { color: currentTheme.colors.error },
                ]}
              >
                {t("planning.analytics.tasks.alertTitle", "Attention required")}
              </UIText>
              <UIText
                size="sm"
                weight="medium"
                style={[
                  ui,
                  styles.alertText,
                  { color: currentTheme.colors.error },
                ]}
              >
                {localAnalytics.tasksOverdue === 1
                  ? t(
                      "planning.analytics.tasks.alertOverdue",
                      `${numberFormatter.format(1)} task overdue`
                    )
                  : t(
                      "planning.analytics.tasks.alertOverdueMultiple",
                      `${numberFormatter.format(
                        localAnalytics.tasksOverdue
                      )} tasks overdue`
                    )}
              </UIText>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const styles = createStyles(adaptiveDimensions, currentTheme);

  return (
    <View style={styles.container}>
      {renderEventsSection()}
      {renderGoalsSection()}
      {renderTasksSection()}
    </View>
  );
};

const createStyles = (adaptiveDimensions: any, currentTheme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    section: {
      marginBottom: adaptiveDimensions.spacing.md,
    },
    sectionGradient: {
      borderRadius: adaptiveDimensions.borderRadius.lg,
      padding: adaptiveDimensions.spacing.md,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: adaptiveDimensions.spacing.md,
    },
    sectionIconContainer: {
      width: adaptiveDimensions.componentHeight.touchTarget * 0.8,
      height: adaptiveDimensions.componentHeight.touchTarget * 0.8,
      borderRadius: adaptiveDimensions.borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      marginRight: adaptiveDimensions.spacing.sm,
    },
    sectionTitleContainer: {
      flex: 1,
    },
    sectionTitle: {
      letterSpacing: -0.3,
      // fontSize et fontWeight supprimés - gérés par HeadingText
    },
    sectionSubtitle: {
      marginTop: 2,
      opacity: 0.8,
      // fontSize et fontWeight supprimés - gérés par UIText
    },
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: adaptiveDimensions.spacing.sm,
    },
    alertCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: adaptiveDimensions.spacing.md,
      borderRadius: adaptiveDimensions.borderRadius.lg,
      borderWidth: 1,
      borderLeftWidth: 4,
      marginTop: adaptiveDimensions.spacing.md,
      shadowColor: currentTheme.colors.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    alertIconContainer: {
      width: adaptiveDimensions.componentHeight.button * 0.8,
      height: adaptiveDimensions.componentHeight.button * 0.8,
      borderRadius: adaptiveDimensions.borderRadius.md,
      backgroundColor: currentTheme.colors.error + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: adaptiveDimensions.spacing.sm,
    },
    alertContent: {
      flex: 1,
    },
    alertTitle: {
      marginBottom: 4,
      // fontSize et fontWeight supprimés - gérés par UIText
    },
    alertText: {
      lineHeight: 20,
      // fontSize et fontWeight supprimés - gérés par UIText
    },

    miniChartContainer: {
      marginLeft: "auto",
    },
    chartBars: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: adaptiveDimensions.spacing.xs / 2,
      height: adaptiveDimensions.componentHeight.button * 1.25,
    },
    chartBar: {
      width: adaptiveDimensions.spacing.sm * 1.5,
      borderRadius: adaptiveDimensions.borderRadius.sm,
      minHeight: adaptiveDimensions.spacing.xs,
    },
    circularProgress: {
      width: adaptiveDimensions.componentHeight.button * 1.25,
      height: adaptiveDimensions.componentHeight.button * 1.25,
      borderRadius: adaptiveDimensions.componentHeight.button * 0.625,
      borderWidth: 3,
      borderColor: currentTheme.colors.warning + "20",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: "auto",
    },
    circularProgressText: {
      // fontSize et fontWeight supprimés - gérés par HeadingText
    },
    quickStats: {
      marginTop: adaptiveDimensions.spacing.md,
    },
    quickStatItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: adaptiveDimensions.spacing.sm,
      borderRadius: adaptiveDimensions.borderRadius.md,
      borderWidth: 1,
      gap: adaptiveDimensions.spacing.xs,
    },
    quickStatText: {
      flex: 1,
      // fontSize et fontWeight supprimés - gérés par UIText
    },
    quickStatValue: {
      // fontSize et fontWeight supprimés - gérés par HeadingText
    },
  });
