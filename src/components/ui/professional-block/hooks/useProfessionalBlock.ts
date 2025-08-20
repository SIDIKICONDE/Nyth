import { useState, useMemo, useCallback } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  ProfessionalBlockProps,
  UseProfessionalBlockReturn,
  VariantConfig,
  SizeConfig,
} from "../types";
import {
  SIZE_CONFIGS,
  STATUS_COLORS,
  ANIMATION_CONFIGS,
  DEFAULT_VALUES,
} from "../constants";

/**
 * Hook personnalisé pour gérer la logique du bloc professionnel
 * Centralise la logique métier et facilite les tests
 */
export const useProfessionalBlock = (
  props: ProfessionalBlockProps
): UseProfessionalBlockReturn => {
  const { currentTheme } = useTheme();

  // 📝 Extraction des props avec valeurs par défaut
  const {
    variant = DEFAULT_VALUES.variant,
    size = DEFAULT_VALUES.size,
    collapsible = DEFAULT_VALUES.collapsible,
    initiallyExpanded = DEFAULT_VALUES.initiallyExpanded,
    animated = DEFAULT_VALUES.animated,
    statusIndicator,
    onPress,
    onLongPress,
  } = props;

  // 🎪 État local pour l'expansion
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  // 🎪 Valeurs d'animation
  const pressScale = useSharedValue(1);

  // 📏 Configuration des tailles basée sur la prop size
  const sizeConfig: SizeConfig = useMemo(() => {
    return SIZE_CONFIGS[size];
  }, [size]);

  // 🎨 Configuration des styles selon le variant
  const variantStyles: VariantConfig = useMemo(() => {
    const baseStyle: VariantConfig = {
      backgroundColor: currentTheme.colors.surface,
    };

    switch (variant) {
      case "elevated":
        return {
          ...baseStyle,
          backgroundColor: currentTheme.colors.background,
          shadowColor: currentTheme.isDark ? "#000" : "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
        };

      case "outlined":
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: currentTheme.colors.border,
        };

      case "minimal":
        return {
          backgroundColor: "transparent",
        };

      case "gradient":
        return {
          ...baseStyle,
          backgroundColor: currentTheme.colors.primary + "10",
          borderWidth: 1,
          borderColor: currentTheme.colors.primary + "30",
        };

      case "glass":
        return {
          backgroundColor: currentTheme.colors.surface + "80",
          borderWidth: 1,
          borderColor: currentTheme.colors.border + "50",
          shadowColor: currentTheme.isDark ? "#000" : "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        };

      default:
        return baseStyle;
    }
  }, [variant, currentTheme]);

  // 🎪 Configuration des animations
  const animationConfig = useMemo(() => {
    return ANIMATION_CONFIGS.default;
  }, []);

  // 🎨 Couleur du statut
  const statusColor = useMemo(() => {
    if (!statusIndicator) return undefined;

    // Utiliser les couleurs du thème si disponibles, sinon fallback vers les constantes
    switch (statusIndicator) {
      case "success":
        return currentTheme.colors.success || STATUS_COLORS.success;
      case "warning":
        return currentTheme.colors.warning || STATUS_COLORS.warning;
      case "error":
        return currentTheme.colors.error || STATUS_COLORS.error;
      case "info":
        return currentTheme.colors.primary || STATUS_COLORS.info;
      case "pending":
        return currentTheme.colors.textSecondary || STATUS_COLORS.pending;
      default:
        return undefined;
    }
  }, [statusIndicator, currentTheme]);

  // 🔧 Déterminer si le composant est interactif
  const isInteractive = useMemo(() => {
    return !!(onPress || onLongPress || collapsible);
  }, [onPress, onLongPress, collapsible]);

  // 🎪 Styles animés pour la pression
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
    };
  });

  // 🔧 Gestion du toggle pour l'expansion
  const toggleExpanded = useCallback(() => {
    if (collapsible) {
      setIsExpanded((prev) => !prev);
    }
  }, [collapsible]);

  // 🔧 Gestion du press principal
  const handlePress = useCallback(() => {
    if (collapsible) {
      toggleExpanded();
    }
    onPress?.();
  }, [collapsible, toggleExpanded, onPress]);

  // 🔧 Gestion de l'animation de pression (début)
  const handlePressIn = useCallback(() => {
    if (animated && isInteractive) {
      pressScale.value = withSpring(0.98, animationConfig.springConfig);
    }
  }, [animated, isInteractive, pressScale, animationConfig]);

  // 🔧 Gestion de l'animation de pression (fin)
  const handlePressOut = useCallback(() => {
    if (animated && isInteractive) {
      pressScale.value = withSpring(1, animationConfig.springConfig);
    }
  }, [animated, isInteractive, pressScale, animationConfig]);

  return {
    // 📊 Configuration
    sizeConfig,
    variantStyles,
    animationConfig,

    // 🎪 État et styles animés
    isExpanded,
    animatedContainerStyle,

    // 🔧 Fonctions de gestion
    toggleExpanded,
    handlePress,
    handlePressIn,
    handlePressOut,

    // 🎨 Styles calculés
    statusColor,
    isInteractive,
  };
};
