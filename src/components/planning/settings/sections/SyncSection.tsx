import React from "react";
import { StyleSheet, View } from "react-native";
import { H4 } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { SettingItem } from "../components/SettingItem";
import { PlanningSettings } from "../types";

interface SyncSectionProps {
  settings: PlanningSettings;
  onSettingChange: <K extends keyof PlanningSettings>(
    key: K,
    value: PlanningSettings[K]
  ) => void;
}

export const SyncSection: React.FC<SyncSectionProps> = ({
  settings,
  onSettingChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <H4 style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {t("planning.settings.sync", "Synchronization")}
      </H4>

      <SettingItem
        title={t("planning.settings.autoSync", "Automatic synchronization")}
        description={t(
          "planning.settings.autoSyncDesc",
          "Automatically sync with the cloud"
        )}
        value={settings.autoSync}
        onValueChange={(value) => onSettingChange("autoSync", value)}
        icon="cloud"
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
