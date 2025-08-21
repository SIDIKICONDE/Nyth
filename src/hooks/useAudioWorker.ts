/**
 * Hook pour utiliser le Web Worker de traitement audio
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface WorkerRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

export const useAudioWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const requestsRef = useRef<Map<string, WorkerRequest>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialiser le worker
  useEffect(() => {
    try {
      // Créer le worker
      workerRef.current = new Worker(
        new URL('../workers/audioProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Gestionnaire de messages
      workerRef.current.onmessage = (event) => {
        const { id, result, error } = event.data;
        const request = requestsRef.current.get(id);

        if (request) {
          if (error) {
            request.reject(new Error(error));
          } else {
            request.resolve(result);
          }
          requestsRef.current.delete(id);
        }
      };

      // Gestionnaire d'erreurs
      workerRef.current.onerror = (error) => {
        console.error('Audio Worker error:', error);
        setError(new Error('Audio Worker error'));
        
        // Rejeter toutes les requêtes en attente
        requestsRef.current.forEach(request => {
          request.reject(new Error('Worker error'));
        });
        requestsRef.current.clear();
      };

      setIsReady(true);
    } catch (err) {
      console.error('Failed to create audio worker:', err);
      setError(err instanceof Error ? err : new Error('Failed to create worker'));
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      requestsRef.current.clear();
      setIsReady(false);
    };
  }, []);

  // Envoyer un message au worker
  const sendMessage = useCallback(<T = any>(
    type: string,
    data: any
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker not ready'));
        return;
      }

      const id = `${type}-${Date.now()}-${Math.random()}`;
      
      requestsRef.current.set(id, { resolve, reject });

      try {
        workerRef.current.postMessage({ type, id, data });
      } catch (error) {
        requestsRef.current.delete(id);
        reject(error);
      }
    });
  }, [isReady]);

  // Méthodes spécifiques pour chaque type de traitement
  const processSpectrum = useCallback(async (
    audioData: Float32Array,
    sampleRate: number
  ): Promise<Float32Array> => {
    const result = await sendMessage<ArrayBuffer>('PROCESS_SPECTRUM', {
      buffer: audioData.buffer,
      sampleRate
    });
    return new Float32Array(result);
  }, [sendMessage]);

  const calculateRMS = useCallback(async (
    audioData: Float32Array,
    windowSize: number = 1024
  ): Promise<Float32Array> => {
    const result = await sendMessage<ArrayBuffer>('CALCULATE_RMS', {
      buffer: audioData.buffer,
      windowSize
    });
    return new Float32Array(result);
  }, [sendMessage]);

  const applyFilter = useCallback(async (
    audioData: Float32Array,
    filterType: 'lowpass' | 'highpass' | 'bandpass',
    frequency: number,
    sampleRate: number,
    q: number = 0.707
  ): Promise<Float32Array> => {
    const result = await sendMessage<ArrayBuffer>('APPLY_FILTER', {
      buffer: audioData.buffer,
      filterType,
      frequency,
      sampleRate,
      q
    });
    return new Float32Array(result);
  }, [sendMessage]);

  const processBatch = useCallback(async (
    operations: any[]
  ): Promise<any[]> => {
    return sendMessage('BATCH_PROCESS', { operations });
  }, [sendMessage]);

  return {
    isReady,
    error,
    processSpectrum,
    calculateRMS,
    applyFilter,
    processBatch
  };
};