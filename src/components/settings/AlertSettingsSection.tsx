import React from "react";
import { InstantSwitch } from "../common/InstantSwitch";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import SettingRow from "./SettingRow";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import { useAlertPreferences } from "../../hooks/useAlertPreferences";

export default function AlertSettingsSection() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const {
    disableAllAlerts,
    disableSaveConfirmations,
    disableResetConfirmations,
    disableErrorAlerts,
    updateAlertSetting,
  } = useAlertPreferences();

  return (
    <>
      <SectionHeader title={t("settings.alerts.title", "Notifications")} />
      <Card>
        <SettingRow
          icon="bell-off"
          iconColor="#ffffff"
          iconBgColor="#f59e0b"
          title={t(
            "settings.alerts.disableAll.title",
            "Masquer toutes les alertes"
          )}
          subtitle={t(
            "settings.alerts.disableAll.subtitle",
            "Désactive toutes les pop-ups de confirmation"
          )}
          rightElement={
            <InstantSwitch
              value={Boolean(disableAllAlerts)}
              onValueChange={(value) =>
                updateAlertSetting("disableAllAlerts", value)
              }
              trackColor={{
                false: currentTheme.colors.border,
                true: currentTheme.colors.primary,
              }}
              thumbColor="#ffffff"
            />
          }
        />

        {!disableAllAlerts && (
          <>
            <SettingRow
              icon="check-circle"
              iconColor="#ffffff"
              iconBgColor="#10b981"
              title={t(
                "settings.alerts.disableSave.title",
                "Masquer alertes de sauvegarde"
              )}
              subtitle={t(
                "settings.alerts.disableSave.subtitle",
                'Plus de "Paramètres enregistrés"'
              )}
              rightElement={
                <InstantSwitch
                  value={Boolean(disableSaveConfirmations)}
                  onValueChange={(value) =>
                    updateAlertSetting("disableSaveConfirmations", value)
                  }
                  trackColor={{
                    false: currentTheme.colors.border,
                    true: currentTheme.colors.primary,
                  }}
                  thumbColor="#ffffff"
                />
              }
            />

            <SettingRow
              icon="reload"
              iconColor="#ffffff"
              iconBgColor="#ef4444"
              title={t(
                "settings.alerts.disableReset.title",
                "Masquer confirmations de réinitialisation"
              )}
              subtitle={t(
                "settings.alerts.disableReset.subtitle",
                "Réinitialise sans demander confirmation"
              )}
              rightElement={
                <InstantSwitch
                  value={Boolean(disableResetConfirmations)}
                  onValueChange={(value) =>
                    updateAlertSetting("disableResetConfirmations", value)
                  }
                  trackColor={{
                    false: currentTheme.colors.border,
                    true: currentTheme.colors.primary,
                  }}
                  thumbColor="#ffffff"
                />
              }
            />

            <SettingRow
              icon="alert"
              iconColor="#ffffff"
              iconBgColor="#6b7280"
              title={t(
                "settings.alerts.disableError.title",
                "Masquer alertes d'erreur"
              )}
              subtitle={t(
                "settings.alerts.disableError.subtitle",
                "Affiche les erreurs dans la console uniquement"
              )}
              rightElement={
                <InstantSwitch
                  value={Boolean(disableErrorAlerts)}
                  onValueChange={(value) =>
                    updateAlertSetting("disableErrorAlerts", value)
                  }
                  trackColor={{
                    false: currentTheme.colors.border,
                    true: currentTheme.colors.primary,
                  }}
                  thumbColor="#ffffff"
                />
              }
              isLast
            />
          </>
        )}
      </Card>
    </>
  );
}
