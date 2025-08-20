// Export principal du module Equalizer
export { Equalizer } from './Equalizer';
export { AdvancedEqualizer } from './AdvancedEqualizer';
export { EqualizerBand } from './components/EqualizerBand';
export { PresetSelector } from './components/PresetSelector';
export { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
export { useEqualizer } from './hooks/useEqualizer';
export { useEqualizerPresets } from './hooks/useEqualizerPresets';
export { useSpectrumData } from './hooks/useSpectrumData';
export { useNoiseReduction } from './hooks/useNoiseReduction';
export { useAudioSafety } from './hooks/useAudioSafety';
export { useAudioEffects } from './hooks/useAudioEffects';
export type { EqualizerPreset, BandConfig, EqualizerConfig, FilterType, SpectrumData, EqualizerTheme } from './types';
export type { NoiseReductionConfig } from './hooks/useNoiseReduction';
export type { AudioSafetyConfig, AudioSafetyReport } from './hooks/useAudioSafety';
export type { AudioEffectsConfig, CompressorConfig, DelayConfig } from './hooks/useAudioEffects';
