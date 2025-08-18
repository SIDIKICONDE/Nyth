import {
  FAB_SIZES,
  FLOATING_ELEVATION,
  FLOATING_POSITIONS,
  createFABStyle,
} from "@/constants/floatingStyles";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Animated, TouchableOpacity, View } from "react-native";

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  iconComponent?: React.ReactNode;
  size?: keyof typeof FAB_SIZES;
  position?: keyof typeof FLOATING_POSITIONS;
  elevation?: keyof typeof FLOATING_ELEVATION;
  backgroundColor?: string;
  iconColor?: string;
  gradientColors?: string[];
  variant?: "standard" | "gradient" | "outlined";
  animated?: boolean;
  animationValue?: Animated.Value;
  style?: any;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = "plus",
  iconComponent,
  size = "MEDIUM",
  position = "FAB_BOTTOM_RIGHT",
  elevation = "MEDIUM",
  backgroundColor = "#007AFF",
  iconColor = "#FFFFFF",
  gradientColors,
  variant = "standard",
  animated = false,
  animationValue,
  style,
  accessibilityLabel,
  disabled = false,
}) => {
  const fabStyle = createFABStyle(size, position, elevation);
  const sizeConfig = FAB_SIZES[size];

  const renderBackground = () => {
    switch (variant) {
      case "gradient":
        return (
          <LinearGradient
            colors={[...
              (gradientColors && gradientColors.length >= 2
                ? gradientColors
                : [
                    backgroundColor,
                    `${backgroundColor}80`,
                  ]) as unknown as readonly [string, string, ...string[]]
            ]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: sizeConfig.borderRadius,
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        );

      case "outlined":
        return (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: sizeConfig.borderRadius,
              borderWidth: 2,
              borderColor: backgroundColor,
              backgroundColor: "transparent",
            }}
          />
        );

      default:
        return (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: sizeConfig.borderRadius,
              backgroundColor: backgroundColor,
            }}
          />
        );
    }
  };

  const renderIcon = () => {
    if (iconComponent) {
      return iconComponent;
    }

    return (
      <MaterialCommunityIcons
        name={icon as any}
        size={sizeConfig.iconSize}
        color={variant === "outlined" ? backgroundColor : iconColor}
      />
    );
  };

  const buttonContent = (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        fabStyle,
        {
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {renderBackground()}

      {/* Highlight effect */}
      {variant !== "outlined" && (
        <View
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            right: 2,
            height: sizeConfig.height * 0.3,
            borderTopLeftRadius: sizeConfig.borderRadius - 2,
            borderTopRightRadius: sizeConfig.borderRadius - 2,
            backgroundColor: "rgba(255,255,255,0.3)",
          }}
        />
      )}

      {/* Icône */}
      <View style={{ zIndex: 1 }}>{renderIcon()}</View>
    </TouchableOpacity>
  );

  if (animated && animationValue) {
    return (
      <Animated.View
        style={{
          transform: [
            {
              scale: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
            {
              rotate: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        }}
      >
        {buttonContent}
      </Animated.View>
    );
  }

  return buttonContent;
};

export default FloatingActionButton;
