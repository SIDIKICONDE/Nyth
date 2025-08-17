import { BLUR_CONFIGS, FLOATING_OVERLAYS } from "@/constants/floatingStyles";
import { BlurView } from "@react-native-community/blur";
import React from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface FloatingOverlayProps {
  visible: boolean;
  onPress?: () => void;
  variant?: keyof typeof FLOATING_OVERLAYS;
  blurIntensity?: keyof typeof BLUR_CONFIGS;
  animated?: boolean;
  animationValue?: Animated.Value;
  children?: React.ReactNode;
  style?: any;
}

export const FloatingOverlay: React.FC<FloatingOverlayProps> = ({
  visible,
  onPress,
  variant = "MEDIUM",
  blurIntensity = "MEDIUM",
  animated = true,
  animationValue,
  children,
  style,
}) => {
  if (!visible) return null;

  const overlayStyle = FLOATING_OVERLAYS[variant];
  const blurConfig = BLUR_CONFIGS[blurIntensity];

  const renderContent = () => (
    <>
      {/* Overlay de base */}
      <TouchableOpacity
        style={[StyleSheet.absoluteFillObject, overlayStyle]}
        onPress={onPress}
        activeOpacity={1}
      />

      {/* Effet de blur pour iOS */}
      {Platform.OS === "ios" && variant.includes("BLUR") && (
        <BlurView blurAmount={blurConfig.intensity} blurType="dark"
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Contenu additionnel */}
      {children}
    </>
  );

  if (animated && animationValue) {
    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: animationValue },
          style,
        ]}
      >
        {renderContent()}
      </Animated.View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, style]}>
      {renderContent()}
    </View>
  );
};

export default FloatingOverlay;
