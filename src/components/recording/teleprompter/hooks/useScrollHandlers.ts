import { useCallback, useRef } from "react";
import { Animated, Easing } from "react-native";
import { useTranslation } from "../../../../hooks/useTranslation";
import { ANIMATION_RESTART_DELAY } from "../constants";
import { ScrollAction } from "./useScrollState";

interface UseScrollHandlersProps {
  scrollAnimation: Animated.Value;
  state: {
    currentAnimation: Animated.CompositeAnimation | null;
    pausedPosition: number | null;
    isResetting: boolean;
    textHeight: number;
    isTextMeasured: boolean;
  };
  calculations: {
    startPosition: number;
    endPosition: number;
    remainingDuration: number;
  };
  dispatch: React.Dispatch<ScrollAction>;
  isRecording: boolean;
  isPaused: boolean;
  isScreenFocused?: boolean;
}

export const useScrollHandlers = ({
  scrollAnimation,
  state,
  calculations,
  dispatch,
  isRecording,
  isPaused,
  isScreenFocused,
}: UseScrollHandlersProps) => {
  const { t } = useTranslation();
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start scrolling
  const startScrolling = useCallback(() => {
    // Safety checks
    if (!isRecording) {
      return;
    }

    if (isPaused) {
      return;
    }

    if (state.isResetting) {
      return;
    }

    if (!state.isTextMeasured || state.textHeight <= 0) {
      return;
    }

    // Stop current animation if exists
    if (state.currentAnimation) {
      state.currentAnimation.stop();
    }

    // Determine starting position
    const fromPosition =
      state.pausedPosition !== null
        ? state.pausedPosition
        : calculations.startPosition;

    // Set initial position
    scrollAnimation.setValue(fromPosition);

    // Create and start animation
    const animation = Animated.timing(scrollAnimation, {
      toValue: calculations.endPosition,
      duration: calculations.remainingDuration,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: true,
    });

    animation.start(({ finished }) => {
      if (finished && isRecording && isScreenFocused !== false && !isPaused) {
        // Reset and restart
        resetScrolling();
        setTimeout(() => {
          if (isRecording && !isPaused) {
            startScrolling();
          }
        }, ANIMATION_RESTART_DELAY);
      }
    });

    dispatch({ type: "SET_ANIMATION", payload: animation });

    // Clear paused position after starting
    if (state.pausedPosition !== null) {
      setTimeout(() => {
        dispatch({ type: "SET_PAUSED_POSITION", payload: null });
      }, 100);
    }
  }, [
    isRecording,
    isPaused,
    isScreenFocused,
    state.isResetting,
    state.isTextMeasured,
    state.textHeight,
    state.pausedPosition,
    calculations.startPosition,
    calculations.endPosition,
    calculations.remainingDuration,
    // Ne pas inclure state.currentAnimation pour éviter les boucles
  ]);

  // Stop scrolling
  const stopScrolling = useCallback(() => {
    if (state.currentAnimation) {
      state.currentAnimation.stop();
      dispatch({ type: "SET_ANIMATION", payload: null });

      scrollAnimation.stopAnimation((value) => {
        // Sauvegarder la position seulement si on est en pause (pas en arrêt complet)
        if (isPaused && isRecording) {
          dispatch({ type: "SET_PAUSED_POSITION", payload: value });
        } else {
          // Si on arrête complètement, réinitialiser la position
          dispatch({ type: "SET_PAUSED_POSITION", payload: null });
        }
      });
    } else {}
  }, [!!state.currentAnimation, isPaused, isRecording]);

  // Reset scrolling
  const resetScrolling = useCallback(() => {
    // Clear any pending reset timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    // Set resetting flag
    dispatch({ type: "SET_RESETTING", payload: true });

    // Stop current animation
    if (state.currentAnimation) {
      state.currentAnimation.stop();
    }

    // Reset animation value
    scrollAnimation.setValue(calculations.startPosition);

    // Reset state
    dispatch({ type: "RESET" });

    // Clear resetting flag after delay
    resetTimeoutRef.current = setTimeout(() => {
      dispatch({ type: "SET_RESETTING", payload: false });
    }, 300);
  }, [calculations.startPosition]);

  // Update scroll speed
  const updateScrollSpeed = useCallback(
    (speed: number) => {
      const validatedSpeed = Math.max(1, Math.min(100, speed));
      dispatch({ type: "SET_SCROLL_SPEED", payload: validatedSpeed });

      // Restart if currently scrolling
      if (state.currentAnimation && isRecording) {
        stopScrolling();
        setTimeout(startScrolling, 50);
      }
    },
    [!!state.currentAnimation, isRecording]
  );

  // Cleanup timeout on unmount
  const cleanupResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  return {
    startScrolling,
    stopScrolling,
    resetScrolling,
    updateScrollSpeed,
    pauseScrolling: stopScrolling, // Alias for semantic purposes
    cleanupResetTimeout,
  };
};
