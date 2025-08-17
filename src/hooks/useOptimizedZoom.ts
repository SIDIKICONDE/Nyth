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

interface UseOptimizedZoomProps {
  onZoomChange: (zoom: number) => Promise<void> | void;
  debounceMs?: number;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
}

interface UseOptimizedZoomReturn {
  currentZoom: number;
  isZooming: boolean;
  setZoom: (zoom: number) => void;
  resetZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export const useOptimizedZoom = ({
  onZoomChange,
  debounceMs = 100, // 100ms de debounce par défaut
  minZoom = 1,
  maxZoom = 10,
  step = 0.5,
}: UseOptimizedZoomProps): UseOptimizedZoomReturn => {
  const [currentZoom, setCurrentZoom] = useState(minZoom);
  const [isZooming, setIsZooming] = useState(false);
  const lastAppliedZoom = useRef(minZoom);

  // Fonction debounce pour les appels de zoom
  const debouncedZoomChange = useCallback(
    debounce(async (zoom: number) => {
      try {
        setIsZooming(true);
        await onZoomChange(zoom);
        lastAppliedZoom.current = zoom;
      } catch (error) {} finally {
        setIsZooming(false);
      }
    }, debounceMs),
    [onZoomChange, debounceMs]
  );

  // Fonction pour définir le zoom avec validation
  const setZoom = useCallback(
    (zoom: number) => {
      // Valider et contraindre la valeur
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));

      // Mettre à jour l'état local immédiatement pour une réactivité visuelle
      setCurrentZoom(clampedZoom);

      // Appliquer le changement avec debounce
      debouncedZoomChange(clampedZoom);
    },
    [minZoom, maxZoom, debouncedZoomChange]
  );

  // Fonctions utilitaires
  const resetZoom = useCallback(() => {
    setZoom(minZoom);
  }, [setZoom, minZoom]);

  const zoomIn = useCallback(() => {
    setZoom(Math.min(maxZoom, currentZoom + step));
  }, [setZoom, maxZoom, currentZoom, step]);

  const zoomOut = useCallback(() => {
    setZoom(Math.max(minZoom, currentZoom - step));
  }, [setZoom, minZoom, currentZoom, step]);

  // Nettoyer le debounce au démontage
  useEffect(() => {
    return () => {
      debouncedZoomChange.cancel();
    };
  }, [debouncedZoomChange]);

  return {
    currentZoom,
    isZooming,
    setZoom,
    resetZoom,
    zoomIn,
    zoomOut,
  };
};
