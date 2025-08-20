import { useState, useEffect, useRef, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { SpectrumData } from '../types';
import NativeAudioEqualizerModule from '../../../../specs/NativeAudioEqualizerModule';

interface UseSpectrumDataOptions {
  updateInterval?: number; // ms
  smoothingFactor?: number; // 0-1
  minDecibels?: number;
  maxDecibels?: number;
}

export const useSpectrumData = (options: UseSpectrumDataOptions = {}) => {
  const {
    updateInterval = 50, // 20 FPS par défaut
    smoothingFactor = 0.8,
    minDecibels = -60,
    maxDecibels = 0
  } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [spectrumData, setSpectrumData] = useState<SpectrumData>({
    magnitudes: new Array(32).fill(0),
    timestamp: Date.now()
  });
  
  const animationFrameRef = useRef<number | null>(null);
  const previousMagnitudesRef = useRef<number[]>(new Array(32).fill(0));
  const lastUpdateRef = useRef<number>(0);

  // Normaliser les données de magnitude (dB vers 0-1)
  const normalizeMagnitude = useCallback((magnitude: number): number => {
    if (magnitude <= minDecibels) return 0;
    if (magnitude >= maxDecibels) return 1;
    return (magnitude - minDecibels) / (maxDecibels - minDecibels);
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

  // Mettre à jour les données du spectre
  const updateSpectrum = useCallback(async () => {
    if (!NativeAudioEqualizerModule || !isAnalyzing) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < updateInterval) return;
    lastUpdateRef.current = now;

    try {
      const rawData = await NativeAudioEqualizerModule.getSpectrumData();
      
      if (Array.isArray(rawData) && rawData.length > 0) {
        // Normaliser et lisser les données
        const normalized = rawData.map(normalizeMagnitude);
        const smoothed = smoothMagnitudes(normalized);
        
        setSpectrumData({
          magnitudes: smoothed,
          timestamp: now
        });
      }
    } catch (error) {
      console.error('Failed to get spectrum data:', error);
    }
  }, [isAnalyzing, updateInterval, normalizeMagnitude, smoothMagnitudes]);

  // Boucle d'animation
  const animate = useCallback(() => {
    updateSpectrum();
    if (isAnalyzing) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [updateSpectrum, isAnalyzing]);

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
      
      // Démarrer l'animation
      animate();
    } catch (error) {
      console.error('Failed to start spectrum analysis:', error);
    }
  }, [animate]);

  // Arrêter l'analyse
  const stopAnalysis = useCallback(async () => {
    if (!NativeAudioEqualizerModule) return;

    try {
      await NativeAudioEqualizerModule.stopSpectrumAnalysis();
      setIsAnalyzing(false);
      
      // Arrêter l'animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
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
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (isAnalyzing && NativeAudioEqualizerModule) {
        NativeAudioEqualizerModule.stopSpectrumAnalysis();
      }
    };
  }, [isAnalyzing]);

  // Redémarrer l'animation si nécessaire
  useEffect(() => {
    if (isAnalyzing && animationFrameRef.current === null) {
      animate();
    }
  }, [isAnalyzing, animate]);

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
