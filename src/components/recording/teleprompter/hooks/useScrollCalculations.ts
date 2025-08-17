import { useMemo } from "react";
import {
  MIN_SCROLL_SPEED,
  MAX_SCROLL_SPEED,
  DEFAULT_START_POSITION,
  BOTTOM_SAFE_MARGIN,
} from "../constants";

interface ScrollCalculations {
  startPosition: number;
  endPosition: number;
  totalDistance: number;
  duration: number;
  remainingDistance: number;
  remainingDuration: number;
}

export const useScrollCalculations = (
  textHeight: number,
  containerHeight: number,
  scrollSpeed: number,
  pausedPosition: number | null,
  methodConfig?: {
    method?: "classic" | "wpm" | "duration" | "lines";
    wpm?: number;
    durationMinutes?: number;
    linesPerSecond?: number;
    wordCount?: number;
    fontSize?: number;
    lineHeightMultiplier?: number;
  }
): ScrollCalculations => {
  return useMemo(() => {
    const startPosition = DEFAULT_START_POSITION;
    const safetyOffset = BOTTOM_SAFE_MARGIN + 40;
    const endPosition = -(textHeight + containerHeight + safetyOffset);
    const totalDistance = Math.abs(startPosition - endPosition);

    let baseDuration: number;

    // Sélection de méthode
    const method = methodConfig?.method ?? "classic";

    if (method === "wpm") {
      const words = Math.max(
        1,
        Math.round(
          (methodConfig?.wordCount ?? 0) ||
            estimateWords(textHeight, methodConfig)
        )
      );
      const wpm = Math.max(40, Math.min(400, methodConfig?.wpm ?? 160));
      baseDuration = Math.max(3000, (words / wpm) * 60 * 1000);
    } else if (method === "duration") {
      const minutes = Math.max(
        1,
        Math.min(120, methodConfig?.durationMinutes ?? 3)
      );
      baseDuration = minutes * 60 * 1000;
    } else if (method === "lines") {
      const lps = Math.max(
        0.2,
        Math.min(10, methodConfig?.linesPerSecond ?? 1)
      );
      const estimatedLines = estimateLines(textHeight, methodConfig);
      baseDuration = Math.max(3000, (estimatedLines / lps) * 1000);
    } else {
      const normalizedSpeed = Math.max(1, Math.min(100, scrollSpeed));
      const speedFactor = normalizedSpeed / 100;
      const actualSpeed =
        MIN_SCROLL_SPEED + speedFactor * (MAX_SCROLL_SPEED - MIN_SCROLL_SPEED);
      baseDuration = Math.max(3000, (totalDistance / actualSpeed) * 1000);
    }

    let remainingDistance = totalDistance;
    let remainingDuration = baseDuration;

    if (pausedPosition !== null) {
      remainingDistance = Math.abs(pausedPosition - endPosition);
      const remainingRatio = remainingDistance / totalDistance;
      remainingDuration = Math.max(1000, baseDuration * remainingRatio);
    }

    return {
      startPosition,
      endPosition,
      totalDistance,
      duration: baseDuration,
      remainingDistance,
      remainingDuration,
    };
  }, [
    textHeight,
    containerHeight,
    scrollSpeed,
    pausedPosition,
    methodConfig?.method,
    methodConfig?.wpm,
    methodConfig?.durationMinutes,
    methodConfig?.linesPerSecond,
    methodConfig?.wordCount,
    methodConfig?.fontSize,
    methodConfig?.lineHeightMultiplier,
  ]);
};

function estimateWords(
  textHeight: number,
  methodConfig?: { fontSize?: number; lineHeightMultiplier?: number }
) {
  const fontSize = methodConfig?.fontSize ?? 20;
  const lineHeight = (methodConfig?.lineHeightMultiplier ?? 1.4) * fontSize;
  const lines = Math.max(1, Math.floor(textHeight / lineHeight));
  const avgWordsPerLine = 8; // estimation
  return lines * avgWordsPerLine;
}

function estimateLines(
  textHeight: number,
  methodConfig?: { fontSize?: number; lineHeightMultiplier?: number }
) {
  const fontSize = methodConfig?.fontSize ?? 20;
  const lineHeight = (methodConfig?.lineHeightMultiplier ?? 1.4) * fontSize;
  return Math.max(1, Math.floor(textHeight / lineHeight));
}
