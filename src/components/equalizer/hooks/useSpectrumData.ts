import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { SpectrumData } from '../types';
import NativeAudioEqualizerModule from '../../../../specs/NativeAudioEqualizerModule';
import { useAudioWorker } from '../../../hooks/useAudioWorker';
import { AudioComputationCache, useAudioAnimationFrame } from '../../../utils/audioPerformanceOptimizations';

interface UseSpectrumDataOptions {
  updateInterval?: number; // ms
  smoothingFactor?: number; // 0-1
  minDecibels?: number;
  maxDecibels?: number;
  useWebWorker?: boolean; // Utiliser le Web Worker pour les calculs lourds
}

// Cache pour les calculs de normalisation
const normalizationCache = new AudioComputationCache<string, number>(1000, 100);

export const useSpectrumData = (options: UseSpectrumDataOptions = {}) => {
  const {
    updateInterval = 50, // 20 FPS par défaut
    smoothingFactor = 0.8,
    minDecibels = -60,
    maxDecibels = 0,
    useWebWorker = true // Nouvelle option pour utiliser le Web Worker
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
    if (!NativeAudioEqualizerModule || !isAnalyzing) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < updateInterval) return;
    lastUpdateRef.current = now;

    try {
      const rawData = await NativeAudioEqualizerModule.getSpectrumData();
      
      if (Array.isArray(rawData) && rawData.length > 0) {
        // Utiliser le Web Worker pour les calculs lourds si disponible
        if (useWebWorker && workerReady && rawData.length > 64) {
          try {
            const processedData = await processSpectrum(
              new Float32Array(rawData),
              48000 // Sample rate par défaut, à adapter selon votre config
            );
            
            const normalized = Array.from(processedData).map(normalizeMagnitude);
            const smoothed = smoothMagnitudes(normalized);
            
            setSpectrumData({
              magnitudes: smoothed,
              timestamp: now
            });
          } catch (workerError) {
            console.warn('Worker processing failed, falling back to main thread:', workerError);
            // Fallback au traitement sur le thread principal
            const normalized = rawData.map(normalizeMagnitude);
            const smoothed = smoothMagnitudes(normalized);
            
            setSpectrumData({
              magnitudes: smoothed,
              timestamp: now
            });
          }
        } else {
          // Traitement normal pour les petites données
          const normalized = rawData.map(normalizeMagnitude);
          const smoothed = smoothMagnitudes(normalized);
          
          setSpectrumData({
            magnitudes: smoothed,
            timestamp: now
          });
        }
      }
    } catch (error) {
      console.error('Failed to get spectrum data:', error);
    }
  }, [isAnalyzing, updateInterval, normalizeMagnitude, smoothMagnitudes, useWebWorker, workerReady, processSpectrum]);

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
    if (!NativeAudioEqualizerModule) {
      console.error('NativeAudioEqualizerModule not available');
      return;
    }

    try {
      await NativeAudioEqualizerModule.startSpectrumAnalysis();
      setIsAnalyzing(true);
      
      // Réinitialiser les données
      previousMagnitudesRef.current = new Array(32).fill(0);
      lastUpdateRef.current = 0;
      
      // Démarrer l'animation avec notre hook optimisé
      resumeAnimation();
    } catch (error) {
      console.error('Failed to start spectrum analysis:', error);
    }
  }, [resumeAnimation]);

  // Arrêter l'analyse
  const stopAnalysis = useCallback(async () => {
    if (!NativeAudioEqualizerModule) return;

    try {
      await NativeAudioEqualizerModule.stopSpectrumAnalysis();
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
  }, []);

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
      if (isAnalyzing && NativeAudioEqualizerModule) {
        NativeAudioEqualizerModule.stopSpectrumAnalysis();
      }
    };
  }, [isAnalyzing, pauseAnimation]);

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
