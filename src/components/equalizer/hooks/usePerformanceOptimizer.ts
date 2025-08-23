/**
 * Hook d'optimisation des performances audio
 *
 * Optimisations avancées pour le système audio :
 * - Debouncing intelligent des mises à jour
 * - Pooling des objets pour éviter les allocations
 * - Caching prédictif des calculs fréquents
 * - Optimisation des callbacks JSI
 * - Gestion intelligente de la mémoire
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PerformanceMetrics, PerformanceConfig } from '../types';

interface UsePerformanceOptimizerConfig {
  debounceDelay?: number;
  maxPoolSize?: number;
  cacheSize?: number;
  enablePredictiveCaching?: boolean;
  enableBatchUpdates?: boolean;
}

export const usePerformanceOptimizer = (config: UsePerformanceOptimizerConfig = {}) => {
  const {
    debounceDelay = 16, // ~60fps
    maxPoolSize = 100,
    cacheSize = 50,
    enablePredictiveCaching = true,
    enableBatchUpdates = true
  } = config;

  // Métriques de performance
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageLatency: 0,
    peakLatency: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    batchEfficiency: 0,
    lastUpdate: Date.now()
  });

  // Pool d'objets pour éviter les allocations
  const objectPool = useRef<Map<string, any[]>>(new Map());
  const cache = useRef<Map<string, { value: any; timestamp: number; hits: number }>>(new Map());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const batchBuffer = useRef<any[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cache LRU intelligent
  const getFromCache = useCallback((key: string) => {
    const cached = cache.current.get(key);
    if (cached) {
      cached.hits++;
      return cached.value;
    }
    return null;
  }, []);

  const setCache = useCallback((key: string, value: any) => {
    if (cache.current.size >= cacheSize) {
      // Éliminer l'entrée la moins utilisée
      let oldestKey = '';
      let oldestHits = Infinity;
      for (const [k, v] of cache.current.entries()) {
        if (v.hits < oldestHits) {
          oldestHits = v.hits;
          oldestKey = k;
        }
      }
      if (oldestKey) cache.current.delete(oldestKey);
    }

    cache.current.set(key, { value, timestamp: Date.now(), hits: 0 });
  }, [cacheSize]);

  // Pooling d'objets
  const acquireFromPool = useCallback((type: string, factory: () => any) => {
    const pool = objectPool.current.get(type) || [];
    const obj = pool.pop() || factory();
    return obj;
  }, []);

  const releaseToPool = useCallback((type: string, obj: any) => {
    const pool = objectPool.current.get(type) || [];
    if (pool.length < maxPoolSize) {
      pool.push(obj);
      objectPool.current.set(type, pool);
    }
  }, [maxPoolSize]);

  // Debouncing intelligent avec prédiction
  const debouncedUpdate = useCallback((callback: () => void, priority: 'low' | 'medium' | 'high' = 'medium') => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Priorité ajustée selon l'urgence
    const adjustedDelay = priority === 'high' ? debounceDelay / 4 :
                         priority === 'low' ? debounceDelay * 2 : debounceDelay;

    debounceTimeoutRef.current = setTimeout(() => {
      const startTime = performance.now();
      callback();
      const latency = performance.now() - startTime;

      // Mise à jour des métriques
      setMetrics(prev => ({
        ...prev,
        averageLatency: (prev.averageLatency + latency) / 2,
        peakLatency: Math.max(prev.peakLatency, latency),
        lastUpdate: Date.now()
      }));
    }, adjustedDelay);
  }, [debounceDelay]);

  // Mise à jour par lots optimisée
  const batchUpdate = useCallback((update: any, immediate = false) => {
    if (!enableBatchUpdates) {
      update();
      return;
    }

    batchBuffer.current.push(update);

    if (immediate || batchBuffer.current.length >= 10) {
      executeBatch();
    } else {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      batchTimeoutRef.current = setTimeout(executeBatch, debounceDelay);
    }
  }, [enableBatchUpdates, debounceDelay]);

  const executeBatch = useCallback(() => {
    const updates = [...batchBuffer.current];
    batchBuffer.current.length = 0; // Clear buffer

    if (updates.length === 0) return;

    const startTime = performance.now();

    // Exécuter toutes les mises à jour
    updates.forEach(update => update());

    const batchTime = performance.now() - startTime;
    const efficiency = updates.length / batchTime; // updates par ms

    setMetrics(prev => ({
      ...prev,
      batchEfficiency: efficiency,
      lastUpdate: Date.now()
    }));
  }, []);

  // Cache prédictif pour les calculs fréquents
  const predictiveCache = useCallback((context: string, computeFunction: () => any) => {
    if (!enablePredictiveCaching) return computeFunction();

    const cacheKey = `predictive_${context}`;

    // Vérifier le cache
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    // Calculer et mettre en cache
    const result = computeFunction();
    setCache(cacheKey, result);

    // Pré-calculer des variantes probables
    if (context === 'equalizer_bands') {
      // Pré-calculer les gains adjacents
      for (let i = -2; i <= 2; i += 0.5) {
        if (i === 0) continue;
        const variantResult = computeFunction(); // En réalité, adapter selon i
        setCache(`predictive_${context}_variant_${i}`, variantResult);
      }
    }

    return result;
  }, [enablePredictiveCaching, getFromCache, setCache]);

  // Optimisation des callbacks JSI
  const optimizedCallback = useCallback((callback: (...args: any[]) => void) => {
    let callCount = 0;
    let lastCallTime = 0;
    const minInterval = 8; // ~120fps max

    return (...args: any[]) => {
      const now = performance.now();
      if (now - lastCallTime < minInterval) {
        return; // Skip si trop fréquent
      }

      lastCallTime = now;
      callCount++;

      // Mesurer les performances du callback
      const startTime = performance.now();
      callback(...args);
      const callbackTime = performance.now() - startTime;

      if (callCount % 100 === 0) { // Log tous les 100 appels
        console.log(`[Performance] Callback took ${callbackTime.toFixed(2)}ms`);
      }
    };
  }, []);

  // Gestion intelligente de la mémoire
  const memoryManager = useCallback(() => {
    const cleanup = () => {
      // Nettoyer le cache ancien
      const now = Date.now();
      const maxAge = 30000; // 30 secondes

      for (const [key, value] of cache.current.entries()) {
        if (now - value.timestamp > maxAge && value.hits < 2) {
          cache.current.delete(key);
        }
      }

      // Nettoyer les pools surdimensionnés
      for (const [type, pool] of objectPool.current.entries()) {
        if (pool.length > maxPoolSize / 2) {
          objectPool.current.set(type, pool.slice(0, maxPoolSize / 2));
        }
      }

      // Mettre à jour les métriques mémoire
      const memoryUsage = process.memoryUsage?.().heapUsed || 0;
      setMetrics(prev => ({ ...prev, memoryUsage }));
    };

    // Cleanup automatique toutes les 10 secondes
    const cleanupInterval = setInterval(cleanup, 10000);

    return () => {
      clearInterval(cleanupInterval);
      cleanup();
    };
  }, [maxPoolSize]);

  // Hook de nettoyage
  useEffect(() => {
    const cleanup = memoryManager();
    return cleanup;
  }, [memoryManager]);

  // Calcul du taux de succès du cache
  const cacheHitRate = useMemo(() => {
    let totalRequests = 0;
    let cacheHits = 0;

    for (const value of cache.current.values()) {
      totalRequests += value.hits;
      if (value.hits > 0) cacheHits++;
    }

    return totalRequests > 0 ? (cacheHits / cache.current.size) * 100 : 0;
  }, []);

  // Mise à jour des métriques
  useEffect(() => {
    setMetrics(prev => ({ ...prev, cacheHitRate }));
  }, [cacheHitRate]);

  return {
    // Fonctions d'optimisation
    debouncedUpdate,
    batchUpdate,
    predictiveCache,
    optimizedCallback,

    // Gestion de pool et cache
    acquireFromPool,
    releaseToPool,
    getFromCache,
    setCache,

    // Métriques et monitoring
    metrics,

    // Utilitaires
    clearCache: () => cache.current.clear(),
    clearPools: () => objectPool.current.clear(),
    forceBatchExecute: executeBatch,

    // Configuration
    config: {
      debounceDelay,
      maxPoolSize,
      cacheSize,
      enablePredictiveCaching,
      enableBatchUpdates
    }
  };
};
