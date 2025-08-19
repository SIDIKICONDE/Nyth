import { useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { createLogger } from "@/utils/optimizedLogger";
import { useTranslation } from "@/hooks/useTranslation";

const logger = createLogger("useErrorRecovery");

interface ErrorRecoveryState {
  error: Error | null;
  isRecovering: boolean;
  retryCount: number;
  lastErrorTime: number;
  errorHistory: Array<{
    error: Error;
    timestamp: number;
    recovered: boolean;
  }>;
}

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  autoRecovery?: boolean;
  onError?: (error: Error) => void;
  onRecovered?: () => void;
}

export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const { t } = useTranslation();
  const {
    maxRetries = 3,
    retryDelay = 2000,
    autoRecovery = true,
    onError,
    onRecovered,
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRecovering: false,
    retryCount: 0,
    lastErrorTime: 0,
    errorHistory: [],
  });

  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Analyser la sévérité de l'erreur
  const analyzeError = useCallback((error: Error) => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";

    // Erreurs critiques (non récupérables)
    if (
      message.includes("memory") ||
      message.includes("out of bounds") ||
      message.includes("segmentation fault") ||
      stack.includes("native crash")
    ) {
      return { severity: "critical", recoverable: false };
    }

    // Erreurs de permissions (récupérables avec action utilisateur)
    if (
      message.includes("permission") ||
      message.includes("unauthorized") ||
      message.includes("access denied")
    ) {
      return { severity: "high", recoverable: true };
    }

    // Erreurs de caméra (récupérables)
    if (
      message.includes("camera") ||
      message.includes("capture") ||
      message.includes("recording") ||
      message.includes("device")
    ) {
      return { severity: "high", recoverable: true };
    }

    // Erreurs réseau (récupérables)
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("connection") ||
      message.includes("fetch")
    ) {
      return { severity: "medium", recoverable: true };
    }

    // Erreurs de données (récupérables)
    if (
      message.includes("script") ||
      message.includes("settings") ||
      message.includes("storage") ||
      message.includes("parse")
    ) {
      return { severity: "medium", recoverable: true };
    }

    // Erreurs génériques (récupérables)
    return { severity: "low", recoverable: true };
  }, []);

  // Afficher une alerte pour les erreurs critiques
  const showCriticalErrorAlert = useCallback(
    (_error: Error) => {
      Alert.alert(
        t("recording.error.critical.title", "Erreur Critique"),
        t(
          "recording.error.critical.message",
          "Une erreur critique s'est produite. L'application doit être redémarrée."
        ),
        [
          {
            text: t("common.ok", "OK"),
            style: "default",
          },
        ]
      );
    },
    [t]
  );

  // Tentative de récupération automatique
  const attemptRecovery = useCallback(
    (error: Error, analysis: { severity: string; recoverable: boolean }) => {
      if (state.isRecovering) return;

      setState((prevState) => ({
        ...prevState,
        isRecovering: true,
      }));

      logger.info(
        `Tentative de récupération automatique (${
          state.retryCount + 1
        }/${maxRetries})`,
        {
          error: error.message,
          severity: analysis.severity,
        }
      );

      // Nettoyer le timeout précédent
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }

      // Calculer le délai de récupération (backoff exponentiel)
      const delay = retryDelay * Math.pow(2, state.retryCount);

      recoveryTimeoutRef.current = setTimeout(() => {
        setState((prevState) => ({
          ...prevState,
          error: null,
          isRecovering: false,
          retryCount: prevState.retryCount + 1,
          errorHistory: prevState.errorHistory.map((entry, index) =>
            index === prevState.errorHistory.length - 1
              ? { ...entry, recovered: true }
              : entry
          ),
        }));

        logger.info("Récupération automatique effectuée");
        onRecovered?.();
      }, delay);
    },
    [state.isRecovering, state.retryCount, maxRetries, retryDelay, onRecovered]
  );

  // Capturer et traiter une erreur
  const captureError = useCallback(
    (error: Error, context?: string) => {
      const now = Date.now();
      const analysis = analyzeError(error);

      logger.error(`Erreur capturée${context ? ` dans ${context}` : ""}`, {
        message: error.message,
        stack: error.stack,
        severity: analysis.severity,
        recoverable: analysis.recoverable,
        retryCount: state.retryCount,
        timeSinceLastError: now - state.lastErrorTime,
      });

      // Ajouter à l'historique
      const newHistoryEntry = {
        error,
        timestamp: now,
        recovered: false,
      };

      setState((prevState) => ({
        ...prevState,
        error,
        lastErrorTime: now,
        errorHistory: [...prevState.errorHistory.slice(-9), newHistoryEntry], // Garder les 10 dernières erreurs
      }));

      // Notifier le callback d'erreur
      onError?.(error);

      // Tenter une récupération automatique si applicable
      if (
        autoRecovery &&
        analysis.recoverable &&
        state.retryCount < maxRetries
      ) {
        attemptRecovery(error, analysis);
      } else if (!analysis.recoverable) {
        // Erreur critique - afficher une alerte
        showCriticalErrorAlert(error);
      }
    },
    [
      state.retryCount,
      state.lastErrorTime,
      maxRetries,
      autoRecovery,
      analyzeError,
      onError,
      attemptRecovery,
      showCriticalErrorAlert,
    ]
  );

  // Récupération manuelle
  const manualRecovery = useCallback(() => {
    logger.info("Récupération manuelle initiée");

    // Nettoyer le timeout de récupération
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current);
    }

    setState((prevState) => ({
      ...prevState,
      error: null,
      isRecovering: false,
      retryCount: 0, // Reset pour les récupérations manuelles
      errorHistory: prevState.errorHistory.map((entry, index) =>
        index === prevState.errorHistory.length - 1
          ? { ...entry, recovered: true }
          : entry
      ),
    }));

    onRecovered?.();
  }, [onRecovered]);

  // Reset complet de l'état d'erreur
  const resetErrorState = useCallback(() => {
    logger.info("Reset complet de l'état d'erreur");

    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current);
    }

    setState({
      error: null,
      isRecovering: false,
      retryCount: 0,
      lastErrorTime: 0,
      errorHistory: [],
    });
  }, []);

  // Wrapper pour les fonctions async avec gestion d'erreurs
  const safeExecute = useCallback(
    async <T>(
      fn: () => Promise<T>,
      context?: string,
      fallback?: T
    ): Promise<T | undefined> => {
      try {
        return await fn();
      } catch (error) {
        captureError(error as Error, context);
        return fallback;
      }
    },
    [captureError]
  );

  // Wrapper pour les fonctions sync avec gestion d'erreurs
  const safeExecuteSync = useCallback(
    <T>(fn: () => T, context?: string, fallback?: T): T | undefined => {
      try {
        return fn();
      } catch (error) {
        captureError(error as Error, context);
        return fallback;
      }
    },
    [captureError]
  );

  // Vérifier si on peut encore récupérer
  const canRecover =
    state.retryCount < maxRetries && state.error && !state.isRecovering;

  // Statistiques d'erreurs
  const errorStats = {
    totalErrors: state.errorHistory.length,
    recoveredErrors: state.errorHistory.filter((e) => e.recovered).length,
    successRate:
      state.errorHistory.length > 0
        ? (state.errorHistory.filter((e) => e.recovered).length /
            state.errorHistory.length) *
          100
        : 100,
    lastErrorTime: state.lastErrorTime,
  };

  return {
    // État
    error: state.error,
    isRecovering: state.isRecovering,
    retryCount: state.retryCount,
    errorHistory: state.errorHistory,
    canRecover,
    errorStats,

    // Actions
    captureError,
    manualRecovery,
    resetErrorState,
    safeExecute,
    safeExecuteSync,
  };
}
