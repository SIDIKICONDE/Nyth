import React, { ReactNode, createContext, useContext, useEffect } from "react";
import { useGlobalPreferences } from "../hooks/useGlobalPreferences";
import { UserPreferences } from "../services/firebase/userPreferencesService";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('GlobalPreferencesContext');

interface GlobalPreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => Promise<void>;
  migrateAllPreferences: () => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
  updateRecordingSettings: (settings: any) => Promise<void>;
  updateTeleprompterSettings: (settings: any) => Promise<void>;
  updateSecuritySettings: (settings: any) => Promise<void>;
  updateAlertSettings: (settings: any) => Promise<void>;
  updatePlanningPreferences: (settings: any) => Promise<void>;
  guestFABEnabled: boolean;
  fontFamily: string;
  theme?: string;
  language?: string;
  scriptDisplayStyle: string;
  homePage?: "default" | "planning" | "ai-chat";
  aiGeneratorPreferences: any;
  chatPreferences: any;
  profilePreferences: any;
  recordingSettings: any;
  teleprompterSettings: any;
  securitySettings: any;
  alertSettings: any;
  planningPreferences: any;
}

const GlobalPreferencesContext = createContext<
  GlobalPreferencesContextType | undefined
>(undefined);

interface GlobalPreferencesProviderProps {
  children: ReactNode;
}

export function GlobalPreferencesProvider({
  children,
}: GlobalPreferencesProviderProps) {
  const globalPreferences = useGlobalPreferences();

  const contextValue: GlobalPreferencesContextType = {
    ...globalPreferences,
    guestFABEnabled: globalPreferences.preferences?.guestFABEnabled ?? false,
    fontFamily: globalPreferences.preferences?.fontFamily ?? "System",
    scriptDisplayStyle:
      globalPreferences.preferences?.scriptDisplayStyle ?? "list",
    homePage: globalPreferences.preferences?.homePage ?? "default",
    theme: globalPreferences.preferences?.theme,
    language: globalPreferences.preferences?.language,
    aiGeneratorPreferences:
      globalPreferences.preferences?.aiGeneratorPreferences,
    chatPreferences: globalPreferences.preferences?.chatPreferences,
    profilePreferences: globalPreferences.preferences?.profilePreferences,
    recordingSettings: globalPreferences.preferences?.recordingSettings,
    teleprompterSettings: globalPreferences.preferences?.teleprompterSettings,
    securitySettings: globalPreferences.preferences?.securitySettings,
    alertSettings: globalPreferences.preferences?.alertSettings,
    planningPreferences: globalPreferences.preferences?.planningPreferences,
    updateAlertSettings: async (settings: any) => {
      await globalPreferences.updatePreference("alertSettings", settings);
    },
    updatePlanningPreferences: async (settings: any) => {
      await globalPreferences.updatePreference("planningPreferences", settings);
    },
  };

  useEffect(() => {
    logger.debug(
      "🌐 GlobalPreferencesContext - guestFABEnabled:",
      contextValue.guestFABEnabled
    );
  }, [contextValue.guestFABEnabled]);

  useEffect(() => {
    if (contextValue.recordingSettings) {
      logger.debug(
        "🎥 GlobalPreferencesContext - recordingSettings mis à jour:",
        {
          isMicEnabled: contextValue.recordingSettings.isMicEnabled,
          isVideoEnabled: contextValue.recordingSettings.isVideoEnabled,
          showCountdown: contextValue.recordingSettings.showCountdown,
          timestamp: new Date().toISOString(),
        }
      );
    }
  }, [contextValue.recordingSettings]);

  useEffect(() => {
    if (contextValue.alertSettings) {
      logger.debug("🔔 GlobalPreferencesContext - alertSettings mis à jour:", {
        disableAllAlerts: contextValue.alertSettings.disableAllAlerts,
        disableSaveConfirmations:
          contextValue.alertSettings.disableSaveConfirmations,
        disableResetConfirmations:
          contextValue.alertSettings.disableResetConfirmations,
        disableErrorAlerts: contextValue.alertSettings.disableErrorAlerts,
        timestamp: new Date().toISOString(),
      });
    }
  }, [contextValue.alertSettings]);

  return (
    <GlobalPreferencesContext.Provider value={contextValue}>
      {children}
    </GlobalPreferencesContext.Provider>
  );
}

export function useGlobalPreferencesContext() {
  const context = useContext(GlobalPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalPreferencesContext must be used within a GlobalPreferencesProvider"
    );
  }
  return context;
}
