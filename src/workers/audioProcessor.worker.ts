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

// ====== FFT utilitaires (radix-2) ======
function bitReverseIndex(x: number, bits: number): number {
  let r = 0;
  for (let i = 0; i < bits; i++) {
    r = (r << 1) | (x & 1);
    x >>= 1;
  }
  return r >>> 0;
}

function fftRadix2(re: Float32Array | Float64Array, im: Float32Array | Float64Array, inverse: boolean): void {
  const N = re.length;
  if (N !== im.length) throw new Error('re and im must have same length');
  if ((N & (N - 1)) !== 0) throw new Error('FFT size must be power of 2');

  // Bit-reversal permutation
  let bits = 0;
  for (let t = N; t > 1; t >>= 1) bits++;
  for (let i = 0; i < N; i++) {
    const j = bitReverseIndex(i, bits);
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }

  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1;
    const ang = (inverse ? 2.0 : -2.0) * Math.PI / size;
    for (let start = 0; start < N; start += size) {
      for (let k = 0; k < half; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const i0 = start + k;
        const i1 = i0 + half;
        const tr = wr * re[i1] - wi * im[i1];
        const ti = wr * im[i1] + wi * re[i1];
        const ur = re[i0];
        const ui = im[i0];
        re[i0] = ur + tr;
        im[i0] = ui + ti;
        re[i1] = ur - tr;
        im[i1] = ui - ti;
      }
    }
  }

  if (inverse) {
    const scale = 1.0 / N;
    for (let i = 0; i < N; i++) { re[i] *= scale; im[i] *= scale; }
  }
}

/**
 * Calcul du spectre de fréquences avec FFT (radix-2) avec précision configurable
 */
function processSpectrum(data: Float32Array | Float64Array, sampleRate: number, precision: 'fp32' | 'fp64' = 'fp64'): Float32Array | Float64Array {
  const fftSize = 2048;
  const frequencyBins = fftSize / 2;
  const use64 = precision === 'fp64';

  const WindowArr = use64 ? Float64Array : Float32Array;
  const RealArr = use64 ? Float64Array : Float32Array;

  const window = new WindowArr(fftSize);
  for (let i = 0; i < fftSize; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (fftSize - 1));
  }

  const re = new RealArr(fftSize);
  const im = new RealArr(fftSize);
  const count = Math.min(data.length, fftSize);
  for (let i = 0; i < count; i++) re[i] = data[i] * window[i];
  for (let i = count; i < fftSize; i++) re[i] = 0;
  for (let i = 0; i < fftSize; i++) im[i] = 0;

  fftRadix2(re, im, false);

  const spectrum = new RealArr(frequencyBins);
  for (let k = 0; k < frequencyBins; k++) {
    const mag = Math.hypot(re[k], im[k]);
    spectrum[k] = 20 * Math.log10(Math.max(mag, 1e-12));
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
        return processSpectrum(op.data, op.sampleRate, op.precision ?? 'fp32');
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
            data.precision === 'fp64' ? new Float64Array(data.buffer) : new Float32Array(data.buffer),
            data.sampleRate,
            data.precision
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
