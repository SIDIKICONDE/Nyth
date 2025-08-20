import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { InputAnimations, InputStyleType } from "./types";

/**
 * Hook pour gérer toutes les animations du ChatInput
 */
export const useInputAnimations = (
  inputText: string,
  isFocused: boolean,
  isLoading: boolean,
  selectedInputStyle: InputStyleType
): InputAnimations => {
  // Références des animations
  const sendButtonScale = useRef(new Animated.Value(0.8)).current;
  const inputBorderAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const loadingRotation = useRef(new Animated.Value(0)).current;

  // Animation du bouton d'envoi
  useEffect(() => {
    const canSend = inputText.trim().length > 0;
    Animated.spring(sendButtonScale, {
      toValue: canSend ? 1 : 0.8,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [inputText, sendButtonScale]);

  // Animation de la bordure lors du focus
  useEffect(() => {
    Animated.timing(inputBorderAnimation, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, inputBorderAnimation]);

  // Animation de pulsation pour l'input focus
  useEffect(() => {
    if (
      isFocused &&
      selectedInputStyle !== "sheet" &&
      selectedInputStyle !== "neon"
    ) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isFocused, pulseAnimation, selectedInputStyle]);

  // Animation de rotation pour le loading
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(loadingRotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingRotation.setValue(0);
    }
  }, [isLoading, loadingRotation]);

  return {
    sendButtonScale,
    inputBorderAnimation,
    pulseAnimation,
    loadingRotation,
  };
};

/**
 * Crée l'interpolation pour la couleur de bordure
 */
export const createBorderColorInterpolation = (
  inputBorderAnimation: Animated.Value,
  currentTheme: any
) => {
  return inputBorderAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      currentTheme.colors.border,
      currentTheme.colors.accent || "#007AFF",
    ],
  });
}; 