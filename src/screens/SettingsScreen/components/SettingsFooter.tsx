import { UIText } from "@/components/ui";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Pressable, View } from "react-native";
import tw from "twrnc";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { SettingsFooterProps } from "../types";

interface ExtendedSettingsFooterProps extends SettingsFooterProps {
  isSyncing?: boolean;
}

export default function SettingsFooter({
  onReset,
  onSave,
  isSaving,
  isSyncing,
}: ExtendedSettingsFooterProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isConnected = user && !user.isGuest;

  return (
    <View
      style={[
        tw`absolute bottom-5 left-4 right-4 px-4 py-2 rounded-xl`,
        {
          backgroundColor: currentTheme.colors.surface,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 4,
        },
      ]}
    >
      {/* Indicateur de synchronisation Firebase */}
      {isConnected && (
        <View
          style={tw`flex-row items-center justify-center mb-2 pb-2 border-b border-gray-200`}
        >
          <MaterialCommunityIcons
            name={isSyncing ? "cloud-sync" : "cloud-check"}
            size={16}
            color={isSyncing ? currentTheme.colors.accent : "#10B981"}
            style={tw`mr-1`}
          />
          <UIText
            size="xs"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            {isSyncing ? t("settings.sync.syncing") : t("settings.sync.synced")}
          </UIText>
        </View>
      )}

      <View style={tw`flex-row w-full justify-between`}>
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            tw`flex-1 mr-2 py-3 rounded-xl flex-row items-center justify-center`,
            {
              backgroundColor: pressed ? "#ef444425" : "#ef444415",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={18}
            color="#ef4444"
            style={tw`mr-1.5`}
          />
          <UIText size="sm" weight="medium" style={{ color: "#ef4444" }}>
            {t("settings.actions.resetToDefaults")}
          </UIText>
        </Pressable>

        <Pressable
          onPress={onSave}
          disabled={isSaving}
          style={({ pressed }) => [
            tw`flex-1 ml-2 py-3 rounded-xl flex-row items-center justify-center`,
            {
              backgroundColor: pressed
                ? `${currentTheme.colors.accent}25`
                : `${currentTheme.colors.accent}15`,
              opacity: isSaving ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="content-save"
            size={18}
            color={currentTheme.colors.accent}
            style={tw`mr-1.5`}
          />
          <UIText
            size="sm"
            weight="medium"
            style={{ color: currentTheme.colors.accent }}
          >
            {isSaving
              ? t("settings.actions.saving")
              : t("settings.actions.saveAndContinue")}
          </UIText>
        </Pressable>
      </View>
    </View>
  );
}
