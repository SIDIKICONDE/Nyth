import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

interface RippleButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  rippleColor?: string;
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  disabled?: boolean;
  borderRadius?: number;
  duration?: number;
  scaleEffect?: boolean;
  enableHaptic?: boolean;
  testID?: string;
  accessibilityRole?: string;
  accessibilityLabel?: string;
}

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export default function RippleButton({
  children,
  onPress,
  onPressIn: externalOnPressIn,
  onPressOut: externalOnPressOut,
  onLongPress,
  style,
  rippleColor = 'rgba(255,255,255,0.3)',
  hapticType = 'light',
  disabled = false,
  borderRadius = 8,
  duration = 400,
  scaleEffect = true,
  enableHaptic = true,
  testID,
  accessibilityRole,
  accessibilityLabel,
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<any[]>([]);
  const scale = useSharedValue(1);
  const rippleIdCounter = useSharedValue(0);

  // Configuration des types de haptic feedback
  const getHapticType = () => {
    switch (hapticType) {
      case 'light':
        return 'impactLight';
      case 'medium':
        return 'impactMedium';
      case 'heavy':
        return 'impactHeavy';
      case 'success':
        return 'notificationSuccess';
      case 'warning':
        return 'notificationWarning';
      case 'error':
        return 'notificationError';
      default:
        return 'impactLight';
    }
  };

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (enableHaptic && Platform.OS !== 'web') {
      try {
        HapticFeedback.trigger(getHapticType(), hapticOptions);
      } catch (error) {
        // Fallback silencieux si haptic non disponible
      }
    }
  }, [enableHaptic, hapticType]);

  // Créer un effet ripple
  const createRipple = useCallback(
    (x: number, y: number) => {
      const id = rippleIdCounter.value++;
      const newRipple = {
        id,
        x,
        y,
        scale: useSharedValue(0),
        opacity: useSharedValue(1),
      };

      setRipples(prev => [...prev, newRipple]);

      // Animation du ripple
      newRipple.scale.value = withTiming(1, { duration: duration / 2 });
      newRipple.opacity.value = withTiming(0, { duration }, () => {
        // Supprimer le ripple après l'animation
        runOnJS(setRipples)(prev => prev.filter(r => r.id !== id));
      });
    },
    [duration, rippleIdCounter],
  );

  // Gestion du press
  const handlePressIn = useCallback(
    (event: any) => {
      if (disabled) return;

      if (scaleEffect) {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      }

      // Créer le ripple au point de contact
      const { locationX, locationY } = event.nativeEvent;
      createRipple(locationX, locationY);

      // Trigger haptic feedback
      triggerHaptic();

      // Call external callback
      externalOnPressIn?.();
    },
    [
      disabled,
      scaleEffect,
      scale,
      createRipple,
      triggerHaptic,
      externalOnPressIn,
    ],
  );

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    if (scaleEffect) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }

    // Call external callback
    externalOnPressOut?.();
  }, [disabled, scaleEffect, scale, externalOnPressOut]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
  }, [disabled, onPress]);

  const handleLongPress = useCallback(() => {
    if (disabled) return;
    onLongPress?.();
  }, [disabled, onLongPress]);

  // Style animé pour le scale
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={disabled}
        testID={testID}
        accessibilityRole={accessibilityRole as any}
        accessibilityLabel={accessibilityLabel}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius,
        }}
      >
        {children}

        {/* Ripples */}
        {ripples.map(ripple => (
          <Animated.View
            key={ripple.id}
            style={[
              {
                position: 'absolute',
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: rippleColor,
                left: ripple.x - 10,
                top: ripple.y - 10,
              },
              useAnimatedStyle(() => ({
                transform: [{ scale: ripple.scale.value }],
                opacity: ripple.opacity.value,
              })),
            ]}
          />
        ))}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Hook pour des micro-interactions avancées
export function useMicroInteractions() {
  const triggerSuccess = useCallback(() => {
    if (Platform.OS !== 'web') {
      HapticFeedback.trigger('notificationSuccess', hapticOptions);
    }
  }, []);

  const triggerError = useCallback(() => {
    if (Platform.OS !== 'web') {
      HapticFeedback.trigger('notificationError', hapticOptions);
    }
  }, []);

  const triggerWarning = useCallback(() => {
    if (Platform.OS !== 'web') {
      HapticFeedback.trigger('notificationWarning', hapticOptions);
    }
  }, []);

  const triggerImpact = useCallback(
    (type: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (Platform.OS !== 'web') {
        const hapticType =
          type === 'light'
            ? 'impactLight'
            : type === 'heavy'
            ? 'impactHeavy'
            : 'impactMedium';
        HapticFeedback.trigger(hapticType, hapticOptions);
      }
    },
    [],
  );

  return {
    triggerSuccess,
    triggerError,
    triggerWarning,
    triggerImpact,
  };
}
