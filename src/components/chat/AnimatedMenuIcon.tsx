import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useRef } from "react";
import { Animated, TouchableOpacity } from "react-native";

interface AnimatedMenuIconProps {
  size?: number;
  color?: string;
  onPress?: () => void;
  isActive?: boolean;
  style?: any;
}

const AnimatedMenuIcon: React.FC<AnimatedMenuIconProps> = ({
  size = 32,
  color,
  onPress,
  isActive = false,
  style,
}) => {
  const { currentTheme } = useTheme();
  const defaultColor = color || currentTheme.colors.text;

  // Animations
  const scaleValue = useRef(new Animated.Value(1)).current;
  const topLineRotate = useRef(new Animated.Value(0)).current;
  const middleLineOpacity = useRef(new Animated.Value(1)).current;
  const bottomLineRotate = useRef(new Animated.Value(0)).current;
  const topLineTranslateY = useRef(new Animated.Value(0)).current;
  const bottomLineTranslateY = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Animation vers X (menu ouvert)
      Animated.parallel([
        Animated.timing(topLineRotate, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bottomLineRotate, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(middleLineOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(topLineTranslateY, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bottomLineTranslateY, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animation vers hamburger (menu fermé)
      Animated.parallel([
        Animated.timing(topLineRotate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bottomLineRotate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(middleLineOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(topLineTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bottomLineTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  const handlePress = () => {
    // Animation de feedback tactile
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rippleScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rippleScale, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onPress?.();
  };

  // Interpolations
  const topLineRotateInterpolate = topLineRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const bottomLineRotateInterpolate = bottomLineRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-45deg"],
  });

  const topLineTranslateYInterpolate = topLineTranslateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size * 0.22],
  });

  const bottomLineTranslateYInterpolate = bottomLineTranslateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -size * 0.22],
  });

  const rippleScaleInterpolate = rippleScale.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  const lineWidth = size * 0.75;
  const lineHeight = size * 0.06;
  const containerSize = size + 16;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        {
          width: containerSize,
          height: containerSize,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: containerSize / 2,
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      {/* Effet de glow */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: containerSize + 8,
            height: containerSize + 8,
            borderRadius: (containerSize + 8) / 2,
            backgroundColor: defaultColor,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Background avec effet */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor: currentTheme.colors.surface,
            opacity: backgroundOpacity,
            shadowColor: currentTheme.isDark ? "#000" : "#333",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          },
        ]}
      />

      {/* Effet ripple */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor: defaultColor,
            opacity: 0.1,
            transform: [{ scale: rippleScaleInterpolate }],
          },
        ]}
      />

      {/* Container des lignes */}
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            justifyContent: "center",
            alignItems: "center",
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        {/* Ligne du haut */}
        <Animated.View
          style={[
            {
              width: lineWidth,
              height: lineHeight,
              backgroundColor: defaultColor,
              borderRadius: lineHeight / 2,
              position: "absolute",
              top: size * 0.32,
              shadowColor: defaultColor,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 2,
              transform: [
                { translateY: topLineTranslateYInterpolate },
                { rotate: topLineRotateInterpolate },
              ],
            },
          ]}
        />

        {/* Ligne du milieu */}
        <Animated.View
          style={[
            {
              width: lineWidth,
              height: lineHeight,
              backgroundColor: defaultColor,
              borderRadius: lineHeight / 2,
              position: "absolute",
              opacity: middleLineOpacity,
              shadowColor: defaultColor,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 2,
            },
          ]}
        />

        {/* Ligne du bas */}
        <Animated.View
          style={[
            {
              width: lineWidth,
              height: lineHeight,
              backgroundColor: defaultColor,
              borderRadius: lineHeight / 2,
              position: "absolute",
              bottom: size * 0.32,
              shadowColor: defaultColor,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 2,
              transform: [
                { translateY: bottomLineTranslateYInterpolate },
                { rotate: bottomLineRotateInterpolate },
              ],
            },
          ]}
        />

        {/* Points décoratifs modernes */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: size * 0.08,
              height: size * 0.08,
              borderRadius: size * 0.04,
              backgroundColor: defaultColor,
              opacity: isActive ? 0.6 : 0.3,
              right: -size * 0.15,
              top: size * 0.15,
              shadowColor: defaultColor,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.4,
              shadowRadius: 1,
              elevation: 1,
            },
          ]}
        />
        <Animated.View
          style={[
            {
              position: "absolute",
              width: size * 0.06,
              height: size * 0.06,
              borderRadius: size * 0.03,
              backgroundColor: defaultColor,
              opacity: isActive ? 0.4 : 0.2,
              left: -size * 0.12,
              bottom: size * 0.18,
              shadowColor: defaultColor,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.4,
              shadowRadius: 1,
              elevation: 1,
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedMenuIcon;
