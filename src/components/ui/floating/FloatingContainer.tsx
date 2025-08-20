import {
  BLUR_CONFIGS,
  FLOATING_BORDER_RADIUS,
  FLOATING_ELEVATION,
  FLOATING_Z_INDEX,
  createFloatingStyle,
  createGlassmorphismStyle,
} from "@/constants/floatingStyles";
import { BlurView } from "@react-native-community/blur";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";

interface FloatingContainerProps {
  children: React.ReactNode;
  variant?: "standard" | "glassmorphism" | "gradient";
  theme?: "light" | "dark";
  elevation?: keyof typeof FLOATING_ELEVATION;
  borderRadius?: keyof typeof FLOATING_BORDER_RADIUS;
  zIndex?: keyof typeof FLOATING_Z_INDEX;
  blurIntensity?: keyof typeof BLUR_CONFIGS;
  animated?: boolean;
  animationValue?: Animated.Value;
  style?: any;
  backgroundColor?: string;
  gradientColors?: string[];
}

export const FloatingContainer: React.FC<FloatingContainerProps> = ({
  children,
  variant = "standard",
  theme = "light",
  elevation = "MEDIUM",
  borderRadius = "MEDIUM",
  zIndex = "MODAL",
  blurIntensity = "MEDIUM",
  animated = false,
  animationValue,
  style,
  backgroundColor,
  gradientColors,
}) => {
  const baseStyle = createFloatingStyle(elevation, borderRadius, zIndex);
  const blurConfig = BLUR_CONFIGS[blurIntensity];

  const renderBackground = () => {
    switch (variant) {
      case "glassmorphism":
        return (
          <>
            {/* Background glassmorphism */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                createGlassmorphismStyle(theme, borderRadius),
                {
                  backgroundColor:
                    backgroundColor ||
                    createGlassmorphismStyle(theme).backgroundColor,
                },
              ]}
            />

            {/* Blur effect pour iOS */}
            {Platform.OS === "ios" && (
              <BlurView blurAmount={blurConfig.intensity} blurType="dark"
                style={StyleSheet.absoluteFillObject}
              />
            )}

            {/* Border glow */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderRadius: FLOATING_BORDER_RADIUS[borderRadius],
                  borderWidth: 1,
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.08)",
                },
              ]}
            />
          </>
        );

      case "gradient":
        return (
          <LinearGradient
            colors={[...
              (gradientColors && gradientColors.length >= 2
                ? gradientColors
                : [
                    theme === "dark"
                      ? "rgba(20,20,20,0.95)"
                      : "rgba(255,255,255,0.95)",
                    theme === "dark"
                      ? "rgba(40,40,40,0.9)"
                      : "rgba(240,240,240,0.9)",
                  ]) as unknown as readonly [string, string, ...string[]]
            ]}
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: FLOATING_BORDER_RADIUS[borderRadius] },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        );

      default:
        return (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor:
                  backgroundColor || (theme === "dark" ? "#1a1a1a" : "#ffffff"),
                borderRadius: FLOATING_BORDER_RADIUS[borderRadius],
              },
            ]}
          />
        );
    }
  };

  const containerContent = (
    <View style={[baseStyle, { overflow: "hidden" }, style]}>
      {renderBackground()}

      {/* Highlight effect */}
      {variant === "glassmorphism" && (
        <LinearGradient
          colors={[
            theme === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.8)",
            "transparent",
          ]}
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 24,
              borderTopLeftRadius: FLOATING_BORDER_RADIUS[borderRadius],
              borderTopRightRadius: FLOATING_BORDER_RADIUS[borderRadius],
            },
          ]}
        />
      )}

      {/* Contenu */}
      <View style={{ flex: 1, zIndex: 1 }}>{children}</View>
    </View>
  );

  if (animated && animationValue) {
    return (
      <Animated.View
        style={{
          opacity: animationValue,
          transform: [
            {
              scale: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
            {
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        {containerContent}
      </Animated.View>
    );
  }

  return containerContent;
};

export default FloatingContainer;
