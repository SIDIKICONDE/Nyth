import { useEffect, useRef, useState } from "react";
import { Animated, Keyboard, Platform } from "react-native";
import { useInputStyle } from "../../../contexts/InputStyleContext";
import {
  animationDefaults,
  keyboardAnimationConfig,
} from "../utils/animations";

interface UseChatKeyboardReturn {
  keyboardHeight: number;
  keyboardVisible: boolean;
  viewAdjustment: Animated.Value;
  inputPosition: Animated.Value;
  backgroundDimming: Animated.Value;
  dismissKeyboard: () => void;
}

export const useChatKeyboard = (): UseChatKeyboardReturn => {
  const { selectedInputStyle } = useInputStyle();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Position par défaut adaptée au style
  const getDefaultPosition = () => {
    if (selectedInputStyle === "sheet") {
      return 0; // Colle au bas pour le style sheet
    }
    return animationDefaults.inputPosition;
  };

  // Animations
  const viewAdjustment = useRef(
    new Animated.Value(animationDefaults.viewAdjustment)
  ).current;
  const inputPosition = useRef(
    new Animated.Value(getDefaultPosition())
  ).current;
  const backgroundDimming = useRef(
    new Animated.Value(animationDefaults.backgroundDimming)
  ).current;

  // Fonction pour fermer le clavier
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Mettre à jour la position quand le style change
  useEffect(() => {
    if (!keyboardVisible) {
      inputPosition.setValue(getDefaultPosition());
    }
  }, [selectedInputStyle, keyboardVisible, inputPosition]);

  // Écouter les événements du clavier
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);

        // Animer le déplacement de la vue
        Animated.spring(viewAdjustment, {
          toValue: event.endCoordinates.height,
          ...keyboardAnimationConfig.spring,
        }).start();

        // Animer la position de l'input
        Animated.spring(inputPosition, {
          toValue:
            Platform.OS === "ios"
              ? event.endCoordinates.height
              : event.endCoordinates.height + 10,
          ...keyboardAnimationConfig.spring,
        }).start();

        // Animer l'assombrissement du fond
        Animated.timing(backgroundDimming, {
          toValue: animationDefaults.maxDimming,
          ...keyboardAnimationConfig.timing,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);

        // Réinitialiser les animations
        Animated.spring(viewAdjustment, {
          toValue: animationDefaults.viewAdjustment,
          ...keyboardAnimationConfig.spring,
        }).start();

        Animated.spring(inputPosition, {
          toValue: getDefaultPosition(),
          ...keyboardAnimationConfig.spring,
        }).start();

        Animated.timing(backgroundDimming, {
          toValue: animationDefaults.backgroundDimming,
          ...keyboardAnimationConfig.timing,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [viewAdjustment, inputPosition, backgroundDimming]);

  return {
    keyboardHeight,
    keyboardVisible,
    viewAdjustment,
    inputPosition,
    backgroundDimming,
    dismissKeyboard,
  };
};
