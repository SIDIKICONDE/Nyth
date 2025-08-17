import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../../../contexts/ThemeContext";

interface ImprovedFloatingButtonProps {
  onPress: () => void;
  icon?: string;
  iconComponent?: React.ReactNode;
  size?: "small" | "medium" | "large";
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  backgroundColor?: string;
  iconColor?: string;
  gradientColors?: string[];
  variant?: "standard" | "gradient" | "glassmorphism";
  animated?: boolean;
  pulseAnimation?: boolean;
  style?: any;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export const ImprovedFloatingButton: React.FC<ImprovedFloatingButtonProps> = ({
  onPress,
  icon = "plus",
  iconComponent,
  size = "medium",
  position = "bottom-right",
  backgroundColor,
  iconColor,
  gradientColors,
  variant = "standard",
  animated = true,
  pulseAnimation = false,
  style,
  accessibilityLabel,
  disabled = false,
}) => {
  const { currentTheme } = useTheme();

  // Utiliser les couleurs du thème par défaut si non spécifiées
  const defaultBackgroundColor = backgroundColor || currentTheme.colors.primary;
  const defaultIconColor = iconColor || currentTheme.colors.text;
  const defaultGradientColors = gradientColors || [
    currentTheme.colors.primary,
    currentTheme.colors.secondary,
  ];

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animation d'apparition
  useEffect(() => {
    if (animated) {
      Animated.spring(opacityAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [animated, opacityAnim]);

  // Animation de pulsation continue
  useEffect(() => {
    if (pulseAnimation) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    }
  }, [pulseAnimation, pulseAnim]);

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          width: 48,
          height: 48,
          borderRadius: 24,
          iconSize: 20,
        };
      case "large":
        return {
          width: 72,
          height: 72,
          borderRadius: 36,
          iconSize: 32,
        };
      case "medium":
      default:
        return {
          width: 56,
          height: 56,
          borderRadius: 28,
          iconSize: 24,
        };
    }
  };

  const getPositionStyles = () => {
    const baseStyles = { position: "absolute" as const };
    switch (position) {
      case "bottom-left":
        return { ...baseStyles, bottom: 20, left: 20 };
      case "bottom-center":
        return { ...baseStyles, bottom: 20, alignSelf: "center" as const };
      case "bottom-right":
      default:
        return { ...baseStyles, bottom: 20, right: 20 };
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const sizeStyles = getSizeStyles();
  const positionStyles = getPositionStyles();

  const renderIcon = () => {
    if (iconComponent) {
      return iconComponent;
    }
    return (
      <MaterialCommunityIcons
        name={icon}
        size={sizeStyles.iconSize}
        color={defaultIconColor}
      />
    );
  };

  const renderButton = () => {
    const buttonStyle = [
      styles.baseButton,
      sizeStyles,
      variant === "glassmorphism" &&
        Platform.OS === "ios" &&
        styles.glassmorphismIOS,
      variant === "glassmorphism" &&
        Platform.OS === "android" &&
        styles.glassmorphismAndroid,
      {
        backgroundColor:
          variant === "standard" ? defaultBackgroundColor : "transparent",
      },
      disabled && styles.disabled,
    ];

    if (variant === "gradient") {
      return (
        <LinearGradient
          colors={defaultGradientColors}
          style={buttonStyle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderIcon()}
        </LinearGradient>
      );
    }

    return <View style={buttonStyle}>{renderIcon()}</View>;
  };

  const animatedStyle = {
    transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
    opacity: animated ? opacityAnim : 1,
  };

  return (
    <Animated.View style={[positionStyles, animatedStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        style={styles.touchable}
      >
        {renderButton()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 100, // Grand radius pour s'assurer que c'est rond
  },
  baseButton: {
    alignItems: "center",
    justifyContent: "center",
    // Ombrage amélioré
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glassmorphismIOS: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowOpacity: 0.1,
  },
  glassmorphismAndroid: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ImprovedFloatingButton;
