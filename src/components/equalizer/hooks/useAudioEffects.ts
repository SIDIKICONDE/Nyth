import { useState, useCallback, useEffect } from 'react';
import NativeAudioEqualizerModule from '../../../../specs/NativeAudioEqualizerModule';

export interface CompressorConfig {
  thresholdDb: number;
  ratio: number;
  attackMs: number;
  releaseMs: number;
  makeupDb: number;
}

export interface DelayConfig {
  delayMs: number;
  feedback: number;
  mix: number;
}

export interface AudioEffectsConfig {
  enabled: boolean;
  compressor: CompressorConfig;
  delay: DelayConfig;
}

export const useAudioEffects = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [compressor, setCompressor] = useState<CompressorConfig>({
    thresholdDb: -18.0,
    ratio: 3.0,
    attackMs: 10.0,
    releaseMs: 80.0,
    makeupDb: 0.0
  });
  const [delay, setDelay] = useState<DelayConfig>({
    delayMs: 150.0,
    feedback: 0.3,
    mix: 0.25
  });

  // Charger l'état initial
  useEffect(() => {
    const loadState = async () => {
      try {
        const enabled = await NativeAudioEqualizerModule.fxGetEnabled();
        setIsEnabled(enabled);
      } catch (error) {
        console.error('Failed to load FX state:', error);
      }
    };
    
    loadState();
  }, []);

  // Activer/Désactiver les effets
  const toggleEnabled = useCallback(async () => {
    try {
      const newEnabled = !isEnabled;
      await NativeAudioEqualizerModule.fxSetEnabled(newEnabled);
      setIsEnabled(newEnabled);
    } catch (error) {
      console.error('Failed to toggle FX:', error);
    }
  }, [isEnabled]);

  // Mettre à jour le compresseur
  const updateCompressor = useCallback(async (newConfig: Partial<CompressorConfig>) => {
    try {
      const updatedConfig = { ...compressor, ...newConfig };
      
      await NativeAudioEqualizerModule.fxSetCompressor(
        updatedConfig.thresholdDb,
        updatedConfig.ratio,
        updatedConfig.attackMs,
        updatedConfig.releaseMs,
        updatedConfig.makeupDb
      );
      
      setCompressor(updatedConfig);
    } catch (error) {
      console.error('Failed to update compressor:', error);
    }
  }, [compressor]);

  // Mettre à jour le delay
  const updateDelay = useCallback(async (newConfig: Partial<DelayConfig>) => {
    try {
      const updatedConfig = { ...delay, ...newConfig };
      
      await NativeAudioEqualizerModule.fxSetDelay(
        updatedConfig.delayMs,
        updatedConfig.feedback,
        updatedConfig.mix
      );
      
      setDelay(updatedConfig);
    } catch (error) {
      console.error('Failed to update delay:', error);
    }
  }, [delay]);

  // Réinitialiser les effets
  const resetEffects = useCallback(async () => {
    const defaultCompressor: CompressorConfig = {
      thresholdDb: -18.0,
      ratio: 3.0,
      attackMs: 10.0,
      releaseMs: 80.0,
      makeupDb: 0.0
    };
    
    const defaultDelay: DelayConfig = {
      delayMs: 150.0,
      feedback: 0.3,
      mix: 0.25
    };
    
    await updateCompressor(defaultCompressor);
    await updateDelay(defaultDelay);
  }, [updateCompressor, updateDelay]);

  // Calculer la réduction de gain du compresseur
  const getCompressorGainReduction = useCallback((inputDb: number): number => {
    if (inputDb <= compressor.thresholdDb) return 0;
    
    const excess = inputDb - compressor.thresholdDb;
    const compressedExcess = excess / compressor.ratio;
    const reduction = excess - compressedExcess;
    
    return reduction;
  }, [compressor]);

  return {
    // État
    isEnabled,
    compressor,
    delay,
    
    // Actions
    toggleEnabled,
    updateCompressor,
    updateDelay,
    resetEffects,
    
    // Utilitaires
    getCompressorGainReduction
  };
};
