// Types pour l'égaliseur audio professionnel

export interface BandConfig {
  frequency: number;
  gain: number;
  q: number;
  type: FilterType;
  enabled: boolean;
}

export enum FilterType {
  LOWPASS = 0,
  HIGHPASS = 1,
  BANDPASS = 2,
  NOTCH = 3,
  PEAK = 4,
  LOWSHELF = 5,
  HIGHSHELF = 6,
  ALLPASS = 7
}

export interface EqualizerPreset {
  name: string;
  gains: number[];
}

export interface EqualizerConfig {
  numBands: number;
  sampleRate: number;
  masterGain: number;
  bypass: boolean;
  bands: BandConfig[];
}

export interface SpectrumData {
  magnitudes: number[];
  timestamp: number;
}

export interface EqualizerTheme {
  background: string;
  backgroundGradient?: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  slider: {
    track: string;
    trackActive: string;
    thumb: string;
    thumbActive: string;
    thumbBorder: string;
  };
  spectrum: {
    bars: string;
    barsGradient?: string[];
    grid: string;
    labels: string;
  };
  preset: {
    background: string;
    backgroundActive: string;
    text: string;
    textActive: string;
    border: string;
  };
}
