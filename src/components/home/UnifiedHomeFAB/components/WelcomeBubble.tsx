import { AIFriendlyIcon } from "@/components/icons";
import { UIText } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { TextFormatter } from "@/utils/textFormatter";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

const parseWelcomeMessage = (input: any): string => {
  // Si c'est déjà une chaîne simple
  if (typeof input === "string") {
    try {
      // Essayer de parser comme JSON
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === "object") {
        // Extraire le message ou le titre
        const message = parsed.message || parsed.content || parsed.title || "";

        // Si on a trouvé un message, le retourner nettoyé
        if (message) {
          // Nettoyer les caractères d'échappement JSON
          return message
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\")
            .trim();
        }
      }
    } catch {
      // Si ce n'est pas du JSON valide, essayer d'extraire avec regex
      // Chercher différents patterns possibles
      const patterns = [
        /"message"\s*:\s*"([^"]+)"/,
        /'message'\s*:\s*'([^']+)'/,
        /message:\s*"([^"]+)"/,
        /message:\s*'([^']+)'/,
        /"content"\s*:\s*"([^"]+)"/,
        /"text"\s*:\s*"([^"]+)"/,
      ];

      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
          return match[1]
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\")
            .trim();
        }
      }

      // Si aucun pattern ne marche, retourner la chaîne nettoyée
      return input.trim();
    }
  }

  // Si c'est déjà un objet
  if (typeof input === "object" && input !== null) {
    const message = input.message || input.content || input.title || "";
    if (message) return String(message).trim();

    // En dernier recours, essayer de stringifier proprement
    try {
      return JSON.stringify(input, null, 2);
    } catch {
      return String(input);
    }
  }

  // Convertir en string si ce n'est ni string ni objet
  return String(input).trim();
};

interface WelcomeBubbleProps {
  showWelcomeBubble: boolean;
  welcomeMessage: string;
  welcomeBubbleAnim: Animated.Value;
  welcomeBubbleScale: Animated.Value;
  onPress: () => void;
  onClose: () => void;
  isGenerating?: boolean;
}

export const WelcomeBubble: React.FC<WelcomeBubbleProps> = ({
  showWelcomeBubble,
  welcomeMessage,
  welcomeBubbleAnim,
  welcomeBubbleScale,
  onPress,
  onClose,
  isGenerating = false,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Mémoriser la largeur d'écran pour éviter les appels répétés
  const screenWidth = useMemo(() => Dimensions.get("window").width, []);

  // Mémoriser le message formaté pour éviter les recalculs coûteux
  const displayMessage = useMemo(() => {
    if (!welcomeMessage) return "";
    const parsedMessage = parseWelcomeMessage(welcomeMessage);
    return TextFormatter.autoFormatText(parsedMessage);
  }, [welcomeMessage]);

  if (!showWelcomeBubble) return null;

  return (
    <Animated.View
      style={[
        tw`absolute bottom-24 right-4`,
        {
          opacity: welcomeBubbleAnim,
          transform: [{ scale: welcomeBubbleScale }],
          zIndex: 9999,
          maxWidth: screenWidth - 32,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          tw`rounded-2xl`,
          {
            backgroundColor: currentTheme.colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          },
        ]}
      >
        {/* Petite flèche pointant vers le bouton AI Chat */}
        <View
          style={[
            tw`absolute -bottom-2 right-8`,
            {
              width: 0,
              height: 0,
              backgroundColor: "transparent",
              borderStyle: "solid",
              borderLeftWidth: 8,
              borderRightWidth: 8,
              borderTopWidth: 8,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderTopColor: currentTheme.colors.card,
            },
          ]}
        />

        <View style={tw`p-4`}>
          {/* En-tête avec icône AI */}
          <View style={tw`flex-row items-center mb-2`}>
            <View style={tw`w-8 h-8 mr-2`}>
              <AIFriendlyIcon
                size={32}
                primaryColor={currentTheme.colors.primary}
                secondaryColor={currentTheme.colors.primary}
                animated={true}
              />
            </View>
            <UIText
              size="base"
              weight="semibold"
              style={{ color: currentTheme.colors.primary }}
            >
              {t("welcomeBubble.assistantTitle")}
            </UIText>
          </View>

          {/* Message de bienvenue */}
          {isGenerating ? (
            <View style={tw`flex-row items-center justify-center py-4`}>
              <ActivityIndicator
                size="small"
                color={currentTheme.colors.primary}
              />
              <UIText
                size="sm"
                style={[tw`ml-2`, { color: currentTheme.colors.textSecondary }]}
              >
                {t("welcomeBubble.generatingMessage")}
              </UIText>
            </View>
          ) : (
            <UIText
              size="sm"
              style={[tw`leading-5 mb-3`, { color: currentTheme.colors.text }]}
            >
              {displayMessage}
            </UIText>
          )}

          {/* Bouton d'action */}
          {!isGenerating && (
            <View
              style={[
                tw`rounded-lg py-2 px-4`,
                { backgroundColor: currentTheme.colors.primary },
              ]}
            >
              <UIText
                weight="medium"
                style={[tw`text-center`, { color: "white" }]}
              >
                {t("welcomeBubble.chatWithMe")}
              </UIText>
            </View>
          )}
        </View>

        {/* Bouton de fermeture */}
        <TouchableOpacity
          onPress={onClose}
          style={[
            tw`absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={16}
            color={currentTheme.colors.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};
