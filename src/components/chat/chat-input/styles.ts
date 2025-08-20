import tw from "twrnc";
import { DimensionsConfig, StyleConfig } from "./types";

/**
 * Calcule les dimensions selon le style d'input
 */
export const calculateDimensions = (
  selectedInputStyle: string,
  screenWidth: number
): DimensionsConfig => {
  const maxInputHeight =
    selectedInputStyle === "sheet"
      ? 300
      : selectedInputStyle === "neon"
      ? 250
      : 200;

  return {
    screenWidth,
    maxInputHeight,
  };
};

/**
 * Génère les styles du container principal selon le style sélectionné
 */
export const getContainerStyle = (config: StyleConfig) => {
  const {
    selectedInputStyle,
    isFocused,
    currentTheme,
    borderColor,
    pulseAnimation,
  } = config;

  const baseStyle = [tw`flex-row items-end rounded-3xl px-5 py-3`];

  let specificStyle = {};

  switch (selectedInputStyle) {
    case "glass":
      specificStyle = {
        backgroundColor: currentTheme.isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.6)",
        borderWidth: 1,
        borderColor: currentTheme.isDark
          ? "rgba(255,255,255,0.2)"
          : "rgba(0,0,0,0.1)",
        shadowColor: currentTheme.isDark ? "#000" : "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
      };
      break;

    case "sheet":
      specificStyle = {
        backgroundColor: currentTheme.isDark
          ? "rgba(38,38,40,1)"
          : "rgba(255,255,255,1)",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderWidth: 1,
        borderColor: currentTheme.colors.border,
        borderBottomWidth: 0,
        shadowColor: currentTheme.isDark ? "#000" : "#000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: currentTheme.isDark ? 0.6 : 0.3,
        shadowRadius: 20,
        elevation: 15,
      };
      break;

    case "neon":
      specificStyle = {
        backgroundColor: currentTheme.isDark
          ? "rgba(0, 0, 0, 0.9)"
          : "rgba(15, 15, 15, 0.95)",
        borderRadius: 20,
        borderWidth: 2,
        borderColor: isFocused ? "#00F5FF" : "#00CED1",
        shadowColor: "#00F5FF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: isFocused ? 0.8 : 0.4,
        shadowRadius: isFocused ? 20 : 10,
        elevation: 20,
        // Effet de glow interne
        boxShadow: isFocused
          ? "inset 0 0 20px rgba(0, 245, 255, 0.2), 0 0 30px rgba(0, 245, 255, 0.6)"
          : "inset 0 0 10px rgba(0, 206, 209, 0.1), 0 0 15px rgba(0, 206, 209, 0.3)",
      };
      break;

    default: // classic
      specificStyle = {
        backgroundColor: currentTheme.isDark
          ? "rgba(28, 28, 30, 0.9)"
          : "rgba(255, 255, 255, 0.95)",
        borderWidth: 2,
        borderColor,
        shadowColor: currentTheme.isDark ? "#000" : "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
      };
      break;
  }

  // Ajouter la transformation de pulse sauf pour sheet et neon
  const transform =
    selectedInputStyle === "sheet" || selectedInputStyle === "neon"
      ? []
      : [{ scale: pulseAnimation }];

  return [
    ...baseStyle,
    {
      ...specificStyle,
      transform,
    },
  ];
};

/**
 * Génère les styles du TextInput selon le style sélectionné
 */
export const getTextInputStyle = (
  selectedInputStyle: string,
  currentTheme: any,
  maxInputHeight: number,
  contentFontStyle?: any
) => {
  const baseStyle = [tw`flex-1 text-base leading-6 px-2`];

  const specificStyle = {
    color: selectedInputStyle === "neon" ? "#00F5FF" : currentTheme.colors.text,
    minHeight:
      selectedInputStyle === "sheet"
        ? 80
        : selectedInputStyle === "neon"
        ? 60
        : 44,
    maxHeight: maxInputHeight,
    backgroundColor: "transparent",
    textAlign: "left" as const,
    textAlignVertical:
      selectedInputStyle === "sheet" ? ("top" as const) : ("center" as const),
    fontWeight: selectedInputStyle === "neon" ? ("500" as const) : undefined,
    letterSpacing: selectedInputStyle === "neon" ? 0.5 : 0,
    ...contentFontStyle,
  };

  return [...baseStyle, specificStyle];
};

/**
 * Génère les styles du bouton d'envoi
 */
export const getSendButtonStyle = (config: StyleConfig) => {
  const { canSend, isLoading, currentTheme } = config;

  return [
    tw`ml-3 p-3 rounded-full items-center justify-center`,
    {
      backgroundColor:
        canSend && !isLoading
          ? currentTheme.colors.accent || "#007AFF"
          : currentTheme.isDark
          ? "rgba(60, 60, 62, 0.6)"
          : "rgba(229, 229, 234, 0.8)",
      borderWidth: 1,
      borderColor:
        canSend && !isLoading
          ? currentTheme.colors.accent || "#007AFF"
          : currentTheme.isDark
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(0, 0, 0, 0.1)",
      shadowColor: canSend
        ? currentTheme.colors.accent || "#007AFF"
        : "transparent",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: canSend ? 6 : 0,
    },
  ];
};

/**
 * Génère les styles du bouton d'annulation
 */
export const getCancelButtonStyle = (currentTheme: any) => {
  return [
    tw`mr-2 p-3 rounded-full items-center justify-center`,
    {
      backgroundColor: currentTheme.isDark
        ? "rgba(60, 60, 62, 0.6)"
        : "rgba(229, 229, 234, 0.8)",
      borderWidth: 1,
      borderColor: currentTheme.isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
    },
  ];
};

/**
 * Obtient la couleur du placeholder selon le style
 */
export const getPlaceholderTextColor = (
  selectedInputStyle: string,
  currentTheme: any
): string => {
  return selectedInputStyle === "neon"
    ? "rgba(0, 206, 209, 0.6)"
    : currentTheme.colors.textSecondary + "80";
};
