import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { DefaultApiKeyService } from "@/services/defaultApiKey";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('RefreshDefaultKeyButton');

interface RefreshDefaultKeyButtonProps {
  onRefreshComplete?: () => void;
}

export const RefreshDefaultKeyButton: React.FC<
  RefreshDefaultKeyButtonProps
> = ({ onRefreshComplete }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshKey = async () => {
    // Vérifier si l'utilisateur est connecté
    if (!currentUser || currentUser.isGuest) {
      Alert.alert(
        t("settings.api.requiresAuth.title", "Connexion requise"),
        t(
          "settings.api.requiresAuth.message",
          "Vous devez être connecté pour récupérer la clé API par défaut."
        ),
        [{ text: t("common.ok", "OK") }]
      );
      return;
    }

    try {
      setIsRefreshing(true);

      // Forcer la récupération de la clé par défaut
      const configured = await DefaultApiKeyService.forceRefreshDefaultKey();

      if (configured) {
        Alert.alert(
          t("settings.api.refresh.success.title", "Clé API configurée"),
          t(
            "settings.api.refresh.success.message",
            "La clé OpenAI par défaut a été configurée avec succès."
          ),
          [
            {
              text: t("common.ok", "OK"),
              onPress: onRefreshComplete,
            },
          ]
        );
      } else {
        Alert.alert(
          t("common.error", "Erreur"),
          t(
            "settings.api.refresh.error.notAvailable",
            "Aucune clé API par défaut n'est disponible. Contactez l'administrateur."
          )
        );
      }
    } catch (error) {
      logger.error("Erreur lors de la récupération de la clé:", error);
      Alert.alert(
        t("common.error", "Erreur"),
        t(
          "settings.api.refresh.error.message",
          "Une erreur s'est produite lors de la récupération de la clé API."
        )
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Ne pas afficher le bouton si l'utilisateur est invité
  if (currentUser?.isGuest) {
    return null;
  }

  return (
    <Animated.View entering={FadeInDown.delay(400).duration(500)}>
      <View style={tw`mb-6`}>
        <View
          style={[
            tw`overflow-hidden rounded-xl`,
            {
              backgroundColor: currentTheme.colors.surface,
              shadowColor: currentTheme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
            },
          ]}
        >
          <LinearGradient
            colors={[`${currentTheme.colors.primary}30`, "transparent"]}
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
                {t("settings.api.defaultKey.title", "Clé API par défaut")}
              </Text>
              <Text
                style={[
                  tw`text-sm opacity-70`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {t(
                  "settings.api.defaultKey.description",
                  "Récupérer automatiquement la clé OpenAI fournie par l'application"
                )}
              </Text>
            </View>

            <Pressable
              onPress={handleRefreshKey}
              disabled={isRefreshing}
              style={({ pressed }) => [
                tw`flex-row items-center justify-center p-4 rounded-xl`,
                {
                  backgroundColor: pressed
                    ? `${currentTheme.colors.primary}40`
                    : `${currentTheme.colors.primary}20`,
                  opacity: isRefreshing ? 0.7 : 1,
                },
              ]}
            >
              {isRefreshing ? (
                <ActivityIndicator
                  size="small"
                  color={currentTheme.colors.primary}
                />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="cloud-download"
                    size={20}
                    color={currentTheme.colors.primary}
                    style={tw`mr-3`}
                  />
                  <Text
                    style={[
                      tw`text-base font-medium`,
                      { color: currentTheme.colors.primary },
                    ]}
                  >
                    {t(
                      "settings.actions.refreshDefaultKey",
                      "Récupérer la clé par défaut"
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

export default RefreshDefaultKeyButton;
