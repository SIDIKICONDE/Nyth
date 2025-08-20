import { useRef, useCallback } from "react";
import { GestureResponderEvent } from "react-native";

interface TouchHandlerOptions {
  onPress?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  longPressDelay?: number;
  doubleTapDelay?: number;
  tapDistanceThreshold?: number;
  preventGyroscopeInterference?: boolean;
}

export const useOptimizedTouchHandler = (options: TouchHandlerOptions = {}) => {
  const {
    onPress,
    onLongPress,
    onDoubleTap,
    longPressDelay = 500,
    doubleTapDelay = 300,
    tapDistanceThreshold = 50,
    preventGyroscopeInterference = true,
  } = options;

  const touchStartTimeRef = useRef<number>(0);
  const touchStartPositionRef = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  const handleTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      const { pageX, pageY } = event.nativeEvent;
      const now = Date.now();

      // Éviter les conflits avec le gyroscope en vérifiant la stabilité
      if (preventGyroscopeInterference && isProcessingRef.current) {
        return;
      }

      touchStartTimeRef.current = now;
      touchStartPositionRef.current = { x: pageX, y: pageY };
      isProcessingRef.current = true;

      // Vérifier le double tap
      if (lastTapTimeRef.current > 0) {
        const timeDiff = now - lastTapTimeRef.current;
        const distance = Math.sqrt(
          Math.pow(pageX - lastTapPositionRef.current.x, 2) +
            Math.pow(pageY - lastTapPositionRef.current.y, 2)
        );

        if (timeDiff <= doubleTapDelay && distance <= tapDistanceThreshold) {
          // Nettoyer les timeouts
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
          if (doubleTapTimeoutRef.current) {
            clearTimeout(doubleTapTimeoutRef.current);
            doubleTapTimeoutRef.current = null;
          }

          // Exécuter le double tap
          if (onDoubleTap) {
            onDoubleTap();
          }

          lastTapTimeRef.current = 0;
          isProcessingRef.current = false;
          return;
        }
      }

      // Configurer le long press
      longPressTimeoutRef.current = setTimeout(() => {
        if (onLongPress) {
          onLongPress();
        }
      }, longPressDelay);

      // Enregistrer pour le double tap futur
      lastTapTimeRef.current = now;
      lastTapPositionRef.current = { x: pageX, y: pageY };

      // Timeout pour nettoyer le double tap
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
      doubleTapTimeoutRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        doubleTapTimeoutRef.current = null;
      }, doubleTapDelay);
    },
    [
      onLongPress,
      onDoubleTap,
      longPressDelay,
      doubleTapDelay,
      tapDistanceThreshold,
      preventGyroscopeInterference,
    ]
  );

  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      const touchDuration = Date.now() - touchStartTimeRef.current;

      // Nettoyer le long press timeout
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }

      // Si c'était un tap rapide, exécuter onPress
      if (touchDuration < longPressDelay && onPress) {
        // Délai pour éviter les conflits avec le gyroscope
        setTimeout(() => {
          onPress();
        }, 10);
      }

      isProcessingRef.current = false;
    },
    [onPress, longPressDelay]
  );

  const cleanup = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (doubleTapTimeoutRef.current) {
      clearTimeout(doubleTapTimeoutRef.current);
      doubleTapTimeoutRef.current = null;
    }
    isProcessingRef.current = false;
  }, []);

  return {
    handleTouchStart,
    handleTouchEnd,
    cleanup,
  };
};
