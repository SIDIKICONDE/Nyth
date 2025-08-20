import { useCallback } from 'react';
import { Animated } from 'react-native';
import { useTranslation } from '../../../../hooks/useTranslation';

interface UseDoubleTapHandlerProps {
  doubleTapCountRef: React.MutableRefObject<number>;
  currentScrollPositionRef: React.MutableRefObject<number>;
  setShowResetIndicator: (value: boolean) => void;
  setIsResetting: (value: boolean) => void;
  scrollHandlers: {
    stopScrolling: () => void;
    resetScrolling: () => void;
    startScrolling: () => void;
  };
  scrollAnimation: Animated.Value;
  isRecording: boolean;
  isPaused: boolean;
}

export const useDoubleTapHandler = ({
  doubleTapCountRef,
  currentScrollPositionRef,
  setShowResetIndicator,
  setIsResetting,
  scrollHandlers,
  scrollAnimation,
  isRecording,
  isPaused,
}: UseDoubleTapHandlerProps) => {
  const { t } = useTranslation();

  const handleDoubleTap = useCallback(() => {
    doubleTapCountRef.current++;

    // Afficher l'indicateur visuel de réinitialisation
    setShowResetIndicator(true);

    // Activer le flag de réinitialisation pour bloquer tout défilement
    setIsResetting(true);

    // Arrêter immédiatement toute animation en cours
    if (scrollHandlers.stopScrolling) {
      scrollHandlers.stopScrolling();
    }

    try {
      // 1. Utiliser resetScrolling
      if (scrollHandlers.resetScrolling) {
        scrollHandlers.resetScrolling();
      }

      // 2. Définir explicitement la position à 0
      scrollAnimation.setValue(0);
      setTimeout(() => {
        scrollAnimation.setValue(0);
      }, 10);

      // 3. Arrêter l'animation et définir la position
      scrollAnimation.stopAnimation(() => {
        scrollAnimation.setValue(0);
      });
    } catch (error) {}

    // Désactiver le flag de réinitialisation après un délai
    setTimeout(() => {
      setIsResetting(false);
      
      // Masquer l'indicateur visuel après un délai supplémentaire
      setTimeout(() => {
        setShowResetIndicator(false);
      }, 1000);
      
      // Si l'enregistrement est en cours et n'est pas en pause, redémarrer le défilement
      if (isRecording && !isPaused) {
        if (scrollHandlers.startScrolling) {
          setTimeout(() => {
            // Vérifier une dernière fois que la position est à 0
            if (currentScrollPositionRef.current !== 0) {
              scrollAnimation.setValue(0);
            }
            scrollHandlers.startScrolling();
          }, 150);
        }
      }
    }, 100);
  }, [
    doubleTapCountRef,
    currentScrollPositionRef,
    setShowResetIndicator,
    setIsResetting,
    scrollHandlers,
    scrollAnimation,
    isRecording,
    isPaused,
    t
  ]);

  return { handleDoubleTap };
}; 