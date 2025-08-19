import { useState, useRef, useCallback, useEffect } from "react";
import { RecordingState, TeleprompterState } from "../types";
import { 
  DEFAULT_TELEPROMPTER_SETTINGS, 
  DEFAULT_SCROLL_SPEED, 
  DEFAULT_BACKGROUND_OPACITY,
  RECORDING_TIMER_INTERVAL 
} from "../constants";
import { TeleprompterSettings } from "@/components/recording/teleprompter/types";
import { Script, RecordingSettings } from "@/types";
import { createLogger } from "@/utils/optimizedLogger";

const logger = createLogger("useRecordingState");

export function useRecordingState() {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>({
    script: null,
    settings: null,
    isLoading: true,
    error: null,
    isRecording: false,
    recordingDuration: 0,
  });

  // Teleprompter state
  const [teleprompterState, setTeleprompterState] = useState<TeleprompterState>({
    showSettingsModal: false,
    customSettings: DEFAULT_TELEPROMPTER_SETTINGS,
    scrollSpeed: DEFAULT_SCROLL_SPEED,
    backgroundOpacity: DEFAULT_BACKGROUND_OPACITY,
  });

  // Timer ref
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update functions
  const updateRecordingState = useCallback((updates: Partial<RecordingState>) => {
    setRecordingState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateTeleprompterState = useCallback((updates: Partial<TeleprompterState>) => {
    setTeleprompterState(prev => ({ ...prev, ...updates }));
  }, []);

  // Recording timer management
  const startRecordingTimer = useCallback(() => {
    // Clear any existing timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Reset duration and start timer
    updateRecordingState({ recordingDuration: 0 });
    
    recordingTimerRef.current = setInterval(() => {
      setRecordingState(prev => ({ 
        ...prev, 
        recordingDuration: prev.recordingDuration + 1 
      }));
    }, RECORDING_TIMER_INTERVAL);

    logger.info("Recording timer started");
  }, [updateRecordingState]);

  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      logger.info("Recording timer stopped");
    }
  }, []);

  // Specific setters
  const setScript = useCallback((script: Script | null) => {
    updateRecordingState({ script });
  }, [updateRecordingState]);

  const setSettings = useCallback((settings: RecordingSettings | null) => {
    updateRecordingState({ settings });
  }, [updateRecordingState]);

  const setIsLoading = useCallback((isLoading: boolean) => {
    updateRecordingState({ isLoading });
  }, [updateRecordingState]);

  const setError = useCallback((error: string | null) => {
    updateRecordingState({ error });
  }, [updateRecordingState]);

  const setIsRecording = useCallback((isRecording: boolean) => {
    updateRecordingState({ isRecording });
    
    if (isRecording) {
      startRecordingTimer();
    } else {
      stopRecordingTimer();
    }
  }, [updateRecordingState, startRecordingTimer, stopRecordingTimer]);

  const setShowSettingsModal = useCallback((show: boolean) => {
    updateTeleprompterState({ showSettingsModal: show });
  }, [updateTeleprompterState]);

  const setCustomTeleprompterSettings = useCallback((settings: Partial<TeleprompterSettings>) => {
    updateTeleprompterState({ customSettings: settings });
  }, [updateTeleprompterState]);

  const setScrollSpeed = useCallback((speed: number) => {
    updateTeleprompterState({ scrollSpeed: speed });
  }, [updateTeleprompterState]);

  const setBackgroundOpacity = useCallback((opacity: number) => {
    updateTeleprompterState({ backgroundOpacity: opacity });
  }, [updateTeleprompterState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingTimer();
    };
  }, [stopRecordingTimer]);

  return {
    // States
    ...recordingState,
    ...teleprompterState,
    
    // Update functions
    setScript,
    setSettings,
    setIsLoading,
    setError,
    setIsRecording,
    setShowSettingsModal,
    setCustomTeleprompterSettings,
    setScrollSpeed,
    setBackgroundOpacity,
    
    // Timer management
    recordingTimerRef,
  };
}