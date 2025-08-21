/**
 * Web Worker pour le traitement audio lourd
 * Exécute les calculs audio intensifs hors du thread principal
 */

// Types pour les messages
interface AudioProcessorMessage {
  type: 'PROCESS_SPECTRUM' | 'CALCULATE_RMS' | 'APPLY_FILTER' | 'BATCH_PROCESS';
  id: string;
  data: any;
}

interface AudioProcessorResponse {
  type: string;
  id: string;
  result: any;
  error?: string;
}

// Cache pour les calculs répétitifs
const calculationCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 1000; // 1 seconde

// Nettoyer le cache périodiquement
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of calculationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      calculationCache.delete(key);
    }
  }
}, 5000);

/**
 * Calcul du spectre de fréquences avec FFT
 */
function processSpectrum(data: Float32Array, sampleRate: number): Float32Array {
  const fftSize = 2048;
  const frequencyBins = fftSize / 2;
  const spectrum = new Float32Array(frequencyBins);
  
  // Fenêtre de Hann pour réduire les fuites spectrales
  const window = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (fftSize - 1));
  }
  
  // Appliquer la fenêtre
  const windowedData = new Float32Array(fftSize);
  for (let i = 0; i < Math.min(data.length, fftSize); i++) {
    windowedData[i] = data[i] * window[i];
  }
  
  // FFT simplifiée (dans la vraie vie, utiliser une librairie comme KissFFT)
  // Ici on simule avec une analyse simplifiée
  for (let k = 0; k < frequencyBins; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < fftSize; n++) {
      const angle = -2 * Math.PI * k * n / fftSize;
      real += windowedData[n] * Math.cos(angle);
      imag += windowedData[n] * Math.sin(angle);
    }
    
    // Magnitude en dB
    const magnitude = Math.sqrt(real * real + imag * imag);
    spectrum[k] = 20 * Math.log10(Math.max(magnitude, 1e-10));
  }
  
  return spectrum;
}

/**
 * Calcul RMS (Root Mean Square) optimisé
 */
function calculateRMS(data: Float32Array, windowSize: number = 1024): Float32Array {
  const numWindows = Math.floor(data.length / windowSize);
  const rmsValues = new Float32Array(numWindows);
  
  for (let w = 0; w < numWindows; w++) {
    let sum = 0;
    const startIdx = w * windowSize;
    const endIdx = startIdx + windowSize;
    
    for (let i = startIdx; i < endIdx; i++) {
      sum += data[i] * data[i];
    }
    
    rmsValues[w] = Math.sqrt(sum / windowSize);
  }
  
  return rmsValues;
}

/**
 * Application de filtres audio
 */
function applyFilter(
  data: Float32Array,
  filterType: 'lowpass' | 'highpass' | 'bandpass',
  frequency: number,
  sampleRate: number,
  q: number = 0.707
): Float32Array {
  const filtered = new Float32Array(data.length);
  
  // Coefficients du filtre biquad
  const omega = 2 * Math.PI * frequency / sampleRate;
  const sin = Math.sin(omega);
  const cos = Math.cos(omega);
  const alpha = sin / (2 * q);
  
  let b0, b1, b2, a0, a1, a2;
  
  switch (filterType) {
    case 'lowpass':
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
      
    case 'highpass':
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
      
    case 'bandpass':
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
  }
  
  // Normaliser les coefficients
  b0 /= a0;
  b1 /= a0;
  b2 /= a0;
  a1 /= a0;
  a2 /= a0;
  
  // État du filtre
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  
  // Appliquer le filtre
  for (let i = 0; i < data.length; i++) {
    const x0 = data[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    
    filtered[i] = y0;
    
    // Décaler l'état
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  
  return filtered;
}

/**
 * Traitement par batch pour plusieurs opérations
 */
function processBatch(operations: any[]): any[] {
  return operations.map(op => {
    switch (op.type) {
      case 'spectrum':
        return processSpectrum(op.data, op.sampleRate);
      case 'rms':
        return calculateRMS(op.data, op.windowSize);
      case 'filter':
        return applyFilter(op.data, op.filterType, op.frequency, op.sampleRate, op.q);
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  });
}

// Gestionnaire de messages
self.addEventListener('message', (event: MessageEvent<AudioProcessorMessage>) => {
  const { type, id, data } = event.data;
  
  try {
    let result: any;
    
    // Vérifier le cache pour certaines opérations
    const cacheKey = `${type}-${JSON.stringify(data)}`;
    const cached = calculationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      result = cached.result;
    } else {
      switch (type) {
        case 'PROCESS_SPECTRUM':
          result = processSpectrum(
            new Float32Array(data.buffer),
            data.sampleRate
          );
          break;
          
        case 'CALCULATE_RMS':
          result = calculateRMS(
            new Float32Array(data.buffer),
            data.windowSize
          );
          break;
          
        case 'APPLY_FILTER':
          result = applyFilter(
            new Float32Array(data.buffer),
            data.filterType,
            data.frequency,
            data.sampleRate,
            data.q
          );
          break;
          
        case 'BATCH_PROCESS':
          result = processBatch(data.operations);
          break;
          
        default:
          throw new Error(`Unknown message type: ${type}`);
      }
      
      // Mettre en cache le résultat
      calculationCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
    }
    
    // Envoyer la réponse
    const response: AudioProcessorResponse = {
      type,
      id,
      result: result.buffer ? result.buffer : result
    };
    
    // @ts-ignore - TypeScript ne reconnaît pas postMessage dans un worker
    self.postMessage(response, result.buffer ? [result.buffer] : []);
    
  } catch (error) {
    const response: AudioProcessorResponse = {
      type,
      id,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    // @ts-ignore
    self.postMessage(response);
  }
});

// Export pour TypeScript
export {};