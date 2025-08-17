import {
  ANIMATION_DURATIONS,
  FLOATING_ANIMATIONS,
} from "@/constants/floatingStyles";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

interface UseFloatingAnimationProps {
  visible: boolean;
  animationType?: "fade" | "slide" | "scale" | "spring" | "bounce";
  duration?: keyof typeof ANIMATION_DURATIONS;
  delay?: number;
  slideDirection?: "up" | "down" | "left" | "right";
  slideDistance?: number;
  onAnimationComplete?: () => void;
}

export const useFloatingAnimation = ({
  visible,
  animationType = "fade",
  duration = "NORMAL",
  delay = 0,
  slideDirection = "up",
  slideDistance = 50,
  onAnimationComplete,
}: UseFloatingAnimationProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Initialiser les valeurs selon la direction
  useEffect(() => {
    if (animationType === "slide") {
      const initialValue = getSlideInitialValue();
      slideAnim.setValue(initialValue);
    }
  }, [animationType, slideDirection]);

  const getSlideInitialValue = () => {
    switch (slideDirection) {
      case "up":
        return slideDistance;
      case "down":
        return -slideDistance;
      case "left":
        return slideDistance;
      case "right":
        return -slideDistance;
      default:
        return slideDistance;
    }
  };

  const getSlideAnimatedStyle = () => {
    switch (slideDirection) {
      case "up":
      case "down":
        return { transform: [{ translateY: slideAnim }] };
      case "left":
      case "right":
        return { transform: [{ translateX: slideAnim }] };
      default:
        return { transform: [{ translateY: slideAnim }] };
    }
  };

  const createAnimation = (toValue: number) => {
    const animationDuration = ANIMATION_DURATIONS[duration];
    const animations: Animated.CompositeAnimation[] = [];

    switch (animationType) {
      case "fade":
        animations.push(
          Animated.timing(fadeAnim, {
            toValue,
            duration: animationDuration,
            delay,
            useNativeDriver: true,
          })
        );
        break;

      case "slide":
        animations.push(
          Animated.timing(fadeAnim, {
            toValue,
            duration: animationDuration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: toValue === 1 ? 0 : getSlideInitialValue(),
            duration: animationDuration,
            delay,
            useNativeDriver: true,
          })
        );
        break;

      case "scale":
        animations.push(
          Animated.timing(fadeAnim, {
            toValue,
            duration: animationDuration,
            delay,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: toValue === 1 ? 1 : 0.9,
            ...FLOATING_ANIMATIONS.SPRING,
          })
        );
        break;

      case "spring":
        animations.push(
          Animated.timing(fadeAnim, {
            toValue,
            duration: animationDuration,
            delay,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: toValue === 1 ? 1 : 0.8,
            ...FLOATING_ANIMATIONS.SPRING,
          }),
          Animated.timing(slideAnim, {
            toValue: toValue === 1 ? 0 : getSlideInitialValue() * 0.5,
            duration: animationDuration,
            delay,
            useNativeDriver: true,
          })
        );
        break;

      case "bounce":
        animations.push(
          Animated.timing(fadeAnim, {
            toValue,
            duration: animationDuration,
            delay,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: toValue === 1 ? 1 : 0.7,
            ...FLOATING_ANIMATIONS.BOUNCE,
          })
        );
        break;

      default:
        animations.push(
          Animated.timing(fadeAnim, {
            toValue,
            duration: animationDuration,
            delay,
            useNativeDriver: true,
          })
        );
    }

    return Animated.parallel(animations);
  };

  useEffect(() => {
    const animation = createAnimation(visible ? 1 : 0);

    animation.start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });

    return () => {
      animation.stop();
    };
  }, [visible]);

  const getAnimatedStyle = () => {
    const baseStyle = {
      opacity: fadeAnim,
    };

    switch (animationType) {
      case "slide":
        return {
          ...baseStyle,
          ...getSlideAnimatedStyle(),
        };

      case "scale":
        return {
          ...baseStyle,
          transform: [{ scale: scaleAnim }],
        };

      case "spring":
        return {
          ...baseStyle,
          transform: [
            { scale: scaleAnim },
            ...getSlideAnimatedStyle().transform,
          ],
        };

      case "bounce":
        return {
          ...baseStyle,
          transform: [{ scale: scaleAnim }],
        };

      default:
        return baseStyle;
    }
  };

  // Fonction pour créer une animation de rotation continue
  const startRotationAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  // Fonction pour créer une animation de pulsation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  return {
    animatedStyle: getAnimatedStyle(),
    fadeAnim,
    slideAnim,
    scaleAnim,
    rotateAnim,
    startRotationAnimation,
    startPulseAnimation,
    rotationStyle: {
      transform: [
        {
          rotate: rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          }),
        },
      ],
    },
  };
};

export default useFloatingAnimation;
