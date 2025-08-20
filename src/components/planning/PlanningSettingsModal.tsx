import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { ResetButton } from "./settings/components/ResetButton";
import { SettingsHeader } from "./settings/components/SettingsHeader";
import { usePlanningSettings } from "./settings/hooks/usePlanningSettings";
import { DisplaySection } from "./settings/sections/DisplaySection";
import { NotificationsSection } from "./settings/sections/NotificationsSection";
import { EnhancedNotificationsSection } from "./settings/sections/EnhancedNotificationsSection";
import { SyncSection } from "./settings/sections/SyncSection";
import { modalStyles } from "./settings/styles";
import { PlanningSettingsModalProps } from "./settings/types";

export const PlanningSettingsModal: React.FC<PlanningSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const { settings, updateSetting, updateNotificationSetting, handleSave, handleReset, isSaving } =
    usePlanningSettings(onClose);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          modalStyles.container,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <KeyboardAvoidingView
          style={modalStyles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SettingsHeader onClose={onClose} onSave={handleSave} isSaving={isSaving} />

          <ScrollView
            style={modalStyles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Nouvelle section de notifications complète */}
            <EnhancedNotificationsSection
              settings={settings.notificationSettings}
              onSettingChange={updateNotificationSetting}
            />

            <DisplaySection
              settings={settings}
              onSettingChange={updateSetting}
            />

            <SyncSection settings={settings} onSettingChange={updateSetting} />

            <ResetButton onReset={handleReset} />

            <View style={modalStyles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
