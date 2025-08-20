import {
  SizeConfig,
  AnimationConfig,
  ProfessionalBlockSize,
  ProfessionalBlockVariant,
  ProfessionalBlockPadding,
  ProfessionalBlockRadius,
} from "./types";

// 📏 Configuration des tailles pour chaque variant
export const SIZE_CONFIGS: Record<ProfessionalBlockSize, SizeConfig> = {
  xs: {
    titleSize: "sm",
    subtitleSize: "xs",
    descriptionSize: "xs",
    iconSize: 16,
    spacing: 1,
    padding: 2,
  },
  sm: {
    titleSize: "base",
    subtitleSize: "sm",
    descriptionSize: "xs",
    iconSize: 20,
    spacing: 2,
    padding: 3,
  },
  md: {
    titleSize: "lg",
    subtitleSize: "base",
    descriptionSize: "sm",
    iconSize: 24,
    spacing: 3,
    padding: 4,
  },
  lg: {
    titleSize: "xl",
    subtitleSize: "lg",
    descriptionSize: "base",
    iconSize: 28,
    spacing: 4,
    padding: 5,
  },
  xl: {
    titleSize: "2xl",
    subtitleSize: "xl",
    descriptionSize: "lg",
    iconSize: 32,
    spacing: 5,
    padding: 6,
  },
};

// 🎨 Couleurs de statut par défaut
export const STATUS_COLORS = {
  success: "#10B981", // Green-500
  warning: "#F59E0B", // Amber-500
  error: "#EF4444", // Red-500
  info: "#3B82F6", // Blue-500
  pending: "#6B7280", // Gray-500
} as const;

// 🎪 Configuration des animations
export const ANIMATION_CONFIGS: Record<string, AnimationConfig> = {
  default: {
    duration: 200,
    easing: "ease-out",
    springConfig: {
      damping: 15,
      stiffness: 150,
    },
  },
  smooth: {
    duration: 300,
    easing: "ease-in-out",
    springConfig: {
      damping: 20,
      stiffness: 100,
    },
  },
  bouncy: {
    duration: 400,
    easing: "ease-out",
    springConfig: {
      damping: 10,
      stiffness: 200,
    },
  },
};

// 📦 Mappage des paddings vers Tailwind
export const PADDING_MAP: Record<ProfessionalBlockPadding, number> = {
  none: 0,
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
};

// 🔲 Mappage des border radius vers Tailwind
export const RADIUS_MAP: Record<ProfessionalBlockRadius, string> = {
  none: "none",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
  "2xl": "2xl",
  full: "full",
};

// 🎭 Icônes par défaut pour les statuts
export const STATUS_ICONS = {
  success: "check-circle",
  warning: "alert-circle",
  error: "close-circle",
  info: "information",
  pending: "clock",
} as const;

// ⚡ Valeurs par défaut
export const DEFAULT_VALUES = {
  variant: "default" as ProfessionalBlockVariant,
  size: "md" as ProfessionalBlockSize,
  padding: "md" as ProfessionalBlockPadding,
  borderRadius: "md" as ProfessionalBlockRadius,
  animated: true,
  collapsible: false,
  initiallyExpanded: true,
  loading: false,
  iconSize: 24,
  animationDelay: 0,
} as const;

// 🎨 Variantes de style prédéfinies
export const VARIANT_PRESETS = {
  card: {
    variant: "elevated" as ProfessionalBlockVariant,
    borderRadius: "lg" as ProfessionalBlockRadius,
    padding: "md" as ProfessionalBlockPadding,
  },
  panel: {
    variant: "outlined" as ProfessionalBlockVariant,
    borderRadius: "md" as ProfessionalBlockRadius,
    padding: "lg" as ProfessionalBlockPadding,
  },
  banner: {
    variant: "gradient" as ProfessionalBlockVariant,
    borderRadius: "xl" as ProfessionalBlockRadius,
    padding: "lg" as ProfessionalBlockPadding,
  },
  minimal: {
    variant: "minimal" as ProfessionalBlockVariant,
    borderRadius: "none" as ProfessionalBlockRadius,
    padding: "sm" as ProfessionalBlockPadding,
  },
} as const;

// 📱 Breakpoints pour le responsive
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
