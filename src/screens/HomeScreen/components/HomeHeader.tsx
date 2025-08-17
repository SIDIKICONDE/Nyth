import { CustomHeader } from "@/components/common";
import { UIText } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Recording, Script } from "@/types";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useWelcomeBubblePreferences } from "../../../hooks/useWelcomeBubblePreferences";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('HomeHeader');

interface HomeHeaderProps {
  selectionMode: boolean;
  activeTab: "scripts" | "videos";
  scripts: Script[];
  recordings: Recording[];
  selectedScripts: string[];
  selectedRecordings: string[];
  onAIChat: () => void;
  onSettings: () => void;
  onClearSelection: () => void;
  onToggleScriptSelection: (scriptId: string) => void;
  onToggleRecordingSelection: (recordingId: string) => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  selectionMode,
  activeTab,
  scripts,
  recordings,
  selectedScripts,
  selectedRecordings,
  onAIChat,
  onSettings,
  onClearSelection,
  onToggleScriptSelection,
  onToggleRecordingSelection,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings, isLoaded } = useWelcomeBubblePreferences();

  // État local pour forcer le re-render
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      logger.debug(
        "🏠 HomeHeader: settings.showHeaderWelcome =",
        settings.showHeaderWelcome
      );
      logger.debug(
        "🏠 HomeHeader: setting showWelcome to",
        settings.showHeaderWelcome
      );
      setShowWelcome(settings.showHeaderWelcome);
    }
  }, [settings.showHeaderWelcome, isLoaded]);

  const selectedCount =
    activeTab === "scripts"
      ? selectedScripts.length
      : selectedRecordings.length;

  if (selectionMode) {
    return (
      <CustomHeader
        title={`${selectedCount} ${t("common.selected", "sélectionné(s)")}`}
        subtitle={undefined}
        customSubtitleStyle={{
          color: currentTheme.colors.textSecondary,
        }}
        actionButtons={[
          {
            icon: "×",
            onPress: onClearSelection,
            label: t("common.close"),
            isImportant: true,
          },
        ]}
      />
    );
  }

  const period = (() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 22) return "evening";
    return "night";
  })();

  const greetingText = t(`home.greeting.${period}`);

  return (
    <View style={tw`px-4 pt-12 pb-2`}>
      {/* Augmentation du padding top de pt-6 à pt-12 */}
      <View style={tw`flex-row items-center justify-between`}>
        {/* Section gauche - Greeting et nom utilisateur */}
        <View style={tw`flex-row items-center flex-1`}>
          {/* Greeting text - conditionally shown */}
          {showWelcome && (
            <UIText
              size="xs"
              style={[tw`mr-2`, { color: currentTheme.colors.textSecondary }]}
            >
              {greetingText || t("login.welcome", "Bienvenue")}
            </UIText>
          )}

          {/* User name with enhanced design */}
          <View
            style={[
              tw`px-3 py-1 rounded-full`, // Réduction du padding
              {
                backgroundColor: currentTheme.colors.primary + "15",
                borderWidth: 0.5, // Réduction de l'épaisseur de la bordure
                borderColor: currentTheme.colors.primary + "30",
              },
            ]}
          >
            <UIText
              size="sm" // Réduction de la taille du texte
              weight="semibold"
              style={[tw`text-center`, { color: currentTheme.colors.primary }]}
            >
              {user?.displayName ||
                user?.name ||
                t("profile.guest.title", "Invité")}
            </UIText>
          </View>
        </View>
      </View>
    </View>
  );
};
