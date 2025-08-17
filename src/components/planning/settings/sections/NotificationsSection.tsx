import React from "react";
import { StyleSheet, View } from "react-native";
import { H4 } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { SettingItem } from "../components/SettingItem";
import { PlanningSettings } from "../types";

interface NotificationsSectionProps {
  settings: PlanningSettings;
  onSettingChange: <K extends keyof PlanningSettings>(
    key: K,
    value: PlanningSettings[K]
  ) => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  settings,
  onSettingChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <H4 style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {t("planning.settings.notifications", "Notifications")}
      </H4>

      <SettingItem
        title={t(
          "planning.settings.enableNotifications",
          "Enable notifications"
        )}
        description={t(
          "planning.settings.enableNotificationsDesc",
          "Receive notifications for events"
        )}
        value={settings.notifications}
        onValueChange={(value) => onSettingChange("notifications", value)}
        icon="notifications"
      />

      <SettingItem
        title={t("planning.settings.weeklyReminders", "Weekly reminders")}
        description={t(
          "planning.settings.weeklyRemindersDesc",
          "Weekly summary of your goals"
        )}
        value={settings.weeklyReminders}
        onValueChange={(value) => onSettingChange("weeklyReminders", value)}
        icon="calendar"
      />

      <SettingItem
        title={t("planning.settings.goalReminders", "Goal reminders")}
        description={t(
          "planning.settings.goalRemindersDesc",
          "Notifications for overdue goals"
        )}
        value={settings.goalReminders}
        onValueChange={(value) => onSettingChange("goalReminders", value)}
        icon="flag"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
});
