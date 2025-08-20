import { useState, useCallback, useRef } from "react";
import { createLogger } from "@/utils/optimizedLogger";

const logger = createLogger("useRecordingLogic");

interface UseRecordingLogicProps {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onRecordingError?: (error: Error) => void;
}

export function useRecordingLogic({
  onRecordingStart,
  onRecordingStop,
  onRecordingError
}: UseRecordingLogicProps = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Timer pour suivre la durée d'enregistrement
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(() => {
    logger.info("Démarrage enregistrement depuis hook");
    setIsRecording(true);
    setRecordingDuration(0);

    // Nettoyer tout timer existant avant d'en créer un nouveau
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Démarrer le timer de durée
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);

    onRecordingStart?.();
  }, [onRecordingStart]);

  const stopRecording = useCallback(() => {
    logger.info("Arrêt enregistrement depuis hook");
    setIsRecording(false);

    // Arrêter le timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    onRecordingStop?.();
  }, [onRecordingStop]);

  const handleRecordingError = useCallback(
    (error: Error) => {
      logger.error("Erreur d'enregistrement", error);
      setIsRecording(false);

      // Arrêter le timer en cas d'erreur
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      onRecordingError?.(error);
    },
    [onRecordingError]
  );

  // Nettoyage au démontage
  const cleanup = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    handleRecordingError,
    cleanup,
  };
}
