import { useState, useCallback, useEffect, useRef } from 'react';
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

// Constantes pour les modes avancés
export const ADVANCED_NR_MODES = {
  STANDARD: 0,  // Réduction de bruit standard
  IMCRA: 1,     // Improved Minima Controlled Recursive Averaging
  WIENER: 2,    // Filtre de Wiener MMSE-LSA
  TWOSTEP: 3,   // Réduction en deux étapes
  MULTIBAND: 4  // Traitement multi-bandes
} as const;

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

  // État pour les fonctionnalités avancées
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [advancedConfig, setAdvancedConfig] = useState<{
    enabled: boolean;
    advancedMode: number;
    currentSNR: number;
    hasPendingUpdate: boolean;
  }>({
    enabled: false,
    advancedMode: ADVANCED_NR_MODES.STANDARD,
    currentSNR: 0,
    hasPendingUpdate: false
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringRef = useRef<NodeJS.Timeout | null>(null);

  // Charger la configuration initiale
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const enabled = await NativeAudioEqualizerModule.nrGetEnabled();
        const modeNumber = await NativeAudioEqualizerModule.nrGetMode();
        const mode = modeNumber === 0 ? 'expander' : modeNumber === 1 ? 'rnnoise' : 'off';
        const aggressiveness = await NativeAudioEqualizerModule.rnnsGetAggressiveness();
        const nrConfig = await NativeAudioEqualizerModule.nrGetConfig();

        setIsEnabled(enabled);
        setMode(mode);
        setRnnoiseAggressiveness(aggressiveness);
        setConfig({
          enabled,
          mode,
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
      const modeNumber = newMode === 'expander' ? 0 : newMode === 'rnnoise' ? 1 : 2;
      await NativeAudioEqualizerModule.nrSetMode(modeNumber);
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

  // === FONCTIONNALITÉS AVANCÉES ===

  // Basculer le mode avancé
  const toggleAdvancedMode = useCallback(() => {
    setUseAdvanced(prev => !prev);
  }, []);

  // Définir le mode avancé
  const setAdvancedMode = useCallback((mode: keyof typeof ADVANCED_NR_MODES) => {
    const modeValue = ADVANCED_NR_MODES[mode];
    setAdvancedConfig(prev => ({
      ...prev,
      advancedMode: modeValue,
      hasPendingUpdate: true
    }));
  }, []);

  // Activer/désactiver les fonctionnalités avancées
  const toggleAdvancedEnabled = useCallback(() => {
    setAdvancedConfig(prev => ({
      ...prev,
      enabled: !prev.enabled,
      hasPendingUpdate: true
    }));
  }, []);

  // Récupérer les métriques avancées
  const fetchAdvancedMetrics = useCallback(async () => {
    try {
      // Simulation de métriques avancées
      // En production, cela devrait appeler l'API native
      const mockSNR = 15 + Math.random() * 20; // 15-35 dB
      setAdvancedConfig(prev => ({ ...prev, currentSNR: mockSNR }));
      return mockSNR;
    } catch (error) {
      console.error('Failed to fetch advanced metrics:', error);
      return 0;
    }
  }, []);

  // Récupérer le spectre de bruit
  const fetchNoiseSpectrum = useCallback(async (size: number) => {
    try {
      // Simulation du spectre de bruit
      const spectrum = new Array(size).fill(0).map((_, i) => {
        const freq = (i / size) * 22050; // Fréquence en Hz
        return Math.exp(-freq / 2000) * (0.1 + Math.random() * 0.2);
      });
      return spectrum;
    } catch (error) {
      console.error('Failed to fetch noise spectrum:', error);
      return new Array(size).fill(0);
    }
  }, []);

  // Récupérer la probabilité de parole
  const fetchSpeechProbability = useCallback(async (size: number) => {
    try {
      // Simulation de la probabilité de parole
      const probabilities = new Array(size).fill(0).map(() => {
        return Math.random() * 0.3 + (Math.random() > 0.7 ? 0.7 : 0);
      });
      return probabilities;
    } catch (error) {
      console.error('Failed to fetch speech probability:', error);
      return new Array(size).fill(0);
    }
  }, []);

  // Démarrer la surveillance avancée
  const startAdvancedMonitoring = useCallback((intervalMs: number) => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    monitoringRef.current = setInterval(() => {
      fetchAdvancedMetrics();
    }, intervalMs);
  }, [isMonitoring, fetchAdvancedMetrics]);

  // Arrêter la surveillance avancée
  const stopAdvancedMonitoring = useCallback(() => {
    if (monitoringRef.current) {
      clearInterval(monitoringRef.current);
      monitoringRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Effacer les mises à jour en attente
  const clearPendingUpdates = useCallback(() => {
    setAdvancedConfig(prev => ({ ...prev, hasPendingUpdate: false }));
  }, []);

  // Cleanup des intervalles
  useEffect(() => {
    return () => {
      if (monitoringRef.current) {
        clearInterval(monitoringRef.current);
      }
    };
  }, []);

  return {
    // État de base
    isEnabled,
    mode,
    rnnoiseAggressiveness,
    config,

    // Actions de base
    toggleEnabled,
    changeMode,
    setAggressiveness,
    updateConfig,

    // État avancé
    useAdvanced,
    advancedConfig,
    ADVANCED_NR_MODES,

    // Actions avancées
    toggleAdvancedMode,
    setAdvancedMode,
    toggleAdvancedEnabled,
    fetchAdvancedMetrics,
    fetchNoiseSpectrum,
    fetchSpeechProbability,
    startAdvancedMonitoring,
    stopAdvancedMonitoring,
    clearPendingUpdates
  };
};
