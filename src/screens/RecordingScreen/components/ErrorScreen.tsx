import React from "react";
import { View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { UIText, HeadingText } from "@/components/ui/Typography";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

interface ErrorScreenProps {
  error: string;
  onRetry?: () => void;
  onGoBack: () => void;
}

export function ErrorScreen({ error, onRetry, onGoBack }: ErrorScreenProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const getErrorIcon = () => {
    if (error.toLowerCase().includes("permission")) {
      return "🔒";
    }
    if (error.toLowerCase().includes("script")) {
      return "📄";
    }
    return "❌";
  };

  const getErrorTitle = () => {
    if (error.toLowerCase().includes("permission")) {
      return t("recording.error.permissions.title", "Permissions requises");
    }
    if (error.toLowerCase().includes("script")) {
      return t("recording.error.script.title", "Script introuvable");
    }
    return t("recording.error.generic.title", "Erreur de chargement");
  };

  return (
    <SafeAreaView
      style={[
        tw`flex-1 justify-center items-center px-6`,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      {/* Icône d'erreur */}
      <View
        style={[
          tw`w-20 h-20 rounded-full items-center justify-center mb-6`,
          { backgroundColor: "#DC2626" },
        ]}
      >
        <UIText size="xl" style={tw`text-white`}>
          {getErrorIcon()}
        </UIText>
      </View>

      {/* Titre d'erreur */}
      <HeadingText
        size="lg"
        weight="semibold"
        style={[tw`text-center mb-4`, { color: currentTheme.colors.text }]}
      >
        {getErrorTitle()}
      </HeadingText>

      {/* Message d'erreur */}
      <UIText
        size="base"
        style={[
          tw`text-center mb-8 leading-6`,
          { color: currentTheme.colors.textSecondary },
        ]}
      >
        {error}
      </UIText>

      {/* Boutons d'action */}
      <View style={tw`w-full gap-4`}>
        {onRetry && (
          <TouchableOpacity
            style={[
              tw`py-4 px-8 rounded-full`,
              { backgroundColor: currentTheme.colors.primary },
            ]}
            onPress={onRetry}
          >
            <UIText
              size="base"
              weight="semibold"
              style={[tw`text-center text-white`]}
            >
              {t("common.retry", "Réessayer")}
            </UIText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            tw`py-4 px-8 rounded-full border-2`,
            {
              borderColor: currentTheme.colors.primary,
              backgroundColor: "transparent",
            },
          ]}
          onPress={onGoBack}
        >
          <UIText
            size="base"
            weight="semibold"
            style={[tw`text-center`, { color: currentTheme.colors.primary }]}
          >
            {t("common.goBack", "Retour")}
          </UIText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
