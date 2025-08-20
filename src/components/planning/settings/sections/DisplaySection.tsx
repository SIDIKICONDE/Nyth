import React from "react";
import { StyleSheet, View } from "react-native";
import { H4, UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { SettingItem } from "../components/SettingItem";
import { PlanningSettings } from "../types";
import { TouchableOpacity } from "react-native";

interface DisplaySectionProps {
  settings: PlanningSettings;
  onSettingChange: <K extends keyof PlanningSettings>(
    key: K,
    value: PlanningSettings[K]
  ) => void;
}

export const DisplaySection: React.FC<DisplaySectionProps> = ({
  settings,
  onSettingChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <H4 style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {t("planning.settings.display", "Display")}
      </H4>

      <View
        style={{
          marginBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.colors.border,
          paddingBottom: 12,
        }}
      >
        <UIText
          size="base"
          weight="medium"
          style={{ color: currentTheme.colors.text, marginBottom: 4 }}
        >
          {t("planning.settings.defaultTab", "Onglet par défaut")}
        </UIText>
        <UIText size="sm" style={{ color: currentTheme.colors.textSecondary }}>
          {t(
            "planning.settings.defaultTabDesc",
            "Choisissez l'onglet ouvert par défaut dans la page Planning"
          )}
        </UIText>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {(
            [
              {
                key: "timeline",
                label: t("planning.tabs.timeline", "Timeline"),
              },
              { key: "tasks", label: t("planning.tabs.tasks", "Tâches") },
              {
                key: "calendar",
                label: t("planning.tabs.calendar", "Calendrier"),
              },
            ] as const
          ).map((opt) => {
            const isActive = settings.defaultTab === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.8}
                onPress={() => onSettingChange("defaultTab", opt.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: isActive
                    ? currentTheme.colors.primary
                    : currentTheme.colors.surface,
                  borderWidth: 1,
                  borderColor: isActive
                    ? currentTheme.colors.primary
                    : currentTheme.colors.border,
                }}
              >
                <UIText
                  size="sm"
                  weight={isActive ? "semibold" : "normal"}
                  style={{
                    color: isActive ? "white" : currentTheme.colors.text,
                  }}
                >
                  {opt.label}
                </UIText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <SettingItem
        title={t("planning.settings.showWeekends", "Show weekends")}
        description={t(
          "planning.settings.showWeekendsDesc",
          "Include Saturday and Sunday in the calendar"
        )}
        value={settings.showWeekends}
        onValueChange={(value) => onSettingChange("showWeekends", value)}
        icon="calendar-outline"
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
