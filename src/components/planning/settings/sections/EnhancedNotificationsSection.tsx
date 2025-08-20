import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { H4, UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { SettingItem } from "../components/SettingItem";
import { TimePicker } from "../components/TimePicker";
import { ReminderTimingSelector } from "../components/ReminderTimingSelector";
import { ExtendedNotificationSettings } from "../types";

interface EnhancedNotificationsSectionProps {
  settings: ExtendedNotificationSettings;
  onSettingChange: (path: string, value: any) => void;
}

export const EnhancedNotificationsSection: React.FC<
  EnhancedNotificationsSectionProps
> = ({ settings, onSettingChange }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<string[]>(["basic"]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const updateNestedSetting = (path: string, value: any) => {
    onSettingChange(path, value);
  };

  const SectionHeader = ({
    title,
    section,
    icon,
  }: {
    title: string;
    section: string;
    icon: string;
  }) => {
    const isExpanded = expandedSections.includes(section);
    return (
      <TouchableOpacity
        style={[
          styles.sectionHeader,
          { backgroundColor: currentTheme.colors.surface + "50" },
        ]}
        onPress={() => toggleSection(section)}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name={icon} size={20} color={currentTheme.colors.primary} />
          <H4
            style={[styles.sectionTitle, { color: currentTheme.colors.text }]}
          >
            {title}
          </H4>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={currentTheme.colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Section Basique */}
      <SectionHeader
        title="Types de notifications"
        section="basic"
        icon="notifications"
      />
      {expandedSections.includes("basic") && (
        <View style={styles.sectionContent}>
          <SettingItem
            title="Notifications push"
            description="Notifications sur votre appareil"
            value={settings.pushNotifications}
            onValueChange={(value) =>
              updateNestedSetting("pushNotifications", value)
            }
            icon="phone-portrait"
          />

          {/* Temporairement désactivées - Email et SMS non implémentés
          <SettingItem
            title="Notifications par email"
            description="Recevoir des rappels par email"
            value={settings.emailNotifications}
            onValueChange={(value) =>
              updateNestedSetting("emailNotifications", value)
            }
            icon="mail"
          />

          <SettingItem
            title="Notifications SMS"
            description="Rappels par message texte"
            value={settings.smsNotifications}
            onValueChange={(value) =>
              updateNestedSetting("smsNotifications", value)
            }
            icon="chatbubble-ellipses"
          />
          */}
        </View>
      )}

      {/* Section Rappels d'événements */}
      <SectionHeader
        title="Rappels d'événements"
        section="events"
        icon="calendar"
      />
      {expandedSections.includes("events") && (
        <View style={styles.sectionContent}>
          <SettingItem
            title="Activer les rappels d'événements"
            description="Recevoir des rappels avant vos événements"
            value={settings.eventReminders.enabled}
            onValueChange={(value) =>
              updateNestedSetting("eventReminders.enabled", value)
            }
            icon="alarm"
          />

          {settings.eventReminders.enabled && (
            <>
              <View style={styles.customSetting}>
                <View style={styles.customSettingHeader}>
                  <UIText
                    size="base"
                    weight="medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Horaires de rappel
                  </UIText>
                  <UIText
                    size="sm"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Quand recevoir les rappels
                  </UIText>
                </View>
                <ReminderTimingSelector
                  selectedTiming={settings.eventReminders.defaultTiming}
                  onTimingChange={(timing) =>
                    updateNestedSetting("eventReminders.defaultTiming", timing)
                  }
                  title="Rappels d'événements"
                />
              </View>

              <SettingItem
                title="Rappels multiples"
                description="Autoriser plusieurs rappels par événement"
                value={settings.eventReminders.allowMultiple}
                onValueChange={(value) =>
                  updateNestedSetting("eventReminders.allowMultiple", value)
                }
                icon="layers"
              />
            </>
          )}
        </View>
      )}

      {/* Section Objectifs */}
      <SectionHeader title="Rappels d'objectifs" section="goals" icon="flag" />
      {expandedSections.includes("goals") && (
        <View style={styles.sectionContent}>
          <SettingItem
            title="Rappels d'objectifs activés"
            description="Suivre vos progrès et objectifs"
            value={settings.goalReminders.enabled}
            onValueChange={(value) =>
              updateNestedSetting("goalReminders.enabled", value)
            }
            icon="trending-up"
          />

          {settings.goalReminders.enabled && (
            <>
              <SettingItem
                title="Progrès quotidien"
                description="Rappel quotidien de vos progrès"
                value={settings.goalReminders.dailyProgress}
                onValueChange={(value) =>
                  updateNestedSetting("goalReminders.dailyProgress", value)
                }
                icon="today"
              />

              <SettingItem
                title="Révision hebdomadaire"
                description="Bilan hebdomadaire de vos objectifs"
                value={settings.goalReminders.weeklyReview}
                onValueChange={(value) =>
                  updateNestedSetting("goalReminders.weeklyReview", value)
                }
                icon="calendar-outline"
              />

              <SettingItem
                title="Alertes de retard"
                description="Notifications pour objectifs en retard"
                value={settings.goalReminders.overdueAlerts}
                onValueChange={(value) =>
                  updateNestedSetting("goalReminders.overdueAlerts", value)
                }
                icon="warning"
              />

              <SettingItem
                title="Célébrations de réussite"
                description="Notifications lors d'accomplissements"
                value={settings.goalReminders.achievementCelebrations}
                onValueChange={(value) =>
                  updateNestedSetting(
                    "goalReminders.achievementCelebrations",
                    value
                  )
                }
                icon="trophy"
              />
            </>
          )}
        </View>
      )}

      {/* Section Tâches */}
      <SectionHeader
        title="Rappels de tâches"
        section="tasks"
        icon="checkbox"
      />
      {expandedSections.includes("tasks") && (
        <View style={styles.sectionContent}>
          <SettingItem
            title="Rappels de tâches activés"
            description="Notifications pour vos tâches"
            value={settings.taskReminders.enabled}
            onValueChange={(value) =>
              updateNestedSetting("taskReminders.enabled", value)
            }
            icon="list"
          />

          {settings.taskReminders.enabled && (
            <>
              <SettingItem
                title="Alertes d'échéance"
                description="Rappels avant les dates limites"
                value={settings.taskReminders.dueDateAlerts}
                onValueChange={(value) =>
                  updateNestedSetting("taskReminders.dueDateAlerts", value)
                }
                icon="time"
              />

              <SettingItem
                title="Alertes de début"
                description="Rappels pour commencer les tâches"
                value={settings.taskReminders.startDateAlerts}
                onValueChange={(value) =>
                  updateNestedSetting("taskReminders.startDateAlerts", value)
                }
                icon="play"
              />

              <SettingItem
                title="Tâches en retard"
                description="Notifications pour tâches non terminées"
                value={settings.taskReminders.overdueAlerts}
                onValueChange={(value) =>
                  updateNestedSetting("taskReminders.overdueAlerts", value)
                }
                icon="alert-circle"
              />
            </>
          )}
        </View>
      )}

      {/* Section Heures de tranquillité */}
      <SectionHeader
        title="Heures de tranquillité"
        section="quiet"
        icon="moon"
      />
      {expandedSections.includes("quiet") && (
        <View style={styles.sectionContent}>
          <SettingItem
            title="Mode Ne pas déranger"
            description="Suspendre les notifications pendant certaines heures"
            value={settings.quietHours.enabled}
            onValueChange={(value) =>
              updateNestedSetting("quietHours.enabled", value)
            }
            icon="moon"
          />

          {settings.quietHours.enabled && (
            <>
              <View style={styles.timeRangeContainer}>
                <View style={styles.timeRangeItem}>
                  <UIText
                    size="base"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Début
                  </UIText>
                  <TimePicker
                    value={settings.quietHours.startTime}
                    onValueChange={(time) =>
                      updateNestedSetting("quietHours.startTime", time)
                    }
                    title="Heure de début"
                  />
                </View>

                <View style={styles.timeRangeItem}>
                  <UIText
                    size="base"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Fin
                  </UIText>
                  <TimePicker
                    value={settings.quietHours.endTime}
                    onValueChange={(time) =>
                      updateNestedSetting("quietHours.endTime", time)
                    }
                    title="Heure de fin"
                  />
                </View>
              </View>

              <SettingItem
                title="Week-ends uniquement"
                description="Mode tranquillité seulement les week-ends"
                value={settings.quietHours.weekendsOnly}
                onValueChange={(value) =>
                  updateNestedSetting("quietHours.weekendsOnly", value)
                }
                icon="calendar"
              />
            </>
          )}
        </View>
      )}

      {/* Section Sons et vibrations */}
      <SectionHeader
        title="Sons et vibrations"
        section="sounds"
        icon="volume-high"
      />
      {expandedSections.includes("sounds") && (
        <View style={styles.sectionContent}>
          <SettingItem
            title="Sons activés"
            description="Jouer des sons pour les notifications"
            value={settings.soundSettings.enabled}
            onValueChange={(value) =>
              updateNestedSetting("soundSettings.enabled", value)
            }
            icon="musical-notes"
          />

          <SettingItem
            title="Vibrations"
            description="Vibrer lors des notifications"
            value={settings.soundSettings.vibration}
            onValueChange={(value) =>
              updateNestedSetting("soundSettings.vibration", value)
            }
            icon="phone-vibrate"
          />
        </View>
      )}

      {/* Section Notifications intelligentes */}
      <SectionHeader
        title="Notifications intelligentes"
        section="smart"
        icon="sparkles"
      />
      {expandedSections.includes("smart") && (
        <View style={styles.sectionContent}>
          <SettingItem
            title="IA activée"
            description="Notifications intelligentes basées sur vos habitudes"
            value={settings.smartNotifications.enabled}
            onValueChange={(value) =>
              updateNestedSetting("smartNotifications.enabled", value)
            }
            icon="sparkles"
          />

          {settings.smartNotifications.enabled && (
            <>
              <SettingItem
                title="Suggestions IA"
                description="Suggestions d'optimisation de productivité"
                value={settings.smartNotifications.aiSuggestions}
                onValueChange={(value) =>
                  updateNestedSetting("smartNotifications.aiSuggestions", value)
                }
                icon="bulb"
              />

              <SettingItem
                title="Rappels adaptatifs"
                description="Rappels basés sur vos habitudes"
                value={settings.smartNotifications.habitBasedReminders}
                onValueChange={(value) =>
                  updateNestedSetting(
                    "smartNotifications.habitBasedReminders",
                    value
                  )
                }
                icon="sync"
              />

              <SettingItem
                title="Insights de productivité"
                description="Analyses de votre performance"
                value={settings.smartNotifications.productivityInsights}
                onValueChange={(value) =>
                  updateNestedSetting(
                    "smartNotifications.productivityInsights",
                    value
                  )
                }
                icon="analytics"
              />
            </>
          )}
        </View>
      )}

      {/* Section Intégrations */}
      <SectionHeader title="Intégrations" section="integrations" icon="link" />
      {expandedSections.includes("integrations") && (
        <View style={styles.sectionContent}>
          <SettingItem
            title="Synchronisation calendrier"
            description="Synchroniser vos événements avec le calendrier système"
            value={settings.integrations.calendar.enabled}
            onValueChange={(value) =>
              updateNestedSetting("integrations.calendar.enabled", value)
            }
            icon="calendar"
          />

          {settings.integrations.calendar.enabled && (
            <>
              <SettingItem
                title="Synchroniser les rappels"
                description="Synchroniser aussi les rappels avec le calendrier"
                value={settings.integrations.calendar.syncReminders}
                onValueChange={(value) =>
                  updateNestedSetting(
                    "integrations.calendar.syncReminders",
                    value
                  )
                }
                icon="alarm"
              />

              <View style={styles.customSetting}>
                <View style={styles.customSettingHeader}>
                  <UIText
                    size="base"
                    weight="medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Provider de calendrier
                  </UIText>
                  <UIText
                    size="sm"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    {settings.integrations.calendar.provider ||
                      "Calendrier système par défaut"}
                  </UIText>
                </View>
              </View>

              <SettingItem
                title="Notifications d'équipe"
                description="Recevoir des notifications des membres de l'équipe"
                value={settings.integrations.teamNotifications}
                onValueChange={(value) =>
                  updateNestedSetting("integrations.teamNotifications", value)
                }
                icon="people"
              />
            </>
          )}
        </View>
      )}

      {/* Section Filtres de priorité */}
      <SectionHeader
        title="Filtres de priorité"
        section="priorities"
        icon="filter"
      />
      {expandedSections.includes("priorities") && (
        <View style={styles.sectionContent}>
          <SettingItem
            title="Priorité faible"
            description="Afficher les notifications de faible priorité"
            value={settings.priorities.showLowPriority}
            onValueChange={(value) =>
              updateNestedSetting("priorities.showLowPriority", value)
            }
            icon="radio-button-off"
          />

          <SettingItem
            title="Priorité moyenne"
            description="Afficher les notifications de priorité moyenne"
            value={settings.priorities.showMediumPriority}
            onValueChange={(value) =>
              updateNestedSetting("priorities.showMediumPriority", value)
            }
            icon="radio-button-on"
          />

          <SettingItem
            title="Priorité élevée"
            description="Afficher les notifications de haute priorité"
            value={settings.priorities.showHighPriority}
            onValueChange={(value) =>
              updateNestedSetting("priorities.showHighPriority", value)
            }
            icon="radio-button-on"
          />

          <SettingItem
            title="Urgent uniquement"
            description="Ne montrer que les notifications urgentes"
            value={settings.priorities.showUrgentOnly}
            onValueChange={(value) =>
              updateNestedSetting("priorities.showUrgentOnly", value)
            }
            icon="warning"
          />
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  sectionContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  customSetting: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  customSettingHeader: {
    marginBottom: 12,
  },
  timeRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  timeRangeItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
