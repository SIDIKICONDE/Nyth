import { useEffect } from "react";
import { Animated } from "react-native";
import { useTranslation } from "../../../../hooks/useTranslation";

interface UseTeleprompterEffectsProps {
  // États
  isRecording: boolean;
  isPaused: boolean;
  isScreenFocused: boolean;
  isTextMeasured: boolean;
  textHeight: number;
  isTouchPaused: boolean;
  isResetting: boolean;
  containerHeight: number;
  isResizing: boolean;
  scriptId?: string;

  // Références
  prevIsPausedRef: React.MutableRefObject<boolean>;
  prevIsRecordingRef: React.MutableRefObject<boolean>;
  currentScrollPositionRef: React.MutableRefObject<number>;

  // Setters
  setIsTextMeasured: (value: boolean) => void;
  setIsTouchPaused: (value: boolean) => void;
  setIsResetting: (value: boolean) => void;

  // Handlers
  scrollHandlers: {
    stopScrolling: () => void;
    startScrolling: () => void;
    resetScrolling: () => void;
  };
  scrollAnimation: Animated.Value;
  scrollingState: { startPosition: number };
}

export const useTeleprompterEffects = ({
  isRecording,
  isPaused,
  isScreenFocused,
  isTextMeasured,
  textHeight,
  isTouchPaused,
  isResetting,
  containerHeight,
  isResizing,
  scriptId,
  prevIsPausedRef,
  prevIsRecordingRef,
  currentScrollPositionRef,
  setIsTextMeasured,
  setIsTouchPaused,
  setIsResetting,
  scrollHandlers,
  scrollAnimation,
  scrollingState,
}: UseTeleprompterEffectsProps) => {
  const { t } = useTranslation();

  // Log initial au montage
  useEffect(() => {
    return () => {};
  }, []); // Pas de dépendances pour éviter les re-logs

  // Arrêter immédiatement le défilement quand l'écran perd le focus
  useEffect(() => {
    if (isScreenFocused === false) {
      scrollHandlers.stopScrolling();
    }
  }, [isScreenFocused]); // Retirer scrollHandlers et t des dépendances

  // S'assurer que le défilement est arrêté au montage
  useEffect(() => {
    scrollHandlers.stopScrolling();
    scrollAnimation.setValue(0);
  }, []);

  // Suivre la valeur actuelle de scrollAnimation
  useEffect(() => {
    const animationListener = scrollAnimation.addListener((state) => {
      currentScrollPositionRef.current = state.value;
    });

    return () => {
      scrollAnimation.removeListener(animationListener);
    };
  }, [scrollAnimation, currentScrollPositionRef]);

  // Recalculate animation when resizing ends
  useEffect(() => {
    if (
      isRecording &&
      !isPaused &&
      !isResizing &&
      isTextMeasured &&
      !isResetting
    ) {
      const timer = setTimeout(() => {
        scrollHandlers.stopScrolling();
        setTimeout(() => {
          scrollHandlers.startScrolling();
        }, 50);
      }, 100);

      return () => clearTimeout(timer);
    }

    // Retourner une fonction de nettoyage vide si les conditions ne sont pas remplies
    return () => {};
  }, [
    isResizing,
    containerHeight,
    isRecording,
    isPaused,
    isTextMeasured,
    isResetting,
  ]);

  // Effect to handle script changes - avec vérification pour éviter les boucles
  useEffect(() => {
    if (scriptId) {
      setIsTextMeasured(false);
      // Ne pas appeler resetScrolling ici car cela peut causer une boucle
      // Le reset sera géré par d'autres effets si nécessaire
    }
  }, [scriptId]); // Seulement scriptId comme dépendance

  // Effet pour gérer les changements d'état de pause et d'enregistrement
  useEffect(() => {
    // Gérer les changements de pause
    if (isPaused !== prevIsPausedRef.current) {
      if (isPaused && !prevIsPausedRef.current) {
        scrollHandlers.stopScrolling();
      } else if (
        !isPaused &&
        prevIsPausedRef.current &&
        !isTouchPaused &&
        !isResetting
      ) {
        setTimeout(() => {
          if (!isResetting) {
            scrollHandlers.startScrolling();
          }
        }, 50);
      }

      prevIsPausedRef.current = isPaused;
    }

    // Gérer les changements d'enregistrement
    if (isRecording !== prevIsRecordingRef.current) {
      if (isRecording && !prevIsRecordingRef.current) {
        scrollAnimation.setValue(scrollingState.startPosition);
      } else if (!isRecording && prevIsRecordingRef.current) {
        scrollHandlers.stopScrolling();
        setIsTouchPaused(false);
        setIsResetting(false);
      }

      prevIsRecordingRef.current = isRecording;
    }
  }, [
    isPaused,
    isRecording,
    isTouchPaused,
    isResetting,
    scrollingState.startPosition,
  ]);

  // Gérer le défilement automatique
  useEffect(() => {
    const shouldScroll =
      isRecording &&
      !isPaused &&
      !isTouchPaused &&
      !isResetting &&
      isTextMeasured &&
      textHeight > 0 &&
      isScreenFocused;
    const shouldStop =
      !isRecording ||
      isPaused ||
      isTouchPaused ||
      isResetting ||
      !isScreenFocused;

    const logKey = `${shouldScroll}-${shouldStop}`;
    const now = Date.now();

    if (
      !useTeleprompterEffects.lastLogTime ||
      now - useTeleprompterEffects.lastLogTime > 1000 ||
      useTeleprompterEffects.lastLogKey !== logKey
    ) {
      // Log détaillé pour diagnostiquer le problème
      if (!isTextMeasured || textHeight <= 0) {
        // Forcer la mesure du texte si nécessaire
        if (!isTextMeasured && textHeight > 0) {
          setIsTextMeasured(true);
        }
      }

      useTeleprompterEffects.lastLogTime = now;
      useTeleprompterEffects.lastLogKey = logKey;
    }

    if (shouldStop) {
      scrollHandlers.stopScrolling();
    } else if (shouldScroll) {
      scrollHandlers.startScrolling();
    } else if (
      isRecording &&
      !isPaused &&
      !isTouchPaused &&
      !isResetting &&
      isScreenFocused
    ) {}
  }, [
    isRecording,
    isPaused,
    isTouchPaused,
    isResetting,
    isTextMeasured,
    textHeight,
    isScreenFocused,
    setIsTextMeasured,
  ]);
};

// Variables statiques pour le throttling
useTeleprompterEffects.lastLogTime = 0;
useTeleprompterEffects.lastLogKey = "";
