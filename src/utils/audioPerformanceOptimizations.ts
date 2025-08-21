/**
 * Utilitaires d'optimisation des performances audio
 * Ce fichier centralise les meilleures pratiques pour optimiser le traitement audio
 */

import { useRef, useCallback, useMemo, useEffect } from 'react';

/**
 * Debounce optimisé pour les mises à jour audio
 * Évite les mises à jour trop fréquentes qui peuvent causer des problèmes de performance
 */
export const useAudioDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 50
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Mettre à jour la référence du callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Hook pour batching des mises à jour audio
 * Regroupe plusieurs mises à jour pour les exécuter en une seule fois
 */
export const useAudioBatch = <T>(
  executor: (batch: T[]) => Promise<void>,
  batchDelay: number = 16 // ~60fps
) => {
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addToBatch = useCallback((item: T) => {
    batchRef.current.push(item);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (batchRef.current.length > 0) {
        const batch = [...batchRef.current];
        batchRef.current = [];
        await executor(batch);
      }
    }, batchDelay);
  }, [executor, batchDelay]);

  // Forcer l'exécution immédiate du batch
  const flushBatch = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (batchRef.current.length > 0) {
      const batch = [...batchRef.current];
      batchRef.current = [];
      await executor(batch);
    }
  }, [executor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { addToBatch, flushBatch };
};

/**
 * Hook pour throttling des mises à jour audio
 * Limite le nombre de mises à jour par seconde
 */
export const useAudioThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 60 // Updates par seconde
): T => {
  const lastRunRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Mettre à jour la référence du callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;
      const delay = 1000 / limit;

      if (timeSinceLastRun >= delay) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [limit]
  ) as T;

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

/**
 * Cache optimisé pour les calculs audio coûteux
 */
export class AudioComputationCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttlMs: number = 5000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: K, value: V): void {
    // Éviction LRU si la taille max est atteinte
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Pool d'objets réutilisables pour éviter les allocations fréquentes
 */
export class AudioObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pré-allouer des objets
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool = [];
  }
}

/**
 * Utilitaire pour mesurer les performances des opérations audio
 */
export class AudioPerformanceMonitor {
  private measurements = new Map<string, number[]>();
  private maxSamples: number;

  constructor(maxSamples: number = 100) {
    this.maxSamples = maxSamples;
  }

  startMeasure(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMeasurement(label, duration);
    };
  }

  recordMeasurement(label: string, duration: number): void {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }

    const samples = this.measurements.get(label)!;
    samples.push(duration);

    // Garder seulement les derniers échantillons
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  getStats(label: string): { avg: number; min: number; max: number; p95: number } | null {
    const samples = this.measurements.get(label);
    if (!samples || samples.length === 0) return null;

    const sorted = [...samples].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[p95Index]
    };
  }

  clear(label?: string): void {
    if (label) {
      this.measurements.delete(label);
    } else {
      this.measurements.clear();
    }
  }
}

/**
 * Hook pour optimiser les re-renders basés sur les changements audio
 */
export const useAudioMemo = <T>(
  factory: () => T,
  deps: any[],
  threshold: number = 0.001
): T => {
  const prevDepsRef = useRef<any[]>();
  const prevResultRef = useRef<T>();

  return useMemo(() => {
    if (!prevDepsRef.current) {
      prevDepsRef.current = deps;
      prevResultRef.current = factory();
      return prevResultRef.current;
    }

    // Vérifier si les dépendances ont changé significativement
    const hasSignificantChange = deps.some((dep, index) => {
      const prevDep = prevDepsRef.current![index];
      
      // Pour les nombres, vérifier le seuil
      if (typeof dep === 'number' && typeof prevDep === 'number') {
        return Math.abs(dep - prevDep) > threshold;
      }
      
      // Pour le reste, comparaison stricte
      return dep !== prevDep;
    });

    if (hasSignificantChange) {
      prevDepsRef.current = deps;
      prevResultRef.current = factory();
    }

    return prevResultRef.current!;
  }, deps);
};

/**
 * Hook pour utiliser requestAnimationFrame avec les mises à jour audio
 */
export const useAudioAnimationFrame = (callback: (deltaTime: number) => void) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const callbackRef = useRef(callback);

  // Mettre à jour la référence du callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callbackRef.current(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);

  const pause = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
      previousTimeRef.current = undefined;
    }
  }, []);

  const resume = useCallback(() => {
    if (!requestRef.current) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  return { pause, resume };
};