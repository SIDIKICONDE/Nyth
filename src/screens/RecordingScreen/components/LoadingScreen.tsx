import React from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { UIText, HeadingText } from "@/components/ui/Typography";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

interface LoadingScreenProps {
  message?: string;
  showPermissionStatus?: boolean;
}

export function LoadingScreen({
  message = "Chargement...",
  showPermissionStatus = false,
}: LoadingScreenProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView
      style={[
        tw`flex-1 justify-center items-center px-6`,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      {/* Icône de caméra animée */}
      <View
        style={[
          tw`w-20 h-20 rounded-full items-center justify-center mb-6`,
          { backgroundColor: currentTheme.colors.primary },
        ]}
      >
        <UIText size="xl" style={tw`text-white`}>
          📹
        </UIText>
      </View>

      {/* Indicateur de chargement */}
      <ActivityIndicator
        size="large"
        color={currentTheme.colors.primary}
        style={tw`mb-4`}
      />

      {/* Titre */}
      <HeadingText
        size="lg"
        weight="semibold"
        style={[tw`text-center mb-2`, { color: currentTheme.colors.text }]}
      >
        {t("recording.loading.title", "Préparation de l'enregistrement")}
      </HeadingText>

      {/* Message de statut */}
      <UIText
        size="base"
        style={[tw`text-center`, { color: currentTheme.colors.textSecondary }]}
      >
        {message}
      </UIText>

      {/* Statut des permissions si demandé */}
      {showPermissionStatus && (
        <View style={tw`mt-6`}>
          <UIText
            size="sm"
            style={[
              tw`text-center`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t(
              "recording.loading.permissions",
              "Vérification des permissions..."
            )}
          </UIText>
        </View>
      )}
    </SafeAreaView>
  );
}
