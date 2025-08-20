import { Platform, ViewStyle } from "react-native";

/**
 * Crée un style d'ombre optimisé pour React Native
 * Évite les warnings de performance en s'assurant qu'il y a un backgroundColor
 */
export const createOptimizedShadow = (
  shadowColor: string = "#000",
  shadowOffset: { width: number; height: number } = { width: 0, height: 2 },
  shadowOpacity: number = 0.25,
  shadowRadius: number = 3.84,
  elevation: number = 5,
  backgroundColor: string = "#FFFFFF"
): ViewStyle => {
  return {
    backgroundColor, // Toujours définir un backgroundColor
    ...Platform.select({
      ios: {
        shadowColor,
        shadowOffset,
        shadowOpacity,
        shadowRadius,
      },
      android: {
        elevation,
      },
    }),
  };
};

/**
 * Crée un style d'ombre pour les composants glassmorphism
 */
export const createGlassmorphismShadow = (
  theme: "light" | "dark" = "light",
  intensity: number = 0.2
): ViewStyle => {
  const backgroundColor = theme === "dark" 
    ? "rgba(255, 255, 255, 0.1)" 
    : "rgba(255, 255, 255, 0.8)";
    
  return createOptimizedShadow(
    "#000",
    { width: 0, height: 4 },
    intensity,
    12,
    8,
    backgroundColor
  );
};

/**
 * Crée un style d'ombre pour les cartes
 */
export const createCardShadow = (
  color: string = "#000",
  intensity: number = 0.1
): ViewStyle => {
  return createOptimizedShadow(
    color,
    { width: 0, height: 2 },
    intensity,
    8,
    4,
    "#FFFFFF"
  );
};

/**
 * Crée un style d'ombre pour les boutons flottants
 */
export const createFloatingButtonShadow = (
  color: string = "#000",
  intensity: number = 0.3
): ViewStyle => {
  return createOptimizedShadow(
    color,
    { width: 0, height: 4 },
    intensity,
    8,
    8,
    "#FFFFFF"
  );
};
