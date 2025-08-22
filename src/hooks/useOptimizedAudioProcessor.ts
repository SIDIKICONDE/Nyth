/**
 * Hook exemple montrant l'utilisation de toutes les optimisations audio
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  useAudioDebounce, 
  useAudioThrottle, 
  useAudioBatch,
  AudioComputationCache,
  AudioObjectPool,
  AudioPerformanceMonitor,
  useAudioMemo
} from '../utils/audioPerformanceOptimizations';
import { useAudioWorker } from './useAudioWorker';

// Cache global pour les calculs fréquents
const fftCache = new AudioComputationCache<string, Float32Array>(50, 1000);
const performanceMonitor = new AudioPerformanceMonitor(100);

// Pool d'objets pour les buffers audio
const audioBufferPool = new AudioObjectPool(
  () => new Float32Array(2048),
  (buffer) => buffer.fill(0),
  5,
  20
);

interface AudioProcessorConfig {
  sampleRate: number;
  bufferSize: number;
  enableWebWorker: boolean;
  enableCaching: boolean;
}

export const useOptimizedAudioProcessor = (config: AudioProcessorConfig) => {
  const { sampleRate, bufferSize, enableWebWorker, enableCaching } = config;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessingTime, setLastProcessingTime] = useState(0);
  
  // Utiliser le Web Worker pour le traitement lourd
  const { processSpectrum, calculateRMS, applyFilter, processBatch, isReady: workerReady } = useAudioWorker();
  
  // État mémorisé avec seuil de changement significatif
  const audioState = useAudioMemo(() => ({
    volume: 0.5,
    frequency: 440,
    filterQ: 0.707
  }), [0.5, 440, 0.707], 0.01);
  
  // Traitement audio principal avec mesure de performance
  const processAudio = useCallback(async (inputBuffer: Float32Array) => {
    const endMeasure = performanceMonitor.startMeasure('processAudio');
    
    try {
      setIsProcessing(true);
      
      // Vérifier le cache si activé
      if (enableCaching) {
        const cacheKey = `${inputBuffer.length}-${sampleRate}`;
        const cached = fftCache.get(cacheKey);
        if (cached) {
          endMeasure();
          return cached;
        }
      }
      
      let result: Float32Array;
      
      // Utiliser le Web Worker si disponible et activé
      if (enableWebWorker && workerReady) {
        result = (await processSpectrum(inputBuffer, sampleRate, 'fp64')) as Float32Array;
      } else {
        // Traitement sur le thread principal (fallback)
        const buffer = audioBufferPool.acquire();
        // Simulation d'un traitement FFT simple
        for (let i = 0; i < Math.min(inputBuffer.length, buffer.length); i++) {
          buffer[i] = inputBuffer[i] * Math.sin(2 * Math.PI * i / inputBuffer.length);
        }
        result = buffer;
      }
      
      // Mettre en cache le résultat
      if (enableCaching) {
        const cacheKey = `${inputBuffer.length}-${sampleRate}`;
        fftCache.set(cacheKey, result);
      }
      
      endMeasure();
      return result;
      
    } catch (error) {
      console.error('Audio processing error:', error);
      endMeasure();
      throw error;
    } finally {
      setIsProcessing(false);
      setLastProcessingTime(Date.now());
    }
  }, [sampleRate, enableWebWorker, enableCaching, workerReady, processSpectrum]);
  
  // Version debouncée pour les changements de paramètres UI
  const debouncedProcessAudio = useAudioDebounce(processAudio, 100);
  
  // Version throttlée pour les mises à jour en temps réel
  const throttledProcessAudio = useAudioThrottle(processAudio, 60); // 60 FPS max
  
  // Batch processor pour plusieurs opérations
  const { addToBatch, flushBatch } = useAudioBatch<Float32Array>(
    async (batch) => {
      if (enableWebWorker && workerReady) {
        const operations = batch.map(buffer => ({
          type: 'spectrum',
          data: buffer,
          sampleRate,
          precision: 'fp64'
        }));
        await processBatch(operations);
      } else {
        // Traiter séquentiellement si pas de worker
        for (const buffer of batch) {
          await processAudio(buffer);
        }
      }
    },
    16 // ~60 FPS
  );
  
  // Appliquer des filtres avec optimisations
  const applyOptimizedFilter = useCallback(async (
    input: Float32Array,
    filterType: 'lowpass' | 'highpass' | 'bandpass'
  ) => {
    const endMeasure = performanceMonitor.startMeasure('applyFilter');
    
    try {
      if (enableWebWorker && workerReady) {
        const result = await applyFilter(
          input,
          filterType,
          audioState.frequency,
          sampleRate,
          audioState.filterQ
        );
        endMeasure();
        return result;
      } else {
        // Fallback simple
        endMeasure();
        return input;
      }
    } catch (error) {
      endMeasure();
      throw error;
    }
  }, [enableWebWorker, workerReady, applyFilter, audioState, sampleRate]);
  
  // Calculer les métriques RMS avec cache
  const calculateOptimizedRMS = useCallback(async (input: Float32Array) => {
    const endMeasure = performanceMonitor.startMeasure('calculateRMS');
    
    try {
      if (enableWebWorker && workerReady) {
        const result = await calculateRMS(input, 1024);
        endMeasure();
        return result;
      } else {
        // Calcul RMS simple sur le thread principal
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
          sum += input[i] * input[i];
        }
        const rms = Math.sqrt(sum / input.length);
        endMeasure();
        return new Float32Array([rms]);
      }
    } catch (error) {
      endMeasure();
      throw error;
    }
  }, [enableWebWorker, workerReady, calculateRMS]);
  
  // Obtenir les statistiques de performance
  const getPerformanceStats = useCallback(() => {
    return {
      processAudio: performanceMonitor.getStats('processAudio'),
      applyFilter: performanceMonitor.getStats('applyFilter'),
      calculateRMS: performanceMonitor.getStats('calculateRMS')
    };
  }, []);
  
  // Nettoyer les ressources
  const cleanup = useCallback(() => {
    fftCache.clear();
    audioBufferPool.clear();
    performanceMonitor.clear();
  }, []);
  
  // Cleanup au démontage
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  return {
    // État
    isProcessing,
    lastProcessingTime,
    workerReady,
    
    // Méthodes de traitement
    processAudio: debouncedProcessAudio,
    processAudioRealtime: throttledProcessAudio,
    addAudioToBatch: addToBatch,
    flushAudioBatch: flushBatch,
    applyFilter: applyOptimizedFilter,
    calculateRMS: calculateOptimizedRMS,
    
    // Utilitaires
    getPerformanceStats,
    cleanup,
    
    // Configuration
    audioState
  };
};
