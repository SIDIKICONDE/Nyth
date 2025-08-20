import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { resetApplicationSettings } from "@/utils/cache/resetManager";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";
import { DefaultApiKeyService } from "../../services/defaultApiKey";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('ResetSettingsButton');

interface ResetSettingsButtonProps {
  onResetComplete?: () => void;
}

export const ResetSettingsButton: React.FC<ResetSettingsButtonProps> = ({
  onResetComplete,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { resetSettings } = useSettings();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetSettings = () => {
    Alert.alert(
      t("settings.reset.confirmation.title", "Réinitialiser les paramètres"),
      t(
        "settings.reset.confirmation.message",
        "Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ? Cette action ne peut pas être annulée."
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("settings.reset.confirmation.reset", "Réinitialiser"),
          style: "destructive",
          onPress: performReset,
        },
      ]
    );
  };

  const performReset = async () => {
    try {
      setIsResetting(true);

      // Réinitialiser les paramètres de l'application
      await resetApplicationSettings();

      // Réinitialiser les paramètres du contexte
      await resetSettings();

      // Configurer automatiquement la clé OpenAI par défaut
      logger.debug(
        "🔄 Configuration de la clé OpenAI par défaut après réinitialisation..."
      );
      try {
        const defaultKeyConfigured =
          await DefaultApiKeyService.configureDefaultOpenAIKey();
        if (defaultKeyConfigured) {
          logger.debug(
            "✅ Clé OpenAI par défaut configurée après réinitialisation"
          );
        } else {
          logger.debug("⚠️ Impossible de configurer la clé OpenAI par défaut");
        }
      } catch (defaultKeyError) {
        logger.warn(
          "⚠️ Erreur lors de la configuration de la clé par défaut:",
          defaultKeyError
        );
        // Ne pas bloquer la réinitialisation si la configuration de la clé échoue
      }

      // Afficher un message de succès
      Alert.alert(
        t("settings.reset.success.title", "Paramètres réinitialisés"),
        t(
          "settings.reset.success.message",
          "Tous les paramètres ont été réinitialisés aux valeurs par défaut."
        ),
        [
          {
            text: t("common.ok", "OK"),
            onPress: onResetComplete,
          },
        ]
      );
    } catch (error) {
      logger.error("Erreur lors de la réinitialisation:", error);
      Alert.alert(
        t("common.error", "Erreur"),
        t(
          "settings.reset.error.message",
          "Une erreur s'est produite lors de la réinitialisation des paramètres."
        )
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(500).duration(500)}>
      <View style={tw`mb-6`}>
        <View
          style={[
            tw`overflow-hidden rounded-xl`,
            {
              backgroundColor: currentTheme.colors.surface,
              shadowColor: "#ef4444",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
            },
          ]}
        >
          <LinearGradient
            colors={["#ef444430", "transparent"]}
            style={tw`absolute top-0 left-0 right-0 h-1.5`}
          />

          <View style={tw`p-4`}>
            <View style={tw`mb-3`}>
              <Text
                style={[
                  tw`text-lg font-semibold mb-1`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {t("settings.reset.title", "Réinitialiser les paramètres")}
              </Text>
              <Text
                style={[
                  tw`text-sm opacity-70`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {t(
                  "settings.reset.description",
                  "Restaurer tous les paramètres aux valeurs par défaut"
                )}
              </Text>
            </View>

            <Pressable
              onPress={handleResetSettings}
              disabled={isResetting}
              style={({ pressed }) => [
                tw`flex-row items-center justify-center p-4 rounded-xl`,
                {
                  backgroundColor: pressed ? "#ef444440" : "#ef444420",
                  opacity: isResetting ? 0.7 : 1,
                },
              ]}
            >
              {isResetting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="restore"
                    size={20}
                    color="#ef4444"
                    style={tw`mr-3`}
                  />
                  <Text
                    style={[tw`text-base font-medium`, { color: "#ef4444" }]}
                  >
                    {t(
                      "settings.actions.resetToDefaults",
                      "Réinitialiser par défaut"
                    )}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default ResetSettingsButton;
