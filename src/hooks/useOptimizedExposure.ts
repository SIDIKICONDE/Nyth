import { useCallback, useRef, useState, useEffect } from "react";

// Fonction debounce simple sans dépendance externe
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

interface UseOptimizedExposureProps {
  onExposureChange: (exposure: number) => Promise<void> | void;
  debounceMs?: number;
  minExposure?: number;
  maxExposure?: number;
  step?: number;
}

interface UseOptimizedExposureReturn {
  currentExposure: number;
  isAdjusting: boolean;
  setExposure: (exposure: number) => void;
  resetExposure: () => void;
  increaseExposure: () => void;
  decreaseExposure: () => void;
}

export const useOptimizedExposure = ({
  onExposureChange,
  debounceMs = 100, // 100ms de debounce par défaut
  minExposure = -2,
  maxExposure = 2,
  step = 0.1,
}: UseOptimizedExposureProps): UseOptimizedExposureReturn => {
  const [currentExposure, setCurrentExposure] = useState(0);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const lastAppliedExposure = useRef(0);

  // Fonction debounce pour les appels d'exposition
  const debouncedExposureChange = useCallback(
    debounce(async (exposure: number) => {
      try {
        setIsAdjusting(true);
        await onExposureChange(exposure);
        lastAppliedExposure.current = exposure;
      } catch (error) {} finally {
        setIsAdjusting(false);
      }
    }, debounceMs),
    [onExposureChange, debounceMs]
  );

  // Fonction pour définir l'exposition avec validation
  const setExposure = useCallback(
    (exposure: number) => {
      // Valider et contraindre la valeur
      const clampedExposure = Math.max(
        minExposure,
        Math.min(maxExposure, exposure)
      );

      // Mettre à jour l'état local immédiatement pour une réactivité visuelle
      setCurrentExposure(clampedExposure);

      // Appliquer le changement avec debounce
      debouncedExposureChange(clampedExposure);
    },
    [minExposure, maxExposure, debouncedExposureChange]
  );

  // Fonctions utilitaires
  const resetExposure = useCallback(() => {
    setExposure(0);
  }, [setExposure]);

  const increaseExposure = useCallback(() => {
    setExposure(Math.min(maxExposure, currentExposure + step));
  }, [setExposure, maxExposure, currentExposure, step]);

  const decreaseExposure = useCallback(() => {
    setExposure(Math.max(minExposure, currentExposure - step));
  }, [setExposure, minExposure, currentExposure, step]);

  // Nettoyer le debounce au démontage
  useEffect(() => {
    return () => {
      debouncedExposureChange.cancel();
    };
  }, [debouncedExposureChange]);

  return {
    currentExposure,
    isAdjusting,
    setExposure,
    resetExposure,
    increaseExposure,
    decreaseExposure,
  };
};
