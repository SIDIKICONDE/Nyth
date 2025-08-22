import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Cycle de vie de l'égaliseur (instances natives)
  readonly createEqualizer: (numBands: number, sampleRate: number) => number;
  readonly destroyEqualizer: (equalizerId: number) => void;

  // Traitement audio
  readonly processAudio: (equalizerId: number, input: number[]) => number[];
  readonly processAudioStereo: (
    equalizerId: number,
    left: number[],
    right: number[],
  ) => { left: number[]; right: number[] };

  // Contrôles globaux (wrappers JS sur l'instance par défaut)
  readonly setEQEnabled: (enabled: boolean) => void;
  readonly getEQEnabled: () => boolean;
  readonly setMasterGain: (gainDb: number) => void;
  readonly getMasterGain: () => number;
  readonly setBandGain: (bandIndex: number, gain: number) => void;
  readonly getBandGain: (bandIndex: number) => number;
  readonly beginBatch: () => void;
  readonly endBatch: () => void;

  // Contrôle fin des bandes (avec ID explicite)
  readonly setBandFrequency: (equalizerId: number, bandIndex: number, frequency: number) => void;
  readonly setBandQ: (equalizerId: number, bandIndex: number, q: number) => void;
  readonly setBandType: (equalizerId: number, bandIndex: number, type: number) => void;
  readonly setBandEnabled: (equalizerId: number, bandIndex: number, enabled: boolean) => void;
  readonly getBandFrequency: (equalizerId: number, bandIndex: number) => number;
  readonly getBandQ: (equalizerId: number, bandIndex: number) => number;
  readonly getBandType: (equalizerId: number, bandIndex: number) => number;
  readonly isBandEnabled: (equalizerId: number, bandIndex: number) => boolean;

  // Bypass/état global par instance
  readonly setBypass: (equalizerId: number, bypass: boolean) => void;
  readonly isBypassed: (equalizerId: number) => boolean;

  // Préréglages
  readonly setPreset: (presetName: string) => void; // wrapper par nom sur l'instance par défaut
  readonly getCurrentPreset: () => string;
  readonly getAvailablePresets: () => string[];
  readonly loadPreset: (equalizerId: number, preset: { name?: string; gains?: number[] }) => void;
  readonly savePreset: (equalizerId: number) => { name: string; gains: number[] };
  readonly resetAllBands: (equalizerId: number) => void;
  readonly loadPresetByName: (equalizerId: number, presetName: string) => void;

  // Utilitaires
  readonly getNumBands: (equalizerId: number) => number;
  readonly setSampleRate: (equalizerId: number, sampleRate: number) => void;
  readonly getSampleRate: (equalizerId: number) => number;
  readonly beginParameterUpdate: (equalizerId: number) => void;
  readonly endParameterUpdate: (equalizerId: number) => void;

  // Analyse spectrale
  readonly getSpectrumData: () => number[];
  readonly startSpectrumAnalysis: () => void;
  readonly stopSpectrumAnalysis: () => void;

  // Noise Reduction (NR)
  readonly nrSetEnabled: (enabled: boolean) => void;
  readonly nrGetEnabled: () => boolean;
  // Mode: 0=expander, 1=rnnoise, 2=off
  readonly nrSetMode: (mode: number) => void;
  readonly nrGetMode: () => number;
  // RNNoise aggressiveness 0.0..3.0
  readonly rnnsSetAggressiveness: (aggressiveness: number) => void;
  readonly rnnsGetAggressiveness: () => number;
  readonly nrSetConfig: (
    highPassEnabled: boolean,
    highPassHz: number,
    thresholdDb: number,
    ratio: number,
    floorDb: number,
    attackMs: number,
    releaseMs: number,
  ) => void;
  readonly nrGetConfig: () => {
    highPassEnabled: boolean;
    highPassHz: number;
    thresholdDb: number;
    ratio: number;
    floorDb: number;
    attackMs: number;
    releaseMs: number;
  };

  // Audio Safety
  readonly safetySetConfig: (
    enabled: boolean,
    dcRemovalEnabled: boolean,
    dcThreshold: number,
    limiterEnabled: boolean,
    limiterThresholdDb: number,
    softKneeLimiter: boolean,
    kneeWidthDb: number,
    feedbackDetectEnabled: boolean,
    feedbackCorrThreshold: number,
  ) => void;
  readonly safetyGetReport: () => {
    peak: number;
    rms: number;
    dcOffset: number;
    clippedSamples: number;
    feedbackScore: number;
    overload: boolean;
  };

  // Effets créatifs (FX)
  readonly fxSetEnabled: (enabled: boolean) => void;
  readonly fxGetEnabled: () => boolean;
  readonly fxSetCompressor: (
    thresholdDb: number,
    ratio: number,
    attackMs: number,
    releaseMs: number,
    makeupDb: number,
  ) => void;
  readonly fxSetDelay: (
    delayMs: number,
    feedback: number,
    mix: number,
  ) => void;
}

<<<<<<< Current (Your changes)
export default TurboModuleRegistry.getEnforcing<Spec>('NativeAudioEqualizerModule');
=======
let _nativeAudioModule: Spec | null = null;
const getNativeAudioModule = (): Spec => {
  if (!_nativeAudioModule) {
    _nativeAudioModule = TurboModuleRegistry.getEnforcing<Spec>('NativeAudioEqualizerModule');
  }
  return _nativeAudioModule;
};

const LazyNativeAudioEqualizerModule: Spec = new Proxy({} as any, {
  get: (_target, prop) => {
    const mod = getNativeAudioModule() as any;
    return mod[prop as keyof Spec];
  },
}) as Spec;

export default LazyNativeAudioEqualizerModule;
>>>>>>> Incoming (Background Agent changes)
