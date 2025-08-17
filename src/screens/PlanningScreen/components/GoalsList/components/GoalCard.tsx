import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { ANIMATION_CONFIG, GOAL_CARD_CONFIG } from "../constants";
import { GoalCardProps } from "../types";
import { goalUtils } from "../utils/goalUtils";

import { createOptimizedLogger } from '../../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('GoalCard');

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onLongPress,
  onQuickIncrement,
  onQuickDecrement,
  onMarkComplete,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(goal.progress)).current;
  const completedAnim = useRef(
    new Animated.Value(goal.status === "completed" ? 1 : 0)
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // État pour le feedback visuel
  const [isPressed, setIsPressed] = useState(false);

  const priorityColor =
    goal.status === "completed"
      ? "#10B981" // Vert pour les objectifs accomplis
      : goalUtils.getPriorityColor(goal.priority);
  const statusIcon = goalUtils.getStatusIcon(goal);
  const showQuickActions = goalUtils.shouldShowQuickActions(goal);
  const canMarkComplete = goalUtils.canMarkComplete(goal);

  // Animation de progression
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: goal.progress,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [goal.progress]);

  // Animation de completion
  useEffect(() => {
    Animated.spring(completedAnim, {
      toValue: goal.status === "completed" || goal.completedAt ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [goal.status, goal.completedAt]);

  // Animation de pulse pour les actions rapides
  const startPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Gestion du press
  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  // Actions améliorées avec animations
  const handleQuickIncrementPress = () => {
    startPulse();
    onQuickIncrement();
  };

  const handleQuickDecrementPress = () => {
    startPulse();
    onQuickDecrement();
  };

  const handleCompletePress = () => {
    startPulse();
    onMarkComplete();
  };

  // Obtenir l'icône vectorielle selon la priorité
  const getPriorityIcon = () => {
    switch (goal.priority) {
      case "high":
        return "flame";
      case "medium":
        return "warning";
      case "low":
        return "leaf";
      default:
        return "ellipse";
    }
  };

  // Obtenir l'icône de statut
  const getStatusIcon = () => {
    if (goal.status === "completed") {
      return "checkmark-circle";
    }
    return getPriorityIcon();
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor:
              goal.status === "completed"
                ? priorityColor
                : currentTheme.colors.border,
            borderWidth: goal.status === "completed" ? 2 : 1,
            shadowColor: priorityColor,
            shadowOpacity: isPressed ? 0.15 : 0.05,
            shadowRadius: isPressed ? 8 : 2,
            elevation: isPressed ? 4 : 1,
          },
        ]}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Badge de statut accompli avec animation */}
        <Animated.View
          style={[
            styles.completedBadgeContainer,
            {
              opacity: completedAnim,
              transform: [
                {
                  translateY: completedAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={
            goal.status === "completed" || goal.completedAt ? "auto" : "none"
          }
        >
          <View
            style={[styles.completedBadge, { backgroundColor: priorityColor }]}
          >
            <Ionicons name="checkmark-circle" size={12} color="white" />
            <Text style={styles.completedBadgeText}>
              {goal.completedAt && goal.status !== "completed"
                ? t("planning.goals.alreadyCompleted", "Déjà accompli")
                : t("planning.goals.completed", "Accompli")}
            </Text>
          </View>
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.priorityIconContainer,
                { backgroundColor: priorityColor + "20" },
              ]}
            >
              <Ionicons
                name={getStatusIcon()}
                size={14}
                color={
                  goal.status === "completed" ? priorityColor : priorityColor
                }
              />
            </View>
            <Text
              style={[
                styles.title,
                { color: currentTheme.colors.text },
                goal.status === "completed" && styles.completedText,
              ]}
              numberOfLines={1}
            >
              {goal.title}
            </Text>
          </View>

          {/* Progress circle animé */}
          <View
            style={[styles.progressContainer, { borderColor: priorityColor }]}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                styles.progressCircle,
                {
                  backgroundColor: priorityColor + "20",
                  transform: [
                    {
                      scale: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: [0, 1],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.Text
              style={[
                styles.progressText,
                { color: priorityColor },
                {
                  transform: [
                    {
                      scale: progressAnim.interpolate({
                        inputRange: [0, 50, 100],
                        outputRange: [0.8, 1, 1.1],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}
            >
              {Math.round(goal.progress)}%
            </Animated.Text>
          </View>
        </View>

        {/* Progress bar animée */}
        <View
          style={[
            styles.progressBarContainer,
            { backgroundColor: currentTheme.colors.border },
          ]}
        >
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: priorityColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                  extrapolate: "clamp",
                }),
              },
            ]}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.progressInfoContainer}>
            <Ionicons
              name="analytics"
              size={12}
              color={currentTheme.colors.textSecondary}
            />
            <Text
              style={[
                styles.progressInfo,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {goalUtils.formatProgress(goal)}
            </Text>
          </View>
          <View style={styles.periodContainer}>
            <Ionicons
              name="time"
              size={12}
              color={currentTheme.colors.textSecondary}
            />
            <Text
              style={[
                styles.period,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(`planning.goals.periods.${goal.period}`, goal.period)}
            </Text>
          </View>
        </View>

        {/* Quick Actions avec animations */}
        {showQuickActions && (
          <Animated.View
            style={[
              styles.quickActions,
              {
                opacity: showQuickActions ? 1 : 0,
                transform: [
                  {
                    translateY: showQuickActions ? 0 : 20,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.decrementButton,
                {
                  borderColor: currentTheme.colors.border,
                  backgroundColor: currentTheme.colors.background,
                },
              ]}
              onPress={handleQuickDecrementPress}
            >
              <Ionicons
                name="remove"
                size={16}
                color={currentTheme.colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.incrementButton,
                { backgroundColor: priorityColor },
              ]}
              onPress={handleQuickIncrementPress}
            >
              <Ionicons name="add" size={16} color="white" />
            </TouchableOpacity>

            {canMarkComplete && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.completeButton,
                  {
                    backgroundColor: "#10B981",
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                  },
                ]}
                onPress={handleCompletePress}
              >
                <Ionicons name="checkmark" size={12} color="white" />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: "white", fontSize: 10 },
                  ]}
                >
                  {(() => {
                    logger.debug("🔍 Debug badge:", {
                      title: goal.title,
                      status: goal.status,
                      completedAt: goal.completedAt,
                      hasCompletedAt: !!goal.completedAt,
                      statusNotCompleted: goal.status !== "completed",
                      shouldShowAlready:
                        goal.completedAt && goal.status !== "completed",
                    });

                    return goal.completedAt && goal.status !== "completed"
                      ? t("planning.goals.alreadyCompleted", "Déjà accompli")
                      : t("planning.goals.completed", "Accompli");
                  })()}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: GOAL_CARD_CONFIG.padding,
    borderRadius: GOAL_CARD_CONFIG.borderRadius,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginBottom: 8,
  },
  completedBadgeContainer: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  priorityIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.7,
  },
  progressContainer: {
    width: GOAL_CARD_CONFIG.progressCircleSize,
    height: GOAL_CARD_CONFIG.progressCircleSize,
    borderRadius: GOAL_CARD_CONFIG.progressCircleSize / 2,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  progressCircle: {
    borderRadius: GOAL_CARD_CONFIG.progressCircleSize / 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "700",
    zIndex: 1,
  },
  progressBarContainer: {
    height: GOAL_CARD_CONFIG.progressBarHeight,
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressInfo: {
    fontSize: 12,
    fontWeight: "500",
  },
  periodContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  period: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.8,
  },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: GOAL_CARD_CONFIG.actionButtonMinWidth,
    flexDirection: "row",
    gap: 4,
  },
  decrementButton: {
    borderWidth: 1,
  },
  incrementButton: {
    // Couleur définie dynamiquement
  },
  completeButton: {
    paddingHorizontal: 16,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
