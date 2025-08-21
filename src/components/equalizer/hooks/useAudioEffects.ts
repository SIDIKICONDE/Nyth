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

  // Mettre à jour le compresseur - optimisé sans dépendances
  const updateCompressor = useCallback(async (newConfig: Partial<CompressorConfig>) => {
    try {
      // Utiliser une mise à jour fonctionnelle pour éviter la dépendance
      setCompressor(prevCompressor => {
        const updatedConfig = { ...prevCompressor, ...newConfig };
        
        // Appel asynchrone en dehors du setState
        NativeAudioEqualizerModule.fxSetCompressor(
          updatedConfig.thresholdDb,
          updatedConfig.ratio,
          updatedConfig.attackMs,
          updatedConfig.releaseMs,
          updatedConfig.makeupDb
        ).catch(error => {
          console.error('Failed to update compressor:', error);
        });
        
        return updatedConfig;
      });
    } catch (error) {
      console.error('Failed to update compressor:', error);
    }
  }, []);

  // Mettre à jour le delay - optimisé sans dépendances
  const updateDelay = useCallback(async (newConfig: Partial<DelayConfig>) => {
    try {
      // Utiliser une mise à jour fonctionnelle pour éviter la dépendance
      setDelay(prevDelay => {
        const updatedConfig = { ...prevDelay, ...newConfig };
        
        // Appel asynchrone en dehors du setState
        NativeAudioEqualizerModule.fxSetDelay(
          updatedConfig.delayMs,
          updatedConfig.feedback,
          updatedConfig.mix
        ).catch(error => {
          console.error('Failed to update delay:', error);
        });
        
        return updatedConfig;
      });
    } catch (error) {
      console.error('Failed to update delay:', error);
    }
  }, []);

  // Réinitialiser les effets - exécution en parallèle
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
    
    // Exécuter les mises à jour en parallèle pour améliorer les performances
    await Promise.all([
      updateCompressor(defaultCompressor),
      updateDelay(defaultDelay)
    ]);
  }, [updateCompressor, updateDelay]);

  // Calculer la réduction de gain du compresseur - optimisé
  const getCompressorGainReduction = useCallback((inputDb: number): number => {
    // Utiliser les valeurs directement au lieu de l'objet complet
    const threshold = compressor.thresholdDb;
    const ratio = compressor.ratio;
    
    if (inputDb <= threshold) return 0;
    
    const excess = inputDb - threshold;
    const reduction = excess - (excess / ratio);
    
    return reduction;
  }, [compressor.thresholdDb, compressor.ratio]);

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
