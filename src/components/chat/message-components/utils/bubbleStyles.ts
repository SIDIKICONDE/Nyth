import { ChatStyleId } from "@/contexts/ChatStyleContext";
import { MessageLayoutSettings } from "@/contexts/MessageLayoutContext";
import tw from "twrnc";

export interface BubbleStyleParams {
  selectedStyle: ChatStyleId;
  isUser: boolean;
  currentTheme: any;
  layoutSettings?: MessageLayoutSettings;
}

/**
 * Génère les styles de bulle selon le style sélectionné et les réglages de layout
 */
export const getBubbleStyle = ({
  selectedStyle,
  isUser,
  currentTheme,
  layoutSettings,
}: BubbleStyleParams) => {
  // Valeurs par défaut si pas de layoutSettings
  const defaultLayout: MessageLayoutSettings = {
    messageWidth: 85,
    messageHeight: 1.0,
    messageGap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  };

  const layout = layoutSettings || defaultLayout;

  // Calculer les styles de base en fonction des réglages
  const baseUserStyles = {
    alignSelf: "flex-end" as const,
    maxWidth: `${layout.messageWidth}%`,
    paddingHorizontal: layout.paddingHorizontal,
    paddingVertical: layout.paddingVertical * layout.messageHeight,
    marginBottom: layout.messageGap,
  };

  const baseAIStyles = {
    alignSelf: "flex-start" as const,
    maxWidth: `${layout.messageWidth}%`,
    paddingHorizontal: layout.paddingHorizontal,
    paddingVertical: layout.paddingVertical * layout.messageHeight,
    marginBottom: layout.messageGap,
  };

  switch (selectedStyle) {
    case "minimal":
      // Style minimal : bulles sobres, pas d'ombre
      return isUser
        ? [
            tw`rounded-lg`,
            {
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: currentTheme.colors.primary,
              ...baseUserStyles,
            },
          ]
        : [
            tw`rounded-lg`,
            {
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: currentTheme.colors.border,
              ...baseAIStyles,
            },
          ];

    case "neon":
      // Style néon : bulles colorées flashy
      return isUser
        ? [
            tw`rounded-lg`,
            {
              backgroundColor: "#7C3AED", // Violet vif
              shadowColor: "#7C3AED",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.6,
              shadowRadius: 10,
              ...baseUserStyles,
            },
          ]
        : [
            tw`rounded-lg`,
            {
              backgroundColor: "#1E40AF", // Bleu néon sombre
              shadowColor: "#1E40AF",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
              borderWidth: 0,
              ...baseAIStyles,
            },
          ];

    case "modern":
      // Style moderne : rectangulaire avec accents
      return isUser
        ? [
            tw`rounded-none`,
            {
              backgroundColor: "#FF9500",
              borderRightWidth: 3,
              borderRightColor: "#FF9500",
              ...baseUserStyles,
            },
          ]
        : [
            tw`rounded-none`,
            {
              backgroundColor: currentTheme.colors.surface,
              borderLeftWidth: 3,
              borderLeftColor: currentTheme.colors.accent,
              borderWidth: currentTheme.isDark ? 1 : 0,
              borderColor: currentTheme.colors.border,
              ...baseAIStyles,
            },
          ];

    case "elegant":
      // Style élégant : coins arrondis avec ombres subtiles
      return isUser
        ? [
            tw``,
            {
              backgroundColor: "#AF52DE",
              borderRadius: 20,
              shadowColor: "#AF52DE",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              ...baseUserStyles,
            },
          ]
        : [
            tw``,
            {
              backgroundColor: currentTheme.colors.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: currentTheme.colors.border,
              shadowColor: currentTheme.isDark ? "#000" : "#999",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              ...baseAIStyles,
            },
          ];

    case "retro":
      // Style rétro : carrés avec bordures marquées
      return isUser
        ? [
            tw`rounded-sm`,
            {
              backgroundColor: "#FF6B6B",
              borderWidth: 2,
              borderColor: "#FF4757",
              ...baseUserStyles,
            },
          ]
        : [
            tw`rounded-sm`,
            {
              backgroundColor: currentTheme.isDark ? "#2C2C2E" : "#F0F0F0",
              borderWidth: 2,
              borderColor: currentTheme.isDark ? "#444" : "#DDD",
              ...baseAIStyles,
            },
          ];

    case "glass":
      // Style verre : effet glassmorphism
      return isUser
        ? [
            tw`rounded-2xl`,
            {
              backgroundColor: "rgba(0, 212, 170, 0.2)",
              borderWidth: 1,
              borderColor: "rgba(0, 212, 170, 0.3)",
              ...baseUserStyles,
            },
          ]
        : [
            tw`rounded-2xl`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(255, 255, 255, 0.8)",
              borderWidth: 1,
              borderColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.1)",
              ...baseAIStyles,
            },
          ];

    case "ios":
      // Style iOS Notifications : effet glassmorphism avec gris plus doux
      return isUser
        ? [
            tw`mx-1 my-1`,
            {
              backgroundColor: "rgba(72, 72, 74, 0.85)", // Plus clair que #2C2C2E
              borderRadius: 18,
              borderWidth: 0.5,
              borderColor: "rgba(120, 120, 128, 0.5)", // Bordure plus douce
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2, // Ombre plus subtile
              shadowRadius: 12,
              elevation: 6, // Légèrement réduit
              // Effet de flou simulé avec des couches
              backdropFilter: "blur(20px)",
              ...baseUserStyles,
            },
          ]
        : [
            tw`mx-1 my-1`,
            {
              backgroundColor: "rgba(72, 72, 74, 0.85)", // Plus clair que #2C2C2E
              borderRadius: 18,
              borderWidth: 0.5,
              borderColor: "rgba(120, 120, 128, 0.5)", // Bordure plus douce
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2, // Ombre plus subtile
              shadowRadius: 12,
              elevation: 6, // Légèrement réduit
              // Effet glassmorphism
              backdropFilter: "blur(20px)",
              ...baseAIStyles,
            },
          ];

    case "gradient":
      // Style dégradé : bulles avec effet de dégradé
      return isUser
        ? [
            tw`rounded-2xl`,
            {
              backgroundColor: "#EC4899", // Rose vif
              shadowColor: "#EC4899",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: "rgba(236, 72, 153, 0.3)",
              ...baseUserStyles,
            },
          ]
        : [
            tw`rounded-2xl`,
            {
              backgroundColor: "#8B5CF6", // Violet
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: "rgba(139, 92, 246, 0.3)",
              ...baseAIStyles,
            },
          ];

    case "terminal":
      // Style terminal : bulles avec look console/terminal
      return isUser
        ? [
            tw`rounded-sm`,
            {
              backgroundColor: "#10B981", // Vert terminal
              borderWidth: 1,
              borderColor: "#059669",
              shadowColor: "#10B981",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              ...baseUserStyles,
            },
          ]
        : [
            tw`rounded-sm`,
            {
              backgroundColor: "#1F2937", // Gris sombre terminal
              borderWidth: 1,
              borderColor: "#10B981",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              ...baseAIStyles,
            },
          ];

    case "chatgpt":
      // Style ChatGPT : reproduction fidèle de l'interface ChatGPT
      return isUser
        ? [
            tw`rounded-2xl`,
            {
              backgroundColor: currentTheme.isDark ? "#2f2f2f" : "#f7f7f8",
              borderWidth: 0,
              marginLeft: 48, // Espacement à gauche pour les messages utilisateur
              ...baseUserStyles,
            },
          ]
        : [
            tw`rounded-2xl`,
            {
              backgroundColor: currentTheme.isDark ? "#444654" : "#ffffff",
              borderWidth: currentTheme.isDark ? 0 : 1,
              borderColor: currentTheme.isDark ? "transparent" : "#e5e5e7",
              marginRight: 48, // Espacement à droite pour les messages IA
              ...baseAIStyles,
            },
          ];

    default:
      // Style classic traditionnel - Juste le texte, pas de couleurs de fond
      return isUser
        ? [
            tw``,
            {
              backgroundColor: "transparent",
              ...baseUserStyles,
            },
          ]
        : [
            tw``,
            {
              backgroundColor: "transparent",
              ...baseAIStyles,
            },
          ];
  }
};
