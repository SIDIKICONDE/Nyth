import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { unstable_batchedUpdates } from "react-native";

/**
 * Hook optimisé pour gérer l'état avec batching et mémoisation
 */
export function useOptimizedState<T>(
  initialValue: T | (() => T),
  options?: {
    debounceMs?: number;
    throttleMs?: number;
    deepCompare?: boolean;
    onUpdate?: (value: T) => void;
  }
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const resolveInitial = useCallback((): T => {
    return (
      typeof initialValue === "function"
        ? (initialValue as () => T)()
        : (initialValue as T)
    ) as T;
  }, [initialValue]);
  const [state, setStateRaw] = useState<T>(() => resolveInitial());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingValueRef = useRef<T | ((prev: T) => T) | undefined>(undefined);

  // Fonction de comparaison
  const isEqual = useCallback(
    (a: T, b: T): boolean => {
      if (options?.deepCompare) {
        return JSON.stringify(a) === JSON.stringify(b);
      }
      return Object.is(a, b);
    },
    [options?.deepCompare]
  );

  // Setter optimisé avec batching
  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      const updateState = (newValue: T | ((prev: T) => T)) => {
        // Vérifier si la valeur a changé
        setStateRaw((prevState) => {
          let actualNewValue: T;
          if (typeof newValue === "function") {
            const updater = newValue as (prev: T) => T;
            actualNewValue = updater(prevState);
          } else {
            actualNewValue = newValue as T;
          }

          if (isEqual(prevState, actualNewValue)) {
            return prevState; // Pas de mise à jour si identique
          }

          // Callback de mise à jour
          if (options?.onUpdate) {
            (options.onUpdate as (value: T) => void)(actualNewValue);
          }

          return actualNewValue;
        });
      };

      // Debounce
      if (options?.debounceMs) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        pendingValueRef.current = value;

        timeoutRef.current = setTimeout(() => {
          unstable_batchedUpdates(() => {
            const pending = pendingValueRef.current;
            if (pending !== undefined) {
              // Si fonction, l'appliquer, sinon utiliser la valeur
              updateState(pending as T | ((prev: T) => T));
            }
          });
        }, options.debounceMs);
        return;
      }

      // Throttle
      if (options?.throttleMs) {
        const now = Date.now();
        if (now - lastUpdateRef.current < options.throttleMs) {
          return;
        }
        lastUpdateRef.current = now;
      }

      // Mise à jour avec batching
      unstable_batchedUpdates(() => {
        updateState(value as T | ((prev: T) => T));
      });
    },
    [isEqual, options?.debounceMs, options?.throttleMs, options?.onUpdate]
  );

  // Reset function
  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStateRaw(resolveInitial());
  }, [resolveInitial]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return [state, setState, reset];
}

/**
 * Hook pour gérer plusieurs états optimisés
 */
export function useOptimizedMultiState<T extends Record<string, any>>(
  initialValues: T
): {
  values: T;
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  reset: () => void;
} {
  const [state, setState] = useOptimizedState(initialValues, {
    deepCompare: true,
  });

  const setValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setState((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [setState]
  );

  const setValues = useCallback(
    (values: Partial<T>) => {
      setState((prev) => ({
        ...prev,
        ...values,
      }));
    },
    [setState]
  );

  const reset = useCallback(() => {
    setState(initialValues);
  }, [initialValues, setState]);

  return {
    values: state,
    setValue,
    setValues,
    reset,
  };
}

/**
 * Hook pour gérer un état de chargement optimisé
 */
export function useOptimizedLoadingState(initialLoading = false): {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
} {
  const [isLoading, setIsLoading] = useOptimizedState(initialLoading);

  const startLoading = useCallback(() => setIsLoading(true), [setIsLoading]);
  const stopLoading = useCallback(() => setIsLoading(false), [setIsLoading]);

  const withLoading = useCallback(
    async <T>(promise: Promise<T>): Promise<T> => {
      startLoading();
      try {
        const result = await promise;
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
}

/**
 * Hook pour gérer un état de formulaire optimisé
 */
export function useOptimizedFormState<T extends Record<string, any>>(
  initialValues: T,
  validation?: (values: T) => Record<string, string>
): {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: string, error: string) => void;
  setTouched: (field: string) => void;
  validate: () => boolean;
  reset: () => void;
  isDirty: boolean;
  isValid: boolean;
} {
  const {
    values,
    setValue,
    setValues,
    reset: resetValues,
  } = useOptimizedMultiState(initialValues);
  const [errors, setErrors] = useOptimizedState<Record<string, string>>({});
  const [touched, setTouched] = useOptimizedState<Record<string, boolean>>({});

  const setError = useCallback(
    (field: string, error: string) => {
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    },
    [setErrors]
  );

  const setTouchedField = useCallback(
    (field: string) => {
      setTouched((prev) => ({
        ...prev,
        [field]: true,
      }));
    },
    [setTouched]
  );

  const validate = useCallback((): boolean => {
    if (!validation) return true;

    const newErrors = validation(values);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validation, setErrors]);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues]
  );

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const reset = useCallback(() => {
    resetValues();
    setErrors({});
    setTouched({});
  }, [resetValues, setErrors, setTouched]);

  return {
    values,
    errors,
    touched,
    setValue,
    setValues,
    setError,
    setTouched: setTouchedField,
    validate,
    reset,
    isDirty,
    isValid,
  };
}
