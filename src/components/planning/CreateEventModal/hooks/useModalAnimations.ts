import React from "react";
import { Animated, Dimensions } from "react-native";

const { height: screenHeight } = Dimensions.get("window");

export const useModalAnimations = (visible: boolean) => {
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  const showModal = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim, scaleAnim]);

  const hideModal = React.useCallback(
    (onComplete?: () => void) => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete?.();
      });
    },
    [slideAnim, fadeAnim]
  );

  const resetAnimations = React.useCallback(() => {
    slideAnim.setValue(screenHeight);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
  }, [slideAnim, fadeAnim, scaleAnim]);

  React.useEffect(() => {
    if (visible) {
      showModal();
    } else {
      resetAnimations();
    }
  }, [visible, showModal, resetAnimations]);

  return {
    slideAnim,
    fadeAnim,
    scaleAnim,
    showModal,
    hideModal,
    resetAnimations,
  };
};
