import { StyleProp, ViewStyle, TextStyle } from "react-native";

// 🎯 Interface de base pour les propriétés du bloc professionnel
export interface ProfessionalBlockProps {
  title: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;

  // 🎨 Apparence
  variant?: ProfessionalBlockVariant;
  size?: ProfessionalBlockSize;
  padding?: ProfessionalBlockPadding;
  borderRadius?: ProfessionalBlockRadius;

  // 🔧 Fonctionnalités
  collapsible?: boolean;
  initiallyExpanded?: boolean;
  loading?: boolean;
  error?: string;

  // 🎯 Actions
  onPress?: () => void;
  onLongPress?: () => void;
  headerAction?: React.ReactNode;
  footerAction?: React.ReactNode;

  // 🎭 Icônes et visuels
  icon?: string;
  iconColor?: string;
  iconSize?: number;
  statusIndicator?: ProfessionalBlockStatus;

  // 🎪 Animation
  animated?: boolean;
  animationDelay?: number;

  // 🎨 Styles personnalisés
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}

// 🎨 Types pour les variantes de style
export type ProfessionalBlockVariant =
  | "default"
  | "elevated"
  | "outlined"
  | "minimal"
  | "gradient"
  | "glass";

// 📏 Types pour les tailles
export type ProfessionalBlockSize = "xs" | "sm" | "md" | "lg" | "xl";

// 📦 Types pour le padding
export type ProfessionalBlockPadding =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl";

// 🔲 Types pour les bordures arrondies
export type ProfessionalBlockRadius =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "full";

// 🎯 Types pour les statuts
export type ProfessionalBlockStatus =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "pending";

// 📊 Configuration des tailles
export interface SizeConfig {
  titleSize: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  subtitleSize: "xs" | "sm" | "base" | "lg" | "xl";
  descriptionSize: "xs" | "sm" | "base" | "lg";
  iconSize: number;
  spacing: number;
  padding: number;
}

// 🎨 Configuration des styles de variante
export interface VariantConfig {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

// 🎪 Configuration des animations
export interface AnimationConfig {
  duration: number;
  easing: string;
  springConfig?: {
    damping: number;
    stiffness: number;
  };
}

// 🔧 Hook personnalisé - configuration
export interface UseProfessionalBlockConfig {
  variant?: ProfessionalBlockVariant;
  size?: ProfessionalBlockSize;
  animated?: boolean;
  collapsible?: boolean;
}

// 🔧 Hook personnalisé - retour
export interface UseProfessionalBlockReturn {
  sizeConfig: SizeConfig;
  variantStyles: VariantConfig;
  animationConfig: AnimationConfig;
  isExpanded: boolean;
  animatedContainerStyle: any; // Style animé pour le conteneur
  toggleExpanded: () => void;
  handlePress: () => void;
  handlePressIn: () => void;
  handlePressOut: () => void;
  statusColor?: string;
  isInteractive: boolean;
}
