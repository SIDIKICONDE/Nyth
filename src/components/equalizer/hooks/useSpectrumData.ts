import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SpectrumData } from '../types';
import NativeAudioCoreModule from '../../../../specs/NativeAudioCoreModule';
import NativeAudioSpectrumModule from '../../../../specs/NativeAudioSpectrumModule';
import { useAudioWorker } from '../../../hooks/useAudioWorker';
import { AudioComputationCache, useAudioAnimationFrame } from '../../../utils/audioPerformanceOptimizations';

interface UseSpectrumDataOptions {
  updateInterval?: number; // ms
  smoothingFactor?: number; // 0-1
  minDecibels?: number;
  maxDecibels?: number;
  useWebWorker?: boolean; // Utiliser le Web Worker pour les calculs lourds
  precision?: 'fp32' | 'fp64';
}

// Cache pour les calculs de normalisation
const normalizationCache = new AudioComputationCache<string, number>(1000, 100);

export const useSpectrumData = (options: UseSpectrumDataOptions = {}) => {
  const {
    updateInterval = 50, // 20 FPS par défaut
    smoothingFactor = 0.8,
    minDecibels = -60,
    maxDecibels = 0,
    useWebWorker = true, // Nouvelle option pour utiliser le Web Worker
    precision = 'fp64'
  } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [spectrumData, setSpectrumData] = useState<SpectrumData>({
    magnitudes: new Array(32).fill(0),
    timestamp: Date.now()
  });
  
  const previousMagnitudesRef = useRef<number[]>(new Array(32).fill(0));
  const lastUpdateRef = useRef<number>(0);
  
  // Utiliser le Web Worker pour les calculs lourds
  const { processSpectrum, isReady: workerReady } = useAudioWorker();

  // État du module d'analyse spectrale
  const spectrumModuleReady = useRef(false);

  // Initialiser le module d'analyse spectrale
  const initializeSpectrumModule = useCallback(async () => {
    if (!NativeAudioSpectrumModule || spectrumModuleReady.current) return true;

    try {
      const config = {
        sampleRate: 48000,
        fftSize: 1024,
        hopSize: 512,
        numBands: 32,
        minFreq: 20,
        maxFreq: 20000,
        useWindowing: true,
        useSIMD: true
      };

      const success = NativeAudioSpectrumModule.initialize(config);
      if (success) {
        spectrumModuleReady.current = true;
        return true;
      } else {
        console.error('Failed to initialize spectrum module');
        return false;
      }
    } catch (error) {
      console.error('Error initializing spectrum module:', error);
      return false;
    }
  }, []);

  // Normaliser les données de magnitude (dB vers 0-1) avec cache
  const normalizeMagnitude = useCallback((magnitude: number): number => {
    // Utiliser le cache pour éviter les recalculs
    const cacheKey = `${magnitude}-${minDecibels}-${maxDecibels}`;
    const cached = normalizationCache.get(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    let result: number;
    if (magnitude <= minDecibels) {
      result = 0;
    } else if (magnitude >= maxDecibels) {
      result = 1;
    } else {
      result = (magnitude - minDecibels) / (maxDecibels - minDecibels);
    }
    
    normalizationCache.set(cacheKey, result);
    return result;
  }, [minDecibels, maxDecibels]);

  // Appliquer le lissage temporel
  const smoothMagnitudes = useCallback((newMagnitudes: number[]): number[] => {
    const previous = previousMagnitudesRef.current;
    const smoothed = newMagnitudes.map((mag, index) => {
      const prevValue = previous[index] || 0;
      // Descente plus rapide que la montée pour une meilleure réactivité
      const factor = mag > prevValue ? smoothingFactor * 0.5 : smoothingFactor;
      return prevValue * factor + mag * (1 - factor);
    });
    previousMagnitudesRef.current = smoothed;
    return smoothed;
  }, [smoothingFactor]);

  // Mettre à jour les données du spectre - optimisée avec Web Worker
  const updateSpectrum = useCallback(async () => {
    if (!isAnalyzing || !spectrumModuleReady.current) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < updateInterval) return;
    lastUpdateRef.current = now;

    try {
      // Récupérer les données spectrales du module natif
      const spectrumData = NativeAudioSpectrumModule.getSpectrumData();

      if (spectrumData && spectrumData.magnitudes && spectrumData.magnitudes.length > 0) {
        // Les données sont déjà normalisées par le module natif (0-1)
        const normalized = spectrumData.magnitudes.map(normalizeMagnitude);
        const smoothed = smoothMagnitudes(normalized);

        setSpectrumData({
          magnitudes: smoothed,
          timestamp: now
        });
      }
    } catch (error) {
      console.error('Failed to get spectrum data:', error);
    }
  }, [isAnalyzing, updateInterval, normalizeMagnitude, smoothMagnitudes, spectrumModuleReady]);

  // Utiliser notre hook optimisé pour l'animation
  const { pause: pauseAnimation, resume: resumeAnimation } = useAudioAnimationFrame(
    useCallback((deltaTime: number) => {
      if (isAnalyzing) {
        updateSpectrum();
      }
    }, [isAnalyzing, updateSpectrum])
  );

  // Démarrer l'analyse
  const startAnalysis = useCallback(async () => {
    // Initialiser le module d'analyse spectrale si nécessaire
    const moduleInitialized = await initializeSpectrumModule();
    if (!moduleInitialized) {
      console.error('Failed to initialize spectrum module');
      return;
    }

    try {
      // Démarrer l'analyse spectrale via le module natif
      const success = NativeAudioSpectrumModule.startAnalysis();
      if (!success) {
        console.error('Failed to start spectrum analysis');
        return;
      }

      setIsAnalyzing(true);

      // Réinitialiser les données
      previousMagnitudesRef.current = new Array(32).fill(0);
      lastUpdateRef.current = 0;

      // Démarrer l'animation avec notre hook optimisé
      resumeAnimation();
    } catch (error) {
      console.error('Failed to start spectrum analysis:', error);
    }
  }, [resumeAnimation, initializeSpectrumModule]);

  // Arrêter l'analyse
  const stopAnalysis = useCallback(async () => {
    if (!spectrumModuleReady.current) return;

    try {
      // Arrêter l'analyse spectrale via le module natif
      const success = NativeAudioSpectrumModule.stopAnalysis();
      if (!success) {
        console.error('Failed to stop spectrum analysis');
      }

      setIsAnalyzing(false);

      // Arrêter l'animation avec notre hook optimisé
      pauseAnimation();

      // Réinitialiser les données à zéro avec animation
      const fadeOut = () => {
        const current = previousMagnitudesRef.current;
        const faded = current.map(mag => mag * 0.9);

        if (Math.max(...faded) > 0.01) {
          previousMagnitudesRef.current = faded;
          setSpectrumData({
            magnitudes: faded,
            timestamp: Date.now()
          });
          requestAnimationFrame(fadeOut);
        } else {
          setSpectrumData({
            magnitudes: new Array(32).fill(0),
            timestamp: Date.now()
          });
        }
      };
      fadeOut();
    } catch (error) {
      console.error('Failed to stop spectrum analysis:', error);
    }
  }, [pauseAnimation]);

  // Basculer l'analyse
  const toggleAnalysis = useCallback(() => {
    if (isAnalyzing) {
      stopAnalysis();
    } else {
      startAnalysis();
    }
  }, [isAnalyzing, startAnalysis, stopAnalysis]);

  // Cleanup
  useEffect(() => {
    return () => {
      pauseAnimation();
      if (isAnalyzing && spectrumModuleReady.current) {
        NativeAudioSpectrumModule.stopAnalysis();
      }
    };
  }, [isAnalyzing, pauseAnimation]);

  // Initialiser le module d'analyse spectrale au montage
  useEffect(() => {
    initializeSpectrumModule();

    return () => {
      if (spectrumModuleReady.current) {
        NativeAudioSpectrumModule.dispose();
        spectrumModuleReady.current = false;
      }
    };
  }, [initializeSpectrumModule]);

  // Redémarrer l'animation si nécessaire
  useEffect(() => {
    if (isAnalyzing) {
      resumeAnimation();
    } else {
      pauseAnimation();
    }
  }, [isAnalyzing, resumeAnimation, pauseAnimation]);

  // Calculer des métriques utiles
  const getMetrics = useCallback(() => {
    const mags = spectrumData.magnitudes;
    const nonZero = mags.filter(m => m > 0);
    
    return {
      average: nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0,
      peak: Math.max(...mags),
      rms: Math.sqrt(mags.reduce((sum, mag) => sum + mag * mag, 0) / mags.length)
    };
  }, [spectrumData]);

  return {
    // État
    isAnalyzing,
    spectrumData,
    
    // Actions
    startAnalysis,
    stopAnalysis,
    toggleAnalysis,
    
    // Utilitaires
    getMetrics
  };
};
