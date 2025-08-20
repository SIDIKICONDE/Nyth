import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useScrollCalculations } from "./hooks/useScrollCalculations";
import { useScrollHandlers } from "./hooks/useScrollHandlers";
import { useScrollState } from "./hooks/useScrollState";
import { ScrollerHandlers, ScrollingState } from "./types";

export function useScrollAnimation(
  isRecording: boolean,
  isPaused: boolean,
  scrollSpeed: number,
  containerHeight: number,
  externalTextHeight?: number,
  externalIsTextMeasured?: boolean,
  isScreenFocused?: boolean,
  methodConfig?: {
    method?: "classic" | "wpm" | "duration" | "lines";
    wpm?: number;
    durationMinutes?: number;
    linesPerSecond?: number;
    wordCount?: number;
    fontSize?: number;
    lineHeightMultiplier?: number;
  }
): [Animated.Value, ScrollingState, ScrollerHandlers] {
  const scrollAnimation = useRef(new Animated.Value(0)).current;

  const { state, dispatch } = useScrollState(
    scrollSpeed,
    externalTextHeight,
    externalIsTextMeasured
  );

  const calculations = useScrollCalculations(
    state.textHeight,
    containerHeight,
    state.scrollSpeed,
    state.pausedPosition,
    methodConfig
  );

  const handlers = useScrollHandlers({
    scrollAnimation,
    state,
    calculations,
    dispatch,
    isRecording,
    isPaused,
    isScreenFocused,
  });

  useEffect(() => {
    if (scrollSpeed !== state.scrollSpeed) {
      handlers.updateScrollSpeed(scrollSpeed);
    }
  }, [scrollSpeed, state.scrollSpeed]);

  useEffect(() => {
    if (
      state.isTextMeasured &&
      state.textHeight > 0 &&
      (!isRecording || isScreenFocused === false)
    ) {
      scrollAnimation.setValue(calculations.startPosition);
      if (state.currentAnimation) {
        state.currentAnimation.stop();
        dispatch({ type: "SET_ANIMATION", payload: null });
      }
    }
  }, [
    state.isTextMeasured,
    state.textHeight,
    state.currentAnimation,
    isRecording,
    isScreenFocused,
    calculations.startPosition,
  ]);

  useEffect(() => {
    if (isPaused && state.currentAnimation) {
      handlers.stopScrolling();
      return;
    }

    if (
      !isPaused &&
      isRecording &&
      state.isTextMeasured &&
      !state.isResetting &&
      isScreenFocused !== false
    ) {
      if (!state.currentAnimation) {
        const startDelay = state.pausedPosition !== null ? 100 : 50;
        setTimeout(() => {
          if (!isPaused && isRecording && !state.isResetting) {
            handlers.startScrolling();
          }
        }, startDelay);
      }
    } else if (!isRecording || isScreenFocused === false) {
      if (state.currentAnimation) {
        handlers.stopScrolling();
      }
    }
  }, [
    isPaused,
    isRecording,
    state.isTextMeasured,
    state.isResetting,
    isScreenFocused,
    !!state.currentAnimation,
    state.pausedPosition,
  ]);

  useEffect(() => {
    return () => {
      if (state.currentAnimation) {
        state.currentAnimation.stop();
        dispatch({ type: "SET_ANIMATION", payload: null });
      }
      scrollAnimation.stopAnimation();
      if (handlers.cleanupResetTimeout) {
        handlers.cleanupResetTimeout();
      }
    };
  }, []);

  const scrollingState: ScrollingState = {
    textHeight: state.textHeight,
    isTextMeasured: state.isTextMeasured,
    currentAnimation: state.currentAnimation,
    pausedPosition: state.pausedPosition,
    endPosition: calculations.endPosition,
    startPosition: calculations.startPosition,
  };

  const scrollerHandlers: ScrollerHandlers = {
    startScrolling: handlers.startScrolling,
    stopScrolling: handlers.stopScrolling,
    resetScrolling: handlers.resetScrolling,
    calculateDuration: () => calculations.duration,
    updateScrollSpeed: handlers.updateScrollSpeed,
    pauseScrolling: handlers.pauseScrolling,
  };

  return [scrollAnimation, scrollingState, scrollerHandlers];
}

// Helper function to update text height
export const handleTextMeasurement = (
  event: { nativeEvent: { layout: { height: number } } },
  setTextHeight: React.Dispatch<React.SetStateAction<number>>,
  setIsTextMeasured: React.Dispatch<React.SetStateAction<boolean>>,
  scrollAnimation: Animated.Value,
  startPosition: number
) => {
  const { height } = event.nativeEvent.layout;
  if (height > 0) {
    setTextHeight(height);
    setIsTextMeasured(true);
    scrollAnimation.setValue(startPosition);
  }
};
