import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { UIText } from "../ui/Typography";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "info";

export type ButtonSize = "sm" | "md" | "lg";

export interface CustomButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  color?: string;
  isAnimated?: boolean;
}

// Fonction utilitaire pour calculer la couleur de texte avec le meilleur contraste
const getContrastTextColor = (backgroundColor: string): string => {
  // Nettoyer la couleur (enlever les alpha et les formats non-standards)
  let cleanColor = backgroundColor.replace(/[^#0-9A-Fa-f]/g, "");

  // Si c'est une couleur hex courte (#fff), l'étendre
  if (cleanColor.length === 4) {
    cleanColor = cleanColor.replace(/^#(.)(.)(.)$/, "#$1$1$2$2$3$3");
  }

  // Si ce n'est pas une couleur hex valide, retourner blanc par défaut
  if (!/^#[0-9A-Fa-f]{6}$/.test(cleanColor)) {
    return "#ffffff";
  }

  // Convertir hex en RGB
  const r = parseInt(cleanColor.slice(1, 3), 16);
  const g = parseInt(cleanColor.slice(3, 5), 16);
  const b = parseInt(cleanColor.slice(5, 7), 16);

  // Calculer la luminance relative selon les standards WCAG
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Retourner noir pour les fonds clairs, blanc pour les fonds sombres
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

export const CustomButton: React.FC<CustomButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  disabled = false,
  loading = false,
  fullWidth = false,
  rounded = false,
  style,
  textStyle,
  color,
  isAnimated = true,
}) => {
  const { currentTheme } = useTheme();

  // Déterminer la couleur à utiliser (priorité à la prop color)
  const getBaseColor = () => {
    if (color) return color;

    switch (variant) {
      case "primary":
        return currentTheme.colors.primary;
      case "secondary":
        return currentTheme.colors.secondary || currentTheme.colors.accent;
      case "accent":
        return currentTheme.colors.accent;
      case "danger":
        return currentTheme.colors.error || "#ef4444";
      case "success":
        return currentTheme.colors.success || "#10b981";
      case "info":
        return "#3b82f6";
      default:
        return currentTheme.colors.primary;
    }
  };

  const baseColor = getBaseColor();

  // Styles basés sur la variante
  const getVariantStyles = (): {
    container: ViewStyle;
    text: { color: string };
  } => {
    switch (variant) {
      case "primary":
        return {
          container: {
            backgroundColor: disabled ? `${baseColor}60` : baseColor,
            borderColor: "transparent",
            borderWidth: 0,
          },
          text: {
            color: getContrastTextColor(baseColor),
          },
        };
      case "secondary":
      case "accent":
        return {
          container: {
            backgroundColor: disabled ? `${baseColor}15` : `${baseColor}20`,
            borderColor: disabled ? `${baseColor}20` : `${baseColor}40`,
            borderWidth: 1,
          },
          text: {
            color: disabled ? `${baseColor}80` : baseColor,
          },
        };
      case "outline":
        return {
          container: {
            backgroundColor: disabled ? "transparent" : `${baseColor}10`,
            borderColor: disabled ? `${baseColor}40` : baseColor,
            borderWidth: 1,
          },
          text: {
            color: disabled ? `${baseColor}60` : baseColor,
          },
        };
      case "ghost":
        return {
          container: {
            backgroundColor: disabled ? "transparent" : `${baseColor}10`,
            borderColor: "transparent",
            borderWidth: 0,
          },
          text: {
            color: disabled ? `${baseColor}60` : baseColor,
          },
        };
      case "danger":
        return {
          container: {
            backgroundColor: disabled ? `${baseColor}40` : baseColor,
            borderColor: disabled ? `${baseColor}30` : baseColor,
            borderWidth: 1,
          },
          text: {
            color: getContrastTextColor(baseColor),
          },
        };
      case "success":
        return {
          container: {
            backgroundColor: disabled ? `${baseColor}40` : baseColor,
            borderColor: disabled ? `${baseColor}30` : baseColor,
            borderWidth: 1,
          },
          text: {
            color: getContrastTextColor(baseColor),
          },
        };
      case "info":
        return {
          container: {
            backgroundColor: disabled ? `${baseColor}40` : baseColor,
            borderColor: disabled ? `${baseColor}30` : baseColor,
            borderWidth: 1,
          },
          text: {
            color: getContrastTextColor(baseColor),
          },
        };
      default:
        return {
          container: {
            backgroundColor: disabled ? `${baseColor}60` : baseColor,
            borderColor: disabled ? `${baseColor}40` : baseColor,
            borderWidth: 1,
          },
          text: {
            color: getContrastTextColor(baseColor),
          },
        };
    }
  };

  // Styles basés sur la taille
  const getSizeStyles = (): {
    container: ViewStyle;
    textSize: "sm" | "base" | "lg";
    iconSize: number;
  } => {
    switch (size) {
      case "sm":
        return {
          container: {
            paddingVertical: 8,
            paddingHorizontal: 14,
          },
          textSize: "sm",
          iconSize: 16,
        };
      case "lg":
        return {
          container: {
            paddingVertical: 16,
            paddingHorizontal: 24,
          },
          textSize: "lg",
          iconSize: 22,
        };
      case "md":
      default:
        return {
          container: {
            paddingVertical: 12,
            paddingHorizontal: 20,
          },
          textSize: "base",
          iconSize: 18,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  // Ne pas montrer de gradient pour un design plus plat
  const showGradient = false;

  // Fonction pour obtenir une couleur sécurisée pour les icônes et textes
  const getTextColor = (): string => {
    if (variantStyles.text && variantStyles.text.color) {
      return variantStyles.text.color.toString();
    }
    return currentTheme.colors.text;
  };

  const textColor = getTextColor();

  // Couleurs de gradient basées sur le thème
  const getGradientColors = (): [string, string] => {
    if (
      variant === "primary" &&
      currentTheme.colors.gradient &&
      Array.isArray(currentTheme.colors.gradient) &&
      currentTheme.colors.gradient.length >= 2
    ) {
      // Utiliser le gradient du thème si disponible
      return [`${currentTheme.colors.gradient[0]}80`, "transparent"];
    }

    // Fallback au baseColor
    return [`${baseColor}60`, "transparent"];
  };

  const gradientColors = getGradientColors();

  // Composant interne pour le contenu du bouton
  const ButtonContent = () => (
    <View
      style={[
        tw`overflow-hidden rounded-lg`,
        {
          width: fullWidth ? "100%" : "auto",
          borderRadius: rounded ? 50 : 8,
          // Retirer l'opacité d'ici pour éviter le conflit
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        },
        style,
      ]}
    >
      {showGradient && (
        <LinearGradient
          colors={[...gradientColors]}
          style={tw`absolute top-0 left-0 right-0 h-1.5 z-10`}
        />
      )}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[
          tw`flex-row items-center justify-center rounded-lg`,
          variantStyles.container,
          sizeStyles.container,
          { borderRadius: rounded ? 50 : 8 },
          // Appliquer l'opacité ici sur le TouchableOpacity
          { opacity: disabled ? 0.7 : 1 },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} style={tw`mr-2`} />
        ) : (
          icon &&
          iconPosition === "left" && (
            <View style={[tw`mr-2`, { opacity: disabled ? 0.7 : 1 }]}>
              <MaterialCommunityIcons
                name={icon as any}
                size={sizeStyles.iconSize}
                color={textColor}
              />
            </View>
          )
        )}

        <UIText
          size={sizeStyles.textSize}
          weight="semibold"
          color={textColor}
          align="center"
          style={{
            opacity: loading ? 0.8 : 1,
            textTransform: "capitalize",
            ...(textStyle as TextStyle),
          }}
        >
          {title}
        </UIText>

        {icon && iconPosition === "right" && !loading && (
          <View style={[tw`ml-2`, { opacity: disabled ? 0.7 : 1 }]}>
            <MaterialCommunityIcons
              name={icon as any}
              size={sizeStyles.iconSize}
              color={textColor}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Si l'animation est activée, encapsuler dans Animated.View
  // Sinon, retourner directement le contenu
  if (isAnimated) {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <ButtonContent />
      </Animated.View>
    );
  }

  return <ButtonContent />;
};

export default CustomButton;
