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

// Export des modules JSI (pour utilisation directe)
export { default as NativeAudioCoreModule } from '../../../specs/NativeAudioCoreModule';
export { default as NativeAudioEffectsModule } from '../../../specs/NativeAudioEffectsModule';
export { default as NativeAudioNoiseModule } from '../../../specs/NativeAudioNoiseModule';
export { default as NativeAudioSafetyModule } from '../../../specs/NativeAudioSafetyModule';
export { default as NativeAudioUtilsModule } from '../../../specs/NativeAudioUtilsModule';
export { default as NativeAudioPipelineModule } from '../../../specs/NativeAudioPipelineModule';
export { default as NativeAudioCaptureModule } from '../../../specs/NativeAudioCaptureModule';

// Types pour les modules JSI
export type {
  // Core Module types only (the actual exported types from NativeAudioCoreModule)
  CoreError, CoreState, CoreFilterType, CoreFilterConfig, CoreBandConfig,
  CoreEqualizerConfig, CoreFilterInfo, CoreEqualizerInfo,
  CoreAudioCallback, CoreErrorCallback, CoreStateCallback
} from '../../../specs/NativeAudioCoreModule';
