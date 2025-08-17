import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { PlanningEvent } from "../../../../../types/planning";
import { UIText } from "../../../../ui/Typography";
import { StatusBadge } from "../StatusBadge";

interface StatusChangeSectionProps {
  event: PlanningEvent;
  onStatusChange: (eventId: string, newStatus: PlanningEvent["status"]) => void;
}

export const StatusChangeSection: React.FC<StatusChangeSectionProps> = ({
  event,
  onStatusChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const successOpacity = useRef(new Animated.Value(0)).current;

  const handleStatusChange = (newStatus: typeof event.status) => {
    if (event.status === newStatus) {
      return;
    }

    // Marquer le statut en cours de changement
    setChangingStatus(newStatus);

    // Animation de feedback sur le bouton
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
    ]).start(() => {
      // Simuler un délai de traitement
      setTimeout(() => {
        setChangingStatus(null);
        setShowSuccessMessage(true);

        // Animation du message de succès
        Animated.sequence([
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(successOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowSuccessMessage(false);
        });

        onStatusChange(event.id, newStatus);
      }, 500);
    });
  };

  const statusOptions: Array<{
    status: typeof event.status;
    label: string;
    icon: string;
    color: string;
  }> = [
    {
      status: "planned",
      label: t("planning.events.status.planned", "Planifié"),
      icon: "calendar-outline",
      color: "#6366F1",
    },
    {
      status: "in_progress",
      label: t("planning.events.status.in_progress", "En cours"),
      icon: "play-circle-outline",
      color: "#F59E0B",
    },
    {
      status: "completed",
      label: t("planning.events.status.completed", "Terminé"),
      icon: "checkmark-circle-outline",
      color: "#10B981",
    },
    {
      status: "postponed",
      label: t("planning.events.status.postponed", "Reporté"),
      icon: "time-outline",
      color: "#EF4444",
    },
    {
      status: "cancelled",
      label: t("planning.events.status.cancelled", "Annulé"),
      icon: "close-circle-outline",
      color: "#6B7280",
    },
  ];

  return (
    <Animated.View
      style={[
        styles.statusSection,
        {
          backgroundColor: currentTheme.colors.surface,
          transform: [{ scale: scaleAnim }],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
      ]}
    >
      <UIText
        size="lg"
        weight="semibold"
        style={[ui, styles.sectionTitle, { color: currentTheme.colors.text }]}
      >
        {t("planning.timeline.changeStatus", "Changer le statut")}
      </UIText>

      {/* Message de succès */}
      {showSuccessMessage && (
        <Animated.View
          style={[
            styles.successMessage,
            {
              backgroundColor: "#10B981" + "15",
              borderColor: "#10B981" + "30",
              opacity: successOpacity,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <UIText
            size="sm"
            weight="semibold"
            style={[ui, styles.successText, { color: "#10B981" }]}
          >
            {t(
              "planning.success.statusUpdated",
              "Status updated successfully!"
            )}
          </UIText>
        </Animated.View>
      )}

      <View style={styles.statusGrid}>
        {statusOptions.map((option) => {
          const isActive = event.status === option.status;
          const isChanging = changingStatus === option.status;

          return (
            <TouchableOpacity
              key={option.status}
              style={[
                styles.statusOption,
                {
                  backgroundColor: isActive
                    ? option.color + "15"
                    : currentTheme.colors.background,
                  borderColor: isActive
                    ? option.color
                    : currentTheme.colors.border + "50",
                  borderWidth: isActive ? 2 : 1,
                  opacity: isChanging ? 0.7 : 1,
                },
              ]}
              onPress={() => handleStatusChange(option.status)}
              disabled={isActive || changingStatus !== null}
              activeOpacity={0.7}
            >
              <View style={styles.statusContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: option.color + "10" },
                  ]}
                >
                  {isChanging ? (
                    <Animated.View
                      style={{
                        transform: [
                          {
                            rotate: scaleAnim.interpolate({
                              inputRange: [0.95, 1],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                      }}
                    >
                      <Ionicons
                        name="sync-outline"
                        size={20}
                        color={option.color}
                      />
                    </Animated.View>
                  ) : (
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={option.color}
                    />
                  )}
                </View>

                <View style={styles.statusInfo}>
                  <StatusBadge status={option.status} size="small" />
                  <UIText
                    size="sm"
                    weight={isActive ? "bold" : "medium"}
                    style={[
                      ui,
                      styles.statusOptionText,
                      {
                        color: isActive
                          ? option.color
                          : currentTheme.colors.text,
                      },
                    ]}
                  >
                    {isChanging ? "Changement..." : option.label}
                  </UIText>
                </View>

                {isActive && !isChanging && (
                  <View style={styles.checkmark}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={option.color}
                    />
                  </View>
                )}

                {isChanging && (
                  <View style={styles.loadingIndicator}>
                    <Animated.View
                      style={{
                        transform: [
                          {
                            rotate: scaleAnim.interpolate({
                              inputRange: [0.95, 1],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                      }}
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={16}
                        color={option.color}
                      />
                    </Animated.View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  statusSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  successText: {
    flex: 1,
  },
  statusGrid: {
    gap: 8,
  },
  statusOption: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 2,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
    gap: 4,
  },
  statusOptionText: {
    letterSpacing: 0.1,
  },
  checkmark: {
    marginLeft: 8,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
});
