/**
 * Hook Égaliseur Ultra-Optimisé
 *
 * Version optimisée avec :
 * - Cache prédictif des calculs
 * - Pooling des objets
 * - Debouncing intelligent
 * - Batch updates
 * - Callbacks JSI optimisés
 * - Gestion mémoire intelligente
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { BandConfig, EqualizerConfig, FilterType } from '../types';
import NativeAudioCoreModule from '../../../../specs/NativeAudioCoreModule';
import { usePerformanceOptimizer } from './usePerformanceOptimizer';

// Fréquences par défaut pour un égaliseur 10 bandes
const DEFAULT_FREQUENCIES = [
  31.25,   // Sub-bass
  62.5,    // Bass
  125.0,   // Low-mid
  250.0,   // Mid
  500.0,   // Mid
  1000.0,  // Mid-high
  2000.0,  // High-mid
  4000.0,  // Presence
  8000.0,  // Brilliance
  16000.0  // Air
];

export const useEqualizerOptimized = (numBands: number = 10, sampleRate: number = 48000) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [masterGain, setMasterGain] = useState(0);
  const [bands, setBands] = useState<BandConfig[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const equalizerIdRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<Map<number, number>>(new Map());

  // Optimiseur de performance
  const {
    debouncedUpdate,
    batchUpdate,
    predictiveCache,
    optimizedCallback,
    acquireFromPool,
    releaseToPool,
    metrics
  } = usePerformanceOptimizer({
    debounceDelay: 8, // 120fps
    maxPoolSize: 50,
    cacheSize: 30,
    enablePredictiveCaching: true,
    enableBatchUpdates: true
  });

  // Cache pour les configurations de bande
  const bandConfigCache = useRef<Map<string, BandConfig>>(new Map());

  // Pool d'objets pour les configurations
  const configPool = useCallback((type: string) => ({
    acquire: () => acquireFromPool(type, () => ({
      bandIndex: 0,
      frequency: 0,
      gainDB: 0,
      q: 0.707,
      type: FilterType.PEAK,
      enabled: true
    })),
    release: (obj: any) => releaseToPool(type, obj)
  }), [acquireFromPool, releaseToPool]);

  // Cache des calculs de bande
  const computeBandConfig = useCallback((index: number, frequency: number, gain: number) => {
    return predictiveCache(`band_${index}_${frequency}_${gain}`, () => {
      const pool = configPool('bandConfig');
      const config = pool.acquire();

      config.bandIndex = index;
      config.frequency = frequency;
      config.gainDB = gain;
      config.q = 0.707;
      config.type = index === 0 ? FilterType.LOWSHELF :
                   (index === numBands - 1 ? FilterType.HIGHSHELF : FilterType.PEAK);
      config.enabled = true;

      return config;
    });
  }, [predictiveCache, configPool, numBands]);

  // Callback JSI optimisé pour les erreurs
  const errorCallback = useMemo(() => optimizedCallback((error: any) => {
    console.error('[Equalizer] Error:', error);
  }), [optimizedCallback]);

  // Callback optimisé pour les changements d'état
  const stateCallback = useMemo(() => optimizedCallback((state: any) => {
    console.log('[Equalizer] State changed:', state);
  }), [optimizedCallback]);

  // Initialisation optimisée
  useEffect(() => {
    const initEqualizer = async () => {
      try {
        if (!NativeAudioCoreModule) {
          console.error('NativeAudioCoreModule not available');
          return;
        }

        // Cache pour éviter la réinitialisation
        const cacheKey = `init_${numBands}_${sampleRate}`;
        const cachedInit = bandConfigCache.current.get(cacheKey);

        if (cachedInit) {
          setIsInitialized(true);
          setBands(cachedInit as any);
          return;
        }

        // Initialisation avec pooling
        const pool = configPool('equalizerConfig');
        const equalizerConfig = pool.acquire();
        equalizerConfig.numBands = numBands;
        equalizerConfig.sampleRate = sampleRate;
        equalizerConfig.masterGainDB = 0.0;
        equalizerConfig.bypass = false;

        const success = await NativeAudioCoreModule.initialize();
        if (!success) {
          pool.release(equalizerConfig);
          console.error('Failed to initialize core module');
          return;
        }

        const initSuccess = await NativeAudioCoreModule.equalizerInitialize(equalizerConfig);
        pool.release(equalizerConfig);

        if (!initSuccess) {
          console.error('Failed to initialize equalizer');
          return;
        }

        // Configuration des callbacks optimisés
        await NativeAudioCoreModule.setErrorCallback(errorCallback);
        await NativeAudioCoreModule.setStateCallback(stateCallback);

        // Création optimisée des bandes avec cache
        const initialBands: BandConfig[] = [];
        for (let i = 0; i < numBands; i++) {
          const frequency = DEFAULT_FREQUENCIES[i] || DEFAULT_FREQUENCIES[DEFAULT_FREQUENCIES.length - 1];
          const bandConfig = computeBandConfig(i, frequency, 0);

          await NativeAudioCoreModule.equalizerSetBand(i, bandConfig);
          initialBands.push({ ...bandConfig });

          // Cache de la configuration
          bandConfigCache.current.set(`band_${i}`, bandConfig);
        }

        // Cache de l'initialisation
        bandConfigCache.current.set(cacheKey, initialBands as any);

        setBands(initialBands);
        setIsInitialized(true);

        // Récupération de l'état avec cache
        const equalizerInfo = await NativeAudioCoreModule.equalizerGetInfo();
        setEnabled(!equalizerInfo.bypass);
        setMasterGain(equalizerInfo.masterGainDB);

      } catch (error) {
        console.error('Failed to initialize equalizer:', error);
      }
    };

    debouncedUpdate(initEqualizer, 'high');

    // Cleanup
    return () => {
      if (NativeAudioCoreModule) {
        NativeAudioCoreModule.dispose();
      }
      bandConfigCache.current.clear();
    };
  }, [numBands, sampleRate, computeBandConfig, debouncedUpdate, errorCallback, stateCallback, configPool]);

  // Modification de gain de bande ultra-optimisée
  const setBandGain = useCallback((bandIndex: number, gain: number) => {
    if (!isInitialized || !NativeAudioCoreModule || bandIndex < 0 || bandIndex >= bands.length) return;

    // Debouncing intelligent selon la priorité
    const priority = Math.abs(gain - bands[bandIndex]?.gain) > 5 ? 'high' : 'medium';

    const updateBand = async () => {
      try {
        setIsProcessing(true);

        // Limiter le gain avec cache
        const clampedGain = predictiveCache(`clamp_${gain}`, () => Math.max(-24, Math.min(24, gain)));

        // Mise à jour par lots si multiple
        const update = async () => {
          await NativeAudioCoreModule.equalizerSetBandGain(bandIndex, clampedGain);

          setBands(prevBands => {
            const newBands = [...prevBands];
            newBands[bandIndex] = { ...newBands[bandIndex], gain: clampedGain };
            return newBands;
          });
        };

        // Batch update pour les modifications multiples
        if (pendingUpdatesRef.current.size > 0) {
          batchUpdate(update);
        } else {
          await update();
        }

        // Mise à jour du cache
        const cacheKey = `band_${bandIndex}`;
        const cachedConfig = bandConfigCache.current.get(cacheKey);
        if (cachedConfig) {
          cachedConfig.gain = clampedGain;
        }

      } catch (error) {
        console.error('Failed to set band gain:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    debouncedUpdate(updateBand, priority);
  }, [isInitialized, bands, predictiveCache, batchUpdate, debouncedUpdate]);

  // Modification de gain master optimisée
  const updateMasterGain = useCallback(async (gain: number) => {
    if (!isInitialized || !NativeAudioCoreModule) return;

    const clampedGain = predictiveCache(`master_clamp_${gain}`, () => Math.max(-24, Math.min(24, gain)));

    const update = async () => {
      try {
        await NativeAudioCoreModule.equalizerSetMasterGain(clampedGain);
        setMasterGain(clampedGain);
      } catch (error) {
        console.error('Failed to set master gain:', error);
      }
    };

    debouncedUpdate(update, 'high');
  }, [isInitialized, predictiveCache, debouncedUpdate]);

  // Activation/désactivation optimisée
  const toggleEnabled = useCallback(async () => {
    if (!isInitialized || !NativeAudioCoreModule) return;

    const update = async () => {
      try {
        const newEnabled = !enabled;
        await NativeAudioCoreModule.equalizerSetBypass(!newEnabled);
        setEnabled(newEnabled);
      } catch (error) {
        console.error('Failed to toggle equalizer:', error);
      }
    };

    debouncedUpdate(update, 'high');
  }, [enabled, isInitialized, debouncedUpdate]);

  // Réinitialisation optimisée avec batch
  const resetAllBands = useCallback(async () => {
    if (!isInitialized || !NativeAudioCoreModule) return;

    const update = async () => {
      try {
        setIsProcessing(true);

        // Batch reset de toutes les bandes
        const resetPromises = bands.map((_, index) =>
          NativeAudioCoreModule.equalizerSetBandGain(index, 0)
        );

        await Promise.all(resetPromises);

        setBands(prevBands =>
          prevBands.map(band => ({ ...band, gain: 0 }))
        );

        // Reset master gain
        await updateMasterGain(0);

        // Clear cache des configurations
        bandConfigCache.current.clear();

      } catch (error) {
        console.error('Failed to reset bands:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    debouncedUpdate(update, 'medium');
  }, [isInitialized, bands, updateMasterGain, debouncedUpdate]);

  // Mise à jour par lots des gains
  const updateAllBandGains = useCallback(async (gains: number[]) => {
    if (!isInitialized || !NativeAudioCoreModule) return;

    const update = async () => {
      try {
        setIsProcessing(true);

        // Batch update avec pooling
        const updatePromises = gains.map((gain, index) => {
          if (index < bands.length) {
            const clampedGain = Math.max(-24, Math.min(24, gain));
            return NativeAudioCoreModule.equalizerSetBandGain(index, clampedGain);
          }
        }).filter(Boolean);

        await Promise.all(updatePromises);

        setBands(prevBands =>
          prevBands.map((band, index) => ({
            ...band,
            gain: index < gains.length ? Math.max(-24, Math.min(24, gains[index])) : band.gain
          }))
        );

      } catch (error) {
        console.error('Failed to update band gains:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    debouncedUpdate(update, 'high');
  }, [isInitialized, bands, debouncedUpdate]);

  // Configuration optimisée
  const getConfig = useCallback((): EqualizerConfig => {
    return predictiveCache('equalizer_config', () => ({
      numBands: bands.length,
      sampleRate,
      masterGain,
      bypass: !enabled,
      bands: [...bands]
    }));
  }, [bands, enabled, masterGain, sampleRate, predictiveCache]);

  return {
    // État
    isInitialized,
    enabled,
    masterGain,
    bands,
    isProcessing,

    // Actions optimisées
    toggleEnabled,
    setBandGain,
    updateMasterGain,
    resetAllBands,
    updateAllBandGains,
    getConfig,

    // Métriques de performance
    performanceMetrics: metrics
  };
};
