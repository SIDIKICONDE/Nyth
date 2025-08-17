import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Keyboard, Platform } from "react-native";
import { KeyboardState } from "../types";

export const useKeyboardAnimations = () => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    keyboardHeight: 0,
    keyboardVisible: false,
  });

  // Références pour les animations
  const viewAdjustment = useRef(new Animated.Value(0)).current;
  const inputPosition = useRef(
    new Animated.Value(Platform.OS === "ios" ? 20 : 10)
  ).current;
  const backgroundDimming = useRef(new Animated.Value(0)).current;

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // Timer d'inactivité du clavier
  useEffect(() => {
    const inactivityDelay = 5000;
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      inactivityTimer = setTimeout(() => {
        if (keyboardState.keyboardVisible) {
          dismissKeyboard();
        }
      }, inactivityDelay);
    };

    const keyPressListener = Keyboard.addListener(
      "keyboardDidShow",
      resetTimer
    );

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      keyPressListener.remove();
    };
  }, [keyboardState.keyboardVisible, dismissKeyboard]);

  // Gestion des événements du clavier
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardState({
          keyboardVisible: true,
          keyboardHeight: event.endCoordinates.height,
        });

        // Animer le déplacement de la vue
        Animated.spring(viewAdjustment, {
          toValue: event.endCoordinates.height,
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start();

        // Animer la position de l'input
        Animated.spring(inputPosition, {
          toValue: event.endCoordinates.height + 10,
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start();

        // Animer l'assombrissement du fond
        Animated.timing(backgroundDimming, {
          toValue: 0.7,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardState({
          keyboardVisible: false,
          keyboardHeight: 0,
        });

        // Réinitialiser les animations
        Animated.spring(viewAdjustment, {
          toValue: 0,
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start();

        Animated.spring(inputPosition, {
          toValue: Platform.OS === "ios" ? 20 : 10,
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start();

        Animated.timing(backgroundDimming, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [viewAdjustment, inputPosition, backgroundDimming]);

  return {
    ...keyboardState,
    viewAdjustment,
    inputPosition,
    backgroundDimming,
    dismissKeyboard,
  };
};
