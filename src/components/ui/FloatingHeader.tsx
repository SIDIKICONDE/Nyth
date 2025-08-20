import React, { useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

import { useTheme } from "../../contexts/ThemeContext";

interface FloatingHeaderProps {
  onPress?: () => void;
  position?: "top-left" | "top-right" | "top-center";
  icon?: string;
  size?: "small" | "medium" | "large";
  style?: any;
}

/**
 * 📁 Menu flottant de style iOS
 *
 * Fonctionnalités:
 * - Design iOS natif avec glassmorphism
 * - Bouton rond semi-transparent
 * - Animations tactiles fluides
 * - Ombre douce et effet de profondeur
 * - Modulaire et réutilisable
 */
export const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  onPress,
  position = "top-left",
  icon = "folder-outline",
  size = "medium",
  style,
}) => {
  const { currentTheme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const { width: screenWidth } = Dimensions.get("window");

  // Configuration des tailles
  const sizeConfig = {
    small: { size: 36, iconSize: 16, padding: 8 },
    medium: { size: 44, iconSize: 20, padding: 12 },
    large: { size: 52, iconSize: 24, padding: 14 },
  };

  const config = sizeConfig[size];

  // Configuration des couleurs avec style iOS distinctif
  const colors = {
    background: currentTheme.isDark
      ? "rgba(58, 58, 60, 0.95)" // iOS dark control background
      : "rgba(242, 242, 247, 0.95)", // iOS light control background
    border: currentTheme.isDark
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(0, 0, 0, 0.06)",
    icon: currentTheme.isDark
      ? "rgba(255, 255, 255, 0.85)"
      : "rgba(60, 60, 67, 0.85)", // iOS label color
    shadow: "rgba(0, 0, 0, 0.25)",
    overlay: currentTheme.isDark
      ? "rgba(72, 72, 74, 0.6)" // Darker overlay for pressed state
      : "rgba(209, 209, 214, 0.6)", // Light overlay for pressed state
  };

  // Obtenir la position selon le paramètre
  const getPositionStyle = () => {
    const baseStyle = {
      position: "absolute" as const,
      top: Platform.OS === "ios" ? 60 : 50,
      zIndex: 1000,
    };

    switch (position) {
      case "top-right":
        return { ...baseStyle, right: 16 };
      case "top-center":
        return {
          ...baseStyle,
          left: (screenWidth - config.size) / 2,
        };
      case "top-left":
      default:
        return { ...baseStyle, left: 16 };
    }
  };

  // Animation de pression
  const handlePressIn = () => {
    setIsPressed(true);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animation de relâchement
  const handlePressOut = () => {
    setIsPressed(false);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Rendu du contenu du bouton
  const renderButtonContent = () => (
    <Animated.View
      style={[
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
          shadowColor: colors.shadow,
          shadowOffset: {
            width: 0,
            height: shadowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 3],
            }),
          },
          shadowOpacity: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.15, 0.3],
          }),
          shadowRadius: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 6],
          }),
          elevation: shadowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 4],
          }),
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={config.iconSize}
        color={colors.icon}
        style={{
          textShadowColor: currentTheme.isDark
            ? "rgba(0,0,0,0.4)"
            : "rgba(255,255,255,0.9)",
          textShadowOffset: { width: 0, height: 0.5 },
          textShadowRadius: 0.5,
        }}
      />
    </Animated.View>
  );

  return (
    <Animated.View
      style={[
        getPositionStyle(),
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          borderRadius: config.size / 2,
          overflow: "hidden",
        }}
      >
        {/* Effet glassmorphism pour iOS avec style distinctif */}
        {Platform.OS === "ios" ? (
          <BlurView
            blurAmount={12}
            blurType={currentTheme.isDark ? "dark" : "light"}
            style={{
              borderRadius: config.size / 2,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: config.size / 2,
                borderWidth: 0.5,
                borderColor: colors.border,
              }}
            >
              {renderButtonContent()}
              {/* Overlay pour l'état pressé */}
              {isPressed && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: colors.overlay,
                    borderRadius: config.size / 2,
                  }}
                />
              )}
            </View>
          </BlurView>
        ) : (
          <View style={{ position: "relative" }}>
            {renderButtonContent()}
            {/* Overlay pour Android */}
            {isPressed && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: colors.overlay,
                  borderRadius: config.size / 2,
                }}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FloatingHeader;
