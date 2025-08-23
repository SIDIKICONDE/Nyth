/**
 * Hook Égaliseur - Version Originale (Conservée pour Compatibilité)
 *
 * ⚠️ ATTENTION: Cette version originale est conservée pour compatibilité.
 *    Pour bénéficier des optimisations de performance, utilisez useEqualizerOptimized.
 *
 * 🚀 MIGRATION RECOMMANDÉE:
 *    Remplacez: import { useEqualizer } from './useEqualizer';
 *    Par:       import { useEqualizerOptimized } from './useEqualizerOptimized';
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { BandConfig, EqualizerConfig, FilterType } from '../types';
import NativeAudioCoreModule from '../../../../specs/NativeAudioCoreModule';

// Fréquences par défaut pour un égaliseur 10 bandes
const DEFAULT_FREQUENCIES = [
  31.25,   // Sub-bass
  62.5,    // Bass
  125.0,   // Low-mid
  250.0,   // Mid
  500.0,   // Mid
  1000.0,  // Mid-high
  2000.0,  // High-mid
  4000.0,  // Presence
  8000.0,  // Brilliance
  16000.0  // Air
];

export const useEqualizer = (numBands: number = 10, sampleRate: number = 48000) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [masterGain, setMasterGain] = useState(0);
  const [bands, setBands] = useState<BandConfig[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const equalizerIdRef = useRef<number | null>(null);

  // Initialiser l'égaliseur
  useEffect(() => {
    const initEqualizer = async () => {
      try {
        if (!NativeAudioCoreModule) {
          console.error('NativeAudioCoreModule not available');
          return;
        }

        // Initialiser le module core
        const success = await NativeAudioCoreModule.initialize();
        if (!success) {
          console.error('Failed to initialize core module');
          return;
        }

        // Initialiser l'égaliseur avec la configuration
        const equalizerConfig = {
          numBands: numBands,
          sampleRate: sampleRate,
          masterGainDB: 0.0,
          bypass: false
        };

        const initSuccess = await NativeAudioCoreModule.equalizerInitialize(equalizerConfig);
        if (!initSuccess) {
          console.error('Failed to initialize equalizer');
          return;
        }

        // Initialiser les bandes avec les fréquences par défaut
        const initialBands: BandConfig[] = [];
        for (let i = 0; i < numBands; i++) {
          const frequency = i < DEFAULT_FREQUENCIES.length
            ? DEFAULT_FREQUENCIES[i]
            : DEFAULT_FREQUENCIES[DEFAULT_FREQUENCIES.length - 1] * Math.pow(2, i - DEFAULT_FREQUENCIES.length + 1);

          // Configurer chaque bande
          const bandConfig = {
            bandIndex: i,
            frequency: frequency,
            gainDB: 0.0,
            q: 0.707,
            type: i === 0 ? 'lowshelf' as const : (i === numBands - 1 ? 'highshelf' as const : 'peak' as const),
            enabled: true
          };

          await NativeAudioCoreModule.equalizerSetBand(i, bandConfig);

          initialBands.push({
            frequency,
            gain: 0,
            q: 0.707,
            type: i === 0 ? FilterType.LOWSHELF : (i === numBands - 1 ? FilterType.HIGHSHELF : FilterType.PEAK),
            enabled: true
          });
        }

        setBands(initialBands);
        setIsInitialized(true);

        // Récupérer l'état actuel
        const equalizerInfo = await NativeAudioCoreModule.equalizerGetInfo();
        setEnabled(!equalizerInfo.bypass);
        setMasterGain(equalizerInfo.masterGainDB);

      } catch (error) {
        console.error('Failed to initialize equalizer:', error);
      }
    };

    initEqualizer();

    // Cleanup
    return () => {
      if (NativeAudioCoreModule) {
        NativeAudioCoreModule.dispose();
      }
    };
  }, [numBands, sampleRate]);

  // Activer/Désactiver l'égaliseur
  const toggleEnabled = useCallback(async () => {
    if (!isInitialized || !NativeAudioCoreModule) return;

    try {
      const newEnabled = !enabled;
      await NativeAudioCoreModule.equalizerSetBypass(!newEnabled);
      setEnabled(newEnabled);
    } catch (error) {
      console.error('Failed to toggle equalizer:', error);
    }
  }, [enabled, isInitialized]);

  // Modifier le gain d'une bande
  const setBandGain = useCallback(async (bandIndex: number, gain: number) => {
    if (!isInitialized || !NativeAudioCoreModule || bandIndex < 0 || bandIndex >= bands.length) return;

    try {
      setIsProcessing(true);

      // Limiter le gain entre -24 et +24 dB
      const clampedGain = Math.max(-24, Math.min(24, gain));

      await NativeAudioCoreModule.equalizerSetBandGain(bandIndex, clampedGain);

      setBands(prevBands => {
        const newBands = [...prevBands];
        newBands[bandIndex] = { ...newBands[bandIndex], gain: clampedGain };
        return newBands;
      });
    } catch (error) {
      console.error('Failed to set band gain:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [bands.length, isInitialized]);

  // Modifier le gain master
  const updateMasterGain = useCallback(async (gain: number) => {
    if (!isInitialized || !NativeAudioCoreModule) return;

    try {
      const clampedGain = Math.max(-24, Math.min(24, gain));
      await NativeAudioCoreModule.equalizerSetMasterGain(clampedGain);
      setMasterGain(clampedGain);
    } catch (error) {
      console.error('Failed to set master gain:', error);
    }
  }, [isInitialized]);

  // Réinitialiser toutes les bandes
  const resetAllBands = useCallback(async () => {
    if (!isInitialized || !NativeAudioCoreModule) return;

    try {
      setIsProcessing(true);

      // Utiliser la méthode de réinitialisation directe de l'égaliseur
      await NativeAudioCoreModule.equalizerResetAllBands();

      setBands(prevBands =>
        prevBands.map(band => ({ ...band, gain: 0 }))
      );

      // Réinitialiser le gain master
      await updateMasterGain(0);
    } catch (error) {
      console.error('Failed to reset bands:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [bands.length, isInitialized, updateMasterGain]);

  // Mise à jour groupée des gains (pour les presets)
  const updateAllBandGains = useCallback(async (gains: number[]) => {
    if (!isInitialized || !NativeAudioCoreModule) return;

    try {
      setIsProcessing(true);

      const numBandsToUpdate = Math.min(gains.length, bands.length);
      for (let i = 0; i < numBandsToUpdate; i++) {
        const clampedGain = Math.max(-24, Math.min(24, gains[i]));
        await NativeAudioCoreModule.equalizerSetBandGain(i, clampedGain);
      }

      setBands(prevBands =>
        prevBands.map((band, index) => ({
          ...band,
          gain: index < gains.length ? Math.max(-24, Math.min(24, gains[index])) : band.gain
        }))
      );
    } catch (error) {
      console.error('Failed to update band gains:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [bands.length, isInitialized]);

  // Obtenir la configuration actuelle
  const getConfig = useCallback((): EqualizerConfig => {
    return {
      numBands: bands.length,
      sampleRate,
      masterGain,
      bypass: !enabled,
      bands: [...bands]
    };
  }, [bands, enabled, masterGain, sampleRate]);

  return {
    // État
    isInitialized,
    enabled,
    masterGain,
    bands,
    isProcessing,
    
    // Actions
    toggleEnabled,
    setBandGain,
    updateMasterGain,
    resetAllBands,
    updateAllBandGains,
    getConfig
  };
};
