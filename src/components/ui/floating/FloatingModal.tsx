import {
  ANIMATION_DURATIONS,
  FLOATING_ANIMATIONS,
} from "@/constants/floatingStyles";
import React, { useEffect, useRef } from "react";
import { Animated, KeyboardAvoidingView, Modal, Platform } from "react-native";
import FloatingContainer from "./FloatingContainer";
import FloatingOverlay from "./FloatingOverlay";

interface FloatingModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: "fade" | "slide" | "none";
  presentationStyle?:
    | "fullScreen"
    | "pageSheet"
    | "formSheet"
    | "overFullScreen";
  variant?: "standard" | "glassmorphism" | "gradient";
  theme?: "light" | "dark";
  elevation?: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  borderRadius?: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
  overlayVariant?: "LIGHT" | "MEDIUM" | "DARK" | "BLUR_LIGHT" | "BLUR_DARK";
  blurIntensity?: "LIGHT" | "MEDIUM" | "DARK" | "EXTRA_LIGHT";
  position?: "center" | "bottom" | "top";
  keyboardAvoidingEnabled?: boolean;
  style?: any;
  containerStyle?: any;
  overlayStyle?: any;
  onShow?: () => void;
  onDismiss?: () => void;
}

export const FloatingModal: React.FC<FloatingModalProps> = ({
  visible,
  onClose,
  children,
  animationType = "fade",
  presentationStyle = "overFullScreen",
  variant = "glassmorphism",
  theme = "light",
  elevation = "HIGH",
  borderRadius = "LARGE",
  overlayVariant = "BLUR_DARK",
  blurIntensity = "MEDIUM",
  position = "center",
  keyboardAvoidingEnabled = true,
  style,
  containerStyle,
  overlayStyle,
  onShow,
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(
    new Animated.Value(
      position === "bottom" ? 100 : position === "top" ? -100 : 0
    )
  ).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATIONS.NORMAL,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATIONS.NORMAL,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...FLOATING_ANIMATIONS.SPRING,
        }),
      ]).start(() => {
        onShow?.();
      });
    } else {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATIONS.FAST,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: position === "bottom" ? 50 : position === "top" ? -50 : 0,
          duration: ANIMATION_DURATIONS.FAST,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: ANIMATION_DURATIONS.FAST,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss?.();
      });
    }
  }, [visible]);

  const getContainerStyle = () => {
    const baseStyle = {
      flex: 1,
      justifyContent:
        position === "bottom"
          ? "flex-end"
          : position === "top"
          ? "flex-start"
          : "center",
      alignItems: "center",
      padding: 16,
    };

    if (position === "bottom") {
      return {
        ...baseStyle,
        paddingBottom: Platform.OS === "ios" ? 34 : 16, // Safe area pour iOS
      };
    }

    return baseStyle;
  };

  const getModalContainerStyle = () => {
    const baseStyle = {
      width: "100%",
      maxWidth: position === "center" ? 400 : undefined,
      maxHeight:
        position === "center" ? "80%" : position === "bottom" ? "90%" : "80%",
    };

    if (position === "bottom") {
      return {
        ...baseStyle,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      };
    }

    return baseStyle;
  };

  const renderContent = () => (
    <>
      {/* Overlay */}
      <FloatingOverlay
        visible={visible}
        onPress={onClose}
        variant={overlayVariant}
        blurIntensity={blurIntensity}
        animated={true}
        animationValue={fadeAnim}
        style={overlayStyle}
      />

      {/* Contenu du modal */}
      <Animated.View
        style={[
          getContainerStyle(),
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
          style,
        ]}
      >
        <FloatingContainer
          variant={variant}
          theme={theme}
          elevation={elevation}
          borderRadius={borderRadius}
          style={[getModalContainerStyle(), containerStyle]}
        >
          {children}
        </FloatingContainer>
      </Animated.View>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="none" // Nous gérons nos propres animations
      transparent={true}
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {keyboardAvoidingEnabled ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {renderContent()}
        </KeyboardAvoidingView>
      ) : (
        renderContent()
      )}
    </Modal>
  );
};

export default FloatingModal;
