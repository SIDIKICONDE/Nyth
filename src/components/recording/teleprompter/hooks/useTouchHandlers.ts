import { useCallback } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";

interface UseTouchHandlersProps {
  isRecording: boolean;
  isPaused: boolean;
  isTouchPaused: boolean;
  isResetting: boolean;
  setIsTouchPaused: (value: boolean) => void;
  scrollHandlers: {
    stopScrolling: () => void;
    startScrolling: () => void;
  };
}

export const useTouchHandlers = ({
  isRecording,
  isPaused,
  isTouchPaused,
  isResetting,
  setIsTouchPaused,
  scrollHandlers,
}: UseTouchHandlersProps) => {
  const { t } = useTranslation();

  // NOUVELLE FONCTION TOGGLE - Intelligence automatique
  const handleTogglePause = useCallback(() => {
    // Vérifications de sécurité
    if (!isRecording) {
      return;
    }

    if (isPaused) {
      return;
    }

    if (isResetting) {
      return;
    }

    // LOGIQUE TOGGLE INTELLIGENTE
    if (isTouchPaused) {
      setIsTouchPaused(false);

      setTimeout(() => {
        if (!isResetting && !isPaused) {
          scrollHandlers.startScrolling();
        }
      }, 50);
    } else {
      setIsTouchPaused(true);
      scrollHandlers.stopScrolling();
    }
  }, [
    isRecording,
    isPaused,
    isTouchPaused,
    isResetting,
    setIsTouchPaused,
    scrollHandlers,
  ]);

  // ANCIENNES FONCTIONS (pour compatibilité)
  const handlePauseScroll = useCallback(() => {
    // Ne pausez le défilement que si l'enregistrement est en cours et n'est pas déjà en pause
    if (isRecording && !isPaused) {
      setIsTouchPaused(true);
      scrollHandlers.stopScrolling();
    } else {}
  }, [isRecording, isPaused, setIsTouchPaused, scrollHandlers, t]);

  const handleResumeScroll = useCallback(() => {
    // Ne reprenez le défilement que si toutes les conditions sont réunies
    if (isRecording && !isPaused && isTouchPaused && !isResetting) {
      setIsTouchPaused(false);

      setTimeout(() => {
        if (!isResetting) {
          scrollHandlers.startScrolling();
        } else {}
      }, 50);
    } else {}
  }, [
    isRecording,
    isPaused,
    isTouchPaused,
    isResetting,
    setIsTouchPaused,
    scrollHandlers,
    t,
  ]);

  return {
    handleTogglePause, // 🆕 NOUVELLE fonction intelligente
    handlePauseScroll, // Ancienne (pour hold)
    handleResumeScroll, // Ancienne (pour fin de hold)
  };
};
