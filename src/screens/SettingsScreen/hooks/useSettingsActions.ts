import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { RecordingSettings, RootStackParamList, Script } from "../../../types";
import {
  showNoScriptError,
  showResetConfirmation,
  showResetSuccess,
  showSaveError,
  showSaveSuccess,
} from "../utils/alerts";

type NavigationProp = StackNavigationProp<RootStackParamList, "Settings">;

interface UseSettingsActionsProps {
  settings: RecordingSettings;
  script: Script | null;
  saveSettingsToStorage: () => Promise<boolean>;
  resetSettings: () => Promise<void>;
  updateSetting: <K extends keyof RecordingSettings>(
    key: K,
    value: RecordingSettings[K]
  ) => void;
}

export function useSettingsActions({
  settings,
  script,
  saveSettingsToStorage,
  resetSettings,
  updateSetting,
}: UseSettingsActionsProps) {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  const saveSettings = async () => {
    try {
      // Sauvegarder localement
      await saveSettingsToStorage();

      if (script && script.id) {
        navigation.navigate("Recording", {
          scriptId: script.id,
          settings: settings,
        });
      } else {
        showNoScriptError(t);
      }
    } catch (error) {}
  };

  const saveSettingsOnly = async () => {
    try {
      setIsSaving(true);

      // Sauvegarder localement
      const success = await saveSettingsToStorage();

      if (success) {
        showSaveSuccess(!!currentUser, t);
      } else {
        showSaveError(t);
      }
    } catch (error) {
      showSaveError(t);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    showResetConfirmation(async () => {
      await resetSettings();
      showResetSuccess(t);
    }, t);
  };

  return {
    isSaving,
    saveSettings,
    saveSettingsOnly,
    resetToDefaults,
  };
}
