// Composants flottants réutilisables
export { default as FloatingOverlay } from "./FloatingOverlay";
export { default as FloatingActionButton } from "./FloatingActionButton";
export { default as FloatingModal } from "./FloatingModal";
export { default as FloatingContainer } from "./FloatingContainer";

// Nouveaux composants améliorés pour React Native pur
export { ImprovedFloatingMenu } from "./ImprovedFloatingMenu";
export { ImprovedFloatingButton } from "./ImprovedFloatingButton";

// Constantes et utilitaires
export * from "@/constants/floatingStyles";

// Types pour les composants flottants
export interface FloatingComponentProps {
  theme?: "light" | "dark";
  animated?: boolean;
  elevation?: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  borderRadius?: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
}

export interface FloatingPositionProps {
  position?: "center" | "bottom" | "top" | "left" | "right";
  offset?: {
    x?: number;
    y?: number;
  };
}

export interface FloatingAnimationProps {
  animationType?: "fade" | "slide" | "scale" | "spring";
  duration?: number;
  delay?: number;
}
