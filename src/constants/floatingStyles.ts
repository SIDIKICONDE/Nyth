import { Platform } from "react-native";

/**
 * Constantes pour les styles d'éléments flottants
 * Centralise tous les styles pour maintenir la cohérence
 */

// Z-Index hiérarchie
export const FLOATING_Z_INDEX = {
  BACKGROUND: 0,
  CONTENT: 1,
  OVERLAY: 999,
  DROPDOWN: 1000,
  MODAL: 1001,
  FAB: 9999,
  MENU: 10000,
  TOOLTIP: 10001,

  CONTEXT_MENU: 10002,
} as const;

// Élévations standardisées
export const FLOATING_ELEVATION = {
  LOW: {
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  MEDIUM: {
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  HIGH: {
    elevation: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  EXTREME: {
    elevation: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
} as const;

// Rayons de bordure standardisés
export const FLOATING_BORDER_RADIUS = {
  SMALL: 8,
  MEDIUM: 12,
  LARGE: 16,
  EXTRA_LARGE: 20,
  ROUND: 28,
  CIRCLE: 50,
} as const;

// Tailles de FAB standardisées
export const FAB_SIZES = {
  SMALL: {
    width: 40,
    height: 40,
    borderRadius: 20,
    iconSize: 20,
  },
  MEDIUM: {
    width: 56,
    height: 56,
    borderRadius: 28,
    iconSize: 24,
  },
  LARGE: {
    width: 72,
    height: 72,
    borderRadius: 36,
    iconSize: 32,
  },
} as const;

// Positions standardisées
export const FLOATING_POSITIONS = {
  FAB_BOTTOM_RIGHT: {
    position: "absolute" as const,
    bottom: 20,
    right: 20,
  },
  FAB_BOTTOM_LEFT: {
    position: "absolute" as const,
    bottom: 20,
    left: 20,
  },
  FAB_BOTTOM_CENTER: {
    position: "absolute" as const,
    bottom: 20,
    alignSelf: "center" as const,
  },
  MENU_BOTTOM_LEFT: {
    position: "absolute" as const,
    bottom: 100,
    left: 16,
  },
  MENU_BOTTOM_RIGHT: {
    position: "absolute" as const,
    bottom: 100,
    right: 16,
  },
} as const;

// Overlays standardisés
export const FLOATING_OVERLAYS = {
  LIGHT: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  MEDIUM: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  DARK: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  BLUR_LIGHT: {
    backgroundColor:
      Platform.OS === "ios" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.3)",
  },
  BLUR_DARK: {
    backgroundColor:
      Platform.OS === "ios" ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.5)",
  },
} as const;

// Configurations d'animation standardisées
export const FLOATING_ANIMATIONS = {
  FADE: {
    duration: 300,
    useNativeDriver: true,
  },
  SLIDE: {
    duration: 300,
    useNativeDriver: true,
  },
  SPRING: {
    tension: 60,
    friction: 8,
    useNativeDriver: true,
  },
  BOUNCE: {
    tension: 100,
    friction: 6,
    useNativeDriver: true,
  },
} as const;

// Effets glassmorphism
export const GLASSMORPHISM_EFFECTS = {
  LIGHT: {
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255, 255, 255, 0.85)"
        : "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  DARK: {
    backgroundColor:
      Platform.OS === "ios" ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.95)",
    backdropFilter: "blur(20px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
} as const;

// Espacements standardisés
export const FLOATING_SPACING = {
  EXTRA_SMALL: 4,
  SMALL: 8,
  MEDIUM: 16,
  LARGE: 24,
  EXTRA_LARGE: 32,
} as const;

// Durées d'animation standardisées
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
} as const;

// Configurations de blur pour iOS
export const BLUR_CONFIGS = {
  LIGHT: {
    intensity: 20,
    tint: "light" as const,
  },
  MEDIUM: {
    intensity: 50,
    tint: "default" as const,
  },
  DARK: {
    intensity: 80,
    tint: "dark" as const,
  },
  EXTRA_LIGHT: {
    intensity: 10,
    tint: "extraLight" as const,
  },
} as const;

// Helpers pour créer des styles combinés
export const createFloatingStyle = (
  elevation: keyof typeof FLOATING_ELEVATION,
  borderRadius: keyof typeof FLOATING_BORDER_RADIUS,
  zIndex: keyof typeof FLOATING_Z_INDEX
) => ({
  ...FLOATING_ELEVATION[elevation],
  borderRadius: FLOATING_BORDER_RADIUS[borderRadius],
  zIndex: FLOATING_Z_INDEX[zIndex],
});

export const createGlassmorphismStyle = (
  theme: "light" | "dark",
  borderRadius: keyof typeof FLOATING_BORDER_RADIUS = "MEDIUM"
) => ({
  ...GLASSMORPHISM_EFFECTS[
    theme.toUpperCase() as keyof typeof GLASSMORPHISM_EFFECTS
  ],
  borderRadius: FLOATING_BORDER_RADIUS[borderRadius],
  overflow: "hidden" as const,
});

export const createFABStyle = (
  size: keyof typeof FAB_SIZES,
  position: keyof typeof FLOATING_POSITIONS,
  elevation: keyof typeof FLOATING_ELEVATION = "MEDIUM"
) => ({
  ...FAB_SIZES[size],
  ...FLOATING_POSITIONS[position],
  ...FLOATING_ELEVATION[elevation],
  zIndex: FLOATING_Z_INDEX.FAB,
});
