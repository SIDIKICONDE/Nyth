import { useState, useCallback, useEffect } from 'react';
import NativeAudioEqualizerModule from '../../../../specs/NativeAudioEqualizerModule';

export interface NoiseReductionConfig {
  enabled: boolean;
  mode: 'expander' | 'rnnoise' | 'off';
  rnnoiseAggressiveness: number; // 0.0 - 3.0
  highPassEnabled: boolean;
  highPassHz: number;
  thresholdDb: number;
  ratio: number;
  floorDb: number;
  attackMs: number;
  releaseMs: number;
}

export const useNoiseReduction = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [mode, setMode] = useState<'expander' | 'rnnoise' | 'off'>('expander');
  const [rnnoiseAggressiveness, setRnnoiseAggressiveness] = useState(1.0);
  const [config, setConfig] = useState<NoiseReductionConfig>({
    enabled: false,
    mode: 'expander',
    rnnoiseAggressiveness: 1.0,
    highPassEnabled: true,
    highPassHz: 80.0,
    thresholdDb: -45.0,
    ratio: 2.5,
    floorDb: -18.0,
    attackMs: 3.0,
    releaseMs: 80.0
  });

  // Charger la configuration initiale
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const enabled = await NativeAudioEqualizerModule.nrGetEnabled();
        const mode = await NativeAudioEqualizerModule.nrGetMode();
        const aggressiveness = await NativeAudioEqualizerModule.rnnsGetAggressiveness();
        const nrConfig = await NativeAudioEqualizerModule.nrGetConfig();
        
        setIsEnabled(enabled);
        setMode(mode === 0 ? 'expander' : mode === 1 ? 'rnnoise' : 'off');
        setRnnoiseAggressiveness(aggressiveness);
        setConfig({
          enabled,
          mode: mode === 0 ? 'expander' : mode === 1 ? 'rnnoise' : 'off',
          rnnoiseAggressiveness: aggressiveness,
          ...nrConfig
        });
      } catch (error) {
        console.error('Failed to load NR config:', error);
      }
    };
    
    loadConfig();
  }, []);

  // Activer/Désactiver la réduction de bruit
  const toggleEnabled = useCallback(async () => {
    try {
      const newEnabled = !isEnabled;
      await NativeAudioEqualizerModule.nrSetEnabled(newEnabled);
      setIsEnabled(newEnabled);
      setConfig(prev => ({ ...prev, enabled: newEnabled }));
    } catch (error) {
      console.error('Failed to toggle NR:', error);
    }
  }, [isEnabled]);

  // Changer le mode
  const changeMode = useCallback(async (newMode: 'expander' | 'rnnoise' | 'off') => {
    try {
      await NativeAudioEqualizerModule.nrSetMode(newMode);
      setMode(newMode);
      setConfig(prev => ({ ...prev, mode: newMode }));
    } catch (error) {
      console.error('Failed to set NR mode:', error);
    }
  }, []);

  // Définir l'agressivité RNNoise
  const setAggressiveness = useCallback(async (value: number) => {
    try {
      const clamped = Math.max(0, Math.min(3, value));
      await NativeAudioEqualizerModule.rnnsSetAggressiveness(clamped);
      setRnnoiseAggressiveness(clamped);
      setConfig(prev => ({ ...prev, rnnoiseAggressiveness: clamped }));
    } catch (error) {
      console.error('Failed to set RNNoise aggressiveness:', error);
    }
  }, []);

  // Mettre à jour la configuration complète
  const updateConfig = useCallback(async (newConfig: Partial<NoiseReductionConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      
      await NativeAudioEqualizerModule.nrSetConfig(
        updatedConfig.highPassEnabled,
        updatedConfig.highPassHz,
        updatedConfig.thresholdDb,
        updatedConfig.ratio,
        updatedConfig.floorDb,
        updatedConfig.attackMs,
        updatedConfig.releaseMs
      );
      
      setConfig(updatedConfig);
    } catch (error) {
      console.error('Failed to update NR config:', error);
    }
  }, [config]);

  return {
    // État
    isEnabled,
    mode,
    rnnoiseAggressiveness,
    config,
    
    // Actions
    toggleEnabled,
    changeMode,
    setAggressiveness,
    updateConfig
  };
};
